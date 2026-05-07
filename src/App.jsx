import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// Ультимативное форматирование цен
const formatPrice = (val) => {
  if (!val) return 'Price on request';
  let num = parseFloat(String(val).replace(/[^\d.]/g, ''));
  if (num < 1000) num = num * 1000000; // Обработка сокращений типа "12"
  return new Intl.NumberFormat('de-DE').format(num);
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [dynamicKeywords, setDynamicKeywords] = useState([]); 
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filters, setFilters] = useState({ rooms: '', maxPrice: '' });
  const [selectedApt, setSelectedApt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    async function fetchData() {
      const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (data) {
        setApartments(data);
        const relevant = ['pool', 'gym', 'balcony', 'sea', 'beach', 'view', 'pet', 'kitchen', 'ac', 'wifi'];
        const wordFreq = {};
        data.forEach(apt => {
          if (!apt.description) return;
          apt.description.toLowerCase().split(/\s+/).forEach(word => {
            if (relevant.some(r => word.includes(r))) wordFreq[word] = (wordFreq[word] || 0) + 1;
          });
        });
        setDynamicKeywords(Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).map(([w]) => w));
      }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const content = (a.description || "").toLowerCase();
      const matchTags = selectedTags.every(t => content.includes(t));
      const matchRooms = filters.rooms === '' || a.rooms === parseInt(filters.rooms);
      
      const currentPrice = a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price;
      const priceLimit = filters.maxPrice ? parseFloat(filters.maxPrice) * 1000000 : Infinity;
      
      return matchTags && matchRooms && currentPrice <= priceLimit;
    });
  }, [apartments, selectedTags, filters]);

  const sidebarWidth = isMobile ? window.innerWidth * 0.88 : 420;
  // Оставляем 12px интерфейса видимыми при закрытии
  const closedOffset = -sidebarWidth + 12;

  return (
    <div style={styles.container}>
      {/* КАРТА */}
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {filteredApts.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedApt(apt) }} />
          ))}
        </MapContainer>
      </div>

      {/* САЙДБАР С КОНТРОЛЛЕРОМ */}
      <div style={{ 
        ...styles.sidebarWrapper, 
        transform: `translateX(${isSidebarOpen ? 0 : closedOffset}px)` 
      }}>
        <div style={{ ...styles.sidebar, width: sidebarWidth }}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            
            <div style={styles.filterBox}>
              <input 
                type="text" placeholder="Search features..." value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)} style={styles.tagInput}
              />
              <div style={styles.tagWrapper}>
                {dynamicKeywords.filter(t => t.includes(tagSearch.toLowerCase())).slice(0, 10).map(word => (
                  <button 
                    key={word} onClick={() => setSelectedTags(prev => prev.includes(word) ? prev.filter(t => t !== word) : [...prev, word])}
                    style={{ ...styles.tagButton, backgroundColor: selectedTags.includes(word) ? '#007AFF' : '#fff', color: selectedTags.includes(word) ? '#fff' : '#1d1d1f' }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterRow}>
              <select onChange={e => setFilters({...filters, rooms: e.target.value})} style={styles.inputShared}>
                <option value="">Bedrooms</option>
                <option value="0">Studio</option>
                <option value="1">1 BR</option>
                <option value="2">2+ BR</option>
              </select>
              <input 
                type="number" placeholder="Max Price (M)" 
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} 
                style={styles.inputShared} 
              />
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '20px' }}>
                  <div style={styles.priceText}>{formatPrice(apt.numeric_price)} VND</div>
                  <div style={styles.descriptionText}>📍 {apt.description?.substring(0, 65)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ В СТИЛЕ MACOS */}
        <div style={styles.pillContainer}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={styles.macPill}
          >
            <span style={styles.pillIcon}>{isSidebarOpen ? '←' : '→'}</span>
            <span style={styles.pillText}>{isSidebarOpen ? 'MAP' : 'BACK'}</span>
          </button>
        </div>
      </div>

      {/* МОДАЛКА */}
      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} />
            <div style={{ padding: '25px' }}>
              <h2 style={styles.modalPrice}>{formatPrice(selectedApt.numeric_price)} VND</h2>
              <p style={styles.modalDesc}>{selectedApt.description}</p>
              {isMobile && (
                <div style={styles.miniMapWrapper}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={false} dragging={false} style={{ height: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              )}
              <button onClick={() => setSelectedApt(null)} style={styles.appleCloseBtn}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#000' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  
  sidebarWrapper: { 
    position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1000, 
    display: 'flex', alignItems: 'center', transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' 
  },
  sidebar: { height: '100vh', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,0,0,0.1)', overflowY: 'auto' },

  // PILL BUTTON (MACOS STYLE)
  pillContainer: { paddingLeft: '12px' },
  macPill: {
    background: 'rgba(29, 29, 31, 0.85)', backdropFilter: 'blur(10px)',
    border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '20px',
    padding: '8px 16px', color: '#fff', display: 'flex', alignItems: 'center',
    gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  pillIcon: { fontSize: '14px', fontWeight: 'bold' },
  pillText: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },

  sidebarHeader: { padding: '40px 24px 20px' },
  title: { margin: '0 0 20px 0', fontWeight: '700', fontSize: '28px', color: '#1d1d1f' },
  filterBox: { background: '#f5f5f7', borderRadius: '18px', padding: '16px', marginBottom: '16px' },
  tagInput: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#fff', marginBottom: '10px', fontSize: '14px', outline: 'none' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tagButton: { padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: 'none', transition: '0.2s' },
  
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' },
  inputShared: { height: '42px', padding: '0 12px', borderRadius: '10px', border: 'none', background: '#fff', fontSize: '14px', outline: 'none' },
  
  list: { padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: '0.3s' },
  cardImg: { width: '100%', height: '220px', objectFit: 'cover' },
  priceText: { fontSize: '22px', fontWeight: '700', color: '#1d1d1f' },
  descriptionText: { fontSize: '13px', color: '#86868b', marginTop: '4px' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(15px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '460px', borderRadius: '30px', overflow: 'hidden', maxHeight: '85vh' },
  modalImg: { width: '100%', height: '300px', objectFit: 'cover' },
  modalPrice: { fontSize: '28px', fontWeight: '700', padding: '0 25px' },
  modalDesc: { fontSize: '15px', color: '#1d1d1f', lineHeight: '1.5', padding: '15px 25px 25px' },
  miniMapWrapper: { height: '180px', borderRadius: '20px', overflow: 'hidden', margin: '0 25px 20px', border: '1px solid #f5f5f7' },
  appleCloseBtn: { width: 'calc(100% - 50px)', margin: '0 25px 25px', padding: '14px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '600', fontSize: '16px' }
};