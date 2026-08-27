"""Delete apartments older than MAX_AGE_DAYS (default 7) so the DB only holds
fresh listings. High churn -> re-parse weekly keeps it current.

Run:  python3 prune_old.py            # DRY (counts what WOULD be deleted)
      WRITE=1 python3 prune_old.py    # actually DELETE
      AGE=14 python3 prune_old.py     # custom age in days (DRY)
"""
import os, json, urllib.request, urllib.parse
from datetime import datetime, timezone, timedelta

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
AGE = int(os.environ.get('AGE', '7'))

def list_old():
    cutoff = (datetime.now(timezone.utc) - timedelta(days=AGE)).isoformat()
    # created_at < cutoff, ordered
    u = f"{URL}/rest/v1/{TABLE}?select=id,city,created_at&created_at=lt.{urllib.parse.quote(cutoff)}&limit=2000"
    return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}), timeout=60).read().decode())

def delete_old(ids):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=AGE)).isoformat()
    # bulk delete via filter
    u = f"{URL}/rest/v1/{TABLE}?created_at=lt.{urllib.parse.quote(cutoff)}"
    req = urllib.request.Request(u, headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Prefer': 'return=minimal'}, method='DELETE')
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status

if __name__ == '__main__':
    if not KEY:
        raise SystemExit('SUPABASE_KEY not set')
    old = list_old()
    from collections import Counter
    print(f"Records older than {AGE}d: {len(old)}  {dict(Counter(r['city'] for r in old))}  WRITE={WRITE}")
    if not old:
        print("Nothing to prune.")
        raise SystemExit
    if WRITE:
        st = delete_old([r['id'] for r in old])
        print(f"DELETE status: {st}")
    else:
        print("DRY run — no rows deleted. Re-run with WRITE=1 to actually prune.")
