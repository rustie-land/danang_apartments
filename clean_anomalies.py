"""Null out bogus numeric_price (<1M VND) on just-parsed rows so the
frontend shows 'Contact for price' instead of a fake 200k-500k price.

Run:  python3 clean_anomalies.py          # DRY
      WRITE=1 python3 clean_anomalies.py  # PATCH Supabase
"""
import os, json, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
def _load_env_local():
    for cand in ('.env', '.env.local'):
        p = os.path.join(HERE, cand)
        if os.path.exists(p):
            for line in open(p, encoding='utf-8'):
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
_load_env_local()

URL = os.environ.get('SUPABASE_URL', 'https://ycgvotlikgvopzsoqjby.supabase.co')
KEY = os.environ.get('SUPABASE_KEY', '')
TABLE = 'apartments'
WRITE = os.environ.get('WRITE') == '1'

# IDs flagged as <1M VND after the weekly parse
ANOM = [386, 387, 394, 397, 398, 404, 411]

def patch(id_, fields):
    u = f"{URL}/rest/v1/{TABLE}?id=eq.{urllib.parse.quote(str(id_))}"
    req = urllib.request.Request(u, data=json.dumps(fields).encode(),
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH')
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status

if __name__ == '__main__':
    if not KEY:
        raise SystemExit('SUPABASE_KEY not set')
    print(f"Anomaly IDs: {ANOM}  WRITE={WRITE}")
    for rid in ANOM:
        if WRITE:
            st = patch(rid, {'numeric_price': None, 'price_raw': None})
            print(f"PATCH {rid} -> {st} (nulled price)")
        else:
            print(f"DRY {rid} -> would null numeric_price + price_raw")
