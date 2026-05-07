import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// Утилита для получения чистой цены из описания или колонки
const getCleanPrice = (apt) => {
  const desc = apt.description || "";
  const priceRegex = /(?:price|💰|vnd)\s*[:*-]*\s*([\d\s.,]{5,15})/i;
  const match = desc.match(priceRegex);
  if (match) {
    return parseInt(match[1].replace(/[^\d]/g, ''), 10);
  }
  let num = parseFloat(apt.numeric_price);
  if (!num) return 0;
  return num < 1000 ? num * 1000000 : num;
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [dynamicTags, setDynamicTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState(50000000); // Дефолт
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 50000000 });
  
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
        
        // 1. Извлекаем цены для настройки слайдера
        const prices = data.map(getCleanPrice).filter(p => p > 0);
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        setPriceBounds({ min: minP, max: maxP });
        setMaxPriceFilter(maxP);

        // 2. Генерируем ТОП-10 тегов динамически
        const commonWords = ['pool', 'gym', 'pet', 'sea', 'beach', 'balcony', 'kitchen', 'modern', 'quiet', 'studio', 'view', 'parking', 'security'];
        const counts = {};
        data.forEach(apt => {
          const d = (apt.description || "").toLowerCase();
          commonWords.forEach(word => {
            if (d.includes(word)) counts[word] = (counts[word] || 0) + 1;
          });
        });
        const top10 = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word]) => word);
        setDynamicTags(top10);
      }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const desc = (a.description || "").toLowerCase();
      const price = getCleanPrice(a);
      
      const matchesTags = selectedTags.every(tag => desc.includes(tag));
      const matchesPrice = price <= maxPriceFilter;
      
      let matchesType = true;
      if (propertyType === 'studio') matchesType = a.rooms === 0 || desc.includes('studio');
      else if (propertyType === '1br') matchesType = a.rooms === 1;
      else if (propertyType === '2br') matchesType = a.rooms === 2;
      else if (propertyType === '3plus') matchesType = a.rooms >= 3 || /house|villa|3 bedroom/i.test(desc);

      return matchesTags && matchesPrice && matchesType;
    });
  }, [apartments, selectedTags, maxPriceFilter, propertyType]);

  const sidebarWidth = isMobile ? window.innerWidth * 0.88 : 420;

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

      <div style={{ ...styles.sidebarWrapper, transform: `translateX(${isSidebarOpen ? 0 : -sidebarWidth + 12}px)` }}>
        <div style={{ ...styles.sidebar, width: sidebarWidth }}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            
            {/* СЛАЙДЕР ЦЕНЫ */}
            <div style={styles.sectionLabel}>Budget: up to {new Intl.NumberFormat('de-DE').format(maxPriceFilter)} VND</div>
            <input 
              type="range" 
              min={priceBounds.min} 
              max={priceBounds.max} 
              step={2000000} 
              value={maxPriceFilter} 
              onChange={(e) => setMaxPriceFilter(parseInt(e.target.value))}
              style={styles.slider}
            />

            {/* ТИП ЖИЛЬЯ */}
            <div style={styles.sectionLabel} style={{marginTop: '20px'}}>Property Type</div>
            <div style={styles.chipScroll}>
              {[{id:'all', label:'All'}, {id:'studio', label:'Studio'}, {id:'1br', label:'1BR'}, {id:'2br', label:'2BR'}, {id:'3plus', label:'3BR+/House'}].map(t => (
                <button key={t.id} onClick={() => setPropertyType(t.id)} 
                  style={{ ...styles.chip, backgroundColor: propertyType === t.id ? '#1d1d1f' : '#f5f5f7', color: propertyType === t.id ? '#fff' : '#1d1d1f' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ДИНАМИЧЕСКИЕ ТЕГИ (ТОП-10) */}
            <div style={styles.sectionLabel}>Popular features</div>
            <div style={styles.tagGrid}>
              {dynamicTags.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  style={{ 
                    ...styles.tagBtn, 
                    backgroundColor: selectedTags.includes(tag) ? '#007AFF' : '#fff',
                    color: selectedTags.includes(tag) ? '#fff' : '#1d1d1f'
                  }}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '18px' }}>
                  <div style={styles.priceText}>{new Intl.NumberFormat('de-DE').format(getCleanPrice(apt))} VND</div>
                  <div style={styles.descriptionText}>📍 {apt.description?.substring(0, 60)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={styles.pillContainer}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.macPill}>
            <span>{isSidebarOpen ? '← MAP' : '→ BACK'}</span>
          </button>
        </div>
      </div>

      {/* MODAL (как в прошлом ответе, с каруселью) */}
      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalScrollContent}>
              <div style={styles.carouselContainer}>
                {selectedApt.image_urls?.map((url, i) => (
                  <img key={i} src={url} style={styles.carouselImg} alt={`v-${i}`} />
                ))}
              </div>
              <div style={{ padding: '25px' }}>
                <h2 style={styles.modalPrice}>{new Intl.NumberFormat('de-DE').format(getCleanPrice(selectedApt))} VND</h2>
                <div style={styles.modalDesc}>{selectedApt.description}</div>
                <div style={styles.miniMapWrapper}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={false} dragging={false} style={{ height: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
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
  sidebarWrapper: { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' },
  sidebar: { height: '100vh', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', overflowY: 'auto' },
  
  // КАРУСЕЛЬ И СЛАЙДЕР
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', height: '300px', scrollbarWidth: 'none' },
  carouselImg: { flex: '0 0 100%', width: '100%', height: '300px', objectFit: 'cover', scrollSnapAlign: 'start' },
  slider: { width: '100%', accentColor: '#007AFF', cursor: 'pointer', marginTop: '10px' },

  pillContainer: { paddingLeft: '12px' },
  macPill: { background: 'rgba(29, 29, 31, 0.9)', border: 'none', borderRadius: '20px', padding: '10px 18px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '11px' },
  sidebarHeader: { padding: '40px 24px 10px' },
  title: { margin: '0 0 20px 0', fontWeight: '700', fontSize: '24px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' },
  chipScroll: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '20px', scrollbarWidth: 'none' },
  chip: { padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
  tagGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  tagBtn: { padding: '10px', borderRadius: '10px', border: '1px solid #e2e2e7', fontSize: '11px', fontWeight: '600', textAlign: 'left', transition: '0.2s' },
  list: { padding: '20px 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f5f5f7' },
  cardImg: { width: '100%', height: '180px', objectFit: 'cover' },
  priceText: { fontSize: '20px', fontWeight: '700' },
  descriptionText: { fontSize: '12px', color: '#86868b', marginTop: '4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '450px', borderRadius: '25px', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  modalPrice: { fontSize: '24px', fontWeight: '700' },
  modalDesc: { fontSize: '15px', lineHeight: '1.6', color: '#1d1d1f', paddingRight: '10px', whiteSpace: 'pre-wrap' },
  miniMapWrapper: { height: '180px', borderRadius: '20px', overflow: 'hidden', marginTop: '20px' },
  modalFooter: { padding: '15px 25px 25px' },
  appleCloseBtn: { width: '100%', padding: '16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '600' }
};