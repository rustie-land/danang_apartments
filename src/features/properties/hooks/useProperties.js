import { useState, useEffect, useMemo } from 'react';
import { fetchProperties } from '../api/properties.js';
import { MOCK_PROPERTIES } from '../../../data/mockProperties.js';

const TIMEOUT_MS = 3500;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function useProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await withTimeout(fetchProperties(), TIMEOUT_MS);
        if (!active) return;
        setProperties(data.length > 0 ? data : MOCK_PROPERTIES);
      } catch (err) {
        if (!active) return;
        console.warn('Supabase unreachable / timeout — using mock data for local preview');
        setProperties(MOCK_PROPERTIES);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();

    return () => { active = false; };
  }, []);

  const cities = useMemo(() => {
    const set = new Set(properties.map((p) => p.city).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [properties]);

  return { properties, loading, cities };
}
