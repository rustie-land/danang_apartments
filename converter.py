import pandas as pd
import json
import os
import re
import random
from deep_translator import GoogleTranslator

def format_price(text):
    """Улучшенная логика цен для рынка Дананга"""
    if not text: return "Check Post"
    
    # Очищаем текст: убираем запятые внутри чисел, приводим к нижнему регистру
    text_clean = text.lower().replace(',', '')
    
    # 1. Поиск миллионов (12.5 million, 12tr, 12mln, 12m, 12 triệu)
    match_m = re.search(r'(\d+\.?\d*)\s*(million|mln|tr|tr triệu|tr.đ|m|trvnd|mil)', text_clean)
    if match_m:
        return f"{float(match_m.group(1)):g}M VND"
    
    # 2. Поиск полных чисел (14000000)
    match_full = re.search(r'(\d{6,8})', text_clean)
    if match_full:
        val = float(match_full.group(1)) / 1_000_000
        return f"{val:g}M VND"

    # 3. Поиск формата "7k", "10k" (специфика аренды в Дананге)
    match_k = re.search(r'(\d+\.?\d*)\s*(k|k\s*vnd)', text_clean)
    if match_k:
        val = float(match_k.group(1))
        # Если число маленькое (типа 7), то это 7M. Если 7000 — тоже 7M.
        if val > 100: val = val / 1000
        return f"{val:g}M VND"

    # 4. Поиск тега "Price: 14,000,000"
    match_price_tag = re.search(r'price\s*[:\-\s]*(\d+[\d\s\.]*)', text_clean)
    if match_price_tag:
        num = re.sub(r'[^\d]', '', match_price_tag.group(1))
        if len(num) >= 6:
            return f"{float(num)/1_000_000:g}M VND"
        elif len(num) > 0:
            return f"{num}M VND"

    return "Check Post"

def clean_data():
    csv_file = 'data.csv'
    output_json = 'src/apartments_data.json'
    
    if not os.path.exists(csv_file): 
        print("❌ Файл data.csv не найден!")
        return

    df = pd.read_csv(csv_file)
    apartments = []
    translator = GoogleTranslator(source='auto', target='en')

    # Привязка к районам Дананга
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

    print(f"🔄 Starting conversion of {len(df)} listings...")

    for index, row in df.iterrows():
        # Сбор всех текстовых частей поста
        text_parts = []
        junk = ["Поделиться", "Ещё", "комментар", "Нравится", "Отправить", "Shared with"]
        
        for col in df.columns:
            val = str(row[col]).strip()
            if (len(val) > 10 and "http" not in val and "fbcdn" not in val and 
                not any(word in val for word in junk)):
                if val not in text_parts:
                    text_parts.append(val)
        
        raw_text = "\n\n".join(text_parts) if text_parts else ""
        
        # Перевод на английский
        try:
            translated_text = translator.translate(raw_text) if len(raw_text) > 5 else raw_text
        except:
            translated_text = raw_text

        # Определение цены (ищем и в оригинале, и в переводе)
        price_val = format_price(raw_text)
        if price_val == "Check Post":
            price_val = format_price(translated_text)

        # Координаты
        base_coords = [16.0544, 108.2022]
        for street, point in STREET_COORDS.items():
            if street in raw_text.lower():
                base_coords = point
                break
        
        # Фото
        images = [str(row[col]) for col in df.columns if "scontent" in str(row[col])]

        apartments.append({
            "id": index,
            "price": price_val,
            "phone": re.search(r'(\+?\d[\d\s\.]{8,12}\d)', raw_text).group(0) if re.search(r'(\+?\d[\d\s\.]{8,12}\d)', raw_text) else "FB Contact",
            "description": translated_text,
            "images": images[:15],
            "lat": base_coords[0] + random.uniform(-0.002, 0.002),
            "lng": base_coords[1] - random.uniform(0, 0.003),
            "link": str(row.get('x1i10hfl href', '#'))
        })

        if (index + 1) % 10 == 0:
            print(f"✅ Processed {index + 1}/{len(df)}...")

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(apartments, f, ensure_ascii=False, indent=4)
    
    print(f"🏁 Finished! {len(apartments)} listings saved to {output_json}")

if __name__ == "__main__":
    clean_data()