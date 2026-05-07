import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// --- ИКОНКИ ---
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 48], iconAnchor: [15, 48]
});

function MapController({ center }) {
  const map = useMap();
  if (center) map.setView(center, 15);
  return null;
}

const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 100, background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>✕</button>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '15px', background: '#000' }}>
          {apt.images.map((img, i) => (
            <img key={i} src={img} style={{ height: '300px', minWidth: '250px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} alt="room" />
          ))}
        </div>
        <div style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '28px', color: '#1e40af', margin: '0 0 10px 0' }}>{apt.price}</h2>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>📞 {apt.phone}</p>
          <p style={{ lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>{apt.description}</p>
          <a href={apt.link} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '20px', padding: '15px', background: '#1877F2', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>View on Facebook</a>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const isMobile = window.innerWidth < 768;

  const activeApt = apartmentsData.find(a => a.id === selectedId);

  // Стили для контейнеров (адаптивность)
  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column-reverse' : 'row',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden'
  };

  const sidebarStyle = {
    width: isMobile ? '100%' : '400px',
    height: isMobile ? '35%' : '100%',
    overflowY: isMobile ? 'hidden' : 'auto',
    overflowX: isMobile ? 'auto' : 'hidden',
    display: isMobile ? 'flex' : 'block',
    padding: '15px',
    background: isMobile ? 'transparent' : 'white',
    zIndex: 1000,
    borderRight: isMobile ? 'none' : '1px solid #eee',
    position: isMobile ? 'absolute' : 'relative',
    bottom: 0,
    pointerEvents: 'none' // Чтобы можно было кликать на карту "сквозь" пустые места
  };

  const cardStyle = (apt) => ({
    borderRadius: '16px',
    border: '1px solid #eee',
    marginBottom: isMobile ? '0' : '15px',
    marginRight: isMobile ? '15px' : '0',
    minWidth: isMobile ? '280px' : 'auto',
    width: isMobile ? '280px' : '100%',
    height: isMobile ? '140px' : 'auto',
    overflow: 'hidden',
    cursor: 'pointer',
    background: 'white',
    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    pointerEvents: 'auto'
  });

  return (
    <div style={containerStyle}>
      {/* Список квартир */}
      <div style={sidebarStyle}>
        {!isMobile && <h1 style={{ padding: '10px', fontSize: '20px' }}>Da Nang Rentals 🌴</h1>}
        <div style={{ display: isMobile ? 'flex' : 'block', paddingBottom: isMobile ? '20px' : '0' }}>
          {apartmentsData.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => { setSelectedId(apt.id); setShowModal(true); }}
              style={cardStyle(apt)}
            >
              <img 
                src={apt.images[0]} 
                style={{ 
                  width: isMobile ? '100px' : '100%', 
                  height: isMobile ? '140px' : '180px', 
                  objectFit: 'cover' 
                }} 
              />
              <div style={{ padding: '12px', flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>{apt.price}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {apt.description.substring(0, isMobile ? 40 : 80)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Карта */}
      <div style={{ flex: 1, height: '100%', width: '100%' }}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapController center={activeApt ? [activeApt.lat, activeApt.lng] : null} />
          {apartmentsData.map(apt => (
            <Marker 
              key={apt.id} 
              position={[apt.lat, apt.lng]} 
              icon={selectedId === apt.id ? activeIcon : defaultIcon}
              eventHandlers={{ click: () => { setSelectedId(apt.id); setShowModal(true); } }}
            />
          ))}
        </MapContainer>
      </div>

      {showModal && <DetailsModal apt={activeApt} onClose={() => setShowModal(false)} />}
    </div>
  );
}