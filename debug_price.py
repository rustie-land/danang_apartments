import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parser as P

cases = [
    # (label, text, expected_vnd_millions)
    ("25M post", "🌍 ** 2-Bedroom Apartment | 💰 ** Rental price: 25,000,000 VND/month 📅 ** Available from: Now 🔐 Deposit: 1 month 💳 Payment: 3 months 🧾 Management fee: 1,300,000 VND/month", 25.0),
    ("24M post", "💰 ** Rental price: 24,000,000 VND/month 📅 ** Available 🔐 Deposit: 1 month 💳 Payment: 3 months", 24.0),
    ("20M post", "💰 Rental price: 20,000,000 VND/month ⚡️ Electricity: 4,500", 20.0),
    ("28 mil post", "🛍Price: 28 mil 📆Available now Close to sea 400 meter", 28.0),
    ("55 million post", "Rental price: 55 million VND/month (1.5-month security deposit)", 55.0),
    ("14M post", "**1 Bedroom Apartment** Street: An Trung 3 street", 0.0),  # no price -> 0
    ("1.3M fee only", "Management fee: 1,300,000 VND/month Deposit: 1 month", 0.0),  # 1.3M is fee, no rent -> 0 (acceptable)
    ("$500", "$500 / month", 12.5),
    ("15000 baht", "15000 baht / month", 10.5),
    ("12 triệu", "12 triệu VND", 12.0),
]

ok = 0
for label, text, exp in cases:
    v, cur = P.clean_price(text)
    status = "OK " if abs(v - exp) < 0.5 else "BAD"
    if status == "OK ":
        ok += 1
    print(f"{status} {label:18} got={v!r} exp={exp!r} cur={cur}")
print(f"\n{ok}/{len(cases)} passed")
