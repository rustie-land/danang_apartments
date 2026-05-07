import pandas as pd
import json
import os
import re

def clean_data():
    csv_file = 'data.csv'
    output_json = 'src/apartments_data.json'

    if not os.path.exists(csv_file):
        print("❌ Файл data.csv не найден!")
        return

    df = pd.read_csv(csv_file)
    apartments = []

    # Координаты улиц (можно расширять)
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
        # Собираем текст
        full_text = " ".join([str(val) for val in row.values if isinstance(val, str) and "http" not in val])
        
        # --- ПАРСИНГ ТЕЛЕФОНА (Агрессивный) ---
        # 1. Заменяем возможные буквы O на цифры 0 (частая уловка)
        text_for_phone = full_text.replace('O', '0').replace('o', '0')
        # 2. Ищем последовательность из 9-11 цифр, игнорируя пробелы, точки и дефисы
        # Находит и 0905.123.456 и 090 555 11 22
        phone_match = re.search(r'(0[0-9]{1,2}[\s.-]?[0-9]{3}[\s.-]?[0-9]{3,4})', text_for_phone)
        phone = phone_match.group(0).strip() if phone_match else "Contact in FB"

        # --- ПАРСИНГ ЦЕНЫ ---
        # Ищем форматы: 10tr, 10 million, 500$, 15.000.000
        text_l = full_text.lower()
        price_match = re.search(r'(\d+[\d\s,.]*(?:million|vnd|tr|mln|k|\$))', text_l)
        
        if price_match:
            price = price_match.group(1).upper()
        else:
            # Попытка найти просто большие числа (миллионы)
            large_number = re.search(r'(\d{1,2}[.,]\d{3}[.,]\d{3})', text_l)
            price = large_number.group(1) + " VND" if large_number else "Check post"

        # --- КАРТИНКИ ---
        images = []
        for col in df.columns:
            val = str(row[col])
            if "scontent" in val and "fbcdn" in val and val not in images:
                images.append(val)
        if not images:
            images = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]

        # --- КООРДИНАТЫ ---
        coords = [16.0544, 108.2022] # Дефолт
        for street, point in STREET_COORDS.items():
            if street in text_l:
                coords = point
                break
        
        # Добавляем случайное смещение, чтобы маркеры не накладывались
        lat = coords[0] + (index * 0.0002)
        lng = coords[1] + (index * 0.0002)

        apartments.append({
            "id": index,
            "price": price,
            "phone": phone,
            "description": full_text,
            "images": images,
            "lat": lat,
            "lng": lng,
            "original_link": str(row.get('x1i10hfl href', '#'))
        })

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    
    found_phones = sum(1 for a in apartments if a['phone'] != "Contact in FB")
    print(f"✅ Готово! Найдено телефонов: {found_phones} из {len(apartments)}")

if __name__ == "__main__":
    clean_data()