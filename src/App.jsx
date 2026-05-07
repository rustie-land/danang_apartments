import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// --- ИКОНКИ ---
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [30, 48], iconAnchor: [15, 48]
});

const getSmartPrice = (apt) => {
  const val = apt.numeric_price;
  if (!val) return 'Price on request';
  const finalPrice = val < 1000 ? val * 1000000 : val;
  return new Intl.NumberFormat('de-DE').format(finalPrice) + ' VND';
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [dynamicKeywords, setDynamicKeywords] = useState([]); 
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filters, setFilters] = useState({ rooms: '', maxPrice: '' });
  const [selectedApt, setSelectedApt] = useState(null);
  
  // Состояние: открыт ли сайдбар
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
            if (word.length > 2 && relevant.some(r => word.includes(r))) wordFreq[word] = (wordFreq[word] || 0) + 1;
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
      return selectedTags.every(t => content.includes(t)) &&
             (filters.rooms === '' || a.rooms === parseInt(filters.rooms)) &&
             ((a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price) <= (filters.maxPrice ? filters.maxPrice * 1000000 : Infinity));
    });
  }, [apartments, selectedTags, filters]);

  const sidebarWidth = isMobile ? '85vw' : '420px';

  return (
    <div style={styles.container}>
      
      {/* ФОНОВАЯ КАРТА */}
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {filteredApts.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} />
          ))}
        </MapContainer>
      </div>

      {/* САЙДБАР И КНОПКА-ПЕРЕКЛЮЧАТЕЛЬ */}
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
                {dynamicKeywords.filter(t => t.includes(tagSearch.toLowerCase())).slice(0, 12).map(word => (
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
              <input type="number" placeholder="Max Price (M)" onChange={e => setFilters({...filters, maxPrice: e.target.value})} style={styles.inputShared} />
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '20px' }}>
                  <div style={styles.priceText}>{getSmartPrice(apt)}</div>
                  <div style={styles.descriptionText}>📍 {apt.description?.substring(0, 60)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* КРАСИВАЯ КНОПКА ПЕРЕХОДА */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={styles.mapToggleBtn}
        >
          <span style={{ fontSize: '20px', marginBottom: '5px' }}>
            {isSidebarOpen ? '🗺️' : '📋'}
          </span>
          <span style={styles.toggleBtnText}>
            {isSidebarOpen ? 'MAP' : 'LIST'}
          </span>
        </button>
      </div>

      {/* МОДАЛКА */}
      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} alt="apt" />
            <div style={{ padding: '25px' }}>
              <h2 style={styles.modalPrice}>{getSmartPrice(selectedApt)}</h2>
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
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#f8fafc' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  
  // ОБЕРТКА САЙДБАРА (для анимации вместе с кнопкой)
  sidebarWrapper: { 
    position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1000, 
    display: 'flex', alignItems: 'center',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' 
  },

  sidebar: { height: '100vh', background: '#fff', boxShadow: '15px 0 50px rgba(0,0,0,0.1)', overflowY: 'auto' },
  
  // КНОПКА
  mapToggleBtn: {
    marginLeft: '15px', width: '65px', height: '100px',
    background: '#1e293b', color: '#fff', border: 'none',
    borderRadius: '0 25px 25px 0', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    boxShadow: '8px 0 20px rgba(0,0,0,0.2)', transition: '0.2s active'
  },
  toggleBtnText: { fontSize: '10px', fontWeight: '900', letterSpacing: '1px' },

  sidebarHeader: { padding: '30px 24px 10px' },
  title: { margin: '0 0 25px 0', fontWeight: '900', fontSize: '26px' },
  filterBox: { background: '#f8fafc', borderRadius: '24px', padding: '16px', marginBottom: '16px', border: '1px solid #f1f5f9' },
  tagInput: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px', outline: 'none' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tagButton: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', border: '1px solid #e2e8f0' },
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  inputShared: { height: '48px', padding: '0 12px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px' },
  
  list: { padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' },
  cardImg: { width: '100%', height: '220px', objectFit: 'cover' },
  priceText: { fontSize: '22px', fontWeight: '900' },
  descriptionText: { fontSize: '13px', color: '#64748b' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '500px', borderRadius: '30px', overflow: 'hidden', maxHeight: '85vh', overflowY: 'auto' },
  modalImg: { width: '100%', height: '300px', objectFit: 'cover' },
  modalPrice: { fontSize: '28px', fontWeight: '900' },
  modalDesc: { fontSize: '15px', padding: '0 25px 20px', lineHeight: '1.6' },
  miniMapWrapper: { height: '180px', borderRadius: '15px', overflow: 'hidden', margin: '0 25px 20px', border: '1px solid #e2e8f0' },
  closeBtn: { width: 'calc(100% - 50px)', margin: '0 25px 25px', padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '14px', fontWeight: '800' }
};