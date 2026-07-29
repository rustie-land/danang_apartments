import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// --- RIGHTMOVE COLOR PALETTE & STYLES ---
const INLINE_STYLING = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

  /* Range Slider */
  .range-slider-container { position: relative; width: 100%; height: 36px; display: flex; align-items: center; }
  .slider-track { position: absolute; height: 6px; width: 100%; background: #E2E8F0; border-radius: 3px; z-index: 1; }
  .slider-progress { position: absolute; height: 6px; background: #00A4A6; border-radius: 3px; z-index: 2; }
  input[type=range].dual-range { position: absolute; width: 100%; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; z-index: 3; margin: 0; }
  input[type=range].dual-range::-webkit-slider-thumb { pointer-events: all; width: 22px; height: 22px; border-radius: 50%; background: #0B3C37; border: 2px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.2); -webkit-appearance: none; cursor: pointer; transition: transform 0.1s; }
  input[type=range].dual-range::-webkit-slider-thumb:hover { transform: scale(1.1); }

  /* Carousel Customisation */
  .carousel-wrapper { position: relative; width: 100%; height: 220px; overflow: hidden; border-top-left-radius: 12px; border-top-right-radius: 12px; }
  .carousel-container { display: flex; overflow-x: auto; height: 100%; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .carousel-container::-webkit-scrollbar { display: none; }
  .carousel-img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }

  /* Card Animations */
  .rm-card { transition: all 0.25s ease; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF; cursor: pointer; overflow: hidden; }
  .rm-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(11, 60, 55, 0.12); border-color: #00A4A6; }

  /* Scrollbars */
  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: #F1F5F9; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
`;

// Leaflet Marker Setup
const createIcon = (color, isBig = false) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: isBig ? [32, 50] : [25, 41],
  iconAnchor: isBig ? [16, 50] : [12, 41]
});

const defaultIcon = createIcon('green');
const highlightIcon = createIcon('orange', true);

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

// Smart Description Helper
const SmartDescription = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\+?\d[\d\s-]{8,12}|@[\w_]{5,}|https?:\/\/t\.me\/[\w_]+|t\.me\/[\w_]+)/g);
  return (
    <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#1E293B', whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => {
        if (/^\+?\d[\d\s-]{8,12}$/.test(part)) {
          const cleanPhone = part.replace(/[^\d+]/g, '');
          return <a key={i} href={`tel:${cleanPhone}`} style={{ color: '#00A4A6', fontWeight: '600', textDecoration: 'underline' }}>{part}</a>;
        }
        if (/^(@[\w_]{5,}|https?:\/\/t\.me\/|t\.me\/)/.test(part)) {
          const url = part.startsWith('@') ? `https://t.me/${part.replace('@', '')}` : (part.startsWith('t.me') ? `https://${part}` : part);
          return <a key={i} href={url} target="_blank" rel="noreferrer" style={{ color: '#00A4A6', fontWeight: '600', textDecoration: 'underline' }}>{part}</a>;
        }
        return part;
      })}
    </div>
  );
};

