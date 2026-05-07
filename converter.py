import pandas as pd
import json
import os
import re

def clean_data():
    csv_file = 'data.csv'
    # Сохраняем сразу в src, чтобы React увидел изменения
    output_json = 'src/apartments_data.json'

    if not os.path.exists(csv_file):
        print(f"❌ Ошибка: Файл '{csv_file}' не найден!")
        return

    print(f"✅ Файл '{csv_file}' найден. Обработка...")

    try:
        df = pd.read_csv(csv_file)
        apartments = []
        
        for index, row in df.iterrows():
            # Извлекаем текст из твоей колонки html-span
            description = str(row.get('html-span', ''))
            
            # Извлекаем картинку из твоей колонки xz74otr src
            image = row.get('xz74otr src')
            
            # Извлекаем ссылку на пост
            link = row.get('x1i10hfl href')

            # Простой парсинг цены (ищем цифры + млн или $)
            price_match = re.search(r'(\d+[\d\s,.]*(?:million|VND|k|\$))', description, re.I)
            price = price_match.group(1) if price_match else "Contact for price"

            apartments.append({
                "id": index,
                "price": price,
                "description": description[:200] + "...",
                "image_url": image if pd.notnull(image) else None,
                "original_link": link if pd.notnull(link) else "#",
                "district": "Ngu Hanh Son",
                "lat": 16.0544 + (index * 0.0012),
                "lng": 108.2022 + (index * 0.0012),
                "rooms": "Check description",
                "features": ["AC", "WiFi"]
            })

        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(apartments, f, ensure_ascii=False, indent=4)
        
        print(f"🚀 ГОТОВО! Создано {len(apartments)} объектов в {output_json}")

    except Exception as e:
        print(f"❌ Произошла ошибка: {e}")

if __name__ == "__main__":
    clean_data()
    