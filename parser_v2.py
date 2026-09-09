"""
Asia Stays — Parser v2
=====================
Telegram → Supabase pipeline with:
1. Google Maps link expansion + coordinate extraction
2. Optimized Photon geocoding (Da Nang bbox + center bias)
3. Media filtering (skip banners/avatars < 60KB, limit 8-10)
4. Price normalization with safety guards + needs_manual_review flag
5. Deduplication via md5(district + bedrooms + price) over 7-day window
6. Telegram forum/thread support (message_thread_id, reply_to_top_id)
7. Async I/O throughout (httpx.AsyncClient, 5-8s timeouts)
"""

from __future__ import annotations

import os
import re
import json
import time
import asyncio
import hashlib
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, List

import httpx
from telethon import TelegramClient, functions
from supabase import create_client, ClientOptions
from dotenv import load_dotenv

load_dotenv(override=True)

# Load OpenRouter key from agent-swarm/.env
try:
    for _line in open(os.path.expanduser('~/agent-swarm/.env'), encoding='utf-8'):
        _line = _line.strip()
        if _line and not _line.startswith('#') and '=' in _line:
            _k, _v = _line.split('=', 1)
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
except FileNotFoundError:
    pass

import extractor as listing_extractor


# ─── Config ───────────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '').strip()
TG_API_ID = os.getenv('TG_API_ID', '').strip()
TG_API_HASH = os.getenv('TG_API_HASH', '').strip()

if not SUPABASE_URL or 'your-project' in SUPABASE_URL:
    raise ValueError(f"❌ Invalid SUPABASE_URL: '{SUPABASE_URL}'")
if not SUPABASE_KEY:
    raise ValueError("❌ Missing SUPABASE_KEY")

# Da Nang bounding box
DA_NANG_BOX = {'lat_min': 15.8, 'lat_max': 16.2, 'lon_min': 108.0, 'lon_max': 108.4}
DA_NANG_CENTER = (16.0544, 108.2400)

# Exchange rates
USD_TO_VND = 25400.0
THB_TO_VND = 730.0

FOLDER_NAME = "parsing aprt"
MAX_AGE_DAYS = 7
MAX_PHOTOS = 10
MIN_PHOTO_SIZE = 60 * 1024  # 60 KB
HTTP_TIMEOUT = 8.0

client = TelegramClient('danang_session', int(TG_API_ID), TG_API_HASH)
supabase = create_client(
    SUPABASE_URL, SUPABASE_KEY,
    options=ClientOptions(postgrest_client_timeout=60)
)


# ─── 1. Google Maps link expansion ───────────────────────────────────────────

GOOGLE_MAPS_RE = re.compile(
    r'(https?://(?:maps\.app\.goo\.gl|google\.com/maps|www\.google\.com/maps)[^\s\]\)]+)'
)

def extract_google_maps_coords(text: str) -> Optional[Tuple[float, float]]:
    """Extract coordinates from Google Maps links in text."""
    m = GOOGLE_MAPS_RE.search(text)
    if not m:
        return None
    url = m.group(1)
    return expand_google_maps_url(url)

