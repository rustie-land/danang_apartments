import os
import re
import asyncio
import random
import time
from telethon import TelegramClient
from supabase import create_client
from dotenv import load_dotenv
from geopy.geocoders import Nominatim

# --- ИНИЦИАЛИЗАЦИЯ ---
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')
load_dotenv(dotenv_path=env_path)

# Данные из .env
api_id = os.getenv('TG_API_ID')
api_hash = os.getenv('TG_API_HASH')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

client = TelegramClient('danang_session', int(api_id), api_hash)
supabase = create_client(supabase_url, supabase_key)
geolocator = Nominatim(user_agent="danang_apartments_app")

CHANNELS = ['danangrentaflat', 'arenda_v_danang', 'danang_arenda', 'danang_home']

# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

def clean_price(text):
    if not text: return 0
    text_clean = text.lower().replace(',', '').replace(' ', '')
    # Миллионы (18.5m, 18.5 million)
    found = re.search(r'(\d+\.?\d*)\s*(million|mln|m|tr|mil)', text_clean)
    if found:
        val = float(found.group(1))
        return val if val < 100 else val / 1000
    # Полные числа (18500000)
    found_full = re.search(r'(\d{4,8})', text_clean)
    if found_full:
        val = float(found_full.group(1))
        if val >= 1_000_000: return val / 1_000_000
        if val >= 1_000: return val / 1_000
    return 0

def get_coords(text):
    areas = {
        'My An': 'My An, Da Nang',
        'Son Tra': 'Son Tra, Da Nang',
        'Ngu Hanh Son': 'Ngu Hanh Son, Da Nang',
        'Hai Chau': 'Hai Chau, Da Nang',
        'An Thuong': 'An Thuong, Da Nang',
        'Lien Chieu': 'Lien Chieu, Da Nang'
    }
    target_query = "Da Nang, Vietnam"
    for key, full in areas.items():
        if key.lower() in text.lower():
            target_query = full
            break
    try:
        time.sleep(0.8) # Лимит OSM
        location = geolocator.geocode(target_query)
        if location:
            # Джиттер (разброс), чтобы маркеры не слипались
            return location.latitude + random.uniform(-0.006, 0.006), \
                   location.longitude + random.uniform(-0.006, 0.006)
    except: pass
    return 16.0544 + random.uniform(-0.01, 0.01), 108.2022 + random.uniform(-0.01, 0.01)

async def upload_image(message):
    """Загрузка медиа в Supabase Storage"""
    try:
        path = await message.download_media(file="temp_img.jpg")
        if not path: return None

        file_name = f"{message.chat_id}_{message.id}.jpg"
        with open(path, 'rb') as f:
            supabase.storage.from_('apartment-images').upload(
                file=f,
                path=file_name,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
        os.remove(path)
        return f"{supabase_url}/storage/v1/object/public/apartment-images/{file_name}"
    except Exception as e:
        print(f"⚠️ Ошибка медиа: {e}")
        return None

async def main():
    await client.start()
    print("🚀 Парсер запущен. Собираем данные и фото...")
    
    for channel in CHANNELS:
        print(f"📡 Группа: @{channel}")
        async for message in client.iter_messages(channel, limit=30):
            if not message.text or len(message.text) < 30: continue
            
            origin_id = f"tg_{channel}_{message.id}"
            img_url = None
            if message.photo:
                print(f"📸 Загрузка фото для поста {message.id}...")
                img_url = await upload_image(message)

            price_val = clean_price(message.text)
            lat, lng = get_coords(message.text)
            
            data = {
                "description": message.text,
                "price": f"{price_val:g}M VND" if price_val > 0 else "Уточняйте",
                "numeric_price": price_val,
                "original_url": origin_id,
                "lat": lat,
                "lng": lng,
                "image_urls": [img_url] if img_url else []
            }
            
            try:
                supabase.table("apartments").upsert(data, on_conflict='original_url').execute()
            except Exception as e:
                print(f"⚠️ Ошибка БД: {e}")

    print("🏁 Сбор завершен.")

if __name__ == '__main__':
    with client:
        client.loop.run_until_complete(main())