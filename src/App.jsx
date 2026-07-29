import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, ZoomControl, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// --- LEAFLET ICONS ---
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const defaultIcon = createIcon('green');

const fmt = (val) => new Intl.NumberFormat('de-DE').format(val);

const getCleanPrice = (apt) => {
  const desc = (apt.description || "").toLowerCase();
  const millionMatch = desc.match(/(\d+(?:[.,]\d+)?)\s*(?:million|mln|млн)/i);
  if (millionMatch) return parseFloat(millionMatch[1].replace(',', '.')) * 1000000;
  
  const match = desc.match(/(?:price|💰|vnd)\s*[:*-]*\s*([\d\s.,]{5,15})/i);
  if (match) return parseInt(match[1].replace(/[^\d]/g, ''), 10);
  
  let num = parseFloat(apt.numeric_price);
  if (!num) return 0;
  return num < 1000 ? num * 1000000 : num;
};

// --- POINT IN POLYGON CHECK (NO EXTERNAL DEPS) ---
function isPointInPolygon(point, polygon) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// --- MAP RESIZER FIX ---
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// --- FREEHAND DRAWING COMPONENT ---
function FreehandDrawLayer({ isDrawing, onPolygonComplete }) {
  const map = useMapEvents({
    mousedown(e) {
      if (!isDrawing) return;
      map.dragging.disable();
      const points = [[e.latlng.lat, e.latlng.lng]];

      const onMouseMove = (moveEvent) => {
        points.push([moveEvent.latlng.lat, moveEvent.latlng.lng]);
      };

      const onMouseUp = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
        if (points.length > 3) {
          onPolygonComplete(points);
        }
      };

      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);
    }
  });

  return null;
}

