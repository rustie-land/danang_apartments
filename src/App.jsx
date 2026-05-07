import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// --- STYLES & ANIMATIONS ---
const INLINE_STYLING = `
  .range-slider-container { position: relative; width: 100%; height: 40px; display: flex; align-items: center; }
  .slider-track { position: absolute; height: 4px; width: 100%; background: #e2e2e7; border-radius: 2px; z-index: 1; }
  .slider-progress { position: absolute; height: 4px; background: #007AFF; border-radius: 2px; z-index: 2; }
  input[type=range].dual-range { position: absolute; width: 100%; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; z-index: 3; margin: 0; }
  input[type=range].dual-range::-webkit-slider-thumb { pointer-events: all; width: 24px; height: 24px; border-radius: 50%; background: #ffffff; border: 1px solid #ddd; box-shadow: 0 2px 6px rgba(0,0,0,0.15); -webkit-appearance: none; cursor: pointer; }
  .list-with-fade { position: relative; flex: 1; overflow: hidden; }
  .fade-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0)); pointer-events: none; z-index: 10; }
  .apt-card { transition: all 0.2s ease-in-out; }
  .apt-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 10px 20px rgba(0,0,0,0.08); border-color: #007AFF; }
`;

// Иконки для карты
const createIcon = (color, isBig = false) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: isBig ? [30, 48] : [25, 41],
  iconAnchor: isBig ? [15, 48] : [12, 41]
});

const defaultIcon = createIcon('blue');
const highlightIcon = createIcon('black', true); // Цвет для "зажигания" пина

const DANANG_BOUNDS = [[15.90, 107.90], [16.25, 108.55]];
const fmt = (val) => new Intl.NumberFormat('de-DE').format(val);

