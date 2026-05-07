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

// Контроллер для перемещения карты при выборе квартиры
function MapController({ center }) {
  const map = useMap();
  if (center) map.setView(center, 15, { animate: true });
  return null;
}

// --- МОДАЛЬНОЕ ОКНО (ДЕТАЛИ КВАРТИРЫ) ---
const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;

  return (
    <div 
      onClick={onClose} 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 20000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          backgroundColor: 'white', borderRadius: '24px', width: '95%', maxWidth: '900px', 
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '15px', right: '15px', zIndex: 100, 
            background: 'white', border: 'none', borderRadius: '50%', 
            width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          ✕
        </button>

        {/* ГАЛЕРЕЯ ВНУТРИ МОДАЛКИ */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '15px', background: '#1a202c', scrollSnapType: 'x mandatory' }}>
          {apt.images && apt.images.map((img, i) => (
            <img 
              key={i} 
              src={img} 
              style={{ height: '350px', minWidth: '280px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, scrollSnapAlign: 'start' }} 
              alt={`View ${i}`} 
            />
          ))}
        </div>

        {/* ТЕКСТОВАЯ ИНФОРМАЦИЯ */}
        <div style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '32px', color: '#1e40af', margin: '0 0 5px 0' }}>{apt.price}</h2>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#475569' }}>📞 {apt.phone}</p>
            </div>
            <a 
              href={apt.link} 
              target="_blank" 
              rel="noreferrer" 
              style={{ padding: '12px 24px', background: '#1877F2', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Original FB Post
            </a>
          </div>
          
          <div style={{ marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.7', 
              color: '#334155', 
              whiteSpace: 'pre-wrap', // СОХРАНЯЕТ ПЕРЕНОСЫ СТРОК ИЗ FB
              wordBreak: 'break-word'
            }}>
              {apt.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
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
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* КАРТА (Фон для мобилок, правая часть для десктопа) */}
      <div style={{ 
        flex: 1, 
        height: '100%', 
        width: '100%',
        position: isMobile ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        zIndex: 1
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

      {/* СПИСОК / ГУЛЯЮЩАЯ ЛЕНТА */}
      <div style={{ 
        width: isMobile ? '100%' : '420px',
        height: isMobile ? 'auto' : '100%',
        position: isMobile ? 'absolute' : 'relative',
        bottom: 0,
        left: 0,
        zIndex: 1000,
        background: isMobile ? 'transparent' : 'white',
        borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
        pointerEvents: 'none'
      }}>
        {!isMobile && (
          <div style={{ padding: '25px', borderBottom: '1px solid #eee', background: 'white' }}>
            <h1 style={{ fontSize: '22px', margin: 0, color: '#1a202c' }}>Da Nang Rentals 🏖️</h1>
          </div>
        )}

        <div style={{ 
          display: isMobile ? 'flex' : 'block',
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: isMobile ? 'hidden' : 'auto',
          padding: '15px',
          gap: '15px',
          pointerEvents: 'auto',
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          WebkitOverflowScrolling: 'touch',
          height: isMobile ? 'auto' : 'calc(100vh - 80px)'
        }}>
          {apartmentsData.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => { setSelectedId(apt.id); setShowModal(true); }}
              style={{ 
                borderRadius: '20px', 
                border: '1px solid #e2e8f0', 
                marginBottom: isMobile ? '0' : '15px',
                flexShrink: 0,
                width: isMobile ? '85%' : '100%',
                maxWidth: isMobile ? '320px' : 'none',
                overflow: 'hidden', 
                cursor: 'pointer', 
                background: 'white',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                scrollSnapAlign: 'center',
                transition: 'transform 0.2s'
              }}
            >
              <img src={apt.images[0]} style={{ width: '100%', height: isMobile ? '150px' : '200px', objectFit: 'cover' }} alt="preview" />
              <div style={{ padding: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e40af' }}>{apt.price}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>
                  {apt.description.substring(0, 70)}...
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