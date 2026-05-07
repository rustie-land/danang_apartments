import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

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
    <div style={styles.modalDesc}>
      {parts.map((part, i) => {
        if (/^\+?\d[\d\s-]{8,12}$/.test(part)) {
          const cleanPhone = part.replace(/[^\d+]/g, '');
          return <a key={i} href={`tel:${cleanPhone}`} style={styles.link}>{part}</a>;
        }
        if (/^(@[\w_]{5,}|https?:\/\/t\.me\/|t\.me\/)/.test(part)) {
          const cleanUrl = part.startsWith('@') ? `https://t.me/${part.replace('@', '')}` : (part.startsWith('t.me') ? `https://${part}` : part);
          return <a key={i} href={cleanUrl} target="_blank" rel="noreferrer" style={styles.link}>{part}</a>;
        }
        return part;
      })}
    </div>
  );
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [dynamicTags, setDynamicTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 1000000, max: 50000000 });
  const [currentFilter, setCurrentFilter] = useState({ min: 1000000, max: 50000000 });
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
        const commonWords = ['pool', 'gym', 'pet', 'sea', 'beach', 'balcony', 'kitchen', 'studio'];
        const counts = {};
        validApts.forEach(apt => {
          const d = (apt.description || "").toLowerCase();
          commonWords.forEach(word => { if (d.includes(word)) counts[word] = (counts[word] || 0) + 1; });
        });
        setDynamicTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w));
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

  const sidebarWidth = isMobile ? window.innerWidth * 0.88 : 400;

  return (
    <div style={styles.container}>
      <div style={styles.mapWrapper}>
        <MapContainer 
          center={[16.0544, 108.2422]} 
          zoom={13} 
          zoomControl={false} // Отключаем стандартный, чтобы добавить свой в нужном месте
          minZoom={11} 
          maxBounds={DANANG_BOUNDS} 
          maxBoundsViscosity={1.0} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" /> 
          {filteredApts.map(apt => (
            <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} eventHandlers={{ click: () => setSelectedApt(apt) }} />
          ))}
        </MapContainer>
      </div>

      <div style={{ ...styles.sidebarWrapper, transform: `translateX(${isSidebarOpen ? 0 : -sidebarWidth + 12}px)` }}>
        <div style={{ ...styles.sidebar, width: sidebarWidth }}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Da Nang Finder 🌴</h2>
            <div style={styles.sectionLabel}>Budget: {fmt(currentFilter.min)} - {fmt(currentFilter.max)}</div>
            <div style={styles.rangeContainer}>
              <input type="range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.min} 
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, min: Math.min(Number(e.target.value), prev.max - 1000000) }))} 
                style={{ ...styles.dualInput, zIndex: currentFilter.min > priceRange.max / 2 ? 5 : 4 }} />
              <input type="range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.max} 
                onChange={(e) => setCurrentFilter(prev => ({ ...prev, max: Math.max(Number(e.target.value), prev.min + 1000000) }))} 
                style={{ ...styles.dualInput, zIndex: currentFilter.max < priceRange.max / 2 ? 5 : 4 }} />
            </div>

            <div style={{...styles.sectionLabel, marginTop: '25px'}}>Type</div>
            <div style={styles.chipScroll}>
              {['all', 'studio', '1br', '2br', '3plus'].map(t => (
                <button key={t} onClick={() => setPropertyType(t)} style={{ ...styles.chip, backgroundColor: propertyType === t ? '#1d1d1f' : '#f5f5f7', color: propertyType === t ? '#fff' : '#1d1d1f' }}>{t.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div style={styles.listContainer}>
            <div style={styles.list}>
              {filteredApts.map(apt => (
                <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                  <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="" />
                  <div style={{ padding: '15px' }}>
                    <div style={styles.priceText}>{fmt(getCleanPrice(apt))} VND</div>
                    <div style={styles.descriptionText}>{apt.description?.substring(0, 55)}...</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.fadeOverlay}></div>
          </div>
        </div>
        <div style={styles.pillContainer}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.macPill}>{isSidebarOpen ? '← MAP' : '→ LIST'}</button>
        </div>
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
              <div style={{ padding: '25px 25px 100px' }}>
                <SmartDescription text={selectedApt.description} />
                <div style={styles.miniMapLabel}>📍 Interactive Map: Move & Zoom enabled</div>
                <div style={styles.miniMap}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={true} dragging={true} style={{ height: '100%', borderRadius: '20px' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              </div>
              <div style={styles.fadeOverlayModal}></div>
            </div>
            
            <div style={styles.modalFooterAirbnb}>
               <div>
                  <div style={styles.footerPriceLabel}>Monthly rent</div>
                  <div style={styles.footerPriceValue}>{fmt(getCleanPrice(selectedApt))} VND</div>
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
  container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#f5f5f7', fontFamily: '-apple-system, sans-serif' },
  mapWrapper: { position: 'absolute', inset: 0, zIndex: 1 },
  sidebarWrapper: { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 100, display: 'flex', alignItems: 'center', transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' },
  sidebar: { height: '100vh', background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '40px 24px 20px', flexShrink: 0 },
  rangeContainer: { position: 'relative', height: '30px', marginTop: '10px' },
  dualInput: { position: 'absolute', width: '100%', pointerEvents: 'none', appearance: 'none', height: '0', outline: 'none', accentColor: '#007AFF' },
  title: { margin: '0 0 15px 0', fontWeight: '800', fontSize: '24px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase' },
  chipScroll: { display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px', scrollbarWidth: 'none' },
  chip: { padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  listContainer: { flex: 1, position: 'relative', overflow: 'hidden' },
  list: { height: '100%', overflowY: 'auto', padding: '0 24px 120px' },
  fadeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none', zIndex: 2 },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '15px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' },
  cardImg: { width: '100%', height: '170px', objectFit: 'cover' },
  priceText: { fontSize: '19px', fontWeight: '800' },
  descriptionText: { fontSize: '12px', color: '#86868b' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '550px', borderRadius: '30px', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalScrollContent: { overflowY: 'auto', flex: 1, position: 'relative' },
  carousel: { display: 'flex', overflowX: 'auto', height: '320px', background: '#000', scrollbarWidth: 'none' },
  carouselImg: { flex: '0 0 100%', width: '100%', objectFit: 'cover' },
  modalDesc: { fontSize: '16px', lineHeight: '1.6', color: '#1d1d1f', whiteSpace: 'pre-wrap' },
  link: { color: '#007AFF', fontWeight: '700', textDecoration: 'none' },
  fadeOverlayModal: { position: 'absolute', bottom: '80px', left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))', pointerEvents: 'none' },
  miniMapLabel: { fontSize: '10px', fontWeight: '700', color: '#007AFF', marginBottom: '8px', marginTop: '20px' },
  miniMap: { height: '220px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #eee' },
  modalFooterAirbnb: { padding: '20px 25px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10 },
  footerPriceLabel: { fontSize: '12px', color: '#86868b' },
  footerPriceValue: { fontSize: '18px', fontWeight: '800' },
  closeBtnAirbnb: { padding: '12px 24px', background: '#FF385C', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  pillContainer: { paddingLeft: '12px' },
  macPill: { background: 'rgba(29, 29, 31, 0.95)', border: 'none', borderRadius: '20px', padding: '12px 20px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }
};

const styleSheet = document.styleSheets[0];
styleSheet.insertRule('input[type=range]::-webkit-slider-thumb { pointer-events: all; position: relative; z-index: 10; cursor: pointer; }', 0);