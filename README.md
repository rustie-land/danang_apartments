# Da Nang Apartments

Веб-приложение для поиска квартир в долгосрочную аренду в Да Нанге (Вьетнам).
Пользователь задаёт бюджет и предпочтения, выбирает зону на карте, и видит
доступные объявления со списком и на интерактивной карте.

## Стек

- **Frontend:** React 18 + Vite 5, Leaflet / react-leaflet (карта), Supabase JS.
- **Backend данных:** Supabase (PostgreSQL + Storage).
- **Парсинг:** Python-скрипты, собирающие объявления из Telegram-каналов в Supabase.
- **Деплой:** Vercel (`vercel.json` присутствует).

## Структура

```
src/                      React-приложение (App.jsx + компоненты)
parser.py                 Пайплайн: Telegram → Supabase
converter.py              Пайплайн: data.csv (Facebook-выгрузка) → JSON
requirements.txt          Python-зависимости
```

## Локальный запуск фронтенда

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # продакшен-сборка в dist/
```

Переменные окружения (Vite, префикс `VITE_`) задаются в настройках проекта Vercel
или локально в `.env` (файл в `.gitignore` — **не коммитьте его**):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Парсинг данных (Python)

```bash
pip install -r requirements.txt
cp .env.example .env      # затем заполните значения
python parser.py          # Telegram → Supabase
python converter.py       # data.csv → src/...json (вспомогательный пайплайн)
```

Переменные окружения для парсеров (`.env`, **не коммиттится**):

```
SUPABASE_URL=...
SUPABASE_KEY=...          # service key (только для серверных скриптов, не для фронта!)
TG_API_ID=...
TG_API_HASH=...
```

> ⚠️ `SUPABASE_KEY` здесь — это серверный ключ. Никогда не используйте его во
> фронтенде и не публикуйте в репозитории.

## Безопасность

- `.env`, `*.session`, `*.csv`, `*.swp` находятся в `.gitignore` и **не должны
  попадать в git**. История репозитория очищена от ранее закоммиченных секретов.
- На таблице `apartments` в Supabase должен быть включён Row Level Security (RLS).
  Фронтенд работает только с anon-key, поэтому RLS обязателен.
- После любой утечки ключей (Telegram API hash, Supabase anon/service key)
  обязательно перегенерируйте их и обновите в Vercel / `.env`.

## TODO

- [ ] Добавить тесты на парсеры цен/комнат.
- [ ] Пагинация Supabase-запроса (сейчас `select('*')` без лимита).
- [ ] Вынести инлайн-стили в CSS-классы.
