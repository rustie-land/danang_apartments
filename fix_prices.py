"""Backfill numeric_price into live apartments from the backup, storing ALL
prices as a VND-equivalent so the frontend's convertPrice (which compares
priceVnd > 1_000_000) displays them correctly. Native currency is kept in the
`currency` column for display toggling.

Rates (from project skill): VND:1, USD:1/25000, THB:1/700  -> 1 USD≈25,000 VND, 1 THB≈700 VND.

SAFE strategy:
  * VND rows: trust backup numeric_price if real (>1M).
  * THB/USD rows: ignore backup numeric_price (often a SALE price). Parse the
    description for a MONTHLY rental rate, convert to VND-equiv, accept only
    below a sane native cap (THB<500000, USD<20000). Else skip (Contact for price).
  * Nothing found: leave as-is.

Run:  python3 fix_prices.py          # DRY
      WRITE=1 python3 fix_prices.py  # PATCH Supabase
"""
import os
import re
import json
import urllib.request
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))


def _load_env_local():
    for cand in ('.env', '.env.local'):
        p = os.path.join(HERE, cand)
        if os.path.exists(p):
            with open(p, encoding='utf-8') as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env_local()

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://ycgvotlikgvopzsoqjby.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
TABLE = 'apartments'
WRITE = os.environ.get('WRITE') == '1'
BACKUP = os.path.join(HERE, 'apartments_backup.json')

# to VND multiplier
TO_VND = {'VND': 1, 'USD': 25000, 'THB': 700}
SANE_CAP = {'VND': 500_000_000, 'THB': 500_000, 'USD': 20_000}


def parse_rental(text, currency):
    """Extract a MONTHLY rental rate (native) for `currency` from raw text."""
    if not text:
        return None
    if currency == 'THB':
        m = re.search(r'(\d[\d.,]{2,})\s*(бат|baht|thb)\s*(/|per)?\s*(месяц|month|mo)?', text, re.I)
        if m:
            return int(float(m.group(1).replace(',', '')))
    if currency == 'USD':
        m = re.search(r'\$\s?(\d[\d.,]{2,})\s*(/|per)?\s*(месяц|month|mo)?', text, re.I)
        if m:
            return int(float(m.group(1).replace(',', '')))
    m = re.search(r'(\d[\d.,]{4,})\s*(VND|₫|dong|донг)', text, re.I)
    if m:
        return int(float(m.group(1).replace(',', '')))
    return None


def is_real(n):
    return isinstance(n, (int, float)) and n > 1_000_000


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
        raise SystemExit('SUPABASE_KEY not set. Refusing to run.')
    backup = json.load(open(BACKUP))
    if isinstance(backup, dict):
        backup = backup.get('data', [backup])
    by_id = {str(r.get('id')): r for r in backup}
    print(f"Backup rows: {len(by_id)}  WRITE={WRITE}")

    q = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,numeric_price,currency&limit=1000"
    req = urllib.request.Request(q, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    live = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
    live_by_id = {str(r.get('id')): r for r in live}

    changed = skipped_sale = still_missing = 0
    for rid, bk in by_id.items():
        bk_cur = (bk.get('currency') or 'VND').strip() or 'VND'
        bk_np = bk.get('numeric_price')
        desc = bk.get('description') or ''
        price_vnd, cur = None, None

        if bk_cur == 'VND' and is_real(bk_np):
            price_vnd, cur = int(bk_np), 'VND'
        elif bk_cur in ('THB', 'USD'):
            rent = parse_rental(desc, bk_cur)
            if rent and rent < SANE_CAP[bk_cur]:
                price_vnd, cur = int(rent * TO_VND[bk_cur]), bk_cur
            else:
                skipped_sale += 1
        else:
            rent = parse_rental(desc, 'VND')
            if rent:
                price_vnd, cur = rent, 'VND'

        if price_vnd is None:
            still_missing += 1
            continue
        old_np = live_by_id.get(rid, {}).get('numeric_price')
        old_cur = live_by_id.get(rid, {}).get('currency')
        if old_np == price_vnd and old_cur == cur:
            continue
        changed += 1
        up = {'numeric_price': price_vnd}
        if cur != old_cur:
            up['currency'] = cur
        if WRITE:
            st = patch(rid, up)
            print(f"PATCH {rid} -> {st} np(VND-equiv)={price_vnd} cur={cur}")
        else:
            print(f"DRY {rid} -> np(VND-equiv)={price_vnd} cur={cur}")

    print(f"\nWould change: {changed}  | skipped (sale/no-rental): {skipped_sale}  | still missing: {still_missing}")
