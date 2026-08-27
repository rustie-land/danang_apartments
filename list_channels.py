"""Print channel titles inside the FOLDER_NAME folder (no DB writes)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(override=True)
from telethon import TelegramClient, functions

SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '').strip()
TG_API_ID = os.getenv('TG_API_ID', '').strip()
TG_API_HASH = os.getenv('TG_API_HASH', '').strip()
FOLDER_NAME = "parsing aprt"

client = TelegramClient('danang_session', int(TG_API_ID), TG_API_HASH)

async def main():
    await client.start()
    result = await client(functions.messages.GetDialogFiltersRequest())
    peers = []
    for f in result.filters:
        title = getattr(f.title, 'text', str(f.title)) if hasattr(f, 'title') else ""
        if title.strip().lower() == FOLDER_NAME.lower():
            peers = f.include_peers
            break
    if not peers:
        print(f"NO FOLDER '{FOLDER_NAME}'")
        return
    print(f"FOLDER '{FOLDER_NAME}' has {len(peers)} channels:")
    for i, peer in enumerate(peers):
        ch = await client.get_entity(peer)
        print(f"  {i+1}. {ch.title}")

with client:
    client.loop.run_until_complete(main())
