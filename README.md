# SkinChance — Premium CS2 Case Hub

React + Vite + TypeScript. Тёмная премиальная тема, кейсы с горизонтальной рулеткой, апгрейдер с Clover ×2, контракты, инвентарь, Steam OpenID-вход и серверный баланс DP (Redis/Upstash).

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Extract the ZIP on your computer. **Do not upload the ZIP file itself** as the project source.
2. In Vercel choose **Add New → Project** and import the GitHub repository containing the extracted project, or use the Vercel CLI from the extracted `skinchance-main` folder.
3. Set the project Root Directory to `skinchance-main` only if you uploaded the parent folder. If you uploaded the contents of `skinchance-main` to the repository root, leave Root Directory as `./`.
4. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
5. Add the environment variables below, then redeploy.

### Required Vercel environment variables

- `SESSION_SECRET` — long random secret (at least 32 random bytes).
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL.
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token.

Optional:

- `VITE_ADMIN_STEAM_IDS` — comma-separated SteamID64 values for the admin UI. The API also checks `ADMIN_STEAM_IDS`; set that server-side too for authorization.
- `VITE_CATALOG_URL` — optional override for the skin catalog JSON (default: ByMykel CSGO-API on GitHub).
- `VITE_PRICES_URL` — optional URL returning `{ "<item name>": <usd price> }` for bulk price seeding.

Steam login and the server balance require `SESSION_SECRET` + Redis. Without them, login/balance endpoints intentionally return a configuration error. Never commit real `.env` files or API tokens to GitHub.

## Game mechanics

- **Cases** — 19 cases in 5 categories (Начальные / Популярные / Премиальные / Дорогие / Эксклюзивные). Opening spends DP via `/api/auth?a=delta`, the winning drop is chosen with `crypto.getRandomValues` **before** the roulette animation starts, and the horizontal roulette (right → left, ~7–8 s ease-out) only visualizes the already-decided result. Each card shows real item name, rarity colour and market image.
- **Roulette result** — after the strip stops, the win card is highlighted under the center pointer; the item can be claimed (goes to inventory) or sold instantly for DP (market USD price × 83 DP; **1 DP = 0.50 грн**, ≈ 83 DP per $1).
- **Upgrader** — source item from inventory vs target from catalog; win chance = `source/target` capped at **80 %**, Clover sector doubles the prize and re-rolls the wheel. All rolls use `crypto.getRandomValues`.
- **Contracts** — 3–10 items → new item priced near the average input.
- **Inventory / Profile / Admin** — sell items for DP, view stats; admins can credit DP to any SteamID64 and give items (server-side check via `ADMIN_STEAM_IDS`).

## Market prices

`/api/prices` proxies Steam Community Market `priceoverview` (appid 730) server-side with a 2-minute cache and low concurrency — Steam's endpoint is undocumented and rate-limited. When live quotes are unavailable, `src/services/priceTable.ts` provides curated USD estimates for every case-drop item (source `table`); the UI converts USD → DP at 83 DP/$ and shows "—" only when neither source has a price. Case prices are computed from drop contents (≥ 1.18× average drop value, never below the configured price). Case drop odds and catalogue data are game configuration, not live Steam data.

## Security notes

- Balance lives in Redis; the browser can only request signed deltas — never set an absolute balance (except admin `credit`, which is server-side admin-gated).
- Sessions are HMAC-signed HttpOnly cookies (`Secure`, `SameSite=Lax`, 30 days).
- Steam OpenID is verified server-side (`check_authentication`) with nonce replay protection.
- Client-side game rolls are deterministic only for animation; spend is validated server-side before the result is shown. For a fully authoritative backend, move `rollCase`/upgrade/contract resolution behind `/api/*` endpoints backed by a real DB.

## Deployment troubleshooting

- The screenshot's `Error · Add files via upload` is the Vercel upload action failing; it does not show a Vite build log. The visible deployment marked **Ready** is a previously completed deployment.
- For the upload workflow, extract this archive first and upload the **project files/folders**, not the `.zip` archive. Keep `package.json`, `package-lock.json`, `index.html`, `src/`, `public/`, `api/`, `vercel.json`, and `vite.config.ts` at the project root.
- If Vercel reports a build error after import, open the failed deployment → **Build Logs** and fix the first actual error. Do not use the generic upload error as evidence of a TypeScript/build failure.
