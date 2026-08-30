<!-- GSD:docs-update -->

# Архитектура

Control Desk — одностраничное приложение владельца панели плюс публичные URL устройства. Один пользователь в БД владеет одной записью `WeatherPanel`.

```text
Браузер (PanelEditor)
        │  PATCH /api/panel
        │  POST  /api/panel/preview
        ▼
   PostgreSQL (User, Session, WeatherPanel)
        ▲
ESP32 ──┘  GET /d/{slug}/screen.png?temp_c=…&batt_pct=…
        │
        ▼
   Open-Meteo + рендер PNG (weather-image + quantize-png)
```

## Слои

| Путь | Роль |
|---|---|
| `src/app/page.tsx` | Выбор: setup / логин / редактор. Для превью подставляет демо-датчик и демо-заряд. |
| `src/components/panel-editor.tsx` | Клиентский редактор: город, тема, тихий час, сетка карточек. |
| `src/components/weather-screen.tsx` | Разметка кадра 800×480, общая с PNG. |
| `src/lib/panel-config.ts` | Типы карточек, сетка 4×2, лимит 8 блоков, тихие часы, темы. |
| `src/lib/weather.ts` | Запрос прогноза Open-Meteo под город панели. |
| `src/lib/weather-image.ts` | Серверный PNG. |
| `src/lib/quantize-png.ts` | Палитра под `colorMode` (`bw`, `bwr`, …). |
| `src/lib/auth.ts` | Cookie `weather_session` (httpOnly, 30 дней, хеш SHA-256 в таблице `Session`). |
| `src/lib/prisma.ts` | Prisma Client + `DATABASE_URL`. Без переменной процесс не стартует. |

## Кадр устройства

`GET /d/{slug}/screen.png`:

1. Панель ищется по `slug`. Нет записи — 404 JSON.
2. Погода берётся из Open-Meteo по координатам панели.
3. Query `chip`, `temp_c`, `pressure_hpa`, `altitude_m`, `humidity` попадают в карточку датчика, если она есть в макете.
4. Точки температуры с платы пишутся в `WeatherPanel.sensorLog` (для графика датчика).
5. `batt_pct` рисуется в шапке, если шапка это показывает.
6. Если включено **«Кешировать PNG»**, считается ETag от JSON погоды; при `If-None-Match` сервер отвечает **304**.
7. Иначе в кадр подставляется актуальное локальное время (`observedAt`).
8. Ответ всегда с `Cache-Control: no-store` и `X-Next-Refresh-Seconds` (обычный интервал или ночной, по часовому поясу города).

Превью в браузере ходит в `POST /api/panel/preview` и **не** использует живые query ESP32: датчик и батарея — демо.

## Сетка

Макет: до 8 карточек, 4 колонки, 2 ряда (`MAX_BLOCKS`, `GRID_COLS`, `GRID_ROWS` в `panel-config.ts`). `layoutFits` отклоняет комбинацию, которая не пакуется. Ширина карточки 1–4, высота 1–2 клетки.

## Внешние сервисы

- Open-Meteo forecast и geocoding.
- Nominatim reverse geocoding при GPS (User-Agent `EInkWeather/1.0`).
- Vercel как хостинг (см. [DEPLOYMENT.md](DEPLOYMENT.md)).

Погода и геокодинг не кэшируются в своей БД: кэш — у провайдеров (`next.revalidate` на reverse geocoding) и ETag кадра на устройстве.
