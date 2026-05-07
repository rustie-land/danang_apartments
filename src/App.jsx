import React, { useState, useEffect } from 'react';
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const activeApt = apartmentsData.find(a => a.id === selectedId);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Карта (на мобилках фон) */}
      <div style={{ 
        flex: 1, 
        height: isMobile ? '100%' : '100%', 
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}>
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

      {/* Сайдбар / Нижняя лента */}
      <div style={{ 
        width: isMobile ? '100%' : '400px',
        height: isMobile ? 'auto' : '100%',
        position: isMobile ? 'absolute' : 'relative',
        bottom: 0,
        left: 0,
        zIndex: 1000,
        background: isMobile ? 'transparent' : 'white',
        borderRight: isMobile ? 'none' : '1px solid #eee',
        pointerEvents: 'none' // Пропускает клики на карту в пустых зонах
      }}>
        {!isMobile && (
          <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: 'white' }}>
            <h1 style={{ fontSize: '20px', margin: 0 }}>Da Nang Rentals 🌴</h1>
          </div>
        )}

        <div style={{ 
          display: isMobile ? 'flex' : 'block',
          overflowX: isMobile ? 'auto' : 'hidden', // ВКЛЮЧАЕМ СКРОЛЛ ДЛЯ МОБИЛОК
          overflowY: isMobile ? 'hidden' : 'auto',
          padding: '15px',
          gap: '15px',
          pointerEvents: 'auto', // ВКЛЮЧАЕМ КЛИКИ/СКРОЛЛ ДЛЯ КАРТОЧЕК
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {apartmentsData.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => { setSelectedId(apt.id); setShowModal(true); }}
              style={{ 
                borderRadius: '16px', 
                border: '1px solid #eee', 
                marginBottom: isMobile ? '0' : '15px',
                flexShrink: 0, // НЕ ДАЕМ КАРТОЧКАМ СЖИМАТЬСЯ
                width: isMobile ? '80%' : '100%',
                maxWidth: isMobile ? '300px' : 'none',
                overflow: 'hidden', 
                cursor: 'pointer', 
                background: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                scrollSnapAlign: 'center'
              }}
            >
              <img src={apt.images[0]} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>{apt.price}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {apt.description.substring(0, 60)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && <DetailsModal apt={activeApt} onClose={() => setShowModal(false)} />}
    </div>
  );
}