const getCleanPrice = (apt) => {
  const desc = (apt.description || "").toLowerCase();
  const millionRegex = /(\d+(?:[.,]\d+)?)\s*(?:million|mln|млн)/i;
  const millionMatch = desc.match(millionRegex);
  if (millionMatch) {
    let val = millionMatch[1].replace(',', '.');
    return parseFloat(val) * 1000000;
  }
  const priceRegex = /(?:price|💰|vnd)\s*[:*-]*\s*([\d\s.,]{5,15})/i;
  const match = desc.match(priceRegex);
  if (match) return parseInt(match[1].replace(/[^\d]/g, ''), 10);
  let num = parseFloat(apt.numeric_price);
  if (!num) return 0;
  return num < 1000 ? num * 1000000 : num;
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [dynamicTags, setDynamicTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 5000000, max: 40000000 });
  const [currentFilter, setCurrentFilter] = useState({ min: 5000000, max: 40000000 });
  const [selectedApt, setSelectedApt] = useState(null);
  const [hoveredAptId, setHoveredAptId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    async function fetchData() {
      const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (data) {
        const validApts = data.filter(apt => getCleanPrice(apt) > 0);
        setApartments(validApts);
        
        // Расчет цен и тегов
        const prices = validApts.map(getCleanPrice);
        if (prices.length) {
          setPriceRange({ min: Math.min(...prices), max: Math.max(...prices) });
          setCurrentFilter({ min: Math.min(...prices), max: Math.max(...prices) });
        }
        
        const commonWords = ['pool', 'gym', 'pet', 'sea', 'beach', 'balcony', 'kitchen', 'studio'];
        const counts = {};
        validApts.forEach(apt => {
          const d = (apt.description || "").toLowerCase();
          commonWords.forEach(word => { if (d.includes(word)) counts[word] = (counts[word] || 0) + 1; });
        });
        setDynamicTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w));
      }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const price = getCleanPrice(a);
      const desc = (a.description || "").toLowerCase();
      const matchesTags = selectedTags.every(tag => desc.includes(tag));
      const matchesPrice = price >= currentFilter.min && price <= currentFilter.max;
      let matchesType = true;
      if (propertyType === 'studio') matchesType = a.rooms === 0 || desc.includes('studio');
      else if (propertyType === '1br') matchesType = a.rooms === 1;
      else if (propertyType === '2br') matchesType = a.rooms === 2;
      else if (propertyType === '3plus') matchesType = a.rooms >= 3 || /house|villa/i.test(desc);
      return matchesTags && matchesPrice && matchesType;
    });
  }, [apartments, selectedTags, currentFilter, propertyType]);

  const sidebarWidth = isMobile ? window.innerWidth : 400;
  const getPercent = (value) => ((value - priceRange.min) / (priceRange.max - priceRange.min)) * 100;

  return (
    <div style={styles.container}>
      <style>{INLINE_STYLING}</style>
      
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" /> 
          {filteredApts.map(apt => (
            <Marker 
              key={apt.id} 
              position={[apt.lat, apt.lng]} 
              icon={hoveredAptId === apt.id ? highlightIcon : defaultIcon} 
              eventHandlers={{ click: () => setSelectedApt(apt) }} 
            />
          ))}
        </MapContainer>
      </div>

      <div style={{ ...styles.sidebarWrapper, width: sidebarWidth, transform: `translateX(${isSidebarOpen ? 0 : -sidebarWidth}px)` }}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            <div style={styles.sectionLabel}>Budget: {fmt(currentFilter.min)} - {fmt(currentFilter.max)}</div>
            
            <div className="range-slider-container">
              <div className="slider-track" />
              <div className="slider-progress" style={{ left: `${getPercent(currentFilter.min)}%`, right: `${100 - getPercent(currentFilter.max)}%` }} />
              <input type="range" className="dual-range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.min} 
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, min: Math.min(Number(e.target.value), prev.max - 1000000) }))} />
              <input type="range" className="dual-range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.max} 
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, max: Math.max(Number(e.target.value), prev.min + 1000000) }))} />
            </div>

            <div style={styles.tagGrid}>
              {['studio', '1br', '2br', '3plus'].map(t => (
                <button key={t} onClick={() => setPropertyType(propertyType === t ? 'all' : t)} 
                  style={{ ...styles.typeChip, backgroundColor: propertyType === t ? '#1d1d1f' : '#f5f5f7', color: propertyType === t ? '#fff' : '#1d1d1f' }}>{t.toUpperCase()}</button>
              ))}
            </div>

            {/* ВЕРНУЛИ ХЭШТЕГИ */}
            <div style={styles.hashtagsRow}>
              {dynamicTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  style={{ ...styles.tag, backgroundColor: selectedTags.includes(tag) ? '#007AFF' : '#fff', color: selectedTags.includes(tag) ? '#fff' : '#86868b' }}>#{tag}</button>
              ))}
            </div>
          </div>

          <div className="list-with-fade">
            <div style={styles.list}>
              {filteredApts.map(apt => (
                <div key={apt.id} 
                  className="apt-card" 
                  style={styles.card} 
                  onClick={() => setSelectedApt(apt)}
                  onMouseEnter={() => setHoveredAptId(apt.id)}
                  onMouseLeave={() => setHoveredAptId(null)}
                >
                  <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="" />
                  <div style={{ padding: '15px' }}>
                    <div style={styles.priceText}>{fmt(getCleanPrice(apt))} VND</div>
                    <div style={styles.descriptionText}>{apt.description?.substring(0, 65)}...</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fade-bottom" />
          </div>
        </div>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.macPill}>
          {isSidebarOpen ? '← MAP' : 'LIST →'}
        </button>
      </div>

      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalScrollContent}>
              <div style={styles.carousel}>
                {selectedApt.image_urls?.map((url, i) => (
                  <img key={i} src={url} style={styles.carouselImg} alt="" />
                ))}
              </div>
              <div style={{ padding: '25px 25px 120px' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#1d1d1f' }}>{selectedApt.description}</p>
                <div style={styles.miniMap}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} dragging={true} style={{ height: '100%', borderRadius: '15px' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              </div>
            </div>
            
            {/* НОВЫЙ БЛЕДНО-СИНИЙ ЦВЕТ КНОПКИ */}
            <div style={styles.modalFooter}>
               <div>
                  <div style={{ fontSize: '11px', color: '#86868b', textTransform: 'uppercase' }}>Monthly rent</div>
                  <div style={{ fontSize: '20px', fontWeight: '800' }}>{fmt(getCleanPrice(selectedApt))} VND</div>
               </div>
               <button onClick={() => setSelectedApt(null)} style={styles.paleBlueBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#fff', fontFamily: '-apple-system, sans-serif' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  sidebarWrapper: { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 100, display: 'flex', alignItems: 'center', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
  sidebar: { height: '100%', background: 'rgba(255, 255, 255, 0.98)', display: 'flex', flexDirection: 'column', boxShadow: '10px 0 30px rgba(0,0,0,0.05)', width: '100%' },
  sidebarHeader: { padding: '40px 24px 15px', flexShrink: 0 },
  title: { margin: '0 0 10px 0', fontWeight: '800', fontSize: '24px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase' },
  tagGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '15px' },
  typeChip: { padding: '10px 5px', borderRadius: '10px', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' },
  hashtagsRow: { display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', scrollbarWidth: 'none' },
  tag: { padding: '6px 12px', borderRadius: '20px', border: '1px solid #eee', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  list: { height: '100%', overflowY: 'auto', padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #f0f0f2', cursor: 'pointer' },
  cardImg: { width: '100%', height: '200px', objectFit: 'cover' },
  priceText: { fontSize: '19px', fontWeight: '800' },
  descriptionText: { fontSize: '13px', color: '#86868b' },
  macPill: { position: 'absolute', right: '-45px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: '20px', padding: '10px 16px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '500px', borderRadius: '32px', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  carousel: { display: 'flex', overflowX: 'auto', height: '300px', background: '#000' },
  carouselImg: { flex: '0 0 100%', width: '100%', objectFit: 'cover' },
  miniMap: { height: '200px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #eee', marginTop: '15px' },
  modalFooter: { padding: '20px 25px', borderTop: '1px solid #f0f0f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' },
  paleBlueBtn: { padding: '14px 30px', background: '#E3F2FD', color: '#007AFF', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }
};