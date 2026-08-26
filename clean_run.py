"""Canonical Asia Stays description cleaner (single source of truth).

Run:  python3 clean_run.py            # DRY run (prints what WOULD change)
      WRITE=1 python3 clean_run.py    # PATCH Supabase (after _backup_table.py)

NOTE: always launch as a fresh __main__ / new filename. Importing this module
and re-execing is unreliable on macOS because Python serves a frozen bytecode
cache even after the source changes (the original clean_descriptions.py bug).
This file name (clean_run.py) is unique so it always loads fresh.
"""
import os
import re
import json
import urllib.request
import urllib.parse

def _load_env_local():
    """Load KEY=VALUE pairs from a .env file next to this script (no deps)."""
    here = os.path.dirname(os.path.abspath(__file__))
    for cand in ('.env', '.env.local'):
        p = os.path.join(here, cand)
        if os.path.exists(p):
            with open(p, encoding='utf-8') as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    k, v = line.split('=', 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    os.environ.setdefault(k, v)


_load_env_local()

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://ycgvotlikgvopzsoqjby.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
TABLE = 'apartments'
WRITE = os.environ.get('WRITE') == '1'

KNOWN_CITIES = {
    'Da Nang': ['da nang', 'danang', 'son tra', 'ngu hanh son', 'hai chau',
                'thanh khe', 'cam le', 'my an', 'khue my', 'hoa cuong', 'my khe', 'phuoc my'],
    'Pattaya': ['pattaya', 'jomtien', 'bang lamung', 'chonburi'],
    'Phuket': ['phuket', 'patong', 'karon', 'kata', 'rawai', 'kamala', 'surin'],
}

EMOJI_RE = re.compile(
    '['
    '\\U0001F000-\\U0001FAFF'
    '\\U00002600-\\U000027BF'
    '\\U0001F1E6-\\U0001F1FF'
    '\\U0000FE00-\\U0000FE0F'
    '\\U00002190-\\U000021FF'
    '\\U00002B00-\\U00002BFF'
    '\\U0000E000-\\U0000EFFF'
    ']'
)

# Keywords that should always start on their own line.
NEWLINE_KEYWORDS = [
    'Улица:', 'Street:', 'Location:', 'Район:', 'District:',
    'Расположение:', 'Местоположение:', 'Адрес:', 'Address:',
]

# Dangling label lines (label with nothing useful after it) to drop entirely.
DANGLING_LABELS = (
    'Contact|Telegram|WhatsApp|Zalo|Location|Available|Contract|Condition|'
    'Payment|Price|Code|Код|Контакт|Локация|Доступна|Договор|Цена|'
    'Местоположение|Расположение|Адрес|Address|Район|District'
)


def clean_text(desc):
    if not desc:
        return desc
    s = desc

    # 1. markdown links -> text, bare urls
    s = re.sub(r'\[([^\]]+)\]\(https?://[^)]+\)', r'\1', s)
    s = re.sub(r'https?://\S+', '', s)
    # 2. telegram handles
    s = re.sub(r'@[\w]{3,32}', '', s)
    # 3. service codes (🏠 Код: XXXX)
    s = re.sub(r'🏠\s*К?[ОO]?[ДD]?[:\s]*[A-Za-z0-9\-]{2,}', '', s)
    s = re.sub(r'\n?\s*Код:\s*[A-Za-z0-9\-]+', '', s, flags=re.I)
    # 4. price tokens (emoji + word forms)
    s = re.sub(r'💰\s*[\d.,]+\s*(VND|USD|THB|₫|million|M)?', '', s, flags=re.I)
    s = re.sub(r'🛍\s*[^\n]*', '', s)
    s = re.sub(r'Цена:\s*[\d.,]+\s*(млн|mln|VND|USD|THB|million|M)?', '', s, flags=re.I)
    s = re.sub(r'Price:\s*[\d.,]+\s*(VND|USD|THB|million|M)?', '', s, flags=re.I)
    # 5. maps "click to view" leftover lines
    s = re.sub(r'(Расположение|Местоположение|Location)\s*:\s*[^\n]*(посмотреть|click|view|here|maps\.app)[^\n]*', '', s, flags=re.I)
    # 6. price remainder (dong / month)
    s = re.sub(r'[,\d]*\s*(вьетнамских донгов|vietnamese dong|dong)\s*(/|per)?\s*(месяц|month|mo)?', '', s, flags=re.I)
    # 7. ALL emoji
    s = EMOJI_RE.sub('', s)
    # 8. leftover emoji-only lines
    s = re.sub(r'^\s*[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\U0000FE00-\U0000FE0F\U00002B00-\U00002BFF]+\s*$', '', s, flags=re.M)
    # 9. strip markdown
    s = s.replace('**', '').replace('__', '')
    s = re.sub(r'^#{1,6}\s?', '', s, flags=re.M)

    # 10. force newline BEFORE each address keyword (negative lookbehind:
    #     only if not already preceded by whitespace/newline -> no double \n)
    for kw in NEWLINE_KEYWORDS:
        s = re.sub(r'(?<![\n\s])' + re.escape(kw), r'\n' + kw, s)

    # 11. force newline before bullet markers glued to previous text.
    #     Only split on "dash + space" (e.g. "My An- Высокий" -> "My An\n- Высокий").
    #     A bare dash with NO space after (e.g. "2-комнатная") is a compound word
    #     and must NOT be split.
    s = re.sub(r'(?<![\n ])[-–—•]\s', r'\n- ', s)

    # 12. dangling label-only lines
    s = re.sub(r'^\s*(' + DANGLING_LABELS + r')\s*:?\s*$', '', s, flags=re.I | re.M)

    # 13. collapse whitespace
    s = re.sub(r'\n{3,}', '\n\n', s)
    s = re.sub(r'[ \t]{2,}', ' ', s)
    s = re.sub(r'^[ \t]+', '', s, flags=re.M)
    s = s.strip()
    return s


def select_all():
    rows = []
    offset = 0
    while True:
        q = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,description,city,lat,lng,image_urls&limit=500&offset={offset}"
        req = urllib.request.Request(q, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode())
        if not data:
            break
        rows.extend(data)
        if len(data) < 500:
            break
        offset += 500
    return rows


def detect_city(row):
    city = (row.get('city') or '').strip()
    if city and city.lower() not in ('other', 'l', '', 'archived'):
        return None
    lat = row.get('lat')
    if lat:
        try:
            lat = float(lat)
            if 15.5 <= lat <= 16.5:
                return 'Da Nang'
            if 12.5 <= lat <= 13.2:
                return 'Pattaya'
            if 7.5 <= lat <= 8.2:
                return 'Phuket'
        except (TypeError, ValueError):
            pass
    text = (row.get('description') or '').lower()
    for c, kws in KNOWN_CITIES.items():
        if any(k in text for k in kws):
            return c
    return None


def should_archive(row):
    imgs = row.get('image_urls')
    return not (bool(imgs) and len(imgs) > 0)


def patch(id_, fields):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{urllib.parse.quote(str(id_))}"
    req = urllib.request.Request(url, data=json.dumps(fields).encode(),
                                 headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}',
                                          'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
                                 method='PATCH')
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


if __name__ == '__main__':
    if not SUPABASE_KEY:
        raise SystemExit('SUPABASE_KEY not set (load .env or export it). Refusing to run.')
    rows = select_all()
    print(f"TOTAL: {len(rows)}  WRITE={WRITE}")
    cd = cc = arch = 0
    for r in rows:
        nd = clean_text(r.get('description'))
        nc = detect_city(r)
        if should_archive(r):
            nc = 'Archived'
        up = {}
        if nd != (r.get('description') or ''):
            up['description'] = nd
        if nc and nc != (r.get('city') or '').strip():
            up['city'] = nc
        if not up:
            continue
        if 'description' in up:
            cd += 1
        if 'city' in up:
            cc += 1
        if nc == 'Archived':
            arch += 1
        if WRITE:
            st = patch(r['id'], up)
            print(f"PATCH {r['id']} -> {st} {list(up.keys())}")
        else:
            print(f"DRY {r['id']} -> {list(up.keys())}")
    print(f"\nWould change: description={cd}, city={cc} (archived={arch})")
