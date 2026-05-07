import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// Улучшенная функция форматирования цены
const formatVND = (val) => {
  if (!val) return 'Price on request';
  // Если цена введена как "12" (миллионов), превращаем в 12 000 000
  const numericValue = parseFloat(val);
  const finalPrice = numericValue < 1000 ? numericValue * 1000000 : numericValue;
  return new Intl.NumberFormat('de-DE').format(finalPrice) + ' VND';
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
      // Корректное сравнение цен в фильтре
      const currentPrice = a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price;
      const priceLimit = filters.maxPrice ? parseFloat(filters.maxPrice) * 1000000 : Infinity;
      
      return matchTags && matchRooms && currentPrice <= priceLimit;
    });
  }, [apartments, selectedTags, filters]);

  const sidebarWidth = isMobile ? '88vw' : '420px';

  return (
    <div style={styles.container}>
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {filteredApts.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedApt(apt) }} />
          ))}
        </MapContainer>
      </div>

      <div style={{ 
        ...styles.sidebarWrapper, 
        transform: isSidebarOpen ? 'translateX(0)' : `translateX(calc(-${sidebarWidth}))` 
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
                    style={{ ...styles.tagButton, backgroundColor: selectedTags.includes(word) ? '#1877F2' : '#fff', color: selectedTags.includes(word) ? '#fff' : '#475569' }}
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
                type="number" 
                placeholder="Max Price (M)" 
                onChange={e => setFilters({...filters, maxPrice: e.target.value})} 
                style={styles.inputShared} 
              />
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '20px' }}>
                  <div style={styles.priceText}>{formatVND(apt.numeric_price)}</div>
                  <div style={styles.descriptionText}>📍 {apt.description?.substring(0, 65)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* УЗКАЯ И ВЫСОКАЯ КНОПКА-ХЭНДЛ */}
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={styles.handleBar}
        >
          <span style={styles.handleText}>{isSidebarOpen ? 'CLOSE' : 'OPEN FILTERS'}</span>
        </div>
      </div>

      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} />
            <div style={{ padding: '25px' }}>
              <h2 style={styles.modalPrice}>{formatVND(selectedApt.numeric_price)}</h2>
              <p style={styles.modalDesc}>{selectedApt.description}</p>
              {isMobile && (
                <div style={styles.miniMapWrapper}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={false} dragging={false} style={{ height: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              )}
              <button onClick={() => setSelectedApt(null)} style={styles.closeBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#fff' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  
  sidebarWrapper: { 
    position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1000, 
    display: 'flex', transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
  },
  sidebar: { height: '100vh', background: '#fff', boxShadow: '10px 0 30px rgba(0,0,0,0.08)', overflowY: 'auto' },

  // НОВЫЙ СТИЛЬ ХЭНДЛА
  handleBar: {
    width: '24px', height: '100vh',
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.1)'
  },
  handleText: {
    color: '#fff', fontSize: '9px', fontWeight: '900', letterSpacing: '2px',
    writingMode: 'vertical-rl', transform: 'rotate(180deg)', opacity: 0.8
  },

  sidebarHeader: { padding: '25px 20px 10px' },
  title: { margin: '0 0 20px 0', fontWeight: '900', fontSize: '24px', letterSpacing: '-0.5px' },
  filterBox: { background: '#f8fafc', borderRadius: '20px', padding: '16px', marginBottom: '12px' },
  tagInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px', fontSize: '14px', boxSizing: 'border-box' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  tagButton: { padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', border: '1px solid #e2e8f0' },
  
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' },
  inputShared: { 
    height: '44px', padding: '0 10px', borderRadius: '12px', 
    border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', 
    boxSizing: 'border-box', width: '100%', outline: 'none' 
  },
  
  list: { padding: '0 20px 100px' },
  card: { background: '#fff', borderRadius: '22px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  cardImg: { width: '100%', height: '210px', objectFit: 'cover' },
  priceText: { fontSize: '20px', fontWeight: '900', color: '#1e293b' },
  descriptionText: { fontSize: '13px', color: '#64748b', marginTop: '4px' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '480px', borderRadius: '28px', overflow: 'hidden', maxHeight: '85vh', overflowY: 'auto' },
  modalImg: { width: '100%', height: '320px', objectFit: 'cover' },
  modalPrice: { fontSize: '26px', fontWeight: '900' },
  modalDesc: { fontSize: '15px', color: '#334155', lineHeight: '1.6', padding: '0 25px 20px' },
  miniMapWrapper: { height: '160px', borderRadius: '15px', overflow: 'hidden', margin: '0 25px 20px' },
  closeBtn: { width: 'calc(100% - 50px)', margin: '0 25px 25px', padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '800' }
};