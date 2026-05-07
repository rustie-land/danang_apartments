import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  
  // Состояние для мобилок
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // СВОЙСТВА СВАЙПА
  const [offsetX, setOffsetX] = useState(0); 
  const [isOpen, setIsOpen] = useState(true);
  const touchStartPos = useRef(null);
  const sidebarWidth = isMobile ? window.innerWidth * 0.9 : 420;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    async function fetchData() {
      const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (data) {
        setApartments(data);
        const wordFreq = {};
        const relevant = ['pool', 'gym', 'balcony', 'sea', 'beach', 'view', 'pet', 'friendly', 'parking', 'security', 'kitchen', 'ac', 'wifi', 'studio', 'penthouse', 'garden', 'modern', 'new', 'cheap', 'luxury', 'son tra', 'my khe', 'nha trang', 'an thuong', 'river', 'bridge'];
        data.forEach(apt => {
          if (!apt.description) return;
          const cleanText = apt.description.toLowerCase().replace(/[^\w\s\u0400-\u04FF]/gi, ' '); 
          const words = cleanText.split(/\s+/);
          words.forEach(word => {
            if (word.length > 2 && relevant.some(cat => word.includes(cat))) {
              wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
          });
        });
        setDynamicKeywords(Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).map(([word]) => word));
      }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleStart = (e) => {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    touchStartPos.current = clientX;
  };

  const handleMove = (e) => {
    if (touchStartPos.current === null) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let diff = clientX - touchStartPos.current;
    if (isOpen) {
      if (diff > 0) diff = 0; 
      if (diff < -sidebarWidth) diff = -sidebarWidth;
      setOffsetX(diff);
    } else {
      if (diff < 0) diff = 0;
      if (diff > sidebarWidth) diff = sidebarWidth;
      setOffsetX(-sidebarWidth + diff);
    }
  };

  const handleEnd = () => {
    if (touchStartPos.current === null) return;
    const threshold = sidebarWidth * 0.25;
    if (isOpen) { if (offsetX < -threshold) setIsOpen(false); } 
    else { if (offsetX > -sidebarWidth + threshold) setIsOpen(true); }
    setOffsetX(0);
    touchStartPos.current = null;
  };

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

  const currentTranslate = isOpen ? offsetX : offsetX || -sidebarWidth;

  return (
    <div 
      style={styles.container}
      onMouseMove={handleMove} onMouseUp={handleEnd}
      onTouchMove={handleMove} onTouchEnd={handleEnd}
    >
      {!isOpen && (
        <div style={styles.openHint} onMouseDown={handleStart} onTouchStart={handleStart}>
          <span>{isMobile ? 'Swipe' : 'Swipe to search →'}</span>
        </div>
      )}

      <div 
        style={{ 
          ...styles.sidebar, 
          width: isMobile ? '90vw' : '420px',
          transform: `translateX(${currentTranslate}px)`,
          transition: touchStartPos.current ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
        }}
      >
        <div style={styles.sidebarHeader} onMouseDown={handleStart} onTouchStart={handleStart}>
          <div style={styles.dragHandle}></div>
          <h2 style={styles.title}>Da Nang Finder 🌴</h2>
          
          <div style={styles.filterBox}>
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
        </div>

        <div style={styles.list}>
          {filteredApts.map(apt => (
            <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
              <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
              <div style={{ padding: '20px' }}>
                <div style={styles.priceText}>{getSmartPrice(apt)}</div>
                <div style={styles.descriptionText}>📍 {apt.description?.substring(0, 80)}...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {filteredApts.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={activeIcon} />
          ))}
        </MapContainer>
      </div>

      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} alt="apt" />
            <div style={{ padding: isMobile ? '20px' : '30px' }}>
              <h2 style={styles.modalPrice}>{getSmartPrice(selectedApt)}</h2>
              <p style={styles.modalDesc}>{selectedApt.description}</p>
              
              {/* МИНИ-КАРТА ТОЛЬКО ДЛЯ МОБИЛОК */}
              {isMobile && (
                <div style={styles.miniMapContainer}>
                  <p style={styles.miniMapLabel}>Location</p>
                  <div style={styles.miniMapWrapper}>
                    <MapContainer 
                      center={[selectedApt.lat, selectedApt.lng]} 
                      zoom={15} 
                      zoomControl={false} 
                      dragging={false} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                    </MapContainer>
                  </div>
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
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#f1f5f9' },
  openHint: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1001, background: '#1e293b', color: '#fff', padding: '15px 10px', borderRadius: '0 15px 15px 0', writingMode: 'vertical-rl', fontSize: '12px', fontWeight: 'bold' },
  sidebar: { position: 'absolute', left: 0, top: 0, height: '100vh', overflowY: 'auto', background: '#fff', zIndex: 1000, boxShadow: '10px 0 40px rgba(0,0,0,0.1)' },
  sidebarHeader: { padding: '20px 24px' },
  dragHandle: { width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '0 auto 20px' },
  title: { margin: '0 0 25px 0', fontWeight: '900', fontSize: '26px' },
  filterBox: { background: '#f8fafc', borderRadius: '24px', padding: '20px', marginBottom: '20px' },
  tagSearchInput: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' },
  tagButton: { padding: '7px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  list: { padding: '0 24px 40px 24px' },
  card: { background: '#fff', borderRadius: '28px', overflow: 'hidden', marginBottom: '25px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
  cardImg: { width: '100%', height: '240px', objectFit: 'cover' },
  priceText: { fontSize: '24px', fontWeight: '900' },
  descriptionText: { fontSize: '14px', color: '#64748b' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  modal: { background: '#fff', width: '95%', maxWidth: '800px', borderRadius: '35px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  modalImg: { width: '100%', height: '350px', objectFit: 'cover' },
  modalPrice: { fontSize: '32px', fontWeight: '900' },
  modalDesc: { whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '16px', marginBottom: '25px' },
  
  // СТИЛИ МИНИ-КАРТЫ
  miniMapContainer: { marginTop: '20px', marginBottom: '20px' },
  miniMapLabel: { fontSize: '14px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' },
  miniMapWrapper: { height: '200px', width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  
  closeBtn: { width: '100%', padding: '16px', background: '#f1f5f9', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }
};