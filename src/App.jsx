import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Импорт данных
import apartmentsData from './apartments_data.json';

// Фикс иконок маркеров
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
  const [apartments] = useState(apartmentsData);
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  const districts = ['All', 'Ngu Hanh Son', 'Son Tra', 'Hai Chau'];

  const filteredApartments = selectedDistrict === 'All' 
    ? apartments 
    : apartments.filter(apt => apt.district === selectedDistrict);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      <header style={{ 
        padding: '15px 25px', background: '#1e40af', color: 'white', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 
      }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Danang Rental Radar 🏝️</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Район:</span>
          <select 
            value={selectedDistrict} 
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px' }}
          >
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        <div style={{ width: '380px', overflowY: 'auto', padding: '20px', borderRight: '1px solid #e5e7eb', background: '#f3f4f6' }}>
          <div style={{ marginBottom: '15px', color: '#374151', fontWeight: '600' }}>
            Найдено объектов: {filteredApartments.length}
          </div>
          
          {filteredApartments.map(apt => (
            <div key={apt.id} style={{ background: 'white', padding: '16px', marginBottom: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#1d4ed8', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>
                {apt.price === "nan" ? "Price on request" : apt.price}
              </div>
              <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginBottom: '10px', fontWeight: 'bold' }}>
                {apt.district ? apt.district.toUpperCase() : 'DANANG'}
              </div>
              <p style={{ fontSize: '13px', margin: 0, color: '#4b5563' }}>{apt.description}</p>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <MapContainer center={[16.0544, 108.2022]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {filteredApartments.map(apt => (
              <Marker key={apt.id} position={[apt.lat, apt.lng]}>
                <Popup>
                  <strong>{apt.price === "nan" ? "Price on request" : apt.price}</strong><br/>
                  <small>{apt.description}</small>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
