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

DA_NANG_BOX = {'lat_min': 15.9000, 'lat_max': 16.1500, 'lon_min': 108.0500, 'lon_max': 108.3500}
DA_NANG_CENTER = (16.0544, 108.2400)

DA_NANG_STREET_WHITELIST = [
    'an thượng', 'an thuong', 'mỹ khê', 'my khe', 'trần hưng đạo', 'tran hung dao',
    'nguyễn văn thoại', 'nguyen van thoai', 'bãi bắc', 'bai bac', 'marble mountains',
    'han river bridge', 'ngô quyền', 'ngo quyen', 'lê duẩn', 'le duan', 'hùng vương',
    'hung vuong', 'phan châu trinh', 'phan chau trinh', 'hoàng diệu', 'hoang dieu',
    'bạch đằng', 'bach dang', 'phan thiết', 'phan thiet', 'võ nguyên giáp',
    'vo nguyen giap', 'ngũ hành sơn', 'ngu hanh son', 'hòa hải', 'hoa hai',
    'hòa quý', 'hoa quy', 'trần phú', 'tran phú', 'bãi dài', 'bai dài',
    'bãi rèn', 'bai ren', 'thọ quang', 'tho quang', 'phước mỹ', 'phuoc my',
    'đường 2/9', 'duong 2/9', 'cầu rồng', 'cau rong', 'cầu sông hàn',
    'cau song han', 'hòa cường', 'hoa cuong', 'thạch thang', 'thach thang',
    'võ thị thừa', 'vo thi thua', 'điện biên phủ', 'dien bien phu',
    'phan đình phùng', 'phan dinh phung', 'trường sa', 'truong sa',
    'hồng bàng', 'hong bang', 'hoà khê', 'hoa khe', 'tân chánh',
    'tan chanh', 'hòa minh', 'hoa minh', 'bình hiên', 'binh hien',
    'bình thuận', 'binh thuan', 'hòa thọ đông', 'hoa tho dong',
    'hòa thọ tây', 'hoa tho tay', 'hòa phát', 'hoa phat',
    'hòa xuân', 'hoa xuan', 'hòa kiếm', 'hoa kiem', 'khê mỹ',
    'khe my', 'kim sơn', 'kim son', 'lộc thọ', 'loc tho',
    'nam dương', 'nam duong', 'ngô mây', 'ngo may', 'phước ninh',
    'phuoc ninh', 'quảng nam', 'quang nam', 'sơn trà', 'son tra',
    'thanh khê', 'thanh khe', 'thọ xuân', 'tho xuan', 'trần cao',
    'tran cao', 'trần nam phú', 'tran nam phu', 'tam thuật',
    'thạch bình', 'thach binh', 'thái phiên', 'thai phien',
    'thăng long', 'thang long', 'thanh lợi', 'thanh loi',
    'thọ quan', 'tho quan', 'thuận phước', 'thuan phuoc',
    'tiên sa', 'tien sa', 'trần hạnh', 'tran hanh', 'trần thị vĩnh',
    'tran thi vinh', 'trung hòa', 'trung hoa', 'trường chinh',
    'truong chinh', 'vạn xuân', 'van xuan', 'viết nam', 'viet nam',
    'vĩnh trung', 'vinh trung', 'vĩnh phước', 'vinh phuoc',
    'xương huân', 'xuong huan', 'thạch thang', 'thach thang',
    'yên bái', 'yen bai', 'phú ninh', 'phu ninh',
]

# Exchange rates
USD_TO_VND = 25400.0
THB_TO_VND = 730.0

FOLDER_NAME = "parsing aprt"
MAX_AGE_DAYS = 7
MAX_PHOTOS = 10
MIN_PHOTO_SIZE = 60 * 1024  # 60 KB
HTTP_TIMEOUT = 8.0
MSG_LIMIT = 2000  # Max messages to scan per channel (increased for more coverage)
LLM_DELAY = 1.5  # Delay between LLM requests to avoid 429

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

