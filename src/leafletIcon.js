import L from 'leaflet';

// Warm terracotta pin with price label (replaces default Leaflet marker)
export const defaultIcon = L.divIcon({
  className: 'as-map-pin',
  html: `<div style="
    background: #C77B4E;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    width: 22px; height: 22px;
    box-shadow: 0 2px 6px rgba(26,26,26,0.25);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});

// Larger pin used for the currently selected/hovered property
export const activeIcon = L.divIcon({
  className: 'as-map-pin-active',
  html: `<div style="
    background: #B36A3E;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg) scale(1.25);
    width: 22px; height: 22px;
    box-shadow: 0 3px 10px rgba(26,26,26,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});
