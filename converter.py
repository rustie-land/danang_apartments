import pandas as pd
import json
import os

def clean_data():
    df = pd.read_csv('data.csv')
    apartments = []

    # Словарь координат популярных улиц и районов Дананга
    STREET_COORDS = {
        "khuê mỹ đông": [16.0333, 108.2455],
        "tran duc thong": [16.0748, 108.2433],
        "ngu hanh son": [16.0359, 108.2410],
        "my an": [16.0485, 108.2435],
        "son tra": [16.0700, 108.2300],
        "an thuong": [16.0515, 108.2450]
    }

    for index, row in df.iterrows():
        full_text = " ".join([str(val) for val in row.values if isinstance(val, str) and "http" not in val]).lower()
        
        images = []
        for col in df.columns:
            val = str(row[col])
            if "scontent" in val and "fbcdn" in val and val not in images:
                images.append(val)
        
        if not images:
            images = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"]

        # Поиск координат по улицам
        coords = [16.0544, 108.2022] # Дефолт
        for street, point in STREET_COORDS.items():
            if street in full_text:
                coords = point
                break
        
        # Разброс, чтобы маркеры не накладывались
        lat = coords[0] + (index % 30 * 0.0002)
        lng = coords[1] + (index % 30 * 0.0002)

        apartments.append({
            "id": index,
            "price": "See details",
            "description": full_text[:160] + "...",
            "images": images,
            "lat": lat,
            "lng": lng,
            "original_link": str(row.get('x1i10hfl href', '#'))
        })

    with open('src/apartments_data.json', 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    print(f"✅ База готова. Объектов: {len(apartments)}")

clean_data()