"""Audit DB: price sync (card numeric_price vs price-in-description) + contact fields.
Read-only SELECT via Supabase REST. Safe."""
import os, re, json, urllib.request

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
TABLE = 'apartments'

def select_all():
    rows = []
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,contact,numeric_price,description&limit=1000&offset={offset}"
        req = urllib.request.Request(url, headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        if not data:
            break
        rows.extend(data)
        if len(data) < 1000:
            break
        offset += 1000
    return rows

def price_in_desc(d):
    if not d:
        return None
    m = re.search(r'(?:Rental price|Price):\s*([\d.,]+)\s*(VND|USD|THB|million)?', d, re.I)
    if not m:
        return None
    raw = m.group(1).replace(',', '').replace('.', '')
    return int(raw) if raw.isdigit() else None

def main():
    rows = select_all()
    print("TOTAL:", len(rows))
    mismatch = 0
    nocontact = 0
    sample = []
    contacts = []
    for r in rows:
        np_ = r.get('numeric_price')
        desc_p = price_in_desc(r.get('description') or '')
        if np_ and desc_p and abs(np_ - desc_p) > 100000:
            mismatch += 1
            if len(sample) < 8:
                sample.append((str(r['id'])[:22], int(np_), desc_p))
        c = (r.get('contact') or '').strip()
        if not c or c in ('N/A', 'None', ''):
            nocontact += 1
        elif len(contacts) < 12:
            contacts.append((str(r['id'])[:16], c[:34]))
    print("PRICE MISMATCH (card vs desc >100k):", mismatch)
    print("NO CONTACT:", nocontact)
    print("MISMATCH SAMPLES:", sample)
    print("CONTACT SAMPLES:", contacts)

if __name__ == '__main__':
    main()
