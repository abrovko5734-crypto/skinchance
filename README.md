# SkinChance — CS2 Upgrader (React + TS + Vite)

```
npm install
npm run dev      # разработка
npm run build    # проверка типов + сборка
```

## Механика
- `src/lib/odds.ts` — вся математика (без UI). Колесо: **win → Clover (ровно 5%) → fail**, по часовой от верхней точки.
  Шанс = цена исходного / цена цели × 95%, ограничен 1–90%. Clover — отдельный исход: приз удваивается и запускается новое колесо (цепочка до 4 колёс: 600→1200→2400→4800→9600).
- UI показывает те же числа, что использует `resolveRoll`; позиция остановки колеса = выпавший roll.
- `src/services/upgradeService.ts` — `UpgradeApi`. Сейчас локальная демо-реализация; в проде заменить на запрос к серверу (результат определяет сервер).

## Каталог CS2
`src/services/itemCatalog.ts` — сервис `ItemCatalog` (поиск, фильтры: оружие/ножи/перчатки/редкость/качество/StatTrak/Souvenir/цена, сортировки).
Источники подключаются через `.env` (см. `.env.example`):
- `VITE_CATALOG_URL` — например `https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins_not_grouped.json` (адаптер уже написан, даёт изображения, редкости, износы, коллекции).
- `VITE_PRICES_URL` — JSON `{ "полное название": цена }` с вашего источника цен.
Без `.env` используется небольшая демо-выборка (`sampleCatalog.ts`) с пометкой «демо»; изображений в ней нет — показывается честная заглушка.

## Не подключено
Steam-инвентарь (демо-инвентарь в localStorage), backend и серверный roll, реальные цены, платежи, разделы Кейсы/Контракты/Бонусы/Рефералы, свои звуковые файлы (`sound.setFile`).

## Вход через Steam и баланс (Vercel)
`api/auth.ts` — serverless-функция: Steam OpenID, подписанная cookie-сессия, баланс в Redis (`bal:<steamid>`, новый игрок = 0).
Настройка: Vercel → Storage → Create → Upstash Redis (подключить к проекту), + переменная `SESSION_SECRET` (`openssl rand -hex 32`), затем Redeploy.
Локально: `npx vercel dev` (обычный `npm run dev` не запускает `/api`).
Пополнение и вывод не реализованы; баланс меняется только на сервере.