async def geocode_address_async(raw_address: str | None, text: str = '', city: str = 'Da Nang') -> Optional[Tuple[float, float]]:
    """Geocode via Photon with Da Nang center bias and HARD bbox filter."""
    query = (raw_address or '').strip()
    if not query:
        return None
    
    # Fuzzy street name normalization
    if query:
        query = normalize_street_name(query)
    
    # Always anchor to Da Nang, Vietnam
    query = f"{query}, Da Nang, Vietnam"
    
    params = {
        'q': query,
        'limit': 3,
        'lat': DA_NANG_CENTER[0],
        'lon': DA_NANG_CENTER[1],
    }
    url = "https://photon.komoot.io/api/"
    headers = {"User-Agent": "AsiaStaysBot/1.0 (danang-apartments; savvin.rg@gmail.com)"}
    
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as c:
            resp = await c.get(url, params=params, headers=headers)
            data = resp.json()
        if data.get('features'):
            for feature in data['features']:
                coords = feature['geometry']['coordinates']
                lat, lng = round(coords[1], 6), round(coords[0], 6)
                if is_in_da_nang_bbox(lat, lng):
                    return (lat, lng)
            # HARD BBOX FILTER: out-of-bbox = no coordinates
            print(f"    ⚠️ Geocode out of Da Nang bbox: {query[:50]} -> resetting lat/lon to NULL")
            return None
    except Exception as e:
        print(f"    ⚠️ Geocode failed ({e}): {query[:50]}")
    return None

def is_in_da_nang_bbox(lat: float, lng: float) -> bool:
    """Check if coordinates fall within Da Nang bounding box."""
    return (DA_NANG_BOX['lat_min'] <= lat <= DA_NANG_BOX['lat_max'] and
            DA_NANG_BOX['lon_min'] <= lng <= DA_NANG_BOX['lon_max'])


def normalize_street_name(name: str) -> str:
    """Fuzzy match street name against Da Nang whitelist."""
    name_lower = name.lower().strip()
    # Remove common prefixes
    name_clean = re.sub(r'^(đường|duong|street|st\.?|đường)\s+', '', name_lower)
    
    # Exact match first
    if name_clean in DA_NANG_STREET_WHITELIST:
        return name_clean
    
    # Fuzzy match using Levenshtein distance
    best_match = None
    best_distance = float('inf')
    
    for street in DA_NANG_STREET_WHITELIST:
        distance = levenshtein_distance(name_clean, street)
        if distance < best_distance:
            best_distance = distance
            best_match = street
    
    # Only return match if distance is reasonable (< 40% of string length)
    if best_match and best_distance < len(name_clean) * 0.4:
        return best_match
    
    return name_clean


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]


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
        # More precise: check hash + similar street/area
        result = supabase.table('apartments') \
            .select('id', 'raw_address', 'title') \
            .eq('listing_hash', hash_val) \
            .gte('created_at', since) \
            .limit(5) \
            .execute()
        if not result.data:
            return False
        # Check if street/area matches
        for row in result.data:
            existing_addr = (row.get('raw_address') or '').lower()
            new_addr = (street or '').lower()
            # Check similarity (at least 3 chars match)
            if existing_addr and new_addr:
                # Simple overlap check
                if any(word in existing_addr for word in new_addr.split() if len(word) > 3):
                    return True
        return False
    except Exception:
        return False


# ─── 6. Telegram forum/thread support ────────────────────────────────────────

async def get_messages_with_threads(channel, limit: int = 100):
    """Yield messages including forum/thread replies. Returns Telethon message objects."""
    async for message in client.iter_messages(channel, limit=limit):
        yield message


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

async def cleanup_old_listings(days: int = 4):
    """Delete listings older than N days."""
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        result = supabase.table('apartments') \
            .delete() \
            .lt('created_at', cutoff) \
            .execute()
        deleted = len(result.data) if result.data else 0
        print(f"🧹 Cleaned up {deleted} listings older than {days} days")
    except Exception as e:
        print(f"⚠️ Cleanup failed: {e}")

