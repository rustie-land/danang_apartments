import L from 'leaflet';

// Teal pin with price label (replaces default Leaflet marker)
export const defaultIcon = L.divIcon({
  className: 'as-map-pin',
  html: `<div style="
    background: #0D9488;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    width: 22px; height: 22px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});

// Active/hovered pin (coral, larger, with glow)
export const activeIcon = L.divIcon({
  className: 'as-map-pin-active',
  html: `<div style="
    background: #F97316;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg) scale(1.3);
    width: 22px; height: 22px;
    box-shadow: 0 4px 12px rgba(249,115,22,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});
