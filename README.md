# SkinChance — CS2 Upgrader

React + TypeScript + Vite. Это проект из архива, доработанный без замены существующей структуры.

## Запуск
```bash
npm install
npm run dev
```
Проверка/production-сборка:
```bash
npm run build
npm run preview
```

## Основная механика Clover
- Основной шанс рассчитывается от цены предмета к цене цели с комиссией 5%.
- Сектор **Clover имеет фиксированный шанс 5%** и отдельный исход.
- Выпадение Clover запускает анимацию, удваивает стоимость следующей цели и открывает дополнительное колесо.
- Цепочка ограничена четырьмя дополнительными колёсами; при достижении потолка Clover превращается в успешный результат.
- Любой fail в цепочке теряет ставку; успех добавляет итоговый предмет в локальный инвентарь.
- Результат колеса и анимация используют один roll; звук можно включать/выключать.

## Что уже есть
- Колесо с секторами win / Clover / fail, анимацией, тик-звуком и подсветкой результата.
- Clover x2 анимация: три этапа, карточки исходного/промежуточного/итогового предмета, кнопка Skip.
- Каталог CS2: поиск, фильтры по типу/редкости/износу/StatTrak/Souvenir и сортировка.
- Выбор исходного предмета из локального демо-инвентаря, выбор цели, расчёт вероятностей.
- Результат, повтор апгрейда и история последних попыток.
- Сохранение демо-инвентаря, выбора и истории в localStorage отдельно для Steam-пользователя.
- Steam OpenID login API и серверное хранение баланса в Redis на Vercel (при настройке окружения).

## Подключение каталога/цен
Скопируйте `.env.example` в `.env.local`, заполните:
- `VITE_CATALOG_URL` — JSON каталога CS2.
- `VITE_PRICES_URL` — JSON с ценами в формате `{ "название предмета": цена }`.

Без этих переменных приложение работает на демо-каталоге и демо-ценах.

## Backend / безопасность
Steam login и баланс требуют настройки Vercel + Upstash Redis, `SESSION_SECRET` и deploy. Обычный `npm run dev` не запускает serverless API — локально используйте `npx vercel dev`.

Апгрейд сейчас **демо-локальный**: roll генерируется на клиенте, инвентарь хранится в localStorage. Не используйте его как азартную/денежную систему или production-экономику. Для реального запуска необходимо перенести генерацию roll, проверку владения предметами, выдачу/списание, админские операции и платежи на сервер, с авторизацией и журналированием.

## Что намеренно не имитируется как «готовое»
Админ-панель, баны, выдача баланса, платежи/вывод и Steam-инвентарь не подключены к backend в этом проекте. Они требуют серверных API и проверки прав; кнопки/эндпоинты из отдельного примера нельзя безопасно добавлять как клиентские действия.


## Live catalogue, inventory and administration (updated)

- Target selector fetches the full paginated public catalogue from SeekSkins (metadata, images, wears and marketplace prices where present). It caches the catalogue in memory for the current page session. The source is independent from Valve.
- Prices are source-provided marketplace values only; missing prices remain blank and items without prices cannot be used as upgrade targets. No demo prices are fabricated.
- The upgrader now uses a separate local DP inventory (not Steam inventory). Starter items are clearly marked as demo items; successful demo upgrades move the result into this local inventory. Steam inventory is not used for selecting a source item.
- Admin actions are protected server-side by `ADMIN_STEAM_IDS`, comma-separated SteamID64s. Set this variable in Vercel in addition to the client visibility variable `VITE_ADMIN_STEAM_IDS`.
- Admin panel currently supports Redis account lookup, setting/adding balance, banning/unbanning, persisted Clover percent and audit log. Clover setting is saved but is not yet wired into the client-side demo upgrade odds.
- Real upgrade history/counting and server-authoritative upgrade outcomes are not implemented; the panel does not fake these stats.
- Required Vercel environment variables: `SESSION_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_STEAM_IDS`, `VITE_ADMIN_STEAM_IDS`.

Data catalogue API: SeekSkins public read-only API, described at https://seekskins.com/en/developers. Please keep request volume moderate; the catalogue uses 4 concurrent page fetches.


## v6 Upgrade refresh
- Separate SkinChance DP inventory; no Steam inventory dependency for the source picker.
- Clover sector chance is 20%. A Clover landing triggers a separate activation roll starting at 50%.
- On successful activation, the item value is doubled and a new tier begins; each subsequent tier's chance is multiplied by 0.8 (50%, 40%, 32%, 25.6%, …), with a 15% floor and an 8-tier UI safety limit.
- UI refreshed with an original dark green premium case-site layout, clearer action chips, and DP pricing.
- Display conversion for demo catalog: 1 USD catalogue value = 100 DP; 100 DP = 50 UAH as the user-defined display rate. This is not a payment or cash-value promise.

**Important:** upgrade RNG is still client-side demo logic and is not secure for real-money or redeemable value. Do not enable payments/withdrawals until a server-authoritative upgrade endpoint and ledger are implemented.


## DP Coin asset
The minimal gold clover DP coin is included at `public/dp-coin.png`. Use it in the UI via `/dp-coin.png`.

## Case Hub refresh
The app now opens in guest/local mode (no Steam login required), has 20 case tiles, DP balance, local inventory, sell-for-DP action, contract exchange, daily reward, upgrade view, and local admin controls. Catalogue requests are capped to 8 pages to avoid the previous slow-loading issue. The case artwork is generated with CSS rather than external demo images.

**Important limits:** balances, cases, inventory, contracts, and admin controls are browser-local and can be edited by the player. This is not a production backend and not a secure real-money game. Catalog pricing/image availability depends on the public catalogue endpoint and may fail due to CORS/rate limits. Build could not be verified in this environment because dependency installation timed out.
