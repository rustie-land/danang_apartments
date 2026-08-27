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
  const [term, setTerm] = useState('Any'); // Any | 1+mo | 6+mo | 1yr+
  const [pets, setPets] = useState(false);
  const [noCommission, setNoCommission] = useState(false);
  const [repair, setRepair] = useState(false);

  const toggleAmenity = useCallback((tag) => {
    setAmenities((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  // Exchange rates: how many units of target currency per 1 VND
  const VND_RATES = { VND: 1, USD: 1 / 25000, THB: 1 / 700 };
  const CURRENCY_SYMBOL = { VND: 'VND', USD: '$', THB: '฿' };

  const convertPrice = useCallback(
    (priceVnd) => {
      // Treat 0, placeholder 1M, and sub-1M (likely missing data) as "no real price"
      if (!priceVnd || priceVnd <= 1000000) return 'Contact for price';
      const rate = VND_RATES[currency] ?? 1;
      const val = priceVnd * rate;
      if (currency === 'VND') return Math.round(val).toLocaleString('ru-RU') + ' VND';
      return CURRENCY_SYMBOL[currency] + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    },
    [currency]
  );

  const filterByPreferences = useCallback(
    (item) => {
      if (selectedCity !== 'All' && item.city !== selectedCity) return false;
      const matchBeds = bedrooms === 'Any' || item.beds === bedrooms;
      // Convert the user's min/max (entered in the selected currency) into VND
      // for comparison against item.price (always VND).
      const rate = VND_RATES[currency] ?? 1; // units of currency per 1 VND
      const toVnd = (v) => {
        if (v === '' || v == null) return null;
        return Number(v) / rate; // e.g. 340 USD / (1/25000) = 8,500,000 VND
      };
      const minRaw = toVnd(minPrice);
      const maxRaw = toVnd(maxPrice);
      const min = minRaw == null ? -Infinity : minRaw;
      const max = maxRaw == null ? Infinity : maxRaw;
      const matchPrice = item.price === 0 || (item.price >= min && item.price <= max);
      const matchAmenities =
        amenities.length === 0 ||
        amenities.some((tag) => {
          const clean = tag.replace('#', '').toLowerCase();
          return item.amenities.some((it) => String(it).replace('#', '').toLowerCase() === clean);
        });
      const matchTerm = term === 'Any' || (item.term && item.term === term);
      const matchPets = !pets || (item.amenities || []).some((a) => String(a).replace('#','').toLowerCase() === 'pet');
      const matchCommission = !noCommission || item.noCommission === true;
      const matchRepair = !repair || item.repair === true;
      return matchBeds && matchPrice && matchAmenities && matchTerm && matchPets && matchCommission && matchRepair;
    },
    [selectedCity, bedrooms, minPrice, maxPrice, amenities, term, pets, noCommission, repair, currency]
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
    term,
    setTerm,
    pets,
    setPets,
    noCommission,
    setNoCommission,
    repair,
    setRepair,
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
