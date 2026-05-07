import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// --- ЖЕЛЕЗОБЕТОННЫЙ ПАРСЕР ЦЕН ---
const getAptPrice = (apt) => {
  const desc = apt.description || "";
  // Ищем в тексте шаблоны: 15.000.000, 15,000,000 или просто 15000000
  const priceRegex = /(?:price|💰|vnd)\s*[:*-]*\s*([\d\s.,]{5,15})/i;
  const match = desc.match(priceRegex);

  let finalValue = 0;

  if (match) {
    // Оставляем только цифры
    finalValue = parseInt(match[1].replace(/[^\d]/g, ''), 10);
  } else {
    // Если в тексте нет, берем numeric_price
    let num = parseFloat(apt.numeric_price);
    if (!num) return "Price on request";
    finalValue = num < 1000 ? num * 1000000 : num;
  }

  return new Intl.NumberFormat('de-DE').format(finalValue) + ' VND';
};

const PRESET_TAGS = [
  { id: 'pool', label: '🏊‍♂️ Pool' },
  { id: 'gym', label: '💪 Gym' },
  { id: 'pet', label: '🐾 Pet' },
  { id: 'sea', label: '🌊 Sea View' },
  { id: 'beach', label: '🏖 Beach' },
  { id: 'balcony', label: '🖼 Balcony' }
];

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceRange, setPriceRange] = useState(null);
  const [propertyType, setPropertyType] = useState('all');
  const [selectedApt, setSelectedApt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    async function fetchData() {
      const { data, error } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (error) console.error("Supabase Error:", error);
      if (data) setApartments(data);
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const desc = (a.description || "").toLowerCase();
      const matchesSearch = tagSearch === '' || desc.includes(tagSearch.toLowerCase());
      const matchesTags = selectedTags.every(tagId => desc.includes(tagId));
      
      let matchesType = true;
      if (propertyType === 'studio') matchesType = a.rooms === 0 || desc.includes('studio');
      else if (propertyType === '1br') matchesType = a.rooms === 1;
      else if (propertyType === '2br') matchesType = a.rooms === 2;
      else if (propertyType === '3plus') matchesType = a.rooms >= 3 || /house|villa|3 bedroom/i.test(desc);

      let matchesPrice = true;
      if (priceRange) {
        const val = a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price;
        matchesPrice = val >= priceRange.min && val <= priceRange.max;
      }
      return matchesSearch && matchesTags && matchesType && matchesPrice;
    });
  }, [apartments, tagSearch, selectedTags, propertyType, priceRange]);

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
            <div style={styles.sectionLabel}>Price & Type</div>
            <div style={styles.chipScroll}>
              {[{id:'all', label:'All'}, {id:'studio', label:'Studio'}, {id:'1br', label:'1BR'}, {id:'2br', label:'2BR'}, {id:'3plus', label:'3BR+/House'}].map(t => (
                <button key={t.id} onClick={() => setPropertyType(t.id)} style={{ ...styles.chip, backgroundColor: propertyType === t.id ? '#1d1d1f' : '#f5f5f7', color: propertyType === t.id ? '#fff' : '#1d1d1f' }}>{t.label}</button>
              ))}
            </div>
            <div style={styles.tagGrid}>
              {PRESET_TAGS.map(tag => (
                <button key={tag.id} onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
                  style={{ ...styles.tagBtn, backgroundColor: selectedTags.includes(tag.id) ? '#007AFF' : '#fff', color: selectedTags.includes(tag.id) ? '#fff' : '#1d1d1f', borderColor: '#e2e2e7' }}>{tag.label}</button>
              ))}
            </div>
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '18px' }}>
                  <div style={styles.priceText}>{getAptPrice(apt)}</div>
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

      {/* MODAL WITH CAROUSEL */}
      {selectedApt && (
        <div style={styles.overlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalScrollContent}>
              {/* КАРУСЕЛЬ ФОТОГРАФИЙ */}
              <div style={styles.carouselContainer}>
                {selectedApt.image_urls?.map((url, i) => (
                  <img key={i} src={url} style={styles.carouselImg} alt={`view-${i}`} />
                ))}
              </div>
              
              <div style={{ padding: '25px' }}>
                <h2 style={styles.modalPrice}>{getAptPrice(selectedApt)}</h2>
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
  
  // КАРУСЕЛЬ
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', height: '300px', background: '#eee', scrollbarWidth: 'none' },
  carouselImg: { flex: '0 0 100%', width: '100%', height: '300px', objectFit: 'cover', scrollSnapAlign: 'start' },

  pillContainer: { paddingLeft: '12px' },
  macPill: { background: 'rgba(29, 29, 31, 0.9)', border: 'none', borderRadius: '20px', padding: '10px 18px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '11px' },
  sidebarHeader: { padding: '40px 24px 10px' },
  title: { margin: '0 0 20px 0', fontWeight: '700', fontSize: '24px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase', marginBottom: '8px' },
  chipScroll: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '15px' },
  chip: { padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '600' },
  tagGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  tagBtn: { padding: '10px', borderRadius: '12px', border: '1px solid', fontSize: '11px', fontWeight: '600', textAlign: 'left' },
  list: { padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardImg: { width: '100%', height: '180px', objectFit: 'cover' },
  priceText: { fontSize: '20px', fontWeight: '700' },
  descriptionText: { fontSize: '12px', color: '#86868b' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  modal: { background: '#fff', width: '92%', maxWidth: '450px', borderRadius: '25px', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  modalPrice: { fontSize: '24px', fontWeight: '700' },
  modalDesc: { fontSize: '15px', lineHeight: '1.6', color: '#1d1d1f', whiteSpace: 'pre-wrap' },
  miniMapWrapper: { height: '180px', borderRadius: '20px', overflow: 'hidden', marginTop: '20px' },
  modalFooter: { padding: '15px 25px 25px' },
  appleCloseBtn: { width: '100%', padding: '16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '600' }
};