"""Apply SQL migrations to the Supabase Postgres DB.

Requires a direct Postgres connection string in .env:
    SUPABASE_DB_URL=postgresql://postgres:<DB_PASSWORD>@db.ycgvotlikgvopzsoqjby.supabase.co:5432/postgres
(DB_PASSWORD is from Supabase dashboard: Project Settings -> Database -> Connection string)

Run:  python3 migrate.py            # applies migrations/001_*.sql
"""
import os, glob, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(override=True)

DB_URL = os.getenv('SUPABASE_DB_URL', '')
MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')


def main():
    if not DB_URL:
        raise SystemExit('SUPABASE_DB_URL not set in .env (need direct Postgres connstring)')
    try:
        import pg8000
    except ImportError:
        raise SystemExit('pg8000 not installed: pip install pg8000')
    from urllib.parse import urlparse
    u = urlparse(DB_URL)
    import pg8000.native as native
    conn = native.Connection(
        user=u.username or 'postgres',
        password=u.password or '',
        host=u.hostname,
        port=u.port or 5432,
        database=u.path.lstrip('/') or 'postgres',
    )
    for path in sorted(glob.glob(os.path.join(MIGRATIONS_DIR, '*.sql'))):
        print(f"Applying {os.path.basename(path)} ...")
        sql = open(path, encoding='utf-8').read()
        conn.run(sql)
        print(f"  OK")
    conn.close()
    print("Migration complete.")


if __name__ == '__main__':
    main()
