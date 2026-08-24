import { useState, useEffect, useMemo } from 'react';
import { fetchProperties } from '../api/properties.js';
import { MOCK_PROPERTIES } from '../../../data/mockProperties.js';

export function useProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active && properties.length === 0) {
        console.warn('Supabase unreachable, using mock data for local preview');
        setProperties(MOCK_PROPERTIES);
        setLoading(false);
      }
    }, 4000);

    async function load() {
      try {
        setLoading(true);
        const data = await fetchProperties();
        if (active) {
          if (data.length > 0) setProperties(data);
          else setProperties(MOCK_PROPERTIES);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (active) setProperties(MOCK_PROPERTIES);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  const cities = useMemo(() => {
    const set = new Set(properties.map((p) => p.city).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [properties]);

  return { properties, loading, cities };
}
