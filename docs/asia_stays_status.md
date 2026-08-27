# Asia Stays — статус и очередь доработки

> Сводка актуальна на 2026-08-26. Полная проектная память (питфолы, env, команды) —
> в навыках `asia-stays-dev` и `supabase-vite-rental-platform`. Этот файл = «что осталось».

## Текущий статус (выполнено)
- ✅ **UI/UX overhaul** (коммит `c2078ed`): глобальный поиск, чистые фильтры (без `#`/emoji),
  унификация карточек, синхронизация цены карточка↔модалка, fade/smooth-scroll.
- ✅ **Чистка описаний в БД** (2026-08-26): `clean_run.py` — канонический cleaner.
  Фикс трёх багов: `Местоположение:` не удалялось, `Улица:` склеивалось, glued-bullet
  (`My An- Высокий`). Прогнано `WRITE=1` на 94 строки. Проверено на живом id152.
  `clean_descriptions.py` теперь = тонкий shim, вызывающий `clean_run.py` свежим кодом
  (убирает macOS module-cache ловушку). Бэкап: `apartments_backup.json` (197 строк).

## Очередь доработки (дальше)
- [x] **Тесты** на парсеры цен/комнат (`parser.py`) — `test_parser.py` (32 cases, зелёный).
      Фикс `extract_rooms` (дефис в «2-спальня»). Коммит `1405eb6`.
- [x] **Чистка БД** описаний при добавлении — заменена на **prune старых записей**:
      `prune_old.py` удаляет >7 дней. Прогнано 2026-08-27: 301→104 строк (только <7d).
- [x] **Прайм-парсинг за неделю** (2026-08-27): запущен из терминала, БД 197→301,
      потом prune до 104. `clean_price` исправлен (month/meter false-million),
      `translate_text` защищён таймаутом. `backup_table.py` (бэкап 301), `clean_anomalies.py`
      (нулил 7 цен <1M). Коммиты `f24c283`, `ba476ff`, `49da622`.
- [ ] **Мульти-город** (Pattaya/Phuket): каналы Пхукета/Паттайи Руслан ВРЕМЕННО убрал из
      TG-папки (вернёмся позже). Сейчас в папке 8 каналов Da Nang. Остались: Da Nang 91, Other 13.

## Критические правила (не забывать)
- Перед записью в prod БД — бэкап (`backup_table.py`).
- Запуск парсера — ТОЛЬКО в реальном терминале (интерактивный TG-логин). Фон агента
  убивается по таймауту Hermes (~30-40s) + оставляет lock на `danang_session.session`
  (sqlite database is locked). Лечение: `pkill -9 -f "python3 parser"; rm -f danang_session.session-journal`.
- `App.modular.jsx` удалён; `main.jsx` → `App.jsx` (single source of truth).
- Сайт/дизайн-вывод → Telegram `-1004302165022` (Ai Automation), НЕ lessons-группа.
## Точка возобновления (пауза 2026-08-27)
- ✅ Тесты парсера, чистка описаний, прайм-парсинг за неделю, prune старых — ВСЁ СДЕЛАНО.
      БД = 104 свежих (<7d) строки, запушено в `main` (до `49da622`).
- 💡 **СМЕНА ЛОГИКИ ПАРСИНГА — ВЫПОЛНЕНО (2026-08-27):** Руслан хотел заменить хрупкие
      regex-экстракторы на структурированное LLM-извлечение. Реализовано:
      - `extractor.py`: `PropertyListingSchema` (Pydantic) + `STABILIZED_PROMPT`
        (адаптирован под Asia Stays: VND/THB/USD, Da Nang/Pattaya/Phuket) +
        `extract_listing_llm` (OpenRouter `deepseek/deepseek-chat`, бесплатная,
        ключ из `~/agent-swarm/.env`) + локальный regex-фоллбэк `extract_listing`.
      - **Миграция БД** `migrations/001_add_listing_schema.sql` ПРИМЕНЕНА (через
        Supabase SQL Editor): +9 колонок (is_rent, property_type, price_amount,
        price_currency, raw_address, area_sqm, floor, total_floors, description_clean)
        +3 индекса. Проверено: 24 колонки. `migrate.py` (pg8000) готов на будущее.
      - **Интеграция в `parser.py`**: вызов `extract_listing_llm` → payload со всеми
        полями; `numeric_price` = VND-эквивалент (rate VND:1, USD:25000, THB:700);
        DRY_RUN показывает LLM-результат. `NO_LLM=1` — фоллбэк на regex.
      - Dry-run подтвердил: цены/типы/адреса извлекаются корректно.
      - Коммит: см. ниже (не запушено — ждём прогона из терминала).
- НЕ СДЕЛАНО (отложено): домен `asia-stays.vercel.app` (404), схема БД `title` (400),
      автоматизация launchd (скрипты `weekly_refresh.sh`+plist готовы, НЕ установлены),
      Phuket/Pattaya каналы (убраны из TG-папки, вернёмся позже),
      **BACKFILL старых 78 строк** (не прошли через LLM; перезапишутся при следующем
      прогоне по original_url, либо отдельным скриптом).
- 🔧 **ФРОНТЕНД ОБНОВЛЁН (2026-08-27):** исправлен поиск по цене + выведены новые поля.
      - `FiltersContext.jsx`: `filterByPreferences` конвертирует min/max из выбранной
        валюты в VND (раньше сравнивал сырой VND → всё отсекалось → кнопка блокировалась).
      - `FilterForm.jsx`: убрана блокировка кнопки Find при 0 результатов; подпись
        валюты у полей цены (min/max VND/USD/THB).
      - `App.jsx`: маппинг `area_sqm`/`floor`/`total_floors`/`property_type`/`raw_address`/
        `description_clean` из БД в объект; `desc` берёт `description_clean` (чище).
      - `PropertyCard.jsx`: в строке характеристик тип / площадь m² / этаж.
      - `PropertyModal.jsx`: блок характеристик (Type, Area, Floor/total), описание из
        `descriptionClean`.
      - Удалён мёртвый `useFilters.js` (дубликат FiltersContext).
      - `npm run build` ✅, деплой ✅ (`danang-apartments.vercel.app`).

## Ежедневно в 23:55 — **cron `b744cbb4fae6`** (скрипт `~/.hermes/scripts/trim_hermes_sessions.sh`):
  `hermes sessions prune --older-than 7d --max-messages 200 --yes`. Комбинированная
  очистка (старые ИЛИ раздутые треды). Причина: сегодня бот упал из-за раздутого
  АКТИВНОГО DM-треда (~39 сообщений), а не из-за старых сессий — только возрастной
  prune это не лечит, критерий по сообщениям ловит раздутые треды.
