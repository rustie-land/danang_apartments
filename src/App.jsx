import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const displayPrice = (apt) => {
  let val = parseFloat(apt.numeric_price);
  if (!val) return "Price on request";
  let num = val < 1000 ? val * 1000000 : val;
  return new Intl.NumberFormat('de-DE').format(num);
};

export default function App() {
  const [apartments, setApartments] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Новые фильтры
  const [priceRange, setPriceRange] = useState(null); // {min, max}
  const [propertyType, setPropertyType] = useState('all'); 
  
  const [selectedApt, setSelectedApt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    async function fetchData() {
      const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
      if (data) setApartments(data);
    }
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ЛОГИКА ФИЛЬТРАЦИИ
  const filteredApts = useMemo(() => {
    return apartments.filter(a => {
      const desc = (a.description || "").toLowerCase();
      
      // 1. Поиск по строке
      const matchesSearch = tagSearch === '' || desc.includes(tagSearch.toLowerCase());
      
      // 2. Поиск по типу жилья (Расширенный)
      let matchesType = true;
      if (propertyType === 'studio') matchesType = a.rooms === 0 || desc.includes('studio');
      else if (propertyType === '1br') matchesType = a.rooms === 1;
      else if (propertyType === '2br') matchesType = a.rooms === 2;
      else if (propertyType === '3plus') {
        matchesType = a.rooms >= 3 || desc.includes('3 bedroom') || desc.includes('house') || desc.includes('villa') || desc.includes('townhouse');
      }

      // 3. Поиск по диапазону цен
      let matchesPrice = true;
      if (priceRange) {
        const val = a.numeric_price < 1000 ? a.numeric_price * 1000000 : a.numeric_price;
        matchesPrice = val >= priceRange.min && val <= priceRange.max;
      }

      return matchesSearch && matchesType && matchesPrice;
    });
  }, [apartments, tagSearch, propertyType, priceRange]);

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
            
            {/* ТИП ЖИЛЬЯ */}
            <div style={styles.sectionLabel}>Property Type</div>
            <div style={styles.chipScroll}>
              {[
                {id: 'all', label: 'All'},
                {id: 'studio', label: 'Studio'},
                {id: '1br', label: '1 BR'},
                {id: '2br', label: '2 BR'},
                {id: '3plus', label: '3BR+ / House'}
              ].map(t => (
                <button key={t.id} onClick={() => setPropertyType(t.id)} 
                  style={{ ...styles.chip, backgroundColor: propertyType === t.id ? '#007AFF' : '#f5f5f7', color: propertyType === t.id ? '#fff' : '#1d1d1f' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ДИАПАЗОНЫ ЦЕН */}
            <div style={styles.sectionLabel}>Price Range (VND)</div>
            <div style={styles.chipScroll}>
              {[
                {label: 'Any', min: 0, max: Infinity},
                {label: '8-12M', min: 8000000, max: 12000000},
                {label: '13-17M', min: 13000000, max: 17000000},
                {label: '18-22M', min: 18000000, max: 22000000},
                {label: '25M+', min: 25000000, max: 999000000}
              ].map(r => (
                <button key={r.label} onClick={() => setPriceRange(r.max === Infinity ? null : r)} 
                  style={{ ...styles.chip, backgroundColor: (priceRange?.label === r.label || (!priceRange && r.label === 'Any')) ? '#007AFF' : '#f5f5f7', color: (priceRange?.label === r.label || (!priceRange && r.label === 'Any')) ? '#fff' : '#1d1d1f' }}>
                  {r.label}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Search keywords (pool, sea...)" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} style={styles.tagInput} />
          </div>

          <div style={styles.list}>
            {filteredApts.map(apt => (
              <div key={apt.id} onClick={() => setSelectedApt(apt)} style={styles.card}>
                <img src={apt.image_urls?.[0]} style={styles.cardImg} alt="apt" />
                <div style={{ padding: '18px' }}>
                  <div style={styles.priceText}>{displayPrice(apt)} VND</div>
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
                <h2 style={styles.modalPrice}>{displayPrice(selectedApt)} VND</h2>
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
  macPill: { background: 'rgba(29, 29, 31, 0.9)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '10px 18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  pillIcon: { fontSize: '14px', fontWeight: 'bold' },
  pillText: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  sidebarHeader: { padding: '40px 24px 15px' },
  title: { margin: '0 0 25px 0', fontWeight: '700', fontSize: '26px', color: '#1d1d1f' },
  sectionLabel: { fontSize: '11px', fontWeight: '800', color: '#86868b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' },
  chipScroll: { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px', scrollbarWidth: 'none' },
  chip: { padding: '8px 16px', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.2s' },
  tagInput: { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#f5f5f7', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  list: { padding: '0 24px 100px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f5f5f7' },
  cardImg: { width: '100%', height: '200px', objectFit: 'cover' },
  priceText: { fontSize: '20px', fontWeight: '700', color: '#1d1d1f' },
  descriptionText: { fontSize: '13px', color: '#86868b', marginTop: '4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px' },
  modal: { background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '30px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalScrollContent: { overflowY: 'auto', flex: 1 },
  modalImg: { width: '100%', height: '280px', objectFit: 'cover' },
  modalPrice: { fontSize: '26px', fontWeight: '700', marginBottom: '15px' },
  modalDesc: { fontSize: '15px', color: '#1d1d1f', lineHeight: '1.6', paddingRight: '10px' },
  miniMapContainer: { marginTop: '30px' },
  miniMapWrapper: { height: '200px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f5f5f7' },
  modalFooter: { padding: '15px 25px 25px' },
  appleCloseBtn: { width: '100%', padding: '16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '600', fontSize: '16px' }
};