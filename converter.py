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

    STREET_COORDS = {
        "khuê mỹ đông": [16.0333, 108.2425],
        "my khe": [16.0600, 108.2420],
        "bac my an": [16.0420, 108.2410],
        "an thuong": [16.0515, 108.2420],
        "tran duc thong": [16.0748, 108.2403],
        "pham van dong": [16.0710, 108.2380],
        "vo nguyen giap": [16.0600, 108.2440],
        "man thai": [16.0850, 108.2400],
        "phuoc my": [16.0650, 108.2390],
        "hai chau": [16.0600, 108.2200],
    }

    for index, row in df.iterrows():
        # ВЫБИРАЕМ ТЕКСТ: Игнорируем ссылки, берем самый длинный человеческий текст
        text_columns = []
        for col in df.columns:
            val = str(row[col])
            if len(val) > 40 and "http" not in val and "scontent" not in val:
                text_columns.append(val)
        
        original_post_text = max(text_columns, key=len) if text_columns else "No description available"

        # Очистка для поиска метаданных
        text_l = original_post_text.lower()

        # Поиск телефона (улучшенный регуляркой)
        phone_match = re.search(r'(\+?\d[\d\s\.]{8,12}\d)', original_post_text)
        phone = phone_match.group(0) if phone_match else "Contact in FB"

        # Поиск цены
        price = "Check post"
        # Ищем паттерны типа 7k, 7 million, 10.000.000
        price_match = re.search(r'(\d+[\d\s,.]*(?:million|vnd|tr|mln|k|\$))', text_l)
        if price_match:
            price = price_match.group(1).upper()

        # Картинки
        images = [str(row[col]) for col in df.columns if "scontent" in str(row[col])]
        
        # Координаты
        base_coords = [16.0544, 108.2022]
        for street, point in STREET_COORDS.items():
            if street in text_l:
                base_coords = point
                break
        
        lat = base_coords[0] + random.uniform(-0.002, 0.002)
        lng = base_coords[1] - random.uniform(0, 0.003)

        apartments.append({
            "id": index,
            "price": price,
            "phone": phone,
            "description": original_post_text,
            "images": images[:15],
            "lat": lat,
            "lng": lng,
            "link": str(row.get('x1i10hfl href', '#'))
        })

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    print("✅ Готово! Ссылки отфильтрованы, текст постов сохранен.")

if __name__ == "__main__":
    clean_data()