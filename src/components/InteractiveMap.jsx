import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MapController from './MapController.jsx';
import MarkerClusterGroup from './MarkerClusterGroup.jsx';
import { defaultIcon, activeIcon } from '../leafletIcon.js';

export default function InteractiveMap({
  initialCenter,
  initialZoom,
  mapCenterCoords,
  mobileView,
  sortedProperties,
  hoveredPropertyId,
  onSelectProperty,
}) {
  return (
    <MapContainer center={initialCenter} zoom={initialZoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapController coords={mapCenterCoords} mobileView={mobileView} />
      <MarkerClusterGroup
        markers={sortedProperties.filter(p => p.lat && p.lng)}
        onMarkerClick={onSelectProperty}
        hoveredId={hoveredPropertyId}
        activeIcon={activeIcon}
        defaultIcon={defaultIcon}
      />
    </MapContainer>
  );
}
