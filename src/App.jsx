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

  // СВОЙСТВА СВАЙПА
  const [offsetX, setOffsetX] = useState(0); // Смещение в пикселях
  const [isOpen, setIsOpen] = useState(true);
  const touchStartPos = useRef(null);
  const sidebarWidth = 420;

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (data) {
        setApartments(data);
        const wordFreq = {};
        const relevant = ['pool', 'gym', 'balcony', 'sea', 'beach', 'view', 'pet', 'friendly', 'parking', 'kitchen', 'ac', 'wifi', 'studio', 'modern', 'luxury', 'son tra', 'my khe', 'river'];
        data.forEach(apt => {
          if (!apt.description) return;
          const words = apt.description.toLowerCase().replace(/[^\w\s\u0400-\u04FF]/gi, ' ').split(/\s+/);
          words.forEach(word => {
            if (word.length > 2 && relevant.some(cat => word.includes(cat))) wordFreq[word] = (wordFreq[word] || 0) + 1;
          });
        });
        setDynamicKeywords(Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).map(([word]) => word));
      }
    }
    fetchData();
  }, []);

  // ЛОГИКА ЖЕСТОВ
  const handleStart = (e) => {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    touchStartPos.current = clientX;
  };

  const handleMove = (e) => {
    if (touchStartPos.current === null) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let diff = clientX - touchStartPos.current;

    if (isOpen) {
      // Если открыт, diff будет отрицательным при свайпе влево
      if (diff > 0) diff = 0; 
      if (diff < -sidebarWidth) diff = -sidebarWidth;
      setOffsetX(diff);
    } else {
      // Если закрыт, тянем вправо (diff положительный)
      if (diff < 0) diff = 0;
      if (diff > sidebarWidth) diff = sidebarWidth;
      setOffsetX(-sidebarWidth + diff);
    }
  };

  const handleEnd = () => {
    if (touchStartPos.current === null) return;
    const threshold = sidebarWidth * 0.2;
    
    if (isOpen) {
      if (offsetX < -threshold) setIsOpen(false);
    } else {
      if (offsetX > -sidebarWidth + threshold) setIsOpen(true);
    }
    
    setOffsetX(0);
    touchStartPos.current = null;
  };

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const content = `${a.description} ${a.district}`.toLowerCase();
      return selectedTags.every(tag => content.includes(tag)) &&
             (filters.rooms === '' || a.rooms === parseInt(filters.rooms)) &&
             ((a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price) <= (filters.maxPrice ? filters.maxPrice * 1000000 : Infinity));
    });
  }, [apartments, selectedTags, filters]);

  const currentTranslate = isOpen ? offsetX : offsetX || -sidebarWidth;

  return (
    <div 
      style={styles.container}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {/* "РУЧКА" ДЛЯ ВЫТЯГИВАНИЯ, КОГДА ЗАКРЫТО */}
      {!isOpen && <div style={styles.grabArea} onMouseDown={handleStart} onTouchStart={handleStart} />}

      {/* САЙДБАР */}
      <div 
        style={{ 
          ...styles.sidebar, 
          transform: `translateX(${currentTranslate}px)`,
          transition: touchStartPos.current ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div style={styles.header}>
          <div style={styles.dragHandle}></div>
          <h2 style={styles.title}>Da Nang Finder 🌴</h2>
          <div style={styles.filterBox}>
            <input 
              type="text" 
              placeholder="Swipe left to hide..." 
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

      {/* КАРТА */}
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
            <img src={selectedApt.image_urls?.[0]} style={styles.modalImg} alt="apt" />
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
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#000' },
  grabArea: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '30px', zIndex: 1001, cursor: 'e-resize' },
  sidebar: { 
    position: 'absolute', left: 0, top: 0, width: '420px', height: '100vh', overflowY: 'auto', 
    background: '#fff', zIndex: 1000, boxShadow: '10px 0 30px rgba(0,0,0,0.1)', userSelect: 'none' 
  },
  dragHandle: { width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '10px auto 0' },
  header: { padding: '20px 24px' },
  title: { margin: '10px 0 20px 0', fontWeight: '900', fontSize: '24px' },
  filterBox: { background: '#f8fafc', borderRadius: '24px', padding: '16px' },
  tagSearchInput: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '10px', outline: 'none' },
  tagWrapper: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tagButton: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: '1px solid' },
  list: { padding: '0 24px 40px 24px' },
  card: { background: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  cardImg: { width: '100%', height: '220px', objectFit: 'cover' },
  priceText: { fontSize: '22px', fontWeight: '900' },
  descriptionText: { fontSize: '13px', color: '#64748b', marginTop: '5px' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  modal: { background: '#fff', width: '90%', maxWidth: '750px', borderRadius: '35px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
  modalImg: { width: '100%', height: '400px', objectFit: 'cover' },
  modalPrice: { fontSize: '32px', fontWeight: '900', padding: '0 30px' },
  modalDesc: { whiteSpace: 'pre-wrap', padding: '20px 30px 40px', color: '#334155', lineHeight: '1.6' }
};