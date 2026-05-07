import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// Фикс иконок
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

function FlyToLocation({ center }) {
  const map = useMap();
  if (center) map.flyTo(center, 15);
  return null;
}

const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '40px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#eee', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>✕</button>
        
        <h2 style={{ fontSize: '32px', color: '#1a365d', marginBottom: '10px' }}>{apt.price}</h2>
        <p style={{ fontSize: '18px', color: '#4a5568', marginBottom: '20px' }}>📍 Location: {apt.lat.toFixed(4)}, {apt.lng.toFixed(4)}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {apt.images.map((img, i) => (
            <img key={i} src={img} style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} alt="room" />
          ))}
        </div>

        <div style={{ background: '#f7fafc', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2b6cb0' }}>📞 Phone: {apt.phone}</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#2d3748' }}>{apt.description}</p>
          <a href={apt.original_link} target="_blank" style={{ display: 'inline-block', marginTop: '20px', padding: '12px 25px', backgroundColor: '#1877F2', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>Open original Facebook Post</a>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const activeApt = apartmentsData.find(a => a.id === selectedId);

  const openDetails = (apt) => {
    setSelectedId(apt.id);
    setShowModal(true);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Список */}
      <div style={{ width: '420px', overflowY: 'auto', padding: '20px', zIndex: 10, backgroundColor: '#fff', boxShadow: '2px 0 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px', color: '#1a202c' }}>Da Nang Rentals 🏖️</h1>
        {apartmentsData.map(apt => (
          <div key={apt.id} onClick={() => openDetails(apt)} style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '20px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <img src={apt.images[0]} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2b6cb0' }}>{apt.price}</div>
              <div style={{ color: '#718096', fontSize: '14px', margin: '5px 0' }}>📞 {apt.phone}</div>
              <div style={{ fontSize: '13px', color: '#4a5568' }}>{apt.description.substring(0, 70)}...</div>
            </div>
          </div>
        ))}
      </div>

      {/* Карта */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[16.0544, 108.2422]} zoom={14} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FlyToLocation center={activeApt ? [activeApt.lat, activeApt.lng] : null} />
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