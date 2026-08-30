<!-- GSD:docs-update -->

# Деплой

Продакшен: [weather-e-ink.vercel.app](https://weather-e-ink.vercel.app/). Файл `vercel.json` в корне пустой (`{}`) — используются настройки проекта в Vercel. <!-- VERIFY: регион, план и привязка Git на дашборде Vercel -->

## Что нужно на хосте

1. **PostgreSQL** и `DATABASE_URL` (Prisma adapter `pg`).
2. Миграции: `npm run db:deploy` / `prisma migrate deploy` на релизе или вручную. Скрипт `build` делает `prisma generate && next build`, но **не** накатывает миграции сам.
3. Переменные: как минимум `DATABASE_URL`. Cookie `Secure` включается при `NODE_ENV=production`.

`maxDuration = 60` на маршрутах PNG: генерация кадра может быть долгой.

## После деплоя

- Откройте сайт, войдите, сохраните макет.
- Проверьте `/d/{slug}/screen.png` в браузере.
- Если сменили домен, обновите `DEVICE_BASE_URL` на плате.

## Ограничения кадра для текущей платы

Прошивка elink: 800×480, максимум 64 КиБ, чёрно-белый экран. Не включайте RGB-режим для этого железа.
