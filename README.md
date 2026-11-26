# SkinChance — CS2 Cases & Upgrader

Готовый фронт для деплоя на **Vercel** (через GitHub).

## Возможности
- Кейсы, апгрейдер (зелёная зона + стрелка), контракты, инвентарь, профиль
- **Баланс только на сервере (Redis)** — игроки стартуют с 0 DP
- Пополнение через Telegram **@Keldisqq** → админ выдаёт DP в админ-панели по SteamID
- Шансы повышены, проценты в UI скрыты
- Steam OpenID + Redis (Upstash)

## Env на Vercel (Project → Settings → Environment Variables)

| Variable | Описание |
|----------|----------|
| `VITE_ADMIN_STEAM_IDS` | SteamID64 админов через запятую |
| `SESSION_SECRET` | Случайная длинная строка (например `openssl rand -hex 32`) |
| `UPSTASH_REDIS_REST_URL` | URL Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash Redis |

Все — Production (и Preview при необходимости).

## Деплой

1. Залейте этот репозиторий на GitHub (или обновите существующий)
2. Import / Redeploy в [Vercel](https://vercel.com) → Framework Preset: **Vite**
3. Build Command: `npm run build` · Output: `dist`
4. Добавьте env выше
5. Deploy

Локально:
```bash
npm install
npm run dev
```

Сборка: `npm run build` → `dist/`

## Админ
В админ-панели укажите SteamID64 игрока (17 цифр) и сумму → **Выдать**.  
Можно выдать себе кнопками «Себе +…».

## API
- `GET /api/auth?a=me` — сессия + баланс
- `POST /api/auth?a=credit` — админ: `{ steamId, amount }`
- `POST /api/auth?a=delta` — игрок: `{ amount }` (кейсы / продажа)
