import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapController({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (coords && Array.isArray(coords) && coords.length === 2) {
      map.flyTo(coords, 15, { duration: 1.2 });
    }
  }, [coords, map]);

  // Leaflet caches the container size; when the map pane is shown/hidden
  // (e.g. mobile list/map toggle) or the viewport rotates, the tiles render
  // with wrong bounds. Force a recalculation whenever the pane becomes visible.
  useEffect(() => {
    const fixSize = () => map.invalidateSize();
    // Defer so layout has settled after the toggle/render.
    const t = setTimeout(fixSize, 200);
    window.addEventListener('resize', fixSize);
    window.addEventListener('orientationchange', fixSize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', fixSize);
      window.removeEventListener('orientationchange', fixSize);
    };
  }, [map]);

  return null;
}
