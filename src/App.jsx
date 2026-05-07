import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// --- CUSTOM MARKERS ---
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
  if (center) map.setView(center, 15, { animate: true });
  return null;
}

// --- MODAL COMPONENT ---
const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;

  return (
    <div 
      onClick={onClose} 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 20000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(5px)'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          backgroundColor: 'white', borderRadius: '28px', width: '95%', maxWidth: '800px', 
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '20px', right: '20px', zIndex: 100, 
            background: 'white', border: 'none', borderRadius: '50%', 
            width: '44px', height: '44px', cursor: 'pointer', fontSize: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* IMAGE CAROUSEL */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', padding: '20px', background: '#0f172a', scrollSnapType: 'x mandatory' }}>
          {apt.images && apt.images.map((img, i) => (
            <img 
              key={i} 
              src={img} 
              style={{ height: '400px', minWidth: '300px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, scrollSnapAlign: 'center' }} 
              alt="apartment" 
            />
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ 
              background: '#eff6ff', border: '2px solid #bfdbfe', padding: '12px 24px', borderRadius: '16px' 
            }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: '#1e40af' }}>{apt.price}</span>
            </div>
            
            <a 
              href={apt.link} 
              target="_blank" 
              rel="noreferrer" 
              style={{ padding: '14px 28px', background: '#1877F2', color: 'white', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '16px' }}
            >
              View on Facebook
            </a>
          </div>

          <p style={{ fontSize: '20px', fontWeight: '700', color: '#475569', marginTop: '20px' }}>📞 {apt.phone}</p>
          
          <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
            <p style={{ 
              fontSize: '17px', lineHeight: '1.8', color: '#334155', 
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {apt.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
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
      display: 'flex', flexDirection: isMobile ? 'column' : 'row', 
      height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative',
      fontFamily: '"Inter", sans-serif'
    }}>
      
      {/* MAP SECTION */}
      <div style={{ 
        flex: 1, height: '100%', width: '100%',
        position: isMobile ? 'absolute' : 'relative',
        top: 0, left: 0, zIndex: 1
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

      {/* SIDEBAR / MOBILE LIST */}
      <div style={{ 
        width: isMobile ? '100%' : '440px',
        height: isMobile ? 'auto' : '100%',
        position: isMobile ? 'absolute' : 'relative',
        bottom: 0, left: 0, zIndex: 1000,
        background: isMobile ? 'transparent' : '#fff',
        borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
        pointerEvents: 'none'
      }}>
        {!isMobile && (
          <div style={{ padding: '30px', borderBottom: '1px solid #f1f5f9' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Da Nang Rentals 🌴</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Found {apartmentsData.length} listings</p>
          </div>
        )}

        <div style={{ 
          display: isMobile ? 'flex' : 'block',
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: isMobile ? 'hidden' : 'auto',
          padding: '20px', gap: '16px', pointerEvents: 'auto',
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          WebkitOverflowScrolling: 'touch',
          height: isMobile ? 'auto' : 'calc(100vh - 100px)'
        }}>
          {apartmentsData.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => { setSelectedId(apt.id); setShowModal(true); }}
              style={{ 
                borderRadius: '24px', border: '1px solid #e2e8f0', 
                marginBottom: isMobile ? '0' : '20px', flexShrink: 0,
                width: isMobile ? '82%' : '100%', maxWidth: isMobile ? '300px' : 'none',
                overflow: 'hidden', cursor: 'pointer', background: 'white',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                scrollSnapAlign: 'center', transition: 'transform 0.2s ease'
              }}
            >
              <img src={apt.images[0]} style={{ width: '100%', height: isMobile ? '160px' : '220px', objectFit: 'cover' }} alt="preview" />
              <div style={{ padding: '20px' }}>
                <div style={{ 
                  background: '#eff6ff', color: '#1e40af', padding: '6px 12px', 
                  borderRadius: '10px', display: 'inline-block', fontWeight: '800', fontSize: '18px'
                }}>
                  {apt.price}
                </div>
                <div style={{ fontSize: '14px', color: '#475569', marginTop: '10px', lineHeight: '1.5' }}>
                  {apt.description.substring(0, 80)}...
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