import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// Leaflet Marker Icon Setup
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

const SmartDescription = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\+?\d[\d\s-]{8,12}|@[\w_]{5,}|https?:\/\/t\.me\/[\w_]+|t\.me\/[\w_]+)/g);
  return (
    <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^\+?\d[\d\s-]{8,12}$/.test(part)) {
          const cleanPhone = part.replace(/[^\d+]/g, '');
          return <a key={i} href={`tel:${cleanPhone}`} className="text-[#00a4a6] font-semibold underline">{part}</a>;
        }
        if (/^(@[\w_]{5,}|https?:\/\/t\.me\/|t\.me\/)/.test(part)) {
          const url = part.startsWith('@') ? `https://t.me/${part.replace('@', '')}` : (part.startsWith('t.me') ? `https://${part}` : part);
          return <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[#00a4a6] font-semibold underline">{part}</a>;
        }
        return part;
      })}
    </div>
  );
};

export default function App() {
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50">
      
      {/* NAVBAR */}
      <header className="h-16 bg-[#0b3c37] text-white flex items-center px-6 shrink-0 border-b border-[#002f34] z-10">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl cursor-pointer flex items-center font-bold" onClick={() => setActivePage('search')}>
            <span className="text-[#88d4ce]">Da Nang</span>
            <span className="text-white font-light ml-1.5">Rentals</span>
          </div>
          <nav className="flex gap-2">
            <button 
              onClick={() => setActivePage('search')} 
              className={`px-4 py-4 text-sm font-semibold transition-all ${activePage === 'search' ? 'border-b-4 border-[#00a4a6] text-white' : 'text-slate-300 hover:text-white'}`}
            >
              Search & Map
            </button>
            <button 
              onClick={() => setActivePage('results')} 
              className={`px-4 py-4 text-sm font-semibold transition-all ${activePage === 'results' ? 'border-b-4 border-[#00a4a6] text-white' : 'text-slate-300 hover:text-white'}`}
            >
              Properties ({filteredApts.length})
            </button>
          </nav>
        </div>
      </header>

      {/* PAGE 1: SEARCH & MAP */}
      {activePage === 'search' && (
        <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
          
          {/* Left Panel: Search Hero */}
          <div className="w-[450px] shrink-0 bg-[#0b3c37] p-8 overflow-y-auto text-white shadow-xl z-10">
            <h1 className="text-2xl font-extrabold mb-1">Find your next rental in Da Nang</h1>
            <p className="text-xs text-[#a7f3d0] mb-6">Filter by price, bedrooms, or map zone</p>

            <div className="bg-white text-slate-800 rounded-xl p-5 shadow-lg space-y-5">
              
              {/* Type Filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Property Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'studio', label: 'Studio' },
                    { id: '1br', label: '1 Bed' },
                    { id: '2br', label: '2 Beds' },
                    { id: '3plus', label: '3+ Beds' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPropertyType(t.id)}
                      className={`py-2 px-1 text-xs rounded-lg font-semibold transition-all ${
                        propertyType === t.id 
                          ? 'bg-[#0b3c37] text-white' 
                          : 'bg-[#eaf4f4] text-[#0b3c37] hover:bg-[#d4ebf8]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Rent</label>
                  <span className="text-xs font-bold text-[#00a4a6]">{fmt(currentFilter.min)} - {fmt(currentFilter.max)} VND</span>
                </div>
                
                <div className="relative w-full h-8 flex items-center">
                  <div className="absolute h-1.5 w-full bg-slate-200 rounded" />
                  <div 
                    className="absolute h-1.5 bg-[#00a4a6] rounded" 
                    style={{ left: `${getPercent(currentFilter.min)}%`, right: `${100 - getPercent(currentFilter.max)}%` }} 
                  />
                  <input 
                    type="range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.min} 
                    onChange={(e) => setCurrentFilter(prev => ({ ...prev, min: Math.min(Number(e.target.value), prev.max - 1000000) }))} 
                    className="absolute w-full appearance-none bg-transparent pointer-events-auto cursor-pointer z-20"
                  />
                  <input 
                    type="range" min={priceRange.min} max={priceRange.max} step={500000} value={currentFilter.max} 
                    onChange={(e) => setCurrentFilter(prev => ({ ...prev, max: Math.max(Number(e.target.value), prev.min + 1000000) }))} 
                    className="absolute w-full appearance-none bg-transparent pointer-events-auto cursor-pointer z-20"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {dynamicTags.map(tag => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTags(prev => isActive ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all font-medium ${
                          isActive 
                            ? 'bg-[#00a4a6] text-white border-[#00a4a6]' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Button */}
              <button 
                onClick={() => setActivePage('results')} 
                className="w-full py-3 bg-[#00a4a6] hover:bg-[#008f91] text-white font-bold rounded-lg text-sm shadow transition-all"
              >
                Show {filteredApts.length} Properties →
              </button>

            </div>
          </div>

          {/* Right Panel: Interactive Map */}
          <div className="flex-1 h-full relative">
            <MapContainer center={[16.0544, 108.2422]} zoom={13} zoomControl={false} className="h-full w-full">
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

      {/* PAGE 2: RESULTS GRID + SIDE MAP */}
      {activePage === 'results' && (
        <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
          
          {/* Left Grid */}
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0b3c37]">Properties for Rent in Da Nang</h2>
                <p className="text-xs text-slate-500">{filteredApts.length} properties match your filters</p>
              </div>
              <button 
                onClick={() => setActivePage('search')} 
                className="px-3 py-1.5 bg-[#eaf4f4] text-[#0b3c37] border border-[#99e2d8] rounded-lg text-xs font-semibold hover:bg-[#d4ebf8]"
              >
                ⚙ Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApts.map(apt => (
                <div 
                  key={apt.id} 
                  onClick={() => setSelectedApt(apt)}
                  onMouseEnter={() => setHoveredAptId(apt.id)}
                  onMouseLeave={() => setHoveredAptId(null)}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all border-hover:border-[#00a4a6] flex flex-col"
                >
                  <div className="h-48 bg-slate-900 relative">
                    <img src={apt.image_urls?.[0]} className="w-full h-full object-cover" alt="" />
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                      📷 {apt.image_urls?.length || 0}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-[#0b3c37]">
                        {fmt(getCleanPrice(apt))} VND <span className="text-xs text-slate-500 font-normal">/ mo</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        {apt.rooms ? `${apt.rooms} Bed Apartment` : 'Studio Apartment'}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {apt.description}
                      </p>
                    </div>

                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {apt.description?.toLowerCase().includes('pool') && <span className="bg-[#eaf4f4] text-[#0b3c37] text-[10px] px-2 py-0.5 rounded font-medium">Pool</span>}
                      {apt.description?.toLowerCase().includes('pet') && <span className="bg-[#eaf4f4] text-[#0b3c37] text-[10px] px-2 py-0.5 rounded font-medium">Pet Friendly</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Map */}
          <div className="w-[40%] h-full relative hidden md:block">
            <MapContainer center={[16.0544, 108.2422]} zoom={13} zoomControl={false} className="h-full w-full">
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

      {/* PROPERTY MODAL */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedApt(null)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-lg font-extrabold text-[#0b3c37]">{fmt(getCleanPrice(selectedApt))} VND / month</span>
                <span className="text-xs text-slate-500 block">Da Nang, Vietnam</span>
              </div>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="h-72 bg-slate-900 flex overflow-x-auto snap-x">
                {selectedApt.image_urls?.map((url, i) => (
                  <img key={i} src={url} className="w-full h-full object-cover shrink-0 snap-start" alt="" />
                ))}
              </div>

              <div className="p-6">
                <h3 className="text-base font-bold text-[#0b3c37] mb-3">Description & Contact</h3>
                <SmartDescription text={selectedApt.description} />

                <h3 className="text-base font-bold text-[#0b3c37] mt-6 mb-3">Location Map</h3>
                <div className="h-48 rounded-xl overflow-hidden border border-slate-200">
                  <MapContainer center={[selectedApt.lat, selectedApt.lng]} zoom={15} zoomControl={true} className="h-full w-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedApt.lat, selectedApt.lng]} icon={defaultIcon} />
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}