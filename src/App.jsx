import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// Настройка иконок
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
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        
        <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', padding: '20px', background: '#1a202c', scrollSnapType: 'x mandatory' }}>
          {apt.images.map((img, i) => (
            <img key={i} src={img} style={{ height: '400px', minWidth: '300px', borderRadius: '16px', objectFit: 'cover', scrollSnapAlign: 'start', flexShrink: 0 }} alt="room" />
          ))}
        </div>

        <div style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '32px', margin: 0, color: '#1e40af' }}>{apt.price}</h2>
              <p style={{ fontSize: '20px', color: '#475569', marginTop: '5px' }}>📞 {apt.phone}</p>
            </div>
            <a href={apt.link} target="_blank" rel="noreferrer" style={{ padding: '12px 24px', backgroundColor: '#1877F2', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>FB Post</a>
          </div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{apt.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const activeApt = apartmentsData.find(a => a.id === selectedId);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ width: '400px', overflowY: 'auto', borderRight: '1px solid #eee' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <h1 style={{ fontSize: '22px', margin: 0 }}>Da Nang Rentals 🌴</h1>
        </div>
        <div style={{ padding: '15px' }}>
          {apartmentsData.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => { setSelectedId(apt.id); setShowModal(true); }}
              style={{ borderRadius: '16px', border: '1px solid #eee', marginBottom: '15px', overflow: 'hidden', cursor: 'pointer', transition: '0.2s' }}
            >
              <img src={apt.images[0]} style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="preview" />
              <div style={{ padding: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>{apt.price}</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>{apt.description.substring(0, 80)}...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%' }}>
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