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

    # Уточненные координаты (чуть глубже в сушу)
    STREET_COORDS = {
        "khuê mỹ đông": [16.0333, 108.2425], # Сместил западнее
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
        full_text = " ".join([str(val) for val in row.values if isinstance(val, str) and "http" not in val])
        text_l = full_text.lower()

        # Улучшенный парсинг телефона (убираем все не-цифры)
        clean_text = re.sub(r'[^0-9]', '', full_text.replace('O', '0').replace('o', '0'))
        phone_match = re.search(r'(0[0-9]{8,10})', clean_text)
        phone = phone_match.group(0) if phone_match else "Contact in FB"

        # Поиск цены (ищем цифры перед 'tr', 'million', '$')
        price = "Check post"
        price_match = re.search(r'(\d+[\d\s,.]*(?:million|vnd|tr|mln|k|\$))', text_l)
        if price_match:
            price = price_match.group(1).upper()

        images = [str(row[col]) for col in df.columns if "scontent" in str(row[col]) and "fbcdn" in str(row[col])]
        
        base_coords = [16.0544, 108.2022]
        for street, point in STREET_COORDS.items():
            if street in text_l:
                base_coords = point
                break
        
        # УМНЫЙ РАЗБРОС: 
        # Немного варьируем широту (вверх-вниз)
        # И смещаем долготу ТОЛЬКО на запад (минус), чтобы не уйти в море
        lat = base_coords[0] + random.uniform(-0.003, 0.003)
        lng = base_coords[1] - random.uniform(0, 0.004) 

        apartments.append({
            "id": index,
            "price": price,
            "phone": phone,
            "description": full_text,
            "images": images[:12],
            "lat": lat,
            "lng": lng,
            "link": str(row.get('x1i10hfl href', '#'))
        })

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    print("✅ Данные обновлены с учетом береговой линии.")

if __name__ == "__main__":
    clean_data()