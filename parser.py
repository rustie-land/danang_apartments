from __future__ import annotations

import os
import re
import time
import asyncio
import random
import requests
from datetime import datetime, timezone, timedelta
from telethon import TelegramClient, functions
from supabase import create_client
from dotenv import load_dotenv

# Принудительно перезаписываем системные переменные окружения значениями из .env
load_dotenv(override=True)

# Считываем и очищаем переменные от пробелов/переносов
SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '').strip()
TG_API_ID = os.getenv('TG_API_ID', '').strip()
TG_API_HASH = os.getenv('TG_API_HASH', '').strip()

# Проверка корректности переменных
if not SUPABASE_URL or 'your-project' in SUPABASE_URL:
    print(f"⚠️ Текущее значение SUPABASE_URL: '{SUPABASE_URL}'")
    raise ValueError("❌ Ошибка: В .env указан неверный, пустой или дефолтный SUPABASE_URL!")

if not SUPABASE_KEY:
    raise ValueError("❌ Ошибка: В .env отсутствует SUPABASE_KEY!")

# Инициализация клиентов
client = TelegramClient('danang_session', int(TG_API_ID), TG_API_HASH)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FOLDER_NAME = "parsing aprt"
MAX_AGE_DAYS = 10
USD_TO_VND_M = 0.025  # Курс для конвертации $ в миллионы донгов ($1000 = 25M VND)
# Примерные курсы (можно вынести в .env позже). 1 USD / 1 THB -> VND
USD_TO_VND = 25000.0
THB_TO_VND = 700.0

# --- УМНЫЕ ЭКСТРАКТОРЫ ---

def detect_currency(text: str) -> str:
    """Определяет валюту объявления по ключевым словам. По умолчанию VND."""
    t = text.lower()
    # THB (бат) — проверяем до $, т.к. в Таиланде часто пишут "฿" или "baht"
    if any(k in t for k in ['฿', 'baht', 'бат', 'thb', 'thai bath', 'thailand']):
        return 'THB'
    # USD / $
    if any(k in t for k in ['$', 'usd', 'долл', 'dollar']):
        return 'USD'
    # Явный донг
    if any(k in t for k in ['vnd', 'đồng', 'донг', 'triệu', 'trieu', 'tr ', ' m ']):
        return 'VND'
    return 'VND'

def extract_city(text: str, channel_title: str = '') -> str:
    """Определяет город/район из текста объявления ИЛИ названия канала."""
    t = (text + ' ' + channel_title).lower()
    city_map = {
        'da nang': 'Da Nang',
        'дананг': 'Da Nang',
        'pattaya': 'Pattaya',
        'паттайя': 'Pattaya',
        'bangkok': 'Bangkok',
        'бангкок': 'Bangkok',
        'phuket': 'Phuket',
        'пхукет': 'Phuket',
        'hua hin': 'Hua Hin',
        'хуа хин': 'Hua Hin',
    }
    for key, city in city_map.items():
        if key in t:
            return city
    return 'Other'

def extract_rooms(text: str) -> int:
    text = text.lower()
    if any(k in text for k in ['studio', 'студия', '0 br', '0 bed']): 
        return 0
    
    # Ищем паттерны: 1BR, 2 beds, 1 спальня, 3 bedrooms
    found = re.search(r'(\d+)\s*(bedroom|br|bed|спальн|spal)', text)
    if found:
        return int(found.group(1))
    
    return 1 # Default fallback

def extract_contacts(text: str) -> str:
    phones = re.findall(r'(\+?\d{9,12})', text)
    telegrams = re.findall(r'(@[\w_]{5,})', text)
    
    contacts = list(set(telegrams + phones))
    return ", ".join(contacts) if contacts else "Direct TG Message"

def extract_features(text: str) -> list:
    text_lower = text.lower()
    tags_map = {
        "#pool": ["pool", "бассейн", "swimming"],
        "#ac": ["ac", "air con", "кондиционер", "aircon"],
        "#balcony": ["balcony", "балкон"],
        "#gym": ["gym", "fitness", "зал"],
        "#pet": ["pet", "dog", "cat", "животными", "pets allowed"],
        "#kitchen": ["kitchen", "кухня"],
        "#sea": ["sea view", "ocean view", "вид на море", "beachfront"],
        "#beach": ["near beach", "walk to beach", "близко к морю"]
    }
    return [tag for tag, keywords in tags_map.items() if any(k in text_lower for k in keywords)]

def clean_price(text: str) -> tuple[float, str]:
    """Возвращает (цена_в_VND_миллионах, валюта_источника).
    Корректно различает VND / USD / THB и конвертирует в VND."""
    if not text:
        return 0.0, 'VND'

    text_clean = text.lower().replace(',', '').replace(' ', '')
    currency = detect_currency(text)

    amount = 0.0  # в исходной валюте

    # 1. Поиск USD (например $500, 500$, 500 usd)
    usd_match = re.search(r'(\$|usd)?(\d{3,5})(\$|usd)?', text_clean)
    if currency == 'USD' and usd_match:
        val = float(usd_match.group(2))
        if 100 <= val <= 20000:
            amount = val
    # 2. Поиск THB (например 15000฿, 15,000 baht)
    elif currency == 'THB':
        thb_match = re.search(r'(\d{4,7})(฿|baht|thb)?', text_clean)
        if thb_match:
            val = float(thb_match.group(1))
            if 3000 <= val <= 500000:
                amount = val
    # 3. Поиск в миллионах донгов (12m, 12.5 triệu, 12tr, 12 million)
    elif currency == 'VND':
        m_match = re.search(r'(\d+\.?\d*)\s*(million|mln|m|tr|triệu|trieu)', text_clean)
        if m_match:
            val = float(m_match.group(1))
            amount = val if val < 100 else round(val / 1000, 2)
        else:
            # 4. Полная запись донгов (12000000)
            full_match = re.search(r'(\d{7,8})', text_clean)
            if full_match:
                amount = round(float(full_match.group(1)) / 1_000_000, 2)

    # Конвертация в VND (миллионы)
    if currency == 'USD':
        vnd_m = round(amount * USD_TO_VND / 1_000_000, 2)
    elif currency == 'THB':
        vnd_m = round(amount * THB_TO_VND / 1_000_000, 2)
    else:
        vnd_m = amount

    return vnd_m, currency

def translate_text(text: str) -> str:
    """Переводит описание на английский. Возвращает оригинал при ошибке."""
    if not text or len(text) < 5:
        return text
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source='auto', target='en').translate(text)
    except Exception as e:
        print(f"    ⚠️ Ошибка перевода: {e}")
        return text

def get_coords(text: str) -> tuple[float, float]:
    text_lower = text.lower()
    # Города (приоритет выше районов — проверяем первыми)
    cities = {
        'pattaya': (12.9236, 100.8823),
        'паттайя': (12.9236, 100.8823),
        'bangkok': (13.7563, 100.5018),
        'бангкок': (13.7563, 100.5018),
        'phuket': (7.8804, 98.3923),
        'пхукет': (7.8804, 98.3923),
        'hua hin': (12.5684, 99.9591),
        'хуа хин': (12.5684, 99.9591),
    }
    for city, coords in cities.items():
        if city in text_lower:
            base_lat, base_lng = coords
            return (
                round(base_lat + random.uniform(-0.02, 0.02), 6),
                round(base_lng + random.uniform(-0.02, 0.02), 6)
            )

    areas = {
        'my an': (16.0520, 108.2410),
        'my khe': (16.0600, 108.2430),
        'son tra': (16.0850, 108.2300),
        'ngu hanh son': (16.0300, 108.2500),
        'hai chau': (16.0680, 108.2230),
        'an thuong': (16.0540, 108.2420)
    }
    
    # Дефолтный центр (Дананг / пляжный район)
    base_lat, base_lng = 16.0544, 108.2400
    
    for area, coords in areas.items():
        if area in text_lower:
            base_lat, base_lng = coords
            break
            
    # Легкий шум (~200 метров), чтобы точки не накладывались ровно друг на друга
    return (
        round(base_lat + random.uniform(-0.002, 0.002), 6),
        round(base_lng + random.uniform(-0.002, 0.002), 6)
    )

# --- ЗАГРУЗКА ИЗОБРАЖЕНИЙ ---

def upload_image_sync(file_path: str, file_name: str) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/apartment-images/{file_name}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "x-upsert": "true",
        "Content-Type": "image/jpeg"
    }
    
    for attempt in range(3):
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
                
            res = requests.post(url, headers=headers, data=file_data, timeout=15)
            
            if res.status_code in (200, 201):
                return True
            else:
                print(f"    ❌ Ошибка Supabase Storage [{res.status_code}]: {res.text}")
                return False
        except Exception as e:
            if attempt == 2:
                print(f"    ❌ Исключение при отправке requests: {e}")
            time.sleep(1)
            
    return False

async def upload_image(message, channel_id: int) -> str | None:
    temp_path = f"temp_{channel_id}_{message.id}.jpg"
    file_name = f"{channel_id}_{message.id}.jpg"

    try:
        path = await message.download_media(file=temp_path)
        if not path: 
            return None
        
        loop = asyncio.get_event_loop()
        success = await loop.run_in_executor(None, upload_image_sync, path, file_name)

        if os.path.exists(path):
            os.remove(path)

        if success:
            return f"{SUPABASE_URL}/storage/v1/object/public/apartment-images/{file_name}"
        else:
            return None

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"    ⚠️ Ошибка обработки медиа {message.id}: {e}")
        return None