export default function App() {
  // Page Navigation State: 'search' | 'results'
  const [activePage, setActivePage] = useState('search');

  const [apartments, setApartments] = useState([]);
  const [dynamicTags, setDynamicTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 3000000, max: 50000000 });
  const [currentFilter, setCurrentFilter] = useState({ min: 3000000, max: 50000000 });
  const [selectedApt, setSelectedApt] = useState(null);
  const [hoveredAptId, setHoveredAptId] = useState(null);

  useEffect(() => {
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
        const commonWords = ['pool', 'gym', 'pet', 'sea', 'beach', 'balcony', 'kitchen'];
        const counts = {};
        validApts.forEach(apt => {
          const d = (apt.description || "").toLowerCase();
          commonWords.forEach(word => { if (d.includes(word)) counts[word] = (counts[word] || 0) + 1; });
        });
        setDynamicTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([w]) => w));
      }
    }
    fetchData();
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

  const getPercent = (value) => {
    if (priceRange.max === priceRange.min) return 0;
    return ((value - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
  };

  return (
    <div style={styles.appWrapper}>
      <style>{INLINE_STYLING}</style>

      {/* --- RIGHTMOVE HEADER NAVBAR --- */}
      <header style={styles.navbar}>
        <div style={styles.navContainer}>
          <div style={styles.logo} onClick={() => setActivePage('search')}>
            <span style={{ color: '#88D4CE', fontWeight: '800' }}>Da Nang</span>
            <span style={{ color: '#FFFFFF', fontWeight: '300', marginLeft: '6px' }}>Rentals</span>
          </div>
          <nav style={styles.navLinks}>
            <button 
              onClick={() => setActivePage('search')} 
              style={{ ...styles.navBtn, borderBottom: activePage === 'search' ? '3px solid #00A4A6' : 'none' }}
            >
              Search & Map
            </button>
            <button 
              onClick={() => setActivePage('results')} 
              style={{ ...styles.navBtn, borderBottom: activePage === 'results' ? '3px solid #00A4A6' : 'none' }}
            >
              Property List ({filteredApts.length})
            </button>
          </nav>
        </div>
      </header>

      {/* =========================================================================
          PAGE 1: SEARCH & MAP SELECTION
         ========================================================================= */}
      {activePage === 'search' && (
        <div style={styles.searchPageLayout}>
          {/* Hero / Filter Box Panel */}
          <div style={styles.searchHeroPanel}>
            <div style={styles.heroContent}>
              <h1 style={styles.heroTitle}>Find your next rental in Da Nang</h1>
              <p style={styles.heroSub}>Explore apartments, studios, and villas across all districts</p>

              {/* Main Filter Card */}
              <div style={styles.filterBoxCard}>
                
                {/* Bedrooms Selection */}
                <div style={styles.filterSection}>
                  <label style={styles.filterLabel}>Property Type / Bedrooms</label>
                  <div style={styles.chipGrid}>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'studio', label: 'Studio' },
                      { id: '1br', label: '1 Bed' },
                      { id: '2br', label: '2 Beds' },
                      { id: '3plus', label: '3+ Beds / Villa' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPropertyType(t.id)}
                        style={{
                          ...styles.chipBtn,
                          backgroundColor: propertyType === t.id ? '#0B3C37' : '#EAF4F4',
                          color: propertyType === t.id ? '#FFFFFF' : '#0B3C37',
                          fontWeight: propertyType === t.id ? '700' : '500'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Slider */}
                <div style={styles.filterSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={styles.filterLabel}>Monthly Rent Range</label>
                    <span style={styles.priceReadout}>{fmt(currentFilter.min)} - {fmt(currentFilter.max)} VND</span>
                  </div>
                  <div className="range-slider-container">
                    <div className="slider-track" />
                    <div className="slider-progress" style={{ left: `${getPercent(currentFilter.min)}%`, right: `${100 - getPercent(currentFilter.max)}%` }} />
                    <input 
                      type="range" 
                      className="dual-range" 
                      min={priceRange.min} 
                      max={priceRange.max} 
                      step={500000} 
                      value={currentFilter.min} 
                      onChange={(e) => setCurrentFilter(prev => ({ ...prev, min: Math.min(Number(e.target.value), prev.max - 1000000) }))} 
                    />
                    <input 
                      type="range" 
                      className="dual-range" 
                      min={priceRange.min} 
                      max={priceRange.max} 
                      step={500000} 
                      value={currentFilter.max} 
                      onChange={(e) => setCurrentFilter(prev => ({ ...prev, max: Math.max(Number(e.target.value), prev.min + 1000000) }))} 
                    />
                  </div>
                </div>

                {/* Amenities / Hashtags */}
                <div style={styles.filterSection}>
                  <label style={styles.filterLabel}>Features & Amenities</label>
                  <div style={styles.tagsContainer}>
                    {dynamicTags.map(tag => {
                      const isActive = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedTags(prev => isActive ? prev.filter(t => t !== tag) : [...prev, tag])}
                          style={{
                            ...styles.tagChip,
                            backgroundColor: isActive ? '#00A4A6' : '#F1F5F9',
                            color: isActive ? '#FFFFFF' : '#334155',
                            borderColor: isActive ? '#00A4A6' : '#CBD5E1'
                          }}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action Button */}
                <button 
                  onClick={() => setActivePage('results')} 
                  style={styles.primarySearchBtn}
                >
                  Search Properties ({filteredApts.length} Available) →
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Area Map Panel */}
          <div style={styles.searchMapPanel}>
            <div style={styles.mapHeaderOverlay}>
              <span>📍 Select areas or click pins to inspect properties</span>
            </div>
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
        </div>
      )}

      {/* =========================================================================
          PAGE 2: RESULTS PAGE (CARDS GRID + SIDE MAP)
         ========================================================================= */}
      {activePage === 'results' && (
        <div style={styles.resultsPageLayout}>
          {/* Left Column: Properties Grid */}
          <div style={styles.resultsListColumn} className="custom-scroll">
            <div style={styles.resultsBar}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0B3C37', margin: 0 }}>
                  Properties for Rent in Da Nang
                </h2>
                <span style={{ fontSize: '14px', color: '#64748B' }}>
                  Showing {filteredApts.length} results matching your criteria
                </span>
              </div>
              <button onClick={() => setActivePage('search')} style={styles.editSearchBtn}>
                ⚙ Edit Filters
              </button>
            </div>

            {filteredApts.length === 0 ? (
              <div style={styles.emptyState}>
                <h3>No properties found</h3>
                <p>Try expanding your price range or clearing some amenity tags.</p>
                <button onClick={() => { setSelectedTags([]); setCurrentFilter(priceRange); setPropertyType('all'); }} style={styles.resetBtn}>Reset Filters</button>
              </div>
            ) : (
              <div style={styles.cardsGrid}>
                {filteredApts.map(apt => (
                  <div 
                    key={apt.id} 
                    className="rm-card" 
                    onClick={() => setSelectedApt(apt)}
                    onMouseEnter={() => setHoveredAptId(apt.id)}
                    onMouseLeave={() => setHoveredAptId(null)}
                  >
                    {/* Photo Carousel Header */}
                    <div className="carousel-wrapper">
                      <div className="carousel-container">
                        {apt.image_urls && apt.image_urls.length > 0 ? (
                          apt.image_urls.map((url, idx) => (
                            <img key={idx} src={url} className="carousel-img" alt={`Apartment photo ${idx + 1}`} />
                          ))
                        ) : (
                          <div style={styles.noImgPlaceholder}>No Photos</div>
                        )}
                      </div>
                      <div style={styles.photoBadge}>📷 {apt.image_urls?.length || 0}</div>
                    </div>

                    {/* Card Content Body */}
                    <div style={{ padding: '16px' }}>
                      <div style={styles.cardPriceRow}>
                        <span style={styles.cardPrice}>{fmt(getCleanPrice(apt))} VND</span>
                        <span style={styles.monthTag}>/ month</span>
                      </div>
                      
                      <div style={styles.cardTitle}>
                        {apt.rooms ? `${apt.rooms} Bedroom Apartment` : 'Studio / Apartment'}
                      </div>

                      <div style={styles.cardSnippet}>
                        {apt.description ? apt.description.substring(0, 90) + '...' : 'No description provided.'}
                      </div>

                      {/* Rightmove-styled Feature Tags */}
                      <div style={styles.cardBadgeRow}>
                        {apt.description?.toLowerCase().includes('pool') && <span style={styles.featureBadge}>🏊 Pool</span>}
                        {apt.description?.toLowerCase().includes('pet') && <span style={styles.featureBadge}>🐾 Pet Friendly</span>}
                        {apt.description?.toLowerCase().includes('sea') && <span style={styles.featureBadge}>🌊 Sea View</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Interactive Map */}
          <div style={styles.resultsMapColumn}>
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
        </div>
      )}

      {/* =========================================================================
          FULL PROPERTY PROFILE MODAL (WHEN A CARD IS CLICKED)
         ========================================================================= */}
      {selectedApt && (
        <div style={styles.modalOverlay} onClick={() => setSelectedApt(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalPrice}>{fmt(getCleanPrice(selectedApt))} VND / month</span>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748B' }}>Da Nang, Vietnam</span>
              </div>
              <button onClick={() => setSelectedApt(null)} style={styles.closeBtn}>✕</button>
            </div>

            {/* Scrollable Modal Body */}
            <div style={styles.modalScrollBody} className="custom-scroll">
              {/* Photo Gallery Carousel */}
              <div className="carousel-container" style={{ height: '320px', background: '#0F172A' }}>
                {selectedApt.image_urls?.map((url, i) => (
                  <img key={i} src={url} className="carousel-img" alt="" />
                ))}
              </div>

              {/* Full Description & Contact Info */}
              <div style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#0B3C37', fontSize: '18px' }}>Property Description</h3>
                <SmartDescription text={selectedApt.description} />

                {/* Embedded Mini Map */}
                <h3 style={{ margin: '24px 0 12px 0', color: '#0B3C37', fontSize: '18px' }}>Location Map</h3>
                <div style={styles.modalMapBox}>
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={true} style={{ height: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <button onClick={() => setSelectedApt(null)} style={styles.secondaryBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CSS-IN-JS STYLES (RIGHTMOVE TEAL / PALAE BLUE ACCENTS) ---
const styles = {
  appWrapper: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F8FAFC' },
  
  // Navbar
  navbar: { height: '64px', backgroundColor: '#0B3C37', color: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0, borderBottom: '1px solid #002F34' },
  navContainer: { width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  navLinks: { display: 'flex', gap: '8px' },
  navBtn: { background: 'none', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '18px 16px', cursor: 'pointer' },

  // Page 1 Layout
  searchPageLayout: { display: 'flex', flex: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' },
  searchHeroPanel: { flex: '0 0 520px', backgroundColor: '#0B3C37', padding: '40px 32px', overflowY: 'auto', color: '#FFFFFF' },
  heroContent: { maxWidth: '460px', margin: '0 auto' },
  heroTitle: { fontSize: '30px', fontWeight: '800', lineHeight: '1.2', margin: '0 0 8px 0', color: '#FFFFFF' },
  heroSub: { fontSize: '15px', color: '#A7F3D0', margin: '0 0 28px 0' },
  filterBoxCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', color: '#0F172A', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  filterSection: { marginBottom: '20px' },
  filterLabel: { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', tracking: '0.05em' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
  chipBtn: { flex: '1 1 auto', padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' },
  priceReadout: { fontSize: '13px', fontWeight: '700', color: '#00A4A6' },
  tagsContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
  tagChip: { padding: '5px 10px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  primarySearchBtn: { width: '100%', padding: '14px', backgroundColor: '#00A4A6', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s' },
  
  searchMapPanel: { flex: 1, position: 'relative' },
  mapHeaderOverlay: { position: 'absolute', top: '16px', left: '16px', zIndex: 1000, backgroundColor: 'rgba(11, 60, 55, 0.9)', color: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(4px)' },

  // Page 2 Layout
  resultsPageLayout: { display: 'flex', flex: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' },
  resultsListColumn: { flex: '1 1 60%', height: '100%', overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' },
  resultsMapColumn: { flex: '1 1 40%', height: '100%', position: 'relative' },
  resultsBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  editSearchBtn: { padding: '8px 16px', backgroundColor: '#EAF4F4', color: '#0B3C37', border: '1px solid #99E2D8', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  
  // Card
  photoBadge: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' },
  noImgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' },
  cardPriceRow: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  cardPrice: { fontSize: '18px', fontWeight: '800', color: '#0B3C37' },
  monthTag: { fontSize: '12px', color: '#64748B' },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '4px' },
  cardSnippet: { fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: '1.4' },
  cardBadgeRow: { display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' },
  featureBadge: { backgroundColor: '#EAF4F4', color: '#0B3C37', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px' },

  // Empty State
  emptyState: { padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1' },
  resetBtn: { marginTop: '12px', padding: '10px 20px', backgroundColor: '#00A4A6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },

  // Modal Profile
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(11, 60, 55, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalContent: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: '700px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' },
  modalPrice: { fontSize: '20px', fontWeight: '800', color: '#0B3C37' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' },
  modalScrollBody: { flex: 1, overflowY: 'auto' },
  modalMapBox: { height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' },
  modalFooter: { padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' },
  secondaryBtn: { padding: '10px 24px', backgroundColor: '#E2E8F0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }
};