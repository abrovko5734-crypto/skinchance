# SkinChance — CS2 Cases & Upgrader

Готовый фронт для деплоя на **Vercel** (через GitHub).

## Возможности
- Кейсы, апгрейдер (зелёная зона + крупная зелёная стрелка), контракты, инвентарь, профиль
- Пополнение только через Telegram **@Keldisqq**
- После оплаты админ зачисляет DP в **Админ-панели** (Steam ID из `VITE_ADMIN_STEAM_IDS`)
- Steam OpenID + Redis (Upstash) на Vercel

## Env на Vercel (Project → Settings → Environment Variables)

| Variable | Описание |
|----------|----------|
| `VITE_ADMIN_STEAM_IDS` | SteamID64 админов через запятую |
| `SESSION_SECRET` | Случайная длинная строка |
| `UPSTASH_REDIS_REST_URL` | URL Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash Redis |

Опционально: `VITE_CATALOG_URL`, `VITE_PRICES_URL`

## Деплой

1. Залейте репозиторий на GitHub
2. Import в [Vercel](https://vercel.com) → Framework: Vite
3. Добавьте env выше (Production)
4. Deploy

Локально:
```bash
npm install
npm run dev
```

Сборка: `npm run build` → `dist/`
