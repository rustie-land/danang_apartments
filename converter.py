import pandas as pd
import json
import os
import re
import random

def clean_data():
    csv_file = 'data.csv'
    output_json = 'src/apartments_data.json'

    if not os.path.exists(csv_file): return

    df = pd.read_csv(csv_file)
    apartments = []

    # Расширенный список локаций Дананга для более точного распределения
    STREET_COORDS = {
        "khuê mỹ đông": [16.0333, 108.2455],
        "my khe": [16.0600, 108.2450],
        "bac my an": [16.0420, 108.2430],
        "an thuong": [16.0515, 108.2450],
        "tran duc thong": [16.0748, 108.2433],
        "pham van dong": [16.0710, 108.2400],
        "vo nguyen giap": [16.0600, 108.2480],
        "man thai": [16.0850, 108.2420],
        "phuoc my": [16.0650, 108.2410],
        "hai chau": [16.0600, 108.2200],
        "cam le": [16.0200, 108.2000],
        "lien chieu": [16.1000, 108.1500]
    }

    for index, row in df.iterrows():
        full_text = " ".join([str(val) for val in row.values if isinstance(val, str) and "http" not in val])
        text_l = full_text.lower()

        # Агрессивный поиск телефона
        text_for_phone = full_text.replace('O', '0').replace('o', '0').replace('.', '').replace(' ', '')
        phone_match = re.search(r'(0[0-9]{8,10})', text_for_phone)
        phone = phone_match.group(0) if phone_match else "Contact in FB"

        # Улучшенный поиск цены
        price = "Check post"
        price_match = re.search(r'(\d+[\d\s,.]*(?:million|vnd|tr|mln|k|\$))', text_l)
        if price_match:
            price = price_match.group(1).upper()
        else:
            large_num = re.search(r'(\d{1,2}[.,]\d{3})', text_l)
            if large_num: price = large_num.group(1) + "k+"

        images = [str(row[col]) for col in df.columns if "scontent" in str(row[col]) and "fbcdn" in str(row[col])]
        if not images: images = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]

        # Определение базовых координат
        base_coords = [16.0544, 108.2022] # Центр
        for street, point in STREET_COORDS.items():
            if street in text_l:
                base_coords = point
                break
        
        # СЛУЧАЙНЫЙ РАЗБРОС (чтобы не было линий как на скриншоте)
        lat = base_coords[0] + random.uniform(-0.005, 0.005)
        lng = base_coords[1] + random.uniform(-0.005, 0.005)

        apartments.append({
            "id": index,
            "price": price,
            "phone": phone,
            "description": full_text,
            "images": images[:10],
            "lat": lat,
            "lng": lng,
            "original_link": str(row.get('x1i10hfl href', '#'))
        })

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    print(f"✅ База готова. Использован Random Jitter.")

if __name__ == "__main__":
    clean_data()