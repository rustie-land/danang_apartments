import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// --- УЛЬТИМАТИВНЫЙ ПАРСЕР ЦЕН ---
const displayPrice = (apt) => {
  const desc = apt.description || "";
  // 1. Пытаемся найти цену в тексте (💰15.000.000 или Price: 12,000,000)
  const priceMatch = desc.match(/(?:Price|💰|\$)\s*[:*-]*\s*([\d\s.,]{5,15})/i);
  
  let finalNum;
  if (priceMatch) {
    finalNum = parseFloat(priceMatch[1].replace(/[^\d]/g, ''));
  } else {
    // 2. Если в тексте нет, берем из колонки numeric_price
    let val = parseFloat(apt.numeric_price);
    if (!val) return "Price on request";
    finalNum = val < 1000 ? val * 1000000 : val;
  }

  return new Intl.NumberFormat('de-DE').format(finalNum) + ' VND';
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
  const closedOffset = -sidebarWidth + 12;

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

      <div style={{ ...styles.sidebarWrapper, transform: `translateX(${isSidebarOpen ? 0 : closedOffset}px)` }}>
        <div style={{ ...styles.sidebar, width: sidebarWidth }}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            <div style={styles.filterBox}>
              <input type="text" placeholder="Search features..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} style={styles.tagInput} />
              <div style={styles.tagWrapper}>
                {dynamicKeywords.filter(t => t.includes(tagSearch.toLowerCase())).slice(0, 8).map(word => (
                  <button key={word} onClick={() => setSelectedTags(prev => prev.includes(word) ? prev.filter(t => t !== word) : [...prev, word])}
                    style={{ ...styles.tagButton, backgroundColor: selectedTags.includes(word) ? '#007AFF' : '#fff', color: selectedTags.includes(word) ? '#fff' : '#1d1d1f' }}>
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
              <input type="number" placeholder="Max Price (M)" onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} style={styles.inputShared} />
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '18px' }}>
                  <div style={styles.priceText}>{displayPrice(apt)}</div>
                  <div style={styles.descriptionText}>📍 {apt.description?.substring(0, 65)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.pillContainer}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.macPill}>
            <span style={styles.pillIcon}>{isSidebarOpen ? '←' : '→'}</span>
            <span style={styles.pillText}>{isSidebarOpen ? 'MAP' : 'BACK'}</span>
          </button>
        </div>
      </div>

      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalScrollContent}>
              <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} />
              <div style={{ padding: '25px' }}>
                <h2 style={styles.modalPrice}>{displayPrice(selectedApt)}</h2>
                <div style={styles.modalDesc}>{selectedApt.description}</div>
                
                <div style={styles.miniMapContainer}>
                  <div style={styles.sectionLabel}>Location</div>
                  <div style={styles.miniMapWrapper}>
                    <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={false} dragging={false} style={{ height: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
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
  sidebarWrapper: { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' },
  sidebar: { height: '100vh', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,0,0,0.1)', overflowY: 'auto' },
  pillContainer: { paddingLeft: '12px' },
  macPill: { background: 'rgba(29, 29, 31, 0.9)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '10px 18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' },
  pillIcon: { fontSize: '14px', fontWeight: 'bold' },
  pillText: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  sidebarHeader: { padding: '40px 24px 15px' },
  title: { margin: '0 0 20px 0', fontWeight: '700', fontSize: '26px', color: '#1d1d1f' },
  filterBox: { background: '#f5f5f7', borderRadius: '18px', padding: '16px', marginBottom: '12px' },
  tagInput: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#fff', marginBottom: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tagButton: { padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '600', border: 'none' },
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' },
  inputShared: { height: '42px', padding: '0 10px', borderRadius: '10px', border: 'none', background: '#fff', fontSize: '14px', outline: 'none' },
  list: { padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f5f5f7' },
  cardImg: { width: '100%', height: '200px', objectFit: 'cover' },
  priceText: { fontSize: '20px', fontWeight: '700', color: '#1d1d1f' },
  descriptionText: { fontSize: '13px', color: '#86868b', marginTop: '4px' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px' },
  modal: { background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '30px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  modalImg: { width: '100%', height: '280px', objectFit: 'cover' },
  modalPrice: { fontSize: '26px', fontWeight: '700', marginBottom: '15px' },
  modalDesc: { fontSize: '15px', color: '#1d1d1f', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  sectionLabel: { fontSize: '12px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' },
  miniMapContainer: { marginTop: '30px' },
  miniMapWrapper: { height: '200px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f5f5f7' },
  modalFooter: { padding: '15px 25px 25px', background: 'linear-gradient(to top, white 80%, transparent)' },
  appleCloseBtn: { width: '100%', padding: '16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }
};