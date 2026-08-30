<!-- GSD:docs-update -->

# HTTP API

База: тот же origin, что и сайт. JSON, если не указано иное.

## Публичные URL устройства

Аутентификация не нужна. Знание `slug` равно доступу на чтение кадра.

### `GET /d/{slug}/screen.png`

PNG  (или 304 / JSON-ошибка).

Query (все необязательные; парсер в `src/lib/device-sensor.ts`):

| Параметр | Условие |
|---|---|
| `chip` | `bmp280` или `bme280` (регистр не важен) |
| `temp_c` | −40…85 |
| `pressure_hpa` | 300…1100 |
| `altitude_m` | −500…9000 |
| `humidity` | 0…100, учитывается только при BME280 |
| `batt_pct` | заряд для шапки |

Заголовки ответа: `Cache-Control: no-store`, `X-Next-Refresh-Seconds`, при включённом кеше — `ETag`.

Клиент может прислать `If-None-Match`. При совпадении хеша погоды — **304**.

Ошибки: **404** `{error:'Device not found'}`, **500** `{error:'Failed to generate weather screen', detail}`.

### `GET /d/{slug}/config`

JSON для отладки, прошивка его отдельно не дергает.

```json
{
  "version": 1,
  "deviceId": "<cuid панели>",
  "refreshIntervalSeconds": 600,
  "screenUrl": "https://…/d/<slug>/screen.png",
  "screenWidth": 800,
  "screenHeight": 480,
  "colorMode": "bw",
  "colorCount": 2,
  "palette": ["#000000", "#ffffff"],
  "updatedAt": "<ISO>"
}
```

`refreshIntervalSeconds` здесь — `refreshMinutes * 60` **без** ночного окна. Реальный сон платы берёт из `X-Next-Refresh-Seconds` на PNG.

## Сессия владельца

Cookie `weather_session`.

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| `POST` | `/api/auth/setup` | `{username, password}` | 200 `{ok:true}` + cookie; 409 если пользователь уже есть; 400 если логин &lt; 3 или пароль &lt; 8 |
| `POST` | `/api/auth/login` | `{username, password}` | 200 или 401 «Неверный логин или пароль» |
| `POST` | `/api/auth/logout` | — | 200 `{ok:true}`, cookie сброшена |

## Панель (нужна сессия)

| Метод | Путь | Назначение |
|---|---|---|
| `PATCH` | `/api/panel` | Сохранить имя, город, единицы, интервал, размер, `colorMode`, `layout`. 401 без входа, 400 Zod, 404 нет панели. |
| `POST` | `/api/panel/preview` | Погода для превью по ещё несохранённым полям. Датчик и батарея — демо. |
| `POST` | `/api/panel/rotate` | Новый `slug`. Старый URL сразу 404. |

## Справочники (нужна сессия)

### `GET /api/cities?q=`

`q` короче 2 символов → `{results:[]}`. Иначе Open-Meteo geocoding, до 7 городов.

### `GET /api/cities?lat=&lon=`

Обратное геокодирование Nominatim + пояс Open-Meteo. 400 при неверных координатах, 502 если провайдер недоступен.

## Служебные кадры без панели

| Путь | Назначение |
|---|---|
| `GET /screenshot.png` | PNG из `renderWeatherImage()` с настройками по умолчанию (Махачкала, дефолтный макет). На проде на момент документации отвечал ошибкой генерации — не опирайтесь на него для проверки устройства. |
| `GET /api/screenshot` | Тот же рендер. |
| `GET /api/weather` | JSON `getWeatherScreenData()` без панели (дефолтный город). 502 при сбое Open-Meteo. |

Эти три маршрута **не** требуют cookie и **не** подставляют датчик платы.
