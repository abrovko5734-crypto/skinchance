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
- Source inventory is read from the signed-in Steam account's public inventory (`730/2`). If the Steam inventory is private, the page displays the error.
- Admin actions are protected server-side by `ADMIN_STEAM_IDS`, comma-separated SteamID64s. Set this variable in Vercel in addition to the client visibility variable `VITE_ADMIN_STEAM_IDS`.
- Admin panel currently supports Redis account lookup, setting/adding balance, banning/unbanning, persisted Clover percent and audit log. Clover setting is saved but is not yet wired into the client-side demo upgrade odds.
- Real upgrade history/counting and server-authoritative upgrade outcomes are not implemented; the panel does not fake these stats.
- Required Vercel environment variables: `SESSION_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_STEAM_IDS`, `VITE_ADMIN_STEAM_IDS`.

Data catalogue API: SeekSkins public read-only API, described at https://seekskins.com/en/developers. Please keep request volume moderate; the catalogue uses 4 concurrent page fetches.
