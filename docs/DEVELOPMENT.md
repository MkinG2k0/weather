<!-- GSD:docs-update -->

# Разработка

Репозиторий: `d:\Project\Main\1OLD\weather`. Соседняя прошивка: `d:\Project\ard\elink`.

## Команды (`package.json`)

| Скрипт | Действие |
|---|---|
| `npm run dev` | Next.js dev |
| `npm run build` | `prisma generate` + `next build` |
| `npm start` | `next start` |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:studio` | Prisma Studio |
| `postinstall` | `prisma generate` |

## Локально

1. PostgreSQL и `DATABASE_URL`.
2. `npm install` (подтянет клиент Prisma).
3. `npx prisma migrate deploy` — миграции в `prisma/migrations/` (`init`, `sensor_log`).
4. `npm run dev` → http://localhost:3000

Prisma schema: `prisma/schema.prisma`. Клиент генерируется в `src/generated/prisma`.

## Куда класть изменения

| Задача | Файлы |
|---|---|
| Новая карточка | `src/lib/panel-config.ts` (`BLOCK_IDS`, подписи в `panel-editor.tsx`), отрисовка в `weather-screen.tsx`, при необходимости данные в `weather.ts` |
| Query PNG для платы | `src/app/d/[slug]/screen.png/route.ts`, `device-sensor.ts` / `sensor-log.ts`, прошивка `src/main.cpp` |
| Тема / палитра | `display.ts`, `quantize-png.ts` |
| Редактор | `panel-editor.tsx` |

Меняя контракт `screen.png`, правьте оба репозитория.

## Next.js 16

В репозитории есть `AGENTS.md` от `next dev`: смотрите актуальные гайды в `node_modules/next/dist/docs/`, не полагайтесь только на старые привычки App Router.
