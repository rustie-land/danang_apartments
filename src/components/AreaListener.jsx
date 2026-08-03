import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';

export default function AreaListener({ onBoundsChange }) {
  const debouncedChange = useDebouncedCallback(onBoundsChange, 250);

  const map = useMapEvents({
    moveend: () => debouncedChange(map.getBounds()),
    zoomend: () => debouncedChange(map.getBounds())
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}