import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// Фикс иконок Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// Плавный полет карты к маркеру
function FlyToLocation({ center }) {
  const map = useMap();
  if (center) map.flyTo(center, 15, { duration: 1.5 });
  return null;
}

// Компонент карусели
const Carousel = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  const next = (e) => { e.stopPropagation(); setIdx((idx + 1) % images.length); };
  const prev = (e) => { e.stopPropagation(); setIdx((idx - 1 + images.length) % images.length); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#000' }}>
      <img src={images[idx]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Apartment" />
      {images.length > 1 && (
        <>
          <button onClick={prev} style={navBtn('left')}>‹</button>
          <button onClick={next} style={navBtn('right')}>›</button>
          <div style={{ position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', color: '#fff', fontSize: '12px', textShadow: '1px 1px 2px black' }}>
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const navBtn = (side) => ({
  position: 'absolute', top: '50%', [side]: '10px', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
});

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const activeApt = apartmentsData.find(a => a.id === selectedId);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Список слева */}
      <div style={{ width: '400px', overflowY: 'auto', padding: '20px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', zIndex: 10 }}>
        <h2 style={{ marginBottom: '20px' }}>Rental Radar Da Nang 🏝️</h2>
        {apartmentsData.map(apt => (
          <div 
            key={apt.id} 
            onClick={() => setSelectedId(apt.id)}
            style={{ 
              borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', cursor: 'pointer',
              border: selectedId === apt.id ? '2px solid #3182ce' : '1px solid #e2e8f0',
              transition: 'transform 0.2s', transform: selectedId === apt.id ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <Carousel images={apt.images} />
            <div style={{ padding: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{apt.price}</div>
              <p style={{ fontSize: '13px', color: '#4a5568', margin: '10px 0' }}>
                {selectedId === apt.id ? apt.description : apt.description.substring(0, 80) + '...'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#718096' }}>📍 Da Nang</span>
                <a href={apt.original_link} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3182ce' }}>Post Link ↗</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Карта справа */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[16.0544, 108.2422]} zoom={14} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FlyToLocation center={activeApt ? [activeApt.lat, activeApt.lng] : null} />
          {apartmentsData.map(apt => (
            <Marker 
              key={apt.id} 
              position={[apt.lat, apt.lng]} 
              icon={selectedId === apt.id ? activeIcon : defaultIcon}
              eventHandlers={{ click: () => setSelectedId(apt.id) }}
            >
              <Popup>
                <div style={{ width: '120px' }}>
                  <img src={apt.images[0]} style={{ width: '100%', borderRadius: '4px' }} alt="Preview" />
                  <div style={{ fontWeight: 'bold', marginTop: '5px' }}>{apt.price}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}