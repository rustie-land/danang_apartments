import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

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

const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
        <h2 style={{ color: '#2b6cb0', fontSize: '28px', marginBottom: '15px' }}>{apt.price}</h2>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px' }}>
          {apt.images.map((img, i) => (
            <img key={i} src={img} style={{ height: '300px', borderRadius: '12px', flexShrink: 0 }} alt="room" />
          ))}
        </div>
        <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0 }}>📞 Phone: {apt.phone}</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px' }}>{apt.description}</p>
          <a href={apt.original_link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '15px', padding: '12px 24px', background: '#1877f2', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>View Original Post</a>
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7f6' }}>
      {/* Sidebar */}
      <div style={{ width: '400px', overflowY: 'auto', padding: '20px', borderRight: '1px solid #e2e8f0', backgroundColor: 'white' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Da Nang Rentals 🏖️</h1>
        {apartmentsData.map(apt => (
          <div key={apt.id} onClick={() => { setSelectedId(apt.id); setShowModal(true); }} style={{ borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '15px', overflow: 'hidden', cursor: 'pointer', transition: '0.2s', boxShadow: selectedId === apt.id ? '0 0 0 2px #3182ce' : 'none' }}>
            <img src={apt.images[0]} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
            <div style={{ padding: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748' }}>{apt.price}</div>
              <div style={{ color: '#718096', fontSize: '13px', marginTop: '4px' }}>📞 {apt.phone}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
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