export default function App() {
  const [step, setStep] = useState('step1_filters');
  const [apartments, setApartments] = useState([]);
  
  // Filters
  const [propertyType, setPropertyType] = useState('all');
  const [currentFilter, setCurrentFilter] = useState({ min: 3000000, max: 50000000 });
  const [selectedTags, setSelectedTags] = useState([]);
  const [dynamicTags, setDynamicTags] = useState([]);

  // Drawing
  const [drawnPolygon, setDrawnPolygon] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [selectedApt, setSelectedApt] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false });
        if (data) {
          const validApts = data.filter(apt => getCleanPrice(apt) > 0);
          setApartments(validApts);
          const prices = validApts.map(getCleanPrice);
          if (prices.length) {
            setCurrentFilter({ min: Math.min(...prices), max: Math.max(...prices) });
          }
          const commonWords = ['pool', 'gym', 'pet', 'sea', 'beach', 'balcony', 'kitchen'];
          const counts = {};
          validApts.forEach(apt => {
            const d = (apt.description || "").toLowerCase();
            commonWords.forEach(word => { if (d.includes(word)) counts[word] = (counts[word] || 0) + 1; });
          });
          setDynamicTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([w]) => w));
        }
      } catch (err) {
        console.error(err);
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

      if (!matchesTags || !matchesPrice || !matchesType) return false;

      if (drawnPolygon.length > 2) {
        return isPointInPolygon([a.lat, a.lng], drawnPolygon);
      }
      return true;
    });
  }, [apartments, selectedTags, currentFilter, propertyType, drawnPolygon]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      
      {/* NAVBAR */}
      <header className="h-16 bg-[#0b3c37] text-white flex items-center px-6 shrink-0 z-30 justify-between shadow-md">
        <div className="text-xl font-bold cursor-pointer flex items-center" onClick={() => setStep('step1_filters')}>
          <span className="text-[#88d4ce]">rightmove</span>
          <span className="text-white font-light ml-1.5">Da Nang</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setStep('step1_filters')} className={`px-3 py-1.5 rounded-full font-bold ${step === 'step1_filters' ? 'bg-[#00a4a6] text-white' : 'text-slate-300'}`}>
            1. Search Preferences
          </button>
          <span>→</span>
          <button onClick={() => setStep('step2_draw')} className={`px-3 py-1.5 rounded-full font-bold ${step === 'step2_draw' ? 'bg-[#00a4a6] text-white' : 'text-slate-300'}`}>
            2. Draw Area
          </button>
          <span>→</span>
          <button onClick={() => setStep('step3_results')} className={`px-3 py-1.5 rounded-full font-bold ${step === 'step3_results' ? 'bg-[#00a4a6] text-white' : 'text-slate-300'}`}>
            3. Properties ({filteredApts.length})
          </button>
        </div>
      </header>

      {/* STEP 1: INITIAL FILTERS */}
      {step === 'step1_filters' && (
        <div className="flex-1 flex items-center justify-center bg-slate-100 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8 border border-slate-200">
            <h1 className="text-2xl font-extrabold text-[#0b3c37] mb-1">Search Options</h1>
            <p className="text-xs text-slate-500 mb-6">Set your target price and bedroom preferences</p>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Bedrooms</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'all', label: 'Any' },
                    { id: 'studio', label: 'Studio' },
                    { id: '1br', label: '1 Bed' },
                    { id: '2br', label: '2 Beds' },
                    { id: '3plus', label: '3+ Beds' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPropertyType(t.id)}
                      className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                        propertyType === t.id ? 'bg-[#0b3c37] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range (VND)</label>
                  <span className="text-xs font-bold text-[#00a4a6]">{fmt(currentFilter.min)} - {fmt(currentFilter.max)} VND</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    value={currentFilter.min} 
                    onChange={(e) => setCurrentFilter(p => ({ ...p, min: Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                  />
                  <input 
                    type="number" 
                    value={currentFilter.max} 
                    onChange={(e) => setCurrentFilter(p => ({ ...p, max: Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {dynamicTags.map(tag => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTags(prev => isActive ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1.5 text-xs rounded-full border font-semibold ${
                          isActive ? 'bg-[#00a4a6] text-white border-[#00a4a6]' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => setStep('step2_draw')} 
                className="w-full py-4 bg-[#00a4a6] hover:bg-[#008f91] text-white font-extrabold rounded-xl text-sm shadow-lg transition-all"
              >
                ✏️ Continue to Map & Draw Area →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FULLSCREEN DRAWING MAP */}
      {step === 'step2_draw' && (
        <div className="flex-1 relative w-full h-full">
          <MapContainer center={[16.0544, 108.2422]} zoom={13} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <ZoomControl position="topright" />
            <MapResizer />

            <FreehandDrawLayer 
              isDrawing={isDrawingMode} 
              onPolygonComplete={(pts) => {
                setDrawnPolygon(pts);
                setIsDrawingMode(false);
              }} 
            />

            {drawnPolygon.length > 0 && (
              <Polygon positions={drawnPolygon} pathOptions={{ color: '#0b3c37', fillColor: '#00a4a6', fillOpacity: 0.25, weight: 3 }} />
            )}

            {filteredApts.map(apt => (
              <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} />
            ))}
          </MapContainer>

          {/* FLOATING ACTION BAR */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-3 px-5 flex items-center gap-4 z-[1000] border border-slate-200">
            <button 
              onClick={() => {
                setDrawnPolygon([]);
                setIsDrawingMode(true);
              }} 
              className="text-xs font-bold text-slate-700 hover:text-black py-2 px-3 rounded-lg hover:bg-slate-100"
            >
              ✏️ {drawnPolygon.length > 0 ? 'Draw again' : 'Hold Mouse & Draw Zone'}
            </button>

            <button 
              onClick={() => setStep('step3_results')} 
              className="bg-[#00a4a6] hover:bg-[#008f91] text-white text-xs font-extrabold py-3 px-6 rounded-xl shadow transition-all"
            >
              View properties ({filteredApts.length})
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTS */}
      {step === 'step3_results' && (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#0b3c37]">Results inside Zone</h2>
                <p className="text-xs text-slate-500">{filteredApts.length} properties matched</p>
              </div>
              <button onClick={() => setStep('step2_draw')} className="px-3 py-1.5 bg-[#eaf4f4] text-[#0b3c37] border border-[#99e2d8] rounded-lg text-xs font-bold">🗺 Redraw Zone</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApts.map(apt => (
                <div key={apt.id} onClick={() => setSelectedApt(apt)} className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                  <div className="h-44 bg-slate-900 relative">
                    <img src={apt.image_urls?.[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="p-4">
                    <div className="text-lg font-extrabold text-[#0b3c37]">{fmt(getCleanPrice(apt))} VND <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                    <div className="text-xs font-bold text-slate-800 mt-1">{apt.rooms ? `${apt.rooms} Bed` : 'Studio'}</div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{apt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[40%] h-full hidden md:block">
            <MapContainer center={[16.0544, 108.2422]} zoom={13} zoomControl={false} className="h-full w-full">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <MapResizer />
              {drawnPolygon.length > 0 && <Polygon positions={drawnPolygon} pathOptions={{ color: '#0b3c37', fillColor: '#00a4a6', fillOpacity: 0.15 }} />}
              {filteredApts.map(apt => (
                <Marker key={apt.id} position={[apt.lat, apt.lng]} icon={defaultIcon} />
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* MODAL */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedApt(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-extrabold text-[#0b3c37]">{fmt(getCleanPrice(selectedApt))} VND / mo</span>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedApt.description}</p>
          </div>
        </div>
      )}

    </div>
  );
}