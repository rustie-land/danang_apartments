import { useMemo, useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import AreaSelectionPage from './components/AreaSelectionPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';

// Подключаем клиент Supabase с фоллбэком для безопасной инициализации
import { supabase } from './supabaseClient.js';

const DEFAULT_CENTER = [16.06, 108.23];
const DEFAULT_ZOOM = 13;

export default function App() {
  const [step, setStep] = useState(1);

  // Хранилище объявлений, полученных из Supabase
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Состояния фильтров
  const [bedrooms, setBedrooms] = useState('Any');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('25000000');
  const [amenities, setAmenities] = useState([]);

  const [mapBounds, setMapBounds] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(null);
  const [activeModalProperty, setActiveModalProperty] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('default');

  // Переключатель вида для мобильных устройств ('list' | 'map')
  const [mobileView, setMobileView] = useState('list');

  // Загружаем данные из Supabase при монтировании
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        console.log('🔄 Загрузка данных из Supabase...');

        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Ошибка Supabase:', error);
        } else if (data) {
          const formattedData = data.map((item, index) => {
            const numPrice = item.numeric_price || 0;
            const formattedPrice =
              item.price_raw ||
              (numPrice > 0 ? `${numPrice.toLocaleString('vi-VN')} VND` : 'Contact for price');

            // Нормализация формата спален под кнопки UI (Studio, 1 Bed, 2 Beds, 3+ Beds)
            let bedsLabel = 'Studio';
            const roomsVal = Number(item.rooms);
            if (roomsVal === 1) bedsLabel = '1 Bed';
            else if (roomsVal === 2) bedsLabel = '2 Beds';
            else if (roomsVal >= 3) bedsLabel = '3+ Beds';

            const computedTitle = item.title || `${bedsLabel} Apartment in Asia`;

            return {
              id: item.id || item.original_url || `apt-${index}`,
              title: computedTitle,
              beds: bedsLabel,
              price: numPrice,
              priceFormatted: formattedPrice,
              priceRaw: formattedPrice,
              amenities: Array.isArray(item.features) ? item.features : [],
              lat: Number(item.lat) || 16.06,
              lng: Number(item.lng) || 108.23,
              imageUrls:
                Array.isArray(item.image_urls) && item.image_urls.length > 0
                  ? item.image_urls
                  : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
              // UI components read `img` (single cover image); map from the array.
              img:
                Array.isArray(item.image_urls) && item.image_urls.length > 0
                  ? item.image_urls[0]
                  : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
              description: item.description || 'No description provided.',
              contact: item.contact || 'N/A',
              area: item.area || item.district || item.address || 'Asia',
              originalUrl: item.original_url || '',
              location: item.address || item.district || 'Asia',
              address: item.address || 'Asia'
            };
          });

          console.log(`✅ Успешно загружено объявлений: ${formattedData.length}`, formattedData);
          setProperties(formattedData);
        }
      } catch (err) {
        console.error('⚠️ Исключение при выполнении запроса:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const toggleAmenity = useCallback((tag) => {
    setAmenities((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  // Гибкая функция фильтрации
  const filterByPreferences = useCallback(
    (item) => {
      // 1. Проверка спален
      const matchBeds = bedrooms === 'Any' || item.beds === bedrooms;

      // 2. Проверка цены
      const min = minPrice === '' ? -Infinity : Number(minPrice);
      const max = maxPrice === '' ? Infinity : Number(maxPrice);
      const matchPrice = item.price === 0 || (item.price >= min && item.price <= max);

      // 3. Мягкая проверка удобств (сравнение тегов без учёта регистра и символа '#')
      const matchAmenities =
        amenities.length === 0 ||
        amenities.some((tag) => {
          const cleanSelectedTag = tag.replace('#', '').toLowerCase();
          return item.amenities.some((itemTag) =>
            String(itemTag).replace('#', '').toLowerCase() === cleanSelectedTag
          );
        });

      return matchBeds && matchPrice && matchAmenities;
    },
    [bedrooms, minPrice, maxPrice, amenities]
  );

  const totalFilteredCount = useMemo(
    () => properties.filter(filterByPreferences).length,
    [properties, filterByPreferences]
  );

  const propertiesInBounds = useMemo(() => {
    const filtered = properties.filter(filterByPreferences).filter((item) => {
      if (!mapBounds) return true;
      return mapBounds.contains([item.lat, item.lng]);
    });

    if (sortBy === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [properties, filterByPreferences, mapBounds, sortBy]);

  useEffect(() => {
    if (selectedPropertyId && !propertiesInBounds.some((p) => p.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [propertiesInBounds, selectedPropertyId]);

  const goToStep1 = () => setStep(1);
  const goToStep2 = () => setStep(2);
  const goToStep3 = () => setStep(3);

  const handleSelectProperty = (prop) => {
    setSelectedPropertyId(prop.id);
    setMapCenterCoords([prop.lat, prop.lng]);
  };

  // Экраны приложения
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>⏳ Загрузка объявлений из базы...</h2>
      </div>
    );
  }

  if (step === 2) {
    return (
      <AreaSelectionPage
        propertiesInBounds={propertiesInBounds}
        initialCenter={DEFAULT_CENTER}
        initialZoom={DEFAULT_ZOOM}
        onBoundsChange={setMapBounds}
        onBack={goToStep1}
        onDone={goToStep3}
      />
    );
  }

  if (step === 3) {
    return (
      <ResultsPage
        properties={propertiesInBounds}
        initialCenter={DEFAULT_CENTER}
        initialZoom={DEFAULT_ZOOM}
        selectedPropertyId={selectedPropertyId}
        mapCenterCoords={mapCenterCoords}
        favorites={favorites}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onSelectProperty={handleSelectProperty}
        onToggleFavorite={toggleFavorite}
        onOpenDetails={setActiveModalProperty}
        onBackToLanding={goToStep1}
        onBackToMap={goToStep2}
        activeModalProperty={activeModalProperty}
        onCloseModal={() => setActiveModalProperty(null)}
        mobileView={mobileView}
        setMobileView={setMobileView}
      />
    );
  }

  return (
    <LandingPage
      totalFilteredCount={totalFilteredCount}
      onGoToMap={goToStep2}
      filterProps={{
        bedrooms,
        setBedrooms,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        amenities,
        toggleAmenity
      }}
    />
  );
}