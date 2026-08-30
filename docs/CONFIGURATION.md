<!-- GSD:docs-update -->

# Конфигурация

## Окружение

| Переменная | Где | Назначение |
|---|---|---|
| `DATABASE_URL` | сервер | Строка PostgreSQL для Prisma. Без неё `src/lib/prisma.ts` бросает ошибку. |
| `NODE_ENV` | Node | `production` включает `Secure` на cookie сессии. |
| `NEXT_PUBLIC_VERCEL_URL` | Vercel | Хост в `src/shared/config/env.ts`. Локально по умолчанию `localhost:3000`. <!-- VERIFY: фактический URL на Vercel может задаваться платформой, не этим файлом --> |

Файла `.env.example` в репозитории нет. На Vercel задайте `DATABASE_URL` в настройках проекта.

## Cookie сессии

Имя: `weather_session`. Значение — непрозрачный токен; в БД хранится SHA-256. Срок 30 дней. `httpOnly`, `sameSite=lax`, `path=/`.

## Поля панели (`WeatherPanel`)

| Поле | Смысл |
|---|---|
| `name` | Заголовок в шапке редактора |
| `slug` | Публичный id в `/d/{slug}/…` |
| `cityName`, `latitude`, `longitude`, `timezone` | Место и пояс для погоды и тихих часов |
| `language` | `RU` или `EN` |
| `unitSystem` | `METRIC` или `IMPERIAL` |
| `refreshMinutes` | 1–1440; уходит в `X-Next-Refresh-Seconds` (×60), если не ночь |
| `layout` | JSON: карточки, шапка, тема, тихие часы, фото |
| `sensorLog` | История температуры с платы для графика датчика |

## Макет (`layout`)

Значения нормализуются в `src/lib/panel-config.ts` и `src/lib/display.ts`.

- Карточки: идентификаторы из `BLOCK_IDS`, не больше 8, без повторов.
- Тема экрана: `classic`, `night`, `poster`, `air`, `rail`.
- Шрифт: 80–200%, шаг 5. Скругление 0–32 px. Зазор 0–28 px.
- `cacheScreen`: ETag / 304 (по умолчанию включено).
- `quietHours`: `enabled`, `startHour`, `endHour` (0–23), `refreshMinutes`. Если `startHour === endHour`, ограничение выключено. «До» в окно не входит.
- `colorMode` и размер экрана лежат в `layout` после сохранения (`screenWidth`, `screenHeight`, `colorMode`). Пресеты размеров — `SIZE_PRESETS` в `display.ts`. Для текущей платы: 800×480 и `bw`.

## Значения по умолчанию в схеме Prisma

Город по умолчанию: Махачкала, `Europe/Moscow`, интервал 10 минут, имя панели `E-Ink Weather`.