async def main():
    await client.start()
    print("🚀 Telegram Client started (Parser v2)")
    print(f"🔗 Supabase: {SUPABASE_URL}")
    
    # Cleanup old listings first
    await cleanup_old_listings(days=4)
    
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
            msg_count = 0
            
            # Process messages from last MAX_AGE_DAYS (with safety limit)
            async for msg in client.iter_messages(channel, limit=MSG_LIMIT):
                msg_count += 1
                # Skip if older than MAX_AGE_DAYS
                if msg.date and (now - msg.date > timedelta(days=MAX_AGE_DAYS)):
                    continue
                if not msg.text and not msg.photo:
                    continue
                
                gid = str(msg.grouped_id) if msg.grouped_id else f"msg_{msg.id}"
                
                if gid not in media_groups:
                    media_groups[gid] = {
                        "text": msg.text or "", 
                        "photo_messages": [], 
                        "id": msg.id,
                        "message_thread_id": getattr(msg, 'message_thread_id', None),
                        "reply_to_top_id": getattr(msg, 'reply_to_top_id', None),
                    }
                else:
                    if msg.text and not media_groups[gid]["text"]:
                        media_groups[gid]["text"] = msg.text
                
                if msg.photo:
                    media_groups[gid]["photo_messages"].append(msg)
            
            print(f"  📊 Scanned {msg_count} messages, {len(media_groups)} groups")
            
            for gid, data in media_groups.items():
                text = data["text"]
                if not data["photo_messages"]:
                    continue
                if not listing_extractor.is_rental_listing(text):
                    continue
                
                # Extract via LLM
                use_llm = os.getenv('NO_LLM') != '1'
                if use_llm:
                    # Add delay to avoid 429
                    await asyncio.sleep(LLM_DELAY)
                    schema = listing_extractor.extract_listing_llm(text)
                else:
                    schema = listing_extractor.extract_listing(text)
                
                if schema.price_amount is None or schema.price_amount <= 0:
                    continue
                
                # Sanity check: skip obvious misreads
                if schema.price_amount > 1_000_000_000:  # > 1 billion VND
                    print(f"  ⚠️ Skipped (price too high): {schema.price_amount} {schema.price_currency.value}")
                    continue
                
                # Normalize price
                price_vnd, needs_review = normalize_price_vnd(
                    schema.price_amount, schema.price_currency.value
                )
                
                # Geocode: try Google Maps first, then Photon
                coords = None
                city = extract_city(text)
                try:
                    gm_url_match = re.search(r'(https?://(?:maps\.app\.goo\.gl|google\.com/maps|www\.google\.com/maps)[^\s\]\)]+)', text)
                    if gm_url_match:
                        coords = await expand_google_maps_url(gm_url_match.group(1))
                    if not coords:
                        coords = await geocode_address_async(schema.raw_address, text, city=city)
                    if not coords:
                        coords = get_coords_fallback(text)
                except Exception as geo_err:
                    print(f"    ⚠️ Geocode error: {geo_err}")
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
                    url = await upload_image_async(photo_msg, channel.id)
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
    
    # Final cleanup
    await cleanup_old_listings(days=4)


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

def extract_contacts(text: str) -> dict:
    """Extract phone/TG/WhatsApp contacts from text. Returns dict with tg, wa, label."""
    if not text:
        return {'tg': '', 'wa': '', 'label': 'Contact owner'}
    
    # Extract Telegram username (look for @username pattern, but skip common false positives)
    false_positives = {'brand', 'apartment', 'last', 'the', 'this', 'that', 'your', 'our', 'my', 'hiepho', 'danang', 'operator'}
    tg = ''
    tg_match = re.search(r'@([a-zA-Z0-9_]{4,32})', text)
    if tg_match:
        candidate = tg_match.group(1).lower()
        if candidate not in false_positives:
            tg = candidate
    
    # Extract WhatsApp phone (digits, +, spaces)
    wa_match = re.search(r'(\+?[\d\s]{8,})', text)
    wa = wa_match.group(1).replace(' ', '').replace('-', '') if wa_match else ''
    
    # Determine label
    label = 'Contact owner'
    if tg:
        label = 'Message on Telegram'
    elif wa:
        label = 'Message on WhatsApp'
    
    return {'tg': tg, 'wa': wa, 'label': label}

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
