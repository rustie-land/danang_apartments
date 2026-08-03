import { useMemo, useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import AreaSelectionPage from './components/AreaSelectionPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';

// Подключаем Supabase клиент из папки src/
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
  const [minPrice, setMinPrice] = useState('5000000');
  const [maxPrice, setMaxPrice] = useState('25000000');
  const [amenities, setAmenities] = useState([]); // Очищено по умолчанию, чтобы видеть все объекты

  const [mapBounds, setMapBounds] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(null);
  const [activeModalProperty, setActiveModalProperty] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('default');

  // Загружаем данные из Supabase при монтировании компонента
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        console.log('🔄 Отправка запроса в Supabase к таблице apartments...');

        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Ошибка загрузки из Supabase:', error);
        } else if (data) {
          // Маппим полученные из парсера поля к структуре UI-компонентов
          const formattedData = data.map((item) => ({
            id: item.id || item.original_url,
            beds: item.rooms === 0 ? 'Studio' : String(item.rooms),
            price: item.numeric_price, // Числовая цена в донгах
            priceRaw: item.price_raw,
            amenities: item.features || [], // Массив тегов (#pool, #sea и т.д.)
            lat: item.lat,
            lng: item.lng,
            imageUrls: item.image_urls || [],
            description: item.description,
            contact: item.contact,
            originalUrl: item.original_url
          }));

          console.log(`✅ Успешно загружено объявлений из Supabase: ${formattedData.length}`, formattedData);
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

  const filterByPreferences = useCallback(
    (item) => {
      const matchBeds = bedrooms === 'Any' || item.beds === bedrooms;
      const min = minPrice === '' ? -Infinity : Number(minPrice);
      const max = maxPrice === '' ? Infinity : Number(maxPrice);
      const matchPrice = item.price >= min && item.price <= max;
      const matchAmenities = amenities.length === 0 || amenities.every((a) => item.amenities.includes(a));
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