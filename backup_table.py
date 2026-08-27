"""Full backup of the apartments table to JSON (before destructive prune).

Run: python3 backup_table.py
Writes apartments_backup_full_<date>.json next to this script.
"""
import os, json, urllib.request, datetime

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

if __name__ == '__main__':
    if not KEY:
        raise SystemExit('SUPABASE_KEY not set')
    # grab everything
    out = []
    offset = 0
    while True:
        u = f"{URL}/rest/v1/{TABLE}?select=*&limit=1000&offset={offset}"
        batch = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}), timeout=60).read().decode())
        if not batch:
            break
        out.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    stamp = datetime.datetime.now().strftime('%Y-%m-%d')
    path = os.path.join(HERE, f'apartments_backup_full_{stamp}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Backed up {len(out)} rows -> {path}")
