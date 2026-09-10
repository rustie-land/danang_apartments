# 🎨 Asia Stays — Design Audit & New Direction

## Текущие проблемы

1. **Название "Asia Stays"** — не отражает суть (TG-каналы, агентства, визуализация)
2. **Цветовая палитра** — бежевый/терракотовый выглядит "дешёво" и не передаёт тропический контекст
3. **Карточки** — нет плавных анимаций, hover-эффектов слабые
4. **Позиционирование** — "Direct from owners" = ложь (80% агентств)

---

## 🌟 Новый стиль: Tropical Tech Minimalist

**Цель:** современный, свежий, премиальный, тропический (без "resort cheap")

### Цветовая палитра

```css
:root {
  /* === TECH TROPICAL PALETTE === */
  --bg: #F8FAFC;           /* Cool off-white (как Vercel/Linear) */
  --surface: #FFFFFF;
  --surface-hover: #F1F5F9;
  --border: #E2E8F0;
  --border-subtle: #F1F5F9;
  
  /* Primary: Ocean Teal (тропический, но tech) */
  --primary: #0D9488;      /* teal-600 */
  --primary-hover: #0F766E;
  --primary-light: #CCFBF1;
  
  /* Accent: Coral (тропический, энергичный) */
  --accent: #F97316;       /* orange-500 */
  --accent-hover: #EA580C;
  --accent-light: #FED7AA;
  
  /* Text */
  --text: #0F172A;         /* slate-900 */
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  
  /* Semantic */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
}
```

### Типографика

```css
/* Замена Cormorant → современный гротеск */
--font-sans: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
--font-display: 'Inter', system-ui, sans-serif;  /* Без засечек для tech feel */

/* Или премиум-вариант: */
--font-display: 'SF Pro Display', 'Inter', system-ui, sans-serif;
```

### Радиусы и тени

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
--shadow-glow: 0 0 20px rgba(13, 148, 136, 0.15);
```

---

## 🎬 Motion Design System

### 1. Page Transitions

```jsx
// Framer Motion variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};
```

### 2. Card Animations

```jsx
// Staggered grid entrance
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Hover effect
const cardHover = {
  scale: 1.02,
  y: -4,
  boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
  transition: { duration: 0.3, ease: 'easeOut' }
};
```

### 3. Image Gallery (внутри карточки)

```jsx
// При наведении на карточку — автоскролл фото
const [imgIdx, setImgIdx] = useState(0);
useEffect(() => {
  if (!isHovered) return;
  const interval = setInterval(() => {
    setImgIdx(i => (i + 1) % images.length);
  }, 1500);
  return () => clearInterval(interval);
}, [isHovered, images.length]);
```

### 4. Map Pin Sync

```jsx
// При hover на карточку — пин пульсирует
<motion.div
  animate={hoveredId === prop.id ? {
    scale: [1, 1.3, 1],
    boxShadow: ['0 0 0 0 rgba(13,148,136,0.4)', '0 0 0 15px rgba(13,148,136,0)']
  } : {}}
  transition={{ duration: 0.6 }}
/>
```

### 5. Filter Popover

```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: -10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: -10 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  style={{
    originY: 0,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
  }}
/>
```

### 6. Modal Spring

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  <motion.div
    initial={{ scale: 0.9, y: 50 }}
    animate={{ scale: 1, y: 0 }}
    exit={{ scale: 0.9, y: 50 }}
    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
  >
    {/* Modal content */}
  </motion.div>
</motion.div>
```

---

## 📝 Варианты позиционирования

| # | Название | H1 | Tagline | Позиционирование |
|---|---|---|---|---|
| 1 | **RentAsia** | Your rental across Asia. | Listings from Telegram, agents, and local posts — one calm feed. | Помощь в поиске аренды через агрегацию TG-каналов и объявлений. Визуализация и простота, без лишних поисков. |
| 2 | **Asia Rentals** | Stay across Asia. | Direct listings from Telegram channels and agents — visualized. | Платформа для поиска аренды в Азии через Telegram-каналы. Простота доступа к информации, без агрессивного поиска. |
| 3 | **Tropic Rentals** | Tropical stays, simplified. | From Telegram to your door — rentals across Asia. | Аренда недвижимости в тропической Азии через агрегацию TG-каналов. Чистый визуальный опыт. |
| 4 | **RentFeed** | Your Asia rental feed. | All Telegram listings in one place — browse, don't search. | Лента объявлений об аренде из Telegram-каналов Азии. Визуальный feed вместо поиска. |
| 5 | **AsiaStays** | Stays across Asia. | Listings from Telegram and agents — calm and clear. | Спокойная платформа для поиска аренды в Азии. Telegram-каналы + агентства в одном месте. |

**Рекомендация: RentAsia** — коротко, ясно, tech-friendly, отражает географию.

---

## 🛠 План внедрения

1. **Заменить цветовую палитру** в `index.css`
2. **Обновить типографику** (Inter вместо Cormorant)
3. **Добавить Framer Motion** анимации на карточки
4. **Внедрить Image Gallery** с автоскроллом
5. **Обновить Map Pin Sync** с пульсацией
6. **Обновить позиционирование** (новое название + tagline)
7. **Протестировать** и **задеплоить**

---

Создано: 2026-09-10
