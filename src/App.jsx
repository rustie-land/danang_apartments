import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apartmentsData from './apartments_data.json';

// Исправление иконки маркера для Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Компонент для центрирования карты
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

function App() {
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedApt, setSelectedApt] = useState(null);

  const filteredApartments = useMemo(() => {
    return apartmentsData.filter(apt =>
      apt.district.toLowerCase().includes(searchDistrict.toLowerCase())
    );
  }, [searchDistrict]);

  const mapCenter = [16.0544, 108.2022];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1e40af', 
        color: 'white', 
        padding: '15px 25px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000 
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Danang Rental Radar 🏝️</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Район:</span>
          <input
            type="text"
            placeholder="Напр: Ngu Hanh Son"
            value={searchDistrict}
            onChange={(e) => setSearchDistrict(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', width: '200px' }}
          />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Список карточек */}
        <div style={{ width: '400px', overflowY: 'auto', padding: '15px', backgroundColor: '#f3f4f6' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
            Найдено вариантов: {filteredApartments.length}
          </p>
          {filteredApartments.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => setSelectedApt(apt)}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                marginBottom: '20px', 
                cursor: 'pointer',
                boxShadow: selectedApt?.id === apt.id ? '0 0 0 3px #3b82f6' : '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s'
              }}
            >
              {/* Картинка с обработкой ошибки */}
              <img 
                src={apt.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'} 
                alt="apartment"
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Photo+Unavailable'; }}
              />
              
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, color: '#1e40af', fontSize: '18px' }}>{apt.price}</h3>
                  <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    {apt.rooms}
                  </span>
                </div>
                
                <p style={{ margin: '8px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                  {apt.description}
                </p>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>📍 {apt.district}</span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>📞 {apt.contact}</span>
                </div>

                <a 
                  href={apt.original_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: 'block', 
                    marginTop: '12px', 
                    textAlign: 'center', 
                    padding: '8px', 
                    backgroundColor: '#eff6ff', 
                    color: '#2563eb', 
                    textDecoration: 'none', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Посмотреть на Facebook →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Карта */}
        <div style={{ flex: 1 }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.