<!-- GSD:docs-update -->

# E-Ink Control Desk

Next.js-приложение, которое хранит макет погодной панели и отдаёт PNG для прошивки [elink](https://github.com/MkinG2k0/weather-station-esp) (FireBeetle 2 ESP32-E + 7,5″ 800×480, чёрно-белая FPC-8612).

Продакшен: [weather-e-ink.vercel.app](https://weather-e-ink.vercel.app/).

![Экран входа Control Desk](docs/images/control-desk-login.png)

После входа слева — секции **01 Экран**, **02 Плата**, **03 Ссылка устройства**; справа — живой макет 800×480. Wi‑Fi платы на сервер не передаётся.

![Редактор Control Desk](docs/images/control-desk-editor.png)

Пример кадра, который рисует сервер (без query датчика с ESP32):

![Пример PNG 800×480](docs/images/screen-demo.png)

## Документация

| Документ | О чём |
|---|---|
| [Начало работы](docs/GETTING-STARTED.md) | Первый владелец, вход, сохранение макета |
| [Архитектура](docs/ARCHITECTURE.md) | Поток от редактора до PNG |
| [API](docs/API.md) | Маршруты `/api/*` и `/d/{slug}/*` |
| [Конфигурация](docs/CONFIGURATION.md) | Переменные окружения и поля панели |
| [Разработка](docs/DEVELOPMENT.md) | Локальный запуск |
| [Тестирование](docs/TESTING.md) | Ручные проверки (автотестов нет) |
| [Деплой](docs/DEPLOYMENT.md) | Vercel и PostgreSQL |
| [Интерфейс](docs/UI.md) | Секции редактора и скриншоты |

Соседний репозиторий прошивки: `d:\Project\ard\elink`.

## Стек

- Next.js 16 (App Router), React 19, TypeScript
- PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)
- Погода: [Open-Meteo](https://open-meteo.com/)
- Поиск городов: Open-Meteo Geocoding; GPS: Nominatim (OpenStreetMap)
- Карточки: `@dnd-kit`, рендер PNG на сервере (`src/lib/weather-image.ts`)

## Быстрый старт

Нужны Node.js 20+, PostgreSQL и `DATABASE_URL`.

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Если пользователей ещё нет, форма создаст первого владельца (логин от 3 символов, пароль от 8). Повторная регистрация отключена (`POST /api/auth/setup` → 409).

## Связка с ESP32

1. Сохраните макет кнопкой **«Сохранить изменения»**.
2. Скопируйте базовый URL из **03 — Ссылка устройства** (без `/screen.png`).
3. Вставьте его в `src/secrets.h` прошивки как `DEVICE_BASE_URL`.
4. Плата запрашивает `DEVICE_BASE_URL/screen.png` и читает заголовок `X-Next-Refresh-Seconds`.

Текущая прошивка принимает PNG не больше 64 КиБ и разрешение 800×480. Режим **RGB · полноцвет** в редакторе обычно даёт файл больше лимита — для FireBeetle оставляйте **2 цвета · чёрный / белый**.
