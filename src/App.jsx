import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// Фикс иконок
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Carousel = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;

  const next = (e) => { e.stopPropagation(); setIdx((idx + 1) % images.length); };
  const prev = (e) => { e.stopPropagation(); setIdx((idx - 1 + images.length) % images.length); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#000' }}>
      <img src={images[idx]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Room" />
      {images.length > 1 && (
        <>
          <button onClick={prev} style={btnStyle('left')}>‹</button>
          <button onClick={next} style={btnStyle('right')}>›</button>
          <div style={{ position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const btnStyle = (side) => ({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: '10px',
  background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', 
  width: '30px', height: '30px', cursor: 'pointer', fontSize: '20px', display: 'flex', 
  alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 10
});

function App() {
  const [view, setView] = useState([16.0544, 108.2422]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ width: '420px', overflowY: 'auto', padding: '20px', zIndex: 10 }}>
        <h2 style={{ marginBottom: '20px', color: '#1a365d' }}>Rental Radar Da Nang 🏝️</h2>
        {apartmentsData.map(apt => (
          <div key={apt.id} onClick={() => setView([apt.lat, apt.lng])} 
            style={{ backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <Carousel images={apt.images} />
            <div style={{ padding: '15px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2b6cb0', marginBottom: '8px' }}>{apt.price}</div>
              <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.4' }}>{apt.description}</p>
              <a href={apt.original_link} target="_blank" style={{ color: '#3182ce', fontSize: '12px', fontWeight: '600' }}>Открыть в Facebook →</a>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer center={view} zoom={14} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {apartmentsData.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]}>
              <Popup>{apt.price}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;