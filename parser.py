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

# --- УМНЫЕ ЭКСТРАКТОРЫ ---

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

def clean_price(text: str) -> float:
    if not text: 
        return 0.0
    
    text_clean = text.lower().replace(',', '').replace(' ', '')
    
    # 1. Поиск USD (например $500 или 500$)
    usd_match = re.search(r'(\$|\busd\b)?\s*(\d{3,4})\s*(\$|\busd\b)?', text_clean)
    if usd_match:
        val = float(usd_match.group(2))
        if 200 <= val <= 5000: # Разумный диапазон аренды в USD
            return round(val * USD_TO_VND_M, 2)

    # 2. Поиск в миллионах (12m, 12.5 triệu, 12tr, 12 million)
    m_match = re.search(r'(\d+\.?\d*)\s*(million|mln|m|tr|triệu|trieu)', text_clean)
    if m_match:
        val = float(m_match.group(1))
        return val if val < 100 else round(val / 1000, 2)

    # 3. Полная запись (12000000)
    full_match = re.search(r'(\d{7,8})', text_clean)
    if full_match:
        return round(float(full_match.group(1)) / 1_000_000, 2)

    return 0.0

def get_coords(text: str) -> tuple[float, float]:
    text_lower = text.lower()
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
            
            # Собираем сообщения за последние MAX_AGE_DAYS
            async for message in client.iter_messages(channel, limit=50):
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
                # Валидация: нужен минимальный текст и хотя бы одно фото
                if not data["photo_messages"] or len(text) < 30:
                    continue
                
                price_val = clean_price(text)
                # Пропускаем объявления с нулевой или аномально высокой ценой (>80M VND)
                if price_val <= 0 or price_val > 80:
                    continue

                lat, lng = get_coords(text)
                
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
                    "price_raw": f"{price_val:g}M VND",
                    "numeric_price": int(price_val * 1_000_000), # В донгах (например 12000000)
                    "original_url": f"tg_{channel.id}_{data['id']}",
                    "lat": lat,
                    "lng": lng,
                    "image_urls": uploaded_images,
                    "rooms": extract_rooms(text),
                    "contact": extract_contacts(text),
                    "features": extract_features(text),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }

                # Upsert в таблицу
                supabase.table("apartments").upsert(payload, on_conflict='original_url').execute()
                print(f"  ✅ [Added] Price: {price_val}M VND | Rooms: {payload['rooms']} | Photos: {len(uploaded_images)}")

        except Exception as e:
            print(f"  ⚠️ Ошибка при обработке канала: {e}")

if __name__ == '__main__':
    with client:
        client.loop.run_until_complete(main())