"""Data extraction for Asia Stays (Vietnam / Thailand long-term rentals).

This module defines the canonical listing schema (Pydantic) and a LOCAL
regex-based extractor that maps a raw Telegram post onto it. It is intentionally
independent of Supabase / Telethon / any LLM call so it can be unit-tested in
isolation.

The STABILIZED_PROMPT constant is the system prompt to feed a real LLM later
(see extract_listing_llm stub). When USE_LLM is wired up, swap extract_listing
to call the model and parse its JSON into PropertyListingSchema.

Market realities baked in:
  - Currencies: VND (primary, millions), THB (baht), USD. UNKNOWN fallback.
  - Cities: Da Nang (My An, Son Tra, Hai Chau, Ngu Hanh Son, Cam Le, An Thuong),
    Pattaya, Phuket, Bangkok, Hua Hin.
  - Price traps avoided: 'month'/'meter' are NOT million-markers; deposit /
    management-fee numbers are NOT the rent price.
"""
from __future__ import annotations
import re
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Schema (adapted for Asia Stays — CIS currencies dropped, VND/THB added)
# ---------------------------------------------------------------------------
class CurrencyEnum(str, Enum):
    USD = "USD"
    VND = "VND"
    THB = "THB"
    UNKNOWN = "UNKNOWN"


class PropertyTypeEnum(str, Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    ROOM = "room"
    COMMERCIAL = "commercial"


class PropertyListingSchema(BaseModel):
    is_rent: bool = Field(description="True for rent, False for sale")
    property_type: PropertyTypeEnum = Field(description="Type of property")
    price_amount: Optional[float] = Field(None, description="Numeric price (native currency, thousands/millions expanded)")
    price_currency: CurrencyEnum = Field(CurrencyEnum.UNKNOWN, description="ISO currency code")
    raw_address: Optional[str] = Field(None, description="City, district, street or landmark for geocoder")
    rooms_count: Optional[int] = Field(None, description="Number of rooms (studio = 1)")
    area_sqm: Optional[float] = Field(None, description="Area in square meters")
    floor: Optional[int] = Field(None, description="Current floor")
    total_floors: Optional[int] = Field(None, description="Total floors in building")
    description_clean: str = Field(description="Cleaned description without contacts/links/emoji")


# ---------------------------------------------------------------------------
# Stabilized prompt (for future LLM extraction)
# ---------------------------------------------------------------------------
STABILIZED_PROMPT = """You are an AI agent that extracts and structures data from long-term
rental real-estate listings in Southeast Asia (Vietnam, Thailand) posted in
Telegram channels.

MARKET & CONTEXT:
- Objects: long-term / monthly rental of apartments, condos, houses, villas,
  studios in Da Nang (Vietnam), Pattaya and Phuket (Thailand), and other
  regional cities.
- Currencies: VND (Vietnamese dong, primary; prices often in millions:
  "25,000,000 VND", "28 mil", "15 trieu"), THB (Thai baht: "40000 baht",
  "15,000฿"), USD (rare: "$500").
- Locations: Da Nang (My An, Son Tra, Hai Chau, Ngu Hanh Son, Cam Le, An
  Thuong), Pattaya, Phuket, Bangkok, Hua Hin.

GOAL: from the raw Telegram post text, extract attributes, clean the text of
junk, and return a strict JSON object matching the provided schema.

EXTRACTION:
1. DEAL TYPE (is_rent): True = long-term/short-term rent ("for rent", "аренд",
   "сдаётся", "rental", "monthly", "long stay"); False = sale/investment ("sale",
   "продаж", "buy", "invest", "купить"). If a post is rent with "also for sale",
   prioritize rent.
2. PROPERTY TYPE (property_type): apartment (квартира/condo/2-bedroom),
   house (villa/house/townhouse), room (a single room without a kitchen zone,
   not a studio-apartment), commercial (office/shop).
3. PRICE (price_amount + price_currency) — CRITICAL:
   - Numeric only, no spaces/currency signs; commas are thousands separators
     ("25,000,000" -> 25000000).
   - "mil"/"mln"/"million"/"triệu"/"trieu" = x1,000,000; "k"/"thousand"/"тыс"
     = x1,000; "billion"/"tỷ" = x1,000,000,000.
   - Examples: "25,000,000 VND" -> 25000000 VND; "28 mil" -> 28000000 VND;
     "40000 THB" -> 40000 THB; "$500" -> 500 USD; "15 triệu" -> 15000000 VND.
   - Currency: VND (₫/dong/triệu), THB (฿/baht/бат), USD ($/usd/долл). If
     absent, infer from context (Vietnam->VND, Thailand->THB) else UNKNOWN.
   - TAKE THE MONTHLY RENT PRICE ONLY. Explicitly IGNORE: deposit ("cọc",
     "đặt cọc", "deposit", "1 month"), commission ("hoa hồng", "commission"),
     management/service fee ("management fee", "phí quản lý", "service"),
     utilities ("electricity", "water", "wifi", "internet"), and per-person
     or per-night prices.
   - If the post shows SEVERAL rent prices (e.g. a range "19M to 21M" or
     "from 5M, up to 20M"), take the MONTHLY RENT figure that the listing
     headline states as THE price — usually the LARGER / headline number, not
     a "from" teaser. Prefer the line labelled "Price:" / "Rent:" / "Rental
     price:" over any small print. NEVER take a deposit or fee as the price.
   - Sanity bound: a normal Da Nang/Pattaya monthly rent is 3,000,000–80,000,000
     VND (or 300–2500 USD / 8000–60000 THB). If you compute something far
     outside this (e.g. hundreds of millions), you misread the text — re-check
     and pick the realistic monthly rent.
4. LOCATION (raw_address): detailed string for a geocoder — city, district,
   street, landmark. E.g. "Da Nang, Son Tra district, Nguyen Dinh street".
   No floor/area/renovation.
5. FEATURES:
   - rooms_count: integer rooms (studio = 1; "2-bedroom" -> 2).
   - area_sqm: area in m² ("76sqm" -> 76.0, "54 кв.м" -> 54.0).
   - floor: current floor ("10th floor" -> 10).
   - total_floors: building floors ("10-storey" -> 10).
6. CLEANING (description_clean): coherent description (English or original
   language if no English), WITHOUT agent names, phones, @handles, t.me links,
   attention emojis (🔥💰📌‼️), "Available now", "Brand new", "Direct owner",
   "No agents". Keep: layout, view, amenities (pool/gym/balcony), terms
   (deposit, lease length).

EDGE CASES:
- Missing attribute -> null, do not invent.
- Sale-only -> is_rent=False, fill the rest.
- Response MUST be strict JSON matching the schema, no Markdown wrapper, no prose."""


# ---------------------------------------------------------------------------
# Local regex extractor (no LLM, no network) — demonstrates the mapping
# ---------------------------------------------------------------------------
def _detect_currency(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ['฿', 'baht', 'бат', 'thb']):
        return 'THB'
    if any(k in t for k in ['$', 'usd', 'долл', 'dollar']):
        return 'USD'
    if any(k in t for k in ['vnd', 'đồng', 'донг', 'triệu', 'trieu', 'tr ']):
        return 'VND'
    # context fallback by city mention
    if 'паттай' in t or 'phuket' in t or 'bangkok' in t or 'thai' in t:
        return 'THB'
    return 'VND'


def _parse_price(text: str):
    """Return (amount: float|None, currency: str) in NATIVE units."""
    cur = _detect_currency(text)
    tc = text.lower().replace(',', '').replace(' ', '')
    if cur == 'USD':
        m = re.search(r'(\$|usd)?(\d{3,5})(\$|usd)?', tc)
        if m:
            v = float(m.group(2))
            if 100 <= v <= 20000:
                return v, 'USD'
    elif cur == 'THB':
        m = re.search(r'(\d{4,7})(฿|baht|thb)?', tc)
        if m:
            v = float(m.group(1))
            if 3000 <= v <= 500000:
                return v, 'THB'
    else:  # VND
        m = re.search(r'(\d+\.?\d*)\s*(billion|tỷ|million|mln|mil|triệu|trieu|tr)', tc)
        if m:
            v = float(m.group(1))
            unit = m.group(2)
            mult = 1_000_000_000 if unit in ('billion', 'tỷ') else 1_000_000
            return v * mult, 'VND'
        matches = re.findall(r'(\d{7,9})', tc)
        if matches:
            return max(int(x) for x in matches), 'VND'
    return None, cur


def _detect_sale(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in ['покупк', 'купить', 'buy', 'sale', 'selling', 'for sale',
                                'продаж', 'продам', 'invest', 'инвест', 'billion', 'tỷ'])


def _property_type(text: str) -> PropertyTypeEnum:
    t = text.lower()
    if any(k in t for k in ['villa', 'house', 'homestay', 'дача', 'townhouse']):
        return PropertyTypeEnum.HOUSE
    if 'studio' in t and 'apartment' not in t:
        return PropertyTypeEnum.ROOM
    if any(k in t for k in ['office', 'shop', 'commercial', 'магазин', 'офис']):
        return PropertyTypeEnum.COMMERCIAL
    return PropertyTypeEnum.APARTMENT


def _rooms(text: str) -> Optional[int]:
    t = text.lower()
    if any(k in t for k in ['studio', 'студия', '0 br', '0 bed']):
        return 1
    m = re.search(r'(\d+)\s*\+\s*\d+\s*(bedroom|br|bed|спальн|spal)', t)  # "3+1 bedroom"
    if m:
        return int(m.group(1))
    m = re.search(r'(\d+)\s*[-\s]*(bedroom|br|bed|спальн|spal)', t)
    if m:
        return int(m.group(1))
    m = re.search(r'(\d+)\s*[- ]?комнат', t)
    if m:
        return int(m.group(1))
    return None


def _area(text: str) -> Optional[float]:
    m = re.search(r'(\d+\.?\d*)\s*(sqm|sq\.?\s*m|m2|кв\.?\s*м)', text.lower())
    if m:
        return float(m.group(1))
    return None


def _floor(text: str) -> Optional[int]:
    m = re.search(r'(\d+)(?:st|nd|rd|th)?\s*floor', text.lower())
    if m:
        return int(m.group(1))
    m = re.search(r'high floor\s*(\d+)', text.lower())
    if m:
        return int(m.group(1))
    return None


def _total_floors(text: str) -> Optional[int]:
    m = re.search(r'(\d+)[-\s]?storey', text.lower())
    if m:
        return int(m.group(1))
    m = re.search(r'(\d+)[-\s]?floor\s*building', text.lower())
    if m:
        return int(m.group(1))
    return None


def _raw_address(text: str) -> Optional[str]:
    # "Street: X" / "**Street: X**" is the most reliable
    m = re.search(r'\*?\*?\s*street\s*:?\s*([^*\n|]+)', text, re.I)
    if m:
        return m.group(1).strip().strip('*').strip()
    # fallback: first line with a district/city keyword (take part before '|')
    for line in text.split('\n'):
        if any(k in line.lower() for k in ['district', 'danang', 'pattaya',
                                            'phuket', 'son tra', 'hai chau',
                                            'ngu hanh', 'cam le', 'an thuong',
                                            'my an', 'bangkok', 'hua hin']):
            return line.split('|')[0].strip().lstrip('*').strip()
    return None


_EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F02F"
    "\U0001F100-\U0001F1FF\uFE0F\u200d]", flags=re.UNICODE)
_LINK = re.compile(r'https?://\S+|t\.me/\S+|@[\w_]{4,}')
_BOILER = re.compile(
    r'📆.*|🛍.*|📝.*|💡.*|⚡️.*|🔥.*|‼️.*|📌.*|💰.*|✨.*|🌍.*|🏠.*|🏢.*|📍.*'
    r'|code:.*|available.*|brand new.*|direct owner.*|no agents?.*|'
    r'note:\s*none|click to see|deposit:.*|management fee.*|payment:.*|'
    r'lease term.*|utilities:.*|wifi:.*|service:.*|water:.*|electricity:.*', re.I)


def _clean_description(text: str) -> str:
    # Per-line: drop a line only if it is ENTIRELY boiler/marketing junk.
    # Keep lines that carry real info (e.g. "- High floor", "Pool, gym").
    kept = []
    for line in text.split('\n'):
        ln = line.strip()
        if not ln:
            continue
        ln_no_emoji = _EMOJI.sub('', ln).strip()
        if not ln_no_emoji:
            continue  # line was only emoji
        if _BOILER.fullmatch(ln_no_emoji):
            continue  # whole line is boiler
        if _LINK.search(ln):
            ln_no_emoji = _LINK.sub('', ln_no_emoji).strip()
            if not ln_no_emoji:
                continue
        ln_no_emoji = re.sub(r'\*\*', '', ln_no_emoji)
        ln_no_emoji = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', ln_no_emoji)
        kept.append(ln_no_emoji)
    return '\n'.join(kept)


def extract_listing(text: str) -> PropertyListingSchema:
    """Local regex-based extraction onto the canonical schema."""
    is_rent = not _detect_sale(text)
    price_amount, price_cur = _parse_price(text)
    return PropertyListingSchema(
        is_rent=is_rent,
        property_type=_property_type(text),
        price_amount=price_amount,
        price_currency=CurrencyEnum(price_cur),
        raw_address=_raw_address(text),
        rooms_count=_rooms(text),
        area_sqm=_area(text),
        floor=_floor(text),
        total_floors=_total_floors(text),
        description_clean=_clean_description(text),
    )


def extract_listing_llm(text: str, api_key: str | None = None, model: str = "deepseek/deepseek-chat") -> PropertyListingSchema:
    """Extract a listing via a free OpenRouter model, returning the validated schema.

    Falls back to the local regex extractor on any failure (network/parse/empty).
    Requires OPENROUTER_API_KEY in env (or passed api_key).
    """
    import os
    import json as _json
    import httpx
    key = api_key or os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY not set — cannot call LLM")
    try:
        resp = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": STABILIZED_PROMPT},
                    {"role": "user", "content": text},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0,
            },
            timeout=30,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        data = _json.loads(content)
        return PropertyListingSchema(**data)
    except Exception as e:  # noqa: BLE001
        print(f"    ⚠️ LLM extraction failed ({e}); falling back to regex")
        return extract_listing(text)