def is_rental_listing(text: str) -> bool:
    """Пропускаем только объявления о ДЛИТЕЛЬНОЙ АРЕНДЕ апартаментов.
    Отбрасываем: продажу, инвестиции, авто/мото, заголовки-списки районов, ботов."""
    t = text.lower()

    # Явные исключения (НЕ аренда)
    reject = [
        'покупк', 'купить', 'buy', 'sale', 'for sale', 'продаж', 'invest',
        'инвест', 'авто', 'auto', 'мото', 'motorcycle', 'cars', '😎',  # часто в заголовках каналов
    ]
    if any(k in t for k in reject):
        return False

    # Признаки аренды (должен быть хотя бы один)
    rent_signals = [
        'аренд', 'сдаётся', 'сдается', 'сниму', 'rent', 'for rent', 'rental',
        'длительн', 'помесяч', 'long stay', 'monthly', 'lease', 'жильё', 'жилье',
        'apartment', 'condo', 'квартир', 'studio', 'bedroom', 'спальн',
    ]
    if not any(k in t for k in rent_signals):
        return False

    # Отбрасываем "списки районов" (много ссылок t.me + слово район/список)
    tme_links = t.count('t.me/') + t.count('@')
    if tme_links >= 3 and any(k in t for k in ['район', 'список', 'district', 'list']):
        return False

    return True

# --- ОСНОВНОЙ ПАЙПЛАЙН ---

async def main():
    await client.start()
    print("🚀 Telegram Client started")
    print(f"🔗 Подключено к Supabase: {SUPABASE_URL}")

    # Получаем папки
    result = await client(functions.messages.GetDialogFiltersRequest())
    peers = []
    for f in result.filters:
        title = getattr(f.title, 'text', str(f.title)) if hasattr(f, 'title') else ""
        if title.strip().lower() == FOLDER_NAME.lower():
            peers = f.include_peers
            break
    
    if not peers:
        return print(f"❌ Папка '{FOLDER_NAME}' не найдена в Telegram")

    now = datetime.now(timezone.utc)
    
    for peer in peers:
        try:
            channel = await client.get_entity(peer)
            print(f"\n📡 Парсим канал: {channel.title}")
            
            media_groups = {}
            
            # Собираем сообщения за последние MAX_AGE_DAYS (берём больше, т.к. много мусора отсеется)
            async for message in client.iter_messages(channel, limit=150):
                if message.date and (now - message.date > timedelta(days=MAX_AGE_DAYS)):
                    continue
                if not message.text and not message.photo:
                    continue

                gid = str(message.grouped_id) if message.grouped_id else f"msg_{message.id}"
                
                if gid not in media_groups:
                    media_groups[gid] = {
                        "text": message.text or "", 
                        "photo_messages": [], 
                        "id": message.id
                    }
                else:
                    if message.text and not media_groups[gid]["text"]:
                        media_groups[gid]["text"] = message.text

                if message.photo:
                    media_groups[gid]["photo_messages"].append(message)

            # Обрабатываем сгруппированные данные
            for gid, data in media_groups.items():
                text = data["text"]
                # Валидация: нужно фото + это реально объявление об аренде
                if not data["photo_messages"]:
                    continue
                if not is_rental_listing(text):
                    continue
                
                price_val, currency = clean_price(text)
                # Пропускаем объявления с нулевой или аномально высокой ценой (>80M VND)
                if price_val <= 0 or price_val > 80:
                    continue

                lat, lng = get_coords(text)
                city = extract_city(text, getattr(channel, 'title', ''))
                desc_en = translate_text(text)

                # Загружаем максимум 5 фото на объявление
                uploaded_images = []
                for photo_msg in data["photo_messages"][:5]:
                    img_url = await upload_image(photo_msg, channel.id)
                    if img_url:
                        uploaded_images.append(img_url)

                if not uploaded_images:
                    continue

                # Формируем payload в соответствии со структурой Supabase
                payload = {
                    "description": text,
                    "description_en": desc_en,
                    "price_raw": f"{price_val:g}M VND",
                    "currency": currency,
                    "numeric_price": int(price_val * 1_000_000), # В донгах (например 12000000)
                    "original_url": f"tg_{channel.id}_{data['id']}",
                    "lat": lat,
                    "lng": lng,
                    "city": city,
                    "image_urls": uploaded_images,
                    "rooms": extract_rooms(text),
                    "contact": extract_contacts(text),
                    "features": extract_features(text),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }

                # Upsert в таблицу
                supabase.table("apartments").upsert(payload, on_conflict='original_url').execute()
                print(f"  ✅ [Added] City: {city} | Price: {price_val}M VND ({currency}) | Rooms: {payload['rooms']} | Photos: {len(uploaded_images)}")

        except Exception as e:
            print(f"  ⚠️ Ошибка при обработке канала: {e}")

if __name__ == '__main__':
    with client:
        client.loop.run_until_complete(main())