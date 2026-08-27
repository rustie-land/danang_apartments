import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extractor as E

posts = [
    ("25M bug post", "🌍 ** 2-Bedroom Apartment | 📐 76sqm | Vista Residence | Xô Viết Nghệ Tĩnh Street | Hải Châu\n🏢  10th floor\n💰 ** Rental price: 25,000,000 VND/month\n📅 ** Available from: Now\n🔐 Deposit: 1 month\n🧾 Management fee: 1,300,000 VND/month"),
    ("28 mil post", "🏠Code: 2B266\n**2 Bedrooms Apartment**\n**Street: Nguyen Dinh street, Son Tra**\n🗺Location: [Click to see](https://maps.app.goo.gl/xxx)\n- High floor \n- Close to sea 400 meter\n📆Available now\n🛍Price: 28 mil\n📝Note: None"),
    ("55 million villa", "Villa Near Lotte – Hai Chau\n- Beautiful 3+1 bedroom house near Lotte Mart.\nRental price: 55 million VND/month (1.5-month security deposit)."),
    ("40000 THB", "Cozy condo in Pattaya Wongamat. Rent 40000 THB/month. 2 bedroom, 65 sqm, 7th floor of 30."),
    ("studio room", "🏠Code: S435 - 303\n**Studio Apartment **\n**Street: Khue My Dong 1 street, Khue My (Near My An)**\n📆Available now\n🛍Price: 12 mil"),
    ("sale only", "Selling 2BR apartment in Da Nang, Son Tra. Price 2.5 billion VND. 80sqm, 15th floor."),
]

for label, post in posts:
    s = E.extract_listing(post)
    print(f"### {label}")
    print(f"  is_rent={s.is_rent} type={s.property_type.value} price={s.price_amount} {s.price_currency.value}")
    print(f"  rooms={s.rooms_count} area={s.area_sqm} floor={s.floor} total={s.total_floors}")
    print(f"  addr={s.raw_address!r}")
    print(f"  desc_clean={s.description_clean[:90]!r}")
    # validate against schema
    assert isinstance(s, E.PropertyListingSchema)
    print()
print("ALL POSTS VALIDATED AGAINST SCHEMA ✅")
