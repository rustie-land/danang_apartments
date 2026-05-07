import React, { useState } from 'react';
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

// --- ИСПРАВЛЕННОЕ МОДАЛЬНОЕ ОКНО ---
const DetailsModal = ({ apt, onClose }) => {
  if (!apt) return null;

  return (
    <div 
      onClick={onClose} 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          backgroundColor: 'white', borderRadius: '24px', width: '95%', maxWidth: '1000px', 
          maxHeight: '90vh', overflowY: 'auto', position: 'relative', 
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' 
        }}
      >
        {/* Кнопка закрытия */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '20px', right: '20px', zIndex: 100, 
            background: 'white', border: 'none', borderRadius: '50%', 
            width: '45px', height: '45px', cursor: 'pointer', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontSize: '20px' 
          }}
        >
          ✕
        </button>
        
        {/* ГАЛЕРЕЯ (КАРУСЕЛЬ) */}
        <div 
          style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '12px', 
            padding: '20px', 
            background: '#1a202c', // Темный фон для акцента на фото
            scrollSnapType: 'x mandatory', // Плавное прилипание при скролле
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {apt.images && apt.images.map((img, i) => (
            <img 
              key={i} 
              src={img} 
              style={{ 
                height: '400px', 
                minWidth: '300px', // Минимальная ширина для каждого фото
                borderRadius: '16px', 
                objectFit: 'cover',
                scrollSnapAlign: 'start',
                flexShrink: 0 // Важно: не дает картинкам сжиматься
              }} 
              alt={`Apartment view ${i + 1}`} 
            />
          ))}
        </div>

        {/* Инфо-блок */}
        <div style={{ padding: '35px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '36px', margin: '0 0 10px 0', color: '#1e40af' }}>{apt.price}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <span style={{ fontSize: '20px', color: '#475569', fontWeight: '600' }}>📞 {apt.phone}</span>
              </div>
            </div>
            <a 
              href={apt.link} 
              target="_blank" 
              rel="noreferrer" 
              style={{ 
                padding: '14px 28px', backgroundColor: '#1877F2', color: 'white', 
                borderRadius: '14px', textDecoration: 'none', fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)'
              }}
            >
              Open Original Post
            </a>
          </div>
          
          <div style={{ margin: '30px 0', borderTop: '1px solid #e2e8f0', paddingTop: '25px' }}>
            <h4 style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Description</h4>
            <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', whiteSpace: 'pre-wrap' }}>
              {apt.description}
            </p>
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
    <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      {/* Левая панель (Sidebar) */}
      <div style={{ width: '420px', overflowY: 'auto', background: 'white', borderRight: '1px solid #e2e8f0' }}>
        <div style={{ padding: '25px', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 10, borderBottom: '1px solid #eee' }}>
          <h1 style={{ fontSize: '24px', margin: 0, color: '#1a202c' }}>Da Nang Rentals 🌴</h1>
        </div>
        <div style={{ padding: '20px' }}>
          {apartmentsData.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => { setSelectedId(apt.id); setShowModal(true); }} 
              style={{ 
                borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '20px', 
                overflow: 'hidden', cursor: 'pointer', transition: '0.2s',
                boxShadow: selectedId === apt.id ? '0 0 0 3px #3b82f6' : '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}
            >
              <img src={apt.images[0]} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '18px' }}>
                <div style={{ fontSize: '20px',