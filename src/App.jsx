import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const DANANG_BOUNDS = [[15.90, 107.90], [16.25, 108.55]];
const fmt = (val) => new Intl.NumberFormat('de-DE').format(val);

const getCleanPrice = (apt) => {
  const desc = apt.description || "";
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
  const [maxPriceFilter, setMaxPriceFilter] = useState(30000000);
  const [priceBounds, setPriceBounds] = useState({ min: 5000000, max: 40000000 });
  const [selectedApt, setSelectedApt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          // Убираем те, где цена не определена
          const validApts = data.filter(apt => getCleanPrice(apt) > 0);
          setApartments(validApts);

          const prices = validApts.map(getCleanPrice);
          if (prices.length > 0) {
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            setPriceBounds({ min: minP, max: maxP });
            setMaxPriceFilter(maxP); // Ставим ползунок на максимум при загрузке
          }

          const commonWords = ['pool', 'gym', 'pet', 'sea', 'beach', 'balcony', 'kitchen', 'studio', 'modern'];
          const counts = {};
          validApts.forEach(apt => {
            const d = (apt.description || "").toLowerCase();
            commonWords.forEach(word => { if (d.includes(word)) counts[word] = (counts[word] || 0) + 1; });
          });
          setDynamicTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w));
        }
      } catch (err) { console.error("Error:", err.message); }
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const price = getCleanPrice(a);
      const desc = (a.description || "").toLowerCase();
      
      const matchesTags = selectedTags.every(tag => desc.includes(tag));
      const matchesPrice = price >= priceBounds.min && price <= maxPriceFilter;
      
      let matchesType = true;
      if (propertyType === 'studio') matchesType = a.rooms === 0 || desc.includes('studio');
      else if (propertyType === '1br') matchesType = a.rooms === 1;
      else if (propertyType === '2br') matchesType = a.rooms === 2;
      else if (propertyType === '3plus') matchesType = a.rooms >= 3 || /house|villa|3 bedroom/i.test(desc);
      
      return matchesTags && matchesPrice && matchesType;
    });
  }, [apartments, selectedTags, maxPriceFilter, propertyType, priceBounds.min]);

  const sidebarWidth = isMobile ? window.innerWidth * 0.88 : 400;

  return (
    <div style={styles.container}>
      <div style={styles.mapWrapper}>
        <MapContainer center={[16.0544, 108.2422]} zoom={13} minZoom={11} maxBounds={DANANG_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
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
            <div style={styles.sectionLabel}>Budget: {fmt(priceBounds.min)} - {fmt(maxPriceFilter)} VND</div>
            <div style={styles.sliderBox}>
              <span style={styles.priceLimit}>{fmt(priceBounds.min / 1000000)}M</span>
              <input type="range" min={priceBounds.min} max={priceBounds.max} step={500000} value={maxPriceFilter} onChange={(e) => setMaxPriceFilter(parseInt(e.target.value))} style={styles.slider} />
              <span style={styles.priceLimit}>{fmt(priceBounds.max / 1000000)}M</span>
            </div>
            
            <div style={{...styles.sectionLabel, marginTop: '20px'}}>Type</div>
            <div style={styles.chipScroll}>
              {['all', 'studio', '1br', '2br', '3plus'].map(t => (
                <button key={t} onClick={() => setPropertyType(t)} style={{ ...styles.chip, backgroundColor: propertyType === t ? '#1d1d1f' : '#f5f5f7', color: propertyType === t ? '#fff' : '#1d1d1f' }}>{t.toUpperCase()}</button>
              ))}
            </div>

            <div style={styles.tagGrid}>
              {dynamicTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  style={{ ...styles.tagBtn, backgroundColor: selectedTags.includes(tag) ? '#007AFF' : '#fff', color: selectedTags.includes(tag) ? '#fff' : '#1d1d1f' }}>{tag}</button>
              ))}
            </div>
          </div>

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
              <div style={{ padding: '25px' }}>
                <h2 style={styles.modalPrice}>{fmt(getCleanPrice(selectedApt))} VND</h2>
                <SmartDescription text={selectedApt.description} />
                <div style={styles.miniMap}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={false} dragging={false} style={{ height: '100%', borderRadius: '15px' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
               <button onClick={() => setSelectedApt(null)} style={styles.closeBtn}>Done</button>
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
  sidebar: { height: '100vh', background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(20px)', overflowY: 'auto', borderRight: '1px solid rgba(0,0,0,0.05)' },
  sliderBox: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' },
  priceLimit: { fontSize: '11px', fontWeight: '800', color: '#86868b' },
  slider: { flex: 1, accentColor: '#007AFF', cursor: 'pointer' },
  sidebarHeader: { padding: '40px 24px 10px' },
  title: { margin: '0 0 15px 0', fontWeight: '800', fontSize: '24px', letterSpacing: '-0.5px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px' },
  chipScroll: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '15px', scrollbarWidth: 'none' },
  chip: { padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: '700' },
  tagGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  tagBtn: { padding: '10px', borderRadius: '10px', border: '1px solid #e2e2e7', fontSize: '11px', fontWeight: '600', textAlign: 'left' },
  list: { padding: '10px 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '15px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' },
  cardImg: { width: '100%', height: '170px', objectFit: 'cover' },
  priceText: { fontSize: '19px', fontWeight: '800' },
  descriptionText: { fontSize: '12px', color: '#86868b' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '500px', borderRadius: '30px', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  carousel: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', height: '320px', scrollbarWidth: 'none', background: '#000' },
  carouselImg: { flex: '0 0 100%', width: '100%', objectFit: 'cover', scrollSnapAlign: 'start' },
  modalPrice: { fontSize: '26px', fontWeight: '800', marginBottom: '12px' },
  modalDesc: { fontSize: '15px', lineHeight: '1.6', color: '#1d1d1f', whiteSpace: 'pre-wrap' },
  link: { color: '#007AFF', fontWeight: '700', textDecoration: 'none' },
  miniMap: { height: '200px', marginTop: '25px', borderRadius: '20px', overflow: 'hidden' },
  modalFooter: { padding: '20px 25px 25px' },
  closeBtn: { width: '100%', padding: '16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer' },
  pillContainer: { paddingLeft: '12px' },
  macPill: { background: 'rgba(29, 29, 31, 0.95)', border: 'none', borderRadius: '20px', padding: '12px 20px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }
};