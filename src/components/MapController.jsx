import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapController({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (coords && Array.isArray(coords) && coords.length === 2) {
      map.flyTo(coords, 15, { duration: 1.2 });
    }
  }, [coords, map]);

  return null;
}