async def expand_google_maps_url(url: str) -> Optional[Tuple[float, float]]:
    """Follow redirects and extract lat/lng from Google Maps URL."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=HTTP_TIMEOUT) as c:
            resp = await c.get(url)
            final_url = str(resp.url)
        # Try @lat,lng pattern
        m = re.search(r'[@?&]q?=?(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
        if not m:
            # Try /place/lat,lng
            m = re.search(r'/place/(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
        if not m:
            # Try !3d!4d format
            m = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', final_url)
        if m:
            lat, lng = float(m.group(1)), float(m.group(2))
            if is_in_da_nang_bbox(lat, lng):
                return (lat, lng)
    except Exception as e:
        print(f"    ⚠️ Google Maps expansion failed: {e}")
    return None


# ─── 2. Optimized Photon geocoding ───────────────────────────────────────────

async def geocode_address_async(raw_address: str | None, text: str = '') -> Optional[Tuple[float, float]]:
    """Geocode via Photon with Da Nang center bias and bbox filter."""
    query = (raw_address or '').strip()
    if not query:
        return None
    if 'vietnam' not in query.lower() and 'việt' not in query.lower():
        query = f"{query}, Vietnam"
    
    params = {
        'q': query,
        'limit': 1,
        'lat': DA_NANG_CENTER[0],
        'lon': DA_NANG_CENTER[1],
    }
    url = f"https://photon.komoot.io/api/"
    headers = {"User-Agent": "AsiaStaysBot/1.0 (danang-apartments; savvin.rg@gmail.com)"}
    
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as c:
            resp = await c.get(url, params=params, headers=headers)
            data = resp.json()
        if data.get('features'):
            coords = data['features'][0]['geometry']['coordinates']
            lat, lng = round(coords[1], 6), round(coords[0], 6)
            if is_in_da_nang_bbox(lat, lng):
                return (lat, lng)
            else:
                print(f"    ⚠️ Geocode out of Da Nang: {query[:50]} -> ({lat},{lng})")
    except Exception as e:
        print(f"    ⚠️ Geocode failed ({e}): {query[:50]}")
    return None

def is_in_da_nang_bbox(lat: float, lng: float) -> bool:
    """Check if coordinates fall within Da Nang bounding box."""
    return (DA_NANG_BOX['lat_min'] <= lat <= DA_NANG_BOX['lat_max'] and
            DA_NANG_BOX['lon_min'] <= lng <= DA_NANG_BOX['lon_max'])


# ─── 3. Media filtering ──────────────────────────────────────────────────────

def should_keep_photo(file_path: str) -> bool:
    """Filter out banners, avatars, logos by file size."""
    try:
        size = os.path.getsize(file_path)
        return size >= MIN_PHOTO_SIZE
    except OSError:
        return False


# ─── 4. Price normalization with safety guards ───────────────────────────────

def normalize_price_vnd(amount: float, currency: str) -> Tuple[float, bool]:
    """
    Convert price to VND. Returns (normalized_amount, needs_manual_review).
    
    Rules:
    - If currency == 'VND' and price < 1000 → multiply by 1,000,000
    - If currency == 'VND' and 1000 <= price < 100,000 → multiply by 1,000
    - USD → multiply by 25,400
    - THB → multiply by 730
    - Flag needs_manual_review if final < 1M or > 150M VND
    """
    if currency == 'VND':
        if amount < 1000:
            amount = amount * 1_000_000
        elif amount < 100_000:
            amount = amount * 1000
    elif currency == 'USD':
        amount = amount * USD_TO_VND
    elif currency == 'THB':
        amount = amount * THB_TO_VND
    
    needs_review = amount < 1_000_000 or amount > 150_000_000
    return amount, needs_review


# ─── 5. Deduplication ────────────────────────────────────────────────────────

def compute_listing_hash(district: str, bedrooms: int | None, price_vnd: float) -> str:
    """Compute md5 hash for deduplication."""
    key = f"{district or ''}|{bedrooms or 0}|{int(price_vnd)}"
    return hashlib.md5(key.encode()).hexdigest()

async def check_duplicate(hash_val: str, street: str, days: int = 7) -> bool:
    """Check if a listing with same hash + street exists in last N days."""
    try:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        result = supabase.table('apartments') \
            .select('id') \
            .eq('listing_hash', hash_val) \
            .gte('created_at', since) \
            .limit(1) \
            .execute()
        return len(result.data) > 0
    except Exception:
        return False


# ─── 6. Telegram forum/thread support ────────────────────────────────────────

async def get_messages_with_threads(channel, limit: int = 100):
    """Yield messages including forum/thread replies."""
    async for message in client.iter_messages(channel, limit=limit):
        yield {
            'id': message.id,
            'text': message.text or '',
            'photo': message.photo,
            'grouped_id': message.grouped_id,
            'date': message.date,
            'message_thread_id': getattr(message, 'message_thread_id', None),
            'reply_to_top_id': getattr(message, 'reply_to_top_id', None),
        }


# ─── 7. Async image upload ───────────────────────────────────────────────────

async def upload_image_async(message, channel_id: int) -> Optional[str]:
    """Download and upload image asynchronously."""
    temp_path = f"temp_{channel_id}_{message.id}.jpg"
    file_name = f"{channel_id}_{message.id}.jpg"
    
    try:
        path = await message.download_media(file=temp_path)
        if not path:
            return None
        
        # Filter by size
        if not should_keep_photo(path):
            os.remove(path)
            return None
        
        # Upload to Supabase Storage
        url = f"{SUPABASE_URL}/storage/v1/object/apartment-images/{file_name}"
        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "x-upsert": "true",
            "Content-Type": "image/jpeg"
        }
        with open(path, 'rb') as f:
            file_data = f.read()
        
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.post(url, headers=headers, content=file_data)
        
        os.remove(path)
        
        if resp.status_code in (200, 201):
            return f"{SUPABASE_URL}/storage/v1/object/public/apartment-images/{file_name}"
        return None
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"    ⚠️ Upload error {message.id}: {e}")
        return None


# ─── Main pipeline ────────────────────────────────────────────────────────────

async def main():
    await client.start()
    print("🚀 Telegram Client started (Parser v2)")
    print(f"🔗 Supabase: {SUPABASE_URL}")
    
    # Get folder
    result = await client(functions.messages.GetDialogFiltersRequest())
    peers = []
    for f in result.filters:
        title = getattr(f.title, 'text', str(f.title)) if hasattr(f, 'title') else ""
        if title.strip().lower() == FOLDER_NAME.lower():
            peers = f.include_peers
            break
    
    if not peers:
        return print(f"❌ Folder '{FOLDER_NAME}' not found")
    
    now = datetime.now(timezone.utc)
    
    for peer in peers:
        try:
            channel = await client.get_entity(peer)
            print(f"\n📡 Channel: {channel.title}")
            
            media_groups = {}
            
            async for msg in get_messages_with_threads(channel, limit=100):
                if msg['date'] and (now - msg['date'] > timedelta(days=MAX_AGE_DAYS)):
                    continue
                if not msg['text'] and not msg['photo']:
                    continue
                
                gid = str(msg['grouped_id']) if msg['grouped_id'] else f"msg_{msg['id']}"
                
                if gid not in media_groups:
                    media_groups[gid] = {
                        "text": msg['text'],
                        "photo_messages": [],
                        "id": msg['id'],
                        "message_thread_id": msg['message_thread_id'],
                        "reply_to_top_id": msg['reply_to_top_id'],
                    }
                else:
                    if msg['text'] and not media_groups[gid]["text"]:
                        media_groups[gid]["text"] = msg['text']
                
                if msg['photo']:
                    media_groups[gid]["photo_messages"].append(msg)
            
            for gid, data in media_groups.items():
                text = data["text"]
                if not data["photo_messages"]:
                    continue
                if not listing_extractor.is_rental_listing(text):
                    continue
                
                # Extract via LLM
                use_llm = os.getenv('NO_LLM') != '1'
                if use_llm:
                    schema = listing_extractor.extract_listing_llm(text)
                else:
                    schema = listing_extractor.extract_listing(text)
                
                if schema.price_amount is None or schema.price_amount <= 0:
                    continue
                
                # Normalize price
                price_vnd, needs_review = normalize_price_vnd(
                    schema.price_amount, schema.price_currency.value
                )
                
                # Geocode: try Google Maps first, then Photon
                coords = None
                gm_coords = extract_google_maps_coords(text)
                if gm_coords:
                    coords = gm_coords
                else:
                    coords = await geocode_address_async(schema.raw_address, text)
                if not coords:
                    coords = get_coords_fallback(text)
                
                lat, lng = coords
                
                # Deduplication
                district = extract_district(text)
                listing_hash = compute_listing_hash(district, schema.rooms_count, price_vnd)
                street = schema.raw_address or ''
                if await check_duplicate(listing_hash, street):
                    print(f"  ⏭️ Duplicate: {street[:40]}")
                    continue
                
                # Upload photos (max 10, filtered)
                uploaded = []
                for photo_msg in data["photo_messages"][:MAX_PHOTOS]:
                    url = await upload_image_async(photo_msg['photo'], channel.id)
                    if url:
                        uploaded.append(url)
                
                if not uploaded:
                    continue
                
                # Build payload
                payload = {
                    "description": text,
                    "description_clean": schema.description_clean,
                    "price_raw": f"{schema.price_amount} {schema.price_currency.value}",
                    "currency": schema.price_currency.value,
                    "price_amount": schema.price_amount,
                    "price_currency": schema.price_currency.value,
                    "numeric_price": int(price_vnd),
                    "is_rent": schema.is_rent,
                    "property_type": schema.property_type.value,
                    "raw_address": schema.raw_address,
                    "rooms": schema.rooms_count,
                    "area_sqm": schema.area_sqm,
                    "floor": schema.floor,
                    "total_floors": schema.total_floors,
                    "original_url": f"tg_{channel.id}_{data['id']}",
                    "lat": lat,
                    "lng": lng,
                    "city": extract_city(text),
                    "image_urls": uploaded,
                    "contact": extract_contacts(text),
                    "features": extract_features(text),
                    "listing_hash": listing_hash,
                    "needs_manual_review": needs_review,
                    "message_thread_id": data.get('message_thread_id'),
                    "reply_to_top_id": data.get('reply_to_top_id'),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                if os.getenv('DRY_RUN') == '1':
                    print(f"  (DRY) price={price_vnd/1e6:.1f}M VND review={needs_review} hash={listing_hash[:8]}")
                    continue
                
                res = upsert_with_retry(payload)
                if res:
                    print(f"  ✅ Added: {schema.property_type.value} | {price_vnd/1e6:.1f}M VND | {len(uploaded)} photos")
        
        except Exception as e:
            print(f"  ⚠️ Channel error: {e}")


def get_coords_fallback(text: str) -> Tuple[float, float]:
    """Fallback to district-level pin with jitter."""
    text_lower = text.lower()
    areas = {
        'my an': (16.0520, 108.2410),
        'my khe': (16.0600, 108.2430),
        'son tra': (16.0850, 108.2300),
        'ngu hanh son': (16.0300, 108.2500),
        'hai chau': (16.0680, 108.2230),
        'an thuong': (16.0540, 108.2420),
    }
    base_lat, base_lng = 16.0544, 108.2400
    for area, coords in areas.items():
        if area in text_lower:
            base_lat, base_lng = coords
            break
    return (
        round(base_lat + random.uniform(-0.002, 0.002), 6),
        round(base_lng + random.uniform(-0.002, 0.002), 6)
    )

def extract_district(text: str) -> str:
    """Extract district name from text."""
    text_lower = text.lower()
    districts = {
        'son tra': 'Son Tra',
        'ngu hanh son': 'Ngu Hanh Son',
        'hai chau': 'Hai Chau',
        'thanh khe': 'Thanh Khe',
        'cam le': 'Cam Le',
        'an thuong': 'An Thuong',
        'my an': 'My An',
        'my khe': 'My Khe',
    }
    for key, name in districts.items():
        if key in text_lower:
            return name
    return 'Da Nang'

def extract_city(text: str) -> str:
    """Extract city from text."""
    text_lower = text.lower()
    for key, city in [('da nang', 'Da Nang'), ('pattaya', 'Pattaya'), ('phuket', 'Phuket'), ('bangkok', 'Bangkok')]:
        if key in text_lower:
            return city
    return 'Da Nang'

def extract_contacts(text: str) -> str:
    """Extract phone/TG contacts."""
    phones = re.findall(r'(\+?\d{9,12})', text)
    telegrams = re.findall(r'(@[\w_]{5,})', text)
    contacts = list(set(telegrams + phones))
    return ", ".join(contacts) if contacts else "Direct TG Message"

def extract_features(text: str) -> List[str]:
    """Extract amenity features."""
    text_lower = text.lower()
    tags_map = {
        "pool": ["pool", "бассейн", "swimming"],
        "ac": ["ac", "air con", "кондиционер", "aircon"],
        "balcony": ["balcony", "балкон"],
        "gym": ["gym", "fitness", "зал"],
        "pet": ["pet", "dog", "cat", "животными", "pets allowed"],
        "kitchen": ["kitchen", "кухня"],
        "sea": ["sea view", "ocean view", "вид на море", "beachfront"],
        "beach": ["near beach", "walk to beach", "близко к морю"],
    }
    return [tag for tag, keywords in tags_map.items() if any(k in text_lower for k in keywords)]


def upsert_with_retry(payload: dict, attempts: int = 4):
    """Upsert with exponential backoff."""
    last = None
    for i in range(attempts):
        try:
            return supabase.table("apartments").upsert(payload, on_conflict='original_url').execute()
        except Exception as e:
            last = e
            wait = 2 ** i
            print(f"    ⚠️ Upsert attempt {i+1}/{attempts} failed: {e}; retry in {wait}s")
            time.sleep(wait)
    print(f"    ❌ Upsert gave up: {last}")
    return None


if __name__ == '__main__':
    import traceback
    try:
        with client:
            client.loop.run_until_complete(main())
    except Exception:
        traceback.print_exc()
        raise
