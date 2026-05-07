import os
import re
import asyncio
import random
import time
from datetime import datetime, timezone, timedelta
from telethon import TelegramClient, functions, types
from supabase import create_client
from dotenv import load_dotenv
from geopy.geocoders import Nominatim

load_dotenv()

client = TelegramClient('danang_session', int(os.getenv('TG_API_ID')), os.getenv('TG_API_HASH'))
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
geolocator = Nominatim(user_agent="danang_housing_pro")

FOLDER_NAME = "parsing aprt"
MAX_AGE_DAYS = 7

# --- УМНЫЕ ЭКСТРАКТОРЫ ---

def extract_rooms(text):
    text = text.lower()
    # Ищем: 1 bedroom, 2 br, 1 спальня, studio
    if 'studio' in text or 'студия' in text: return 0
    found = re.search(r'(\d+)\s*(bedroom|br|спальн|spal)', text)
    return int(found.group(1)) if found else 1

def extract_contacts(text):
    # Ищем телефоны или @username
    phone = re.search(r'(\+?\d{9,12})', text)
    telegram = re.search(r'@[\w_]{5,}', text)
    res = []
    if telegram: res.append(telegram.group(0))
    if phone: res.append(phone.group(1))
    return ", ".join(res) if res else "Check Telegram Link"

def extract_features(text):
    text = text.lower()
    tags_map = {
        "pool": ["pool", "бассейн", "swimming"],
        "ac": ["ac", "air con", "кондиционер", "aircon"],
        "balcony": ["balcony", "балкон"],
        "gym": ["gym", "fitness", "зал"],
        "pet_friendly": ["pet", "dog", "cat", "животными"],
        "kitchen": ["kitchen", "кухня"]
    }
    return [tag for tag, keywords in tags_map.items() if any(k in text for k in keywords)]

def clean_price(text):
    if not text: return 0
    text_clean = text.lower().replace(',', '').replace(' ', '')
    found = re.search(r'(\d+\.?\d*)\s*(million|mln|m|tr|mil)', text_clean)
    if found:
        val = float(found.group(1))
        return val if val < 100 else val / 1000
    found_full = re.search(r'(\d{5,8})', text_clean)
    if found_full:
        return float(found_full.group(1)) / 1_000_000
    return 0

def get_coords(text):
    areas = {'My An': [16.05, 108.24], 'Son Tra': [16.07, 108.23], 'Ngu Hanh Son': [16.03, 108.25], 'Hai Chau': [16.04, 108.22]}
    base_lat, base_lng = 16.0544, 108.2022
    for area, coords in areas.items():
        if area.lower() in text.lower():
            base_lat, base_lng = coords[0], coords[1]
            break
    return base_lat + random.uniform(-0.01, 0.01), base_lng + random.uniform(-0.01, 0.01)

async def upload_image(message):
    try:
        path = await message.download_media(file=f"temp_{message.id}.jpg")
        if not path: return None
        file_name = f"{message.chat_id}_{message.id}.jpg"
        with open(path, 'rb') as f:
            supabase.storage.from_('apartment-images').upload(file=f, path=file_name, file_options={"content-type": "image/jpeg", "upsert": "true"})
        os.remove(path)
        return f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/apartment-images/{file_name}"
    except: return None

async def main():
    await client.start()
    result = await client(functions.messages.GetDialogFiltersRequest())
    peers = []
    for f in result.filters:
        title = getattr(f.title, 'text', str(f.title)) if hasattr(f, 'title') else ""
        if title.strip().lower() == FOLDER_NAME.lower():
            peers = f.include_peers
            break
    
    if not peers: return print("❌ Папка не найдена")

    now = datetime.now(timezone.utc)
    for peer in peers:
        try:
            channel = await client.get_entity(peer)
            print(f"📡 {channel.title}")
            media_groups = {}
            
            async for message in client.iter_messages(channel, limit=40):
                if now - message.date > timedelta(days=MAX_AGE_DAYS): continue
                if not message.text and not message.photo: continue

                gid = str(message.grouped_id) if message.grouped_id else f"msg_{message.id}"
                if gid not in media_groups:
                    media_groups[gid] = {"text": message.text or "", "images": [], "id": message.id}
                else:
                    if message.text: media_groups[gid]["text"] = message.text
                
                if message.photo:
                    url = await upload_image(message)
                    if url: media_groups[gid]["images"].append(url)

            for gid, data in media_groups.items():
                if not data["images"] or len(data["text"]) < 40: continue
                
                price_val = clean_price(data["text"])
                lat, lng = get_coords(data["text"])
                
                payload = {
                    "description": data["text"],
                    "price": f"{price_val:g}M VND" if price_val > 0 else "N/A",
                    "numeric_price": price_val,
                    "original_url": f"tg_{channel.id}_{data['id']}",
                    "lat": lat, "lng": lng,
                    "image_urls": data["images"],
                    "rooms": extract_rooms(data["text"]),
                    "contact": extract_contacts(data["text"]),
                    "features": extract_features(data["text"])
                }
                supabase.table("apartments").upsert(payload, on_conflict='original_url').execute()
                print(f"  ✅ Added {price_val}M")
        except Exception as e: print(f"  ⚠️ Error: {e}")

if __name__ == '__main__':
    with client: client.loop.run_until_complete(main())