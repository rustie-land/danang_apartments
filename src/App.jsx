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
  if (center) map.setView(center, 15);
  return null;
}

const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '0', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>✕</button>
        
        {/* Галерея картинок */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '20px', background: '#f8fafc' }}>
          {apt.images.map((img, i) => (
            <img key={i} src={img} style={{ height: '350px', borderRadius: '12px', objectFit: 'cover' }} alt="apartment" />
          ))}
        </div>

        <div style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '32px', margin: '0', color: '#1e40af' }}>{apt.price}</h2>
              <p style={{ fontSize: '18px', color: '#64748b', margin: '5px 0' }}>📞 {apt.phone}</p>
            </div>
            <a href={apt.link} target="_blank" rel="noreferrer" style={{ padding: '12px 24px', background: '#2563eb', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600' }}>View on Facebook</a>
          </div>
          
          <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />
          
          <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155', whiteSpace: 'pre-wrap' }}>{apt.description}</p>
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
    <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '400px', overflowY: 'auto', background: 'white', borderRight: '1px solid #e5e7eb', zIndex: 10 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 20 }}>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Da Nang Apartments 🏠</h1>
        </div>
        <div style={{ padding: '15px' }}>
          {apartmentsData.map(apt => (
            <div key={apt.id} onClick={() => { setSelectedId(apt.id); setShowModal(true); }} style={{ borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}>
              <img src={apt.images[0]} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{apt.price}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{apt.description.substring(0, 100)}...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
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