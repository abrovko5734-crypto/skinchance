# SkinChance — CS2 Cases & Upgrader

Production-ready frontend for CS2 cases, upgrader, contracts.

## Features
- **20 cases** with CSS case art (no emoji)
- **Upgrader**: min chance **0.01%**, house edge 8%
- **Clover**: 30% chance to appear on the wheel, sector **5%**; disabled if win chance &lt; 5%
- Quick presets: **75% / 50% / 30% / 5× / 10×**
- **Contracts**, inventory, profile
- **Top-up only via Telegram @Keldisqq** (no free DP)
- **Admin** only if Steam ID is in `VITE_ADMIN_STEAM_IDS`
- Steam OpenID login + Redis balance (Vercel)

## Env (Vercel)
- `VITE_ADMIN_STEAM_IDS` — comma-separated SteamIDs
- `SESSION_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Optional: `VITE_CATALOG_URL`, `VITE_PRICES_URL`

## Run
```bash
npm install
npm run dev
# production API: vercel dev
```
