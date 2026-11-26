# SkinChance — Premium Case Hub

React + Vite + TypeScript project. The case catalogue, upgrade flow, contracts, inventory, Steam OpenID login and server-side balance are included.

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

## Deploy to Vercel (important)

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

Steam login and the server balance require the environment variables above. Without Redis and a session secret, login/balance endpoints intentionally return a configuration error. Never commit real `.env` files or API tokens to GitHub.

## Market prices

`/api/prices` requests Steam Community Market `priceoverview` server-side for CS2 (appid 730). Steam's endpoint is undocumented and rate-limited; an unavailable quote is returned as unavailable, not fabricated. Price data is indicative and can lag or be blocked by Steam. Case drop odds and the sample catalogue are game configuration, not live Steam data.

## Deployment troubleshooting

- The screenshot's `Error · Add files via upload` is the Vercel upload action failing; it does not show a Vite build log. The visible deployment marked **Ready** is a previously completed deployment.
- For the upload workflow, extract this archive first and upload the **project files/folders**, not the `.zip` archive. Keep `package.json`, `package-lock.json`, `index.html`, `src/`, `public/`, `api/`, `vercel.json`, and `vite.config.ts` at the project root.
- If Vercel reports a build error after import, open the failed deployment → **Build Logs** and fix the first actual error. Do not use the generic upload error as evidence of a TypeScript/build failure.
