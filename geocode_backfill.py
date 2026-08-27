"""Re-geocode existing listings by their raw_address via Photon (free OSM).

Replaces the coarse district-level pin (get_coords) with a real address-level
coordinate. Reads every row that has a raw_address, geocodes it, and PATCHes
lat/lng back. Honors WRITE=1 (otherwise dry-run, prints only).

Usage (from project root):
    python3 geocode_backfill.py          # dry-run, prints what would change
    WRITE=1 python3 geocode_backfill.py   # actually update the DB
"""
from __future__ import annotations
import os
import sys
import json
import time
import urllib.parse
import urllib.request

from dotenv import load_dotenv
load_dotenv(override=True)

# OpenRouter key lives in agent-swarm/.env — load it transparently (not written here)
try:
    for _line in open(os.path.expanduser('~/agent-swarm/.env'), encoding='utf-8'):
        _line = _line.strip()
        if _line and not _line.startswith('#') and '=' in _line:
            k, v = _line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
except FileNotFoundError:
    pass

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
WRITE = os.getenv('WRITE') == '1'
DRY = not WRITE

_hdr = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}


def fetch_rows():
    out = []
    offset = 0
    while True:
        q = f"{SUPABASE_URL}/rest/v1/apartments?select=id,raw_address,lat,lng&raw_address=not.is.null&limit=1000&offset={offset}"
        data = json.loads(urllib.request.urlopen(urllib.request.Request(q, headers=_hdr), timeout=60).read().decode())
        if not data:
            break
        out.extend(data)
        if len(data) < 1000:
            break
        offset += 1000
    return out


def photon_geocode(query: str):
    if 'vietnam' not in query.lower() and 'việt' not in query.lower():
        query = f"{query}, Vietnam"
    url = f"https://photon.komoot.io/api/?q={urllib.parse.quote(query)}&limit=1"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AsiaStaysBot/1.0 (danang-apartments; savvin.rg@gmail.com)"})
        data = json.loads(urllib.request.urlopen(req, timeout=20).read().decode())
        if data.get('features'):
            c = data['features'][0]['geometry']['coordinates']
            lat, lng = round(c[1], 6), round(c[0], 6)
            # Reject matches outside the Da Nang region bbox (Photon sometimes
            # returns a same-named street in Hanoi). Keep the district pin instead.
            if not (15.8 <= lat <= 16.2 and 108.1 <= lng <= 108.35):
                print(f"    ⚠️ out of Da Nang region, rejected: {query[:40]} -> ({lat},{lng})")
                return None
            return lat, lng
    except Exception as e:
        print(f"    ⚠️ geocode error: {e}")
    return None


def patch_row(rid, lat, lng):
    body = json.dumps({"lat": lat, "lng": lng}).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/apartments?id=eq.{rid}",
        data=body,
        headers={**_hdr, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH',
    )
    urllib.request.urlopen(req, timeout=60).read()


def main():
    rows = fetch_rows()
    print(f"Fetched {len(rows)} rows with raw_address")
    changed = 0
    failed = 0
    for r in rows:
        addr = r.get('raw_address')
        if not addr:
            continue
        geo = photon_geocode(addr)
        time.sleep(0.4)  # be gentle with Photon
        if not geo:
            failed += 1
            continue
        new_lat, new_lng = geo
        old_lat, old_lng = r.get('lat'), r.get('lng')
        if old_lat == new_lat and old_lng == new_lng:
            continue  # already correct
        changed += 1
        if DRY:
            print(f"  [DRY] id={r['id']} {addr[:40]!r} -> ({new_lat}, {new_lng})  (was {old_lat},{old_lng})")
        else:
            patch_row(r['id'], new_lat, new_lng)
            print(f"  ✅ id={r['id']} -> ({new_lat}, {new_lng})")
    print(f"\nDone. Would change / changed: {changed}, geocode failures: {failed}")
    if DRY:
        print("This was a DRY RUN. Set WRITE=1 to apply to the database.")


if __name__ == '__main__':
    main()
