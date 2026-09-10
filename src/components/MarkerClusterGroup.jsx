import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

export default function MarkerClusterGroup({ markers, onMarkerClick, hoveredId, activeIcon, defaultIcon }) {
  const map = useMap();

  useEffect(() => {
    if (!markers || markers.length === 0) return;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
    });

    markers.forEach((prop) => {
      const marker = L.marker([prop.lat, prop.lng], {
        icon: hoveredId === prop.id ? activeIcon : defaultIcon,
      });

      marker.bindPopup(`
        <div style="width: 180px;">
          <img src="${prop.img}" alt="${prop.title}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 0.4rem;" />
          <h4 style="margin: 0.4rem 0 0.1rem 0; font-size: 0.85rem;">${prop.title}</h4>
          <p style="margin: 0 0 0.5rem 0; font-size: 0.8rem; font-weight: 700;">${prop.price ? (prop.price / 1e6).toFixed(1) + 'M VND' : ''}</p>
        </div>
      `);

      marker.on('click', () => onMarkerClick(prop));
      marker.on('mouseover', () => marker.setZIndexOffset(1000));
      marker.on('mouseout', () => marker.setZIndexOffset(0));

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [markers, onMarkerClick, hoveredId, activeIcon, defaultIcon, map]);

  return null;
}
