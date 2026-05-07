import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// --- STYLES ---
const INLINE_STYLING = `
  .range-slider-container {
    position: relative;
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
  }
  .slider-track {
    position: absolute;
    height: 4px;
    width: 100%;
    background: #e2e2e7;
    border-radius: 2px;
    z-index: 1;
  }
  .slider-progress {
    position: absolute;
    height: 4px;
    background: #007AFF;
    border-radius: 2px;
    z-index: 2;
  }
  input[type=range].dual-range {
    position: absolute;
    width: 100%;
    background: none;
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
    z-index: 3;
    margin: 0;
  }
  input[type=range].dual-range::-webkit-slider-thumb {
    pointer-events: all;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #ddd;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    -webkit-appearance: none;
    cursor: pointer;
  }
  .list-with-fade {
    position: relative;
    flex: 1;
    overflow: hidden;
  }
  .fade-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0));
    pointer-events: none;
    z-index: 10;
  }
`;

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

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

const SmartDescription = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\+?\d[\d\s-]{8,12}|@[\w_]{5,}|https?:\/\/t\.me\/[\w_]+|t\.me\/[\w_]+)/g);
  return (
    <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => {
        if (/^\+?\d[\d\s-]{8,12}$/.test(part)) {
          return <a key={i} href={`tel:${part.replace(/[^\d+]/g, '')}`} style={{ color: '#007AFF', fontWeight: 'bold' }}>{part}</a>;
        }
        if (/^(@[\w_]{5,}|https?:\/\/t\.me\/|t\.me\/)/.test(part)) {
          const url = part.startsWith('@') ? `https://t.me/${part.replace('@', '')}` : (part.startsWith('t.me') ? `https://${part}` : part);
          return <a key={i} href={url} target="_blank" rel="noreferrer" style={{ color: '#007AFF', fontWeight: 'bold' }}>{part}</a>;
        }
        return part;
      })}
    </div>
  );
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 5000000, max: 40000000 });
  const [currentFilter, setCurrentFilter] = useState({ min: 5000000, max: 40000000 });
  const [selectedApt, setSelectedApt] = useState(null);
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
        const prices = validApts.map(getCleanPrice);
        if (prices.length) {
          const minP = Math.min(...prices);
          const maxP = Math.max(...prices);
          setPriceRange({ min: minP, max: maxP });
          setCurrentFilter({ min: minP, max: maxP });
        }
      }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const price = getCleanPrice(a);
      const desc = (a.description || "").toLowerCase();
      const matchesPrice = price >= currentFilter.min && price <= currentFilter.max;
      let matchesType = true;
      if (propertyType === 'studio') matchesType = a.rooms === 0 || desc.includes('studio');
      else if (propertyType === '1br') matchesType = a.rooms === 1;
      else if (propertyType === '2br') matchesType = a.rooms === 2;
      else if (propertyType === '3plus') matchesType = a.rooms >= 3 || /house|villa/i.test(desc);
      return matchesPrice && matchesType;
    });
  }, [apartments, currentFilter, propertyType]);

  const sidebarWidth = isMobile ? window.innerWidth : 400;

  // Расчет прогресс-бара для слайдера
  const getPercent = (value) => ((value - priceRange.min) / (priceRange.max - priceRange.min)) * 100;

  return (
    <div style={styles.container}>
      <style>{INLINE_STYLING}</style>
      
      {/* MAP LAYER */}
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} zoomControl={false} minZoom={11} maxBounds={DANANG_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" /> 
          {filteredApts.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedApt(apt) }} />
          ))}
        </MapContainer>
      </div>

      {/* SIDEBAR */}
      <div style={{ ...styles.sidebarWrapper, width: sidebarWidth, transform: `translateX(${isSidebarOpen ? 0 : -sidebarWidth}px)` }}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            <div style={styles.sectionLabel}>Budget: {fmt(currentFilter.min)} - {fmt(currentFilter.max)}</div>
            
            {/* DUAL RANGE SLIDER */}
            <div className="range-slider-container">
              <div className="slider-track" />
              <div className="slider-progress" style={{ 
                left: `${getPercent(currentFilter.min)}%`, 
                right: `${100 - getPercent(currentFilter.max)}%` 
              }} />
              <input type="range" className="dual-range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.min} 
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, min: Math.min(Number(e.target.value), prev.max - 1000000) }))} />
              <input type="range" className="dual-range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.max} 
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, max: Math.max(Number(e.target.value), prev.min + 1000000) }))} />
            </div>

            <div style={{...styles.sectionLabel, marginTop: '20px'}}>Property Type</div>
            <div style={styles.chipScroll}>
              {['all', 'studio', '1br', '2br', '3plus'].map(t => (
                <button key={t} onClick={() => setPropertyType(t)} style={{ ...styles.chip, backgroundColor: propertyType === t ? '#1d1d1f' : '#f5f5f7', color: propertyType === t ? '#fff' : '#1d1d1f' }}>{t.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* LIST WITH FADE EFFECT */}
          <div className="list-with-fade">
            <div style={styles.list}>
              {filteredApts.map(apt => (
                <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                  <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="" />
                  <div style={{ padding: '15px' }}>
                    <div style={styles.priceText}>{fmt(getCleanPrice(apt))} VND</div>
                    <div style={styles.descriptionText}>{apt.description?.substring(0, 80)}...</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fade-bottom" />
          </div>
        </div>

        {/* TOGGLE PILL */}
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.macPill}>
          {isSidebarOpen ? '← CLOSE LIST' : 'MAP VIEW →'}
        </button>
      </div>

      {/* AIRBNB STYLE MODAL */}
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
                <SmartDescription text={selectedApt.description} />
                <div style={styles.miniMapLabel}>📍 Map Interaction Enabled</div>
                <div style={styles.miniMap}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={true} dragging={true} style={{ height: '100%', borderRadius: '15px' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              </div>
            </div>
            
            <div style={styles.modalFooterAirbnb}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#86868b' }}>Total monthly</span>
                  <span style={{ fontSize: '20px', fontWeight: '800' }}>{fmt(getCleanPrice(selectedApt))} VND</span>
               </div>
               <button onClick={() => setSelectedApt(null)} style={styles.closeBtnAirbnb}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  sidebarWrapper: { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 100, display: 'flex', alignItems: 'center', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
  sidebar: { height: '100%', background: 'rgba(255, 255, 255, 0.98)', display: 'flex', flexDirection: 'column', boxShadow: '10px 0 30px rgba(0,0,0,0.05)', width: '100%' },
  sidebarHeader: { padding: '40px 24px 10px', flexShrink: 0 },
  title: { margin: '0 0 10px 0', fontWeight: '800', fontSize: '24px', letterSpacing: '-0.5px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase', marginBottom: '4px' },
  chipScroll: { display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'none' },
  chip: { padding: '10px 18px', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  list: { height: '100%', overflowY: 'auto', padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #f0f0f2', cursor: 'pointer', transition: 'transform 0.2s' },
  cardImg: { width: '100%', height: '200px', objectFit: 'cover' },
  priceText: { fontSize: '20px', fontWeight: '800', color: '#1d1d1f' },
  descriptionText: { fontSize: '13px', color: '#86868b', marginTop: '4px' },
  macPill: { position: 'absolute', right: '-55px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', background: '#1d1d1f', color: '#fff', border: 'none', borderRadius: '20px', padding: '12px 20px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 101 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '500px', borderRadius: '32px', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  carousel: { display: 'flex', overflowX: 'auto', height: '300px', background: '#000', scrollSnapType: 'x mandatory' },
  carouselImg: { flex: '0 0 100%', width: '100%', objectFit: 'cover', scrollSnapAlign: 'start' },
  miniMapLabel: { fontSize: '10px', fontWeight: '700', color: '#007AFF', margin: '20px 0 8px' },
  miniMap: { height: '200px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #eee' },
  modalFooterAirbnb: { padding: '20px 25px', borderTop: '1px solid #f0f0f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', position: 'absolute', bottom: 0, left: 0, right: 0 },
  closeBtnAirbnb: { padding: '14px 28px', background: '#FF385C', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }
};