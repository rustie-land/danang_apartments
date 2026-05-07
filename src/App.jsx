import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// --- ИКОНКИ ---
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [30, 48], iconAnchor: [15, 48], popupAnchor: [1, -34]
});

const getSmartPrice = (apt) => {
  const desc = apt.description || "";
  const priceRegex = /(?:Price|Price:|💰|\$)\s*[:*-]*\s*([\d\s.,]{5,15})/i;
  const match = desc.match(priceRegex);
  if (match) {
    const cleanNum = match[1].replace(/[^\d]/g, '');
    if (cleanNum.length >= 5) return new Intl.NumberFormat('de-DE').format(cleanNum) + ' VND';
  }
  let val = apt.numeric_price;
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
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  
  // НОВОЕ: Состояние сворачивания
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (data) {
        setApartments(data);
        const wordFreq = {};
        const relevantCategories = [
          'pool', 'gym', 'balcony', 'sea', 'beach', 'view', 'pet', 'friendly', 'parking', 'security',
          'kitchen', 'fridge', 'washing', 'dryer', 'ac', 'wifi', 'internet', 'tv', 'bathtub', 'shower',
          'studio', 'penthouse', 'garden', 'quiet', 'modern', 'new', 'cheap', 'luxury', 'center',
          'son tra', 'my khe', 'nha trang', 'an thuong', 'river', 'bridge'
        ];
        data.forEach(apt => {
          if (!apt.description) return;
          const cleanText = apt.description.toLowerCase().replace(/[_\-\/\\|.,!?;:()#💰✨🔥🏠📍✅🌟]/g, ' ').replace(/[^\w\s\u0400-\u04FF]/gi, ' '); 
          const words = cleanText.split(/\s+/);
          words.forEach(word => {
            if (word.length > 2 && relevantCategories.some(cat => word.includes(cat))) {
              wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
          });
        });
        setDynamicKeywords(Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).map(([word]) => word));
      }
    }
    fetchData();
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const content = `${a.description} ${a.district}`.toLowerCase();
      const matchTags = selectedTags.every(tag => content.includes(tag));
      const matchRooms = filters.rooms === '' || a.rooms === parseInt(filters.rooms);
      const currentPrice = a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price;
      const limit = filters.maxPrice ? parseFloat(filters.maxPrice) * 1000000 : Infinity;
      return matchTags && matchRooms && currentPrice <= limit;
    });
  }, [apartments, selectedTags, filters]);

  return (
    <div style={styles.container}>
      
      {/* КНОПКА ПЕРЕКЛЮЧАТЕЛЬ (COLLAPSE TOGGLE) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        style={{
          ...styles.toggleBtn,
          left: isCollapsed ? '20px' : '390px'
        }}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* САЙДБАР */}
      <div style={{ 
        ...styles.sidebar, 
        transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
        opacity: isCollapsed ? 0 : 1
      }}>
        <div style={styles.sidebarContent}>
          <div style={styles.header}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            <div style={styles.filterBox}>
              <div style={styles.filterHeader}>
                <span style={styles.label}>Smart Filters</span>
                {selectedTags.length > 0 && <span onClick={() => setSelectedTags([])} style={styles.clearBtn}>Reset</span>}
              </div>
              <input 
                type="text" 
                placeholder="Search features..." 
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                style={styles.tagSearchInput}
              />
              <div style={styles.tagWrapper}>
                {dynamicKeywords.filter(t => t.includes(tagSearch.toLowerCase())).map(word => (
                  <button 
                    key={word}
                    onClick={() => setSelectedTags(prev => prev.includes(word) ? prev.filter(t => t !== word) : [...prev, word])}
                    style={{
                      ...styles.tagButton,
                      backgroundColor: selectedTags.includes(word) ? '#1877F2' : '#fff',
                      color: selectedTags.includes(word) ? '#fff' : '#475569',
                      borderColor: selectedTags.includes(word) ? '#1877F2' : '#e2e8f0'
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.filterRow}>
              <select onChange={e => setFilters({...filters, rooms: e.target.value})} style={styles.select}>
                <option value="">Bedrooms</option>
                <option value="0">Studio</option>
                <option value="1">1 BR</option>
                <option value="2">2+ BR</option>
              </select>
              <input type="number" placeholder="Max Price (M)" onChange={e => setFilters({...filters, maxPrice: e.target.value})} style={styles.select} />
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} 
                onMouseEnter={() => setHoveredId(apt.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedApt(apt)}
                style={{ ...styles.card, borderColor: hoveredId === apt.id ? '#1877F2' : 'transparent' }}
              >
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '20px' }}>
                  <div style={styles.priceText}>{getSmartPrice(apt)}</div>
                  <div style={styles.descriptionText}>📍 {apt.description?.split('\n')[0].substring(0, 80)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* КАРТА (ВСЕГДА НА ФОНЕ) */}
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {filteredApts.map(apt => (
            <Marker 
              key={apt.id} 
              position={[apt.lat, apt.lng]} 
              icon={hoveredId === apt.id ? activeIcon : defaultIcon}
              eventHandlers={{ click: () => setSelectedApt(apt) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* МОДАЛКА */}
      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} />
            <div style={{ padding: '30px' }}>
              <h2 style={styles.modalPrice}>{getSmartPrice(selectedApt)}</h2>
              <p style={styles.modalDesc}>{selectedApt.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#fff', position: 'relative' },
  
  // КНОПКА ПЕРЕКЛЮЧЕНИЯ
  toggleBtn: {
    position: 'absolute',
    top: '20px',
    zIndex: 1000,
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: '#1e293b',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  sidebar: { 
    position: 'absolute',
    left: 0,
    top: 0,
    width: '420px', 
    height: '100vh', 
    overflowY: 'auto', 
    background: '#fff', 
    zIndex: 999,
    boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  sidebarContent: { display: 'flex', flexDirection: 'column' },
  header: { padding: '30px 24px 20px 24px' },
  title: { margin: '0 0 25px 0', fontWeight: '900', fontSize: '26px' },
  filterBox: { background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' },
  filterHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  label: { fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  clearBtn: { fontSize: '11px', color: '#1877F2', cursor: 'pointer', fontWeight: '700' },
  tagSearchInput: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tagButton: { padding: '7px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid', transition: '0.2s' },
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  select: { padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff' },
  list: { padding: '0 24px 40px 24px' },
  card: { background: '#fff', borderRadius: '28px', overflow: 'hidden', cursor: 'pointer', marginBottom: '25px', border: '3px solid transparent', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', transition: '0.3s' },
  cardImg: { width: '100%', height: '240px', objectFit: 'cover' },
  priceText: { fontSize: '24px', fontWeight: '900' },
  descriptionText: { fontSize: '14px', color: '#64748b', marginTop: '6px' },
  
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  modal: { background: '#fff', width: '90%', maxWidth: '800px', borderRadius: '35px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  modalImg: { width: '100%', height: '450px', objectFit: 'cover' },
  modalPrice: { fontSize: '36px', fontWeight: '900', marginBottom: '20px' },
  modalDesc: { whiteSpace: 'pre-wrap', padding: '0 30px 40px', color: '#334155', lineHeight: '1.7', fontSize: '16px' }
};