"""Fill numeric_price in Supabase from description for records with placeholder/empty price.
Reads all apartments, parses price via regex (old + new Telegram formats), PATCHes only those
where numeric_price is NULL or 1000000 (placeholder). Safe: only UPDATE, no delete.
"""
import os, re, json, urllib.request
from dotenv import load_dotenv

load_dotenv()
URL = os.getenv('SUPABASE_URL')
KEY = os.getenv('SUPABASE_KEY')

def api_get(limit=1000, offset=0):
    api = f'{URL}/rest/v1/apartments?select=original_url,description,numeric_price&limit={limit}&offset={offset}'
    req = urllib.request.Request(api, headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    return json.load(urllib.request.urlopen(req, timeout=30))

def api_patch(url_field, url_val, price):
    api = f'{URL}/rest/v1/apartments?{url_field}=eq.{url_val}'
    req = urllib.request.Request(api, data=json.dumps({'numeric_price': price}).encode(),
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH')
    return urllib.request.urlopen(req, timeout=30).status

def parse_price(desc):
    if not desc:
        return None
    # Old: "💰 Rental price: 19,000,000 VND/month"
    m = re.search(r'Rental price:\s*(\d[\d,\.]*)\s*(VND|USD|THB)', desc, re.I)
    if m:
        return int(m.group(1).replace(',', '').replace('.', ''))
    # New: "💵Price: 10,500,000 VND/month" or "💰**Price: 16.5 million**"
    m = re.search(r'[💰💵]\s*\*?\*{0,2}\s*Price:\s*([\d.,]+)\s*(million|M|VND|USD|THB)?', desc, re.I)
    if m:
        raw = float(m.group(1).replace('.', '').replace(',', ''))
        if m.group(2) and m.group(2).lower() in ('million', 'm'):
            return int(raw * 1_000_000)
        return int(raw)
    # Fallback: first "X VND" where X > 1M (ignore utilities like 4,200 VND)
    m = re.search(r'(\d[\d,\.]*)\s*(VND|USD|THB)', desc, re.I)
    if m:
        val = int(m.group(1).replace(',', '').replace('.', ''))
        if val > 1_000_000:
            return val
    return None

def main():
    updated = 0
    skipped = 0
    offset = 0
    while True:
        rows = api_get(1000, offset)
        if not rows:
            break
        for r in rows:
            cur = r.get('numeric_price')
            if cur and cur != 1000000:
                skipped += 1
                continue
            price = parse_price(r.get('description') or '')
            if price and price != 1000000:
                st = api_patch('original_url', r['original_url'], price)
                if st == 204:
                    updated += 1
                    print(f"  updated {r['original_url']} -> {price:,} VND")
                else:
                    print(f"  FAILED {r['original_url']} status {st}")
            else:
                skipped += 1
        offset += 1000
    print(f"\nDONE. Updated: {updated}, Skipped (no price found / already real): {skipped}")

if __name__ == '__main__':
    main()
