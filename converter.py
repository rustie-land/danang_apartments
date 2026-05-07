import pandas as pd
import json
import os
import re

def clean_data():
    csv_file = 'data.csv'
    output_json = 'src/apartments_data.json'

    if not os.path.exists(csv_file):
        print("❌ Ошибка: Файл data.csv не найден в корне проекта!")
        return

    if not os.path.exists('src'):
        os.makedirs('src')

    df = pd.read_csv(csv_file)
    apartments = []

    # Словарь координат популярных локаций Дананга
    STREET_COORDS = {
        "khuê mỹ đông": [16.0333, 108.2455],
        "tran duc thong": [16.0748, 108.2433],
        "my an": [16.0485, 108.2435],
        "an thuong": [16.0515, 108.2450],
        "pham van dong": [16.0710, 108.2400],
        "vo nguyen giap": [16.0550, 108.2480],
        "nguyen van thoai": [16.0520, 108.2400],
        "bac my phu": [16.0400, 108.2420],
        "son tra": [16.0700, 108.2300],
        "ngu hanh son": [16.0359, 108.2410]
    }

    for index, row in df.iterrows():
        # Текст поста
        full_text = " ".join([str(val) for val in row.values if isinstance(val, str) and "http" not in val])
        
        # Собираем фото
        images = []
        for col in df.columns:
            val = str(row[col])
            if "scontent" in val and "fbcdn" in val and val not in images:
                images.append(val)
        
        if not images:
            images = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]

        # Координаты (по умолчанию - центр города)
        coords = [16.0544, 108.2022] 
        text_lower = full_text.lower()
        for street, point in STREET_COORDS.items():
            if street in text_lower:
                coords = point
                break
        
        # Умный разброс (jitter), чтобы маркеры не накладывались
        lat = coords[0] + (index % 50 * 0.0004)
        lng = coords[1] + (index % 50 * 0.0004)

        # Парсинг цены (упрощенный)
        price_match = re.search(r'(\d+[\d\s,.]*(?:million|vnd|k|\$))', text_lower)
        price = price_match.group(1).upper() if price_match else "Contact"

        apartments.append({
            "id": index,
            "price": price,
            "description": full_text,
            "images": images,
            "lat": lat,
            "lng": lng,
            "district": "Da Nang",
            "original_link": str(row.get('x1i10hfl href', '#'))
        })

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    
    print(f"✅ База обновлена: {len(apartments)} объектов.")

if __name__ == "__main__":
    clean_data()