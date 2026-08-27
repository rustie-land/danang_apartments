import os, sys
sys.path.insert(0, '/Users/ruslansavvin/danang-apartments')
# load OpenRouter key from agent-swarm/.env (do NOT hardcode, do NOT write into project .env)
for line in open('/Users/ruslansavvin/agent-swarm/.env'):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

import extractor as E

post = ("🌍 ** 2-Bedroom Apartment | 📐 76sqm | Vista Residence | Xô Viết Nghệ Tĩnh Street | Hải Châu\n"
        "🏢  10th floor\n💰 ** Rental price: 25,000,000 VND/month\n📅 ** Available from: Now\n"
        "🔐 Deposit: 1 month\n🧾 Management fee: 1,300,000 VND/month\n📞 Contact: @hongphuc13_lis")
print("KEY present:", bool(os.getenv('OPENROUTER_API_KEY')))
s = E.extract_listing_llm(post)
print("is_rent:", s.is_rent)
print("type:", s.property_type.value)
print("price:", s.price_amount, s.price_currency.value)
print("rooms:", s.rooms_count, "area:", s.area_sqm, "floor:", s.floor, "total:", s.total_floors)
print("raw_address:", repr(s.raw_address))
print("desc_clean:", repr(s.description_clean[:120]))
