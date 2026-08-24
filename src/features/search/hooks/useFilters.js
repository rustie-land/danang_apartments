import { useState, useCallback, useMemo } from 'react';

const VND_RATES = { VND: 1, USD: 1 / 25000, THB: 1 / 700 };
const CURRENCY_SYMBOL = { VND: 'VND', USD: '$', THB: '฿' };

export function useFiltersState() {
  const [bedrooms, setBedrooms] = useState('Any');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('25000000');
  const [amenities, setAmenities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [currency, setCurrency] = useState('VND');

  const toggleAmenity = useCallback((tag) => {
    setAmenities((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

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

  return {
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
}
