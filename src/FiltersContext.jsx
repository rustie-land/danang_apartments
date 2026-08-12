import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const FiltersContext = createContext(null);

export function FiltersProvider({ children, properties, cities }) {
  // Filter states (shared across all pages via sticky header)
  const [bedrooms, setBedrooms] = useState('Any');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('25000000');
  const [amenities, setAmenities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [currency, setCurrency] = useState('VND'); // VND | USD | THB

  const toggleAmenity = useCallback((tag) => {
    setAmenities((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  // Exchange rates: how many units of target currency per 1 VND
  const VND_RATES = { VND: 1, USD: 1 / 25000, THB: 1 / 700 };
  const CURRENCY_SYMBOL = { VND: 'VND', USD: '$', THB: '฿' };

  const convertPrice = useCallback(
    (priceVnd) => {
      const rate = VND_RATES[currency] ?? 1;
      const val = (priceVnd || 0) * rate;
      if (currency === 'VND') return Math.round(val).toLocaleString('ru-RU') + ' VND';
      return CURRENCY_SYMBOL[currency] + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    },
    [currency]
  );

  const filterByPreferences = useCallback(
    (item) => {
      if (selectedCity !== 'All' && item.city !== selectedCity) return false;
      const matchBeds = bedrooms === 'Any' || item.beds === bedrooms;
      const min = minPrice === '' ? -Infinity : Number(minPrice);
      const max = maxPrice === '' ? Infinity : Number(maxPrice);
      const matchPrice = item.price === 0 || (item.price >= min && item.price <= max);
      const matchAmenities =
        amenities.length === 0 ||
        amenities.some((tag) => {
          const clean = tag.replace('#', '').toLowerCase();
          return item.amenities.some((it) => String(it).replace('#', '').toLowerCase() === clean);
        });
      return matchBeds && matchPrice && matchAmenities;
    },
    [selectedCity, bedrooms, minPrice, maxPrice, amenities]
  );

  const value = {
    properties,
    cities,
    bedrooms,
    setBedrooms,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    amenities,
    toggleAmenity,
    selectedCity,
    setSelectedCity,
    currency,
    setCurrency,
    convertPrice,
    filterByPreferences,
  };

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}
