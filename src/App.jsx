import { useMemo, useState, useCallback, useEffect } from 'react';
import { MOCK_PROPERTIES } from './data/mockProperties.js';
import LandingPage from './components/LandingPage.jsx';
import AreaSelectionPage from './components/AreaSelectionPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';

const DEFAULT_CENTER = [16.06, 108.23];
const DEFAULT_ZOOM = 13;

export default function App() {
  const [step, setStep] = useState(1);

  const [bedrooms, setBedrooms] = useState('Any');
  const [minPrice, setMinPrice] = useState('5000000');
  const [maxPrice, setMaxPrice] = useState('25000000');
  const [amenities, setAmenities] = useState(['#sea']);

  const [mapBounds, setMapBounds] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(null);
  const [activeModalProperty, setActiveModalProperty] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('default');

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
    () => MOCK_PROPERTIES.filter(filterByPreferences).length,
    [filterByPreferences]
  );

  const propertiesInBounds = useMemo(() => {
    const filtered = MOCK_PROPERTIES.filter(filterByPreferences).filter((item) => {
      if (!mapBounds) return true;
      return mapBounds.contains([item.lat, item.lng]);
    });

    if (sortBy === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [filterByPreferences, mapBounds, sortBy]);

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