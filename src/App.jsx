import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Контроллер движения карты для Шага 3
function MapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && Array.isArray(coords) && coords.length === 2) {
      map.flyTo(coords, 15, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// Компонент отслеживания границ видимости для Шага 2 (Зона поиска)
function AreaListener({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds());
    },
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

// === MOCK DATA ===
const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Luxury Oceanfront Studio',
    area: 'My Khe Beach',
    price: 12000000,
    beds: 'Studio',
    amenities: ['#sea', '#pool', '#balcony'],
    lat: 16.0600,
    lng: 108.2430,
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    address: 'An Thuong 26, My An',
    desc: 'Spacious oceanview studio with modern Scandinavian furniture. 2 mins walk to My Khe Beach.'
  },
  {
    id: 2,
    title: 'Modern 2BR Han River View',
    area: 'Han River',
    price: 18000000,
    beds: '2 Beds',
    amenities: ['#gym', '#balcony', '#kitchen'],
    lat: 16.0680,
    lng: 108.2230,
    img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    address: 'Tran Hung Dao, An Hai Bac',
    desc: 'Panoramic river view apartment near Dragon Bridge. High-speed internet, fitness center access included.'
  },
  {
    id: 3,
    title: 'Cozy 1BR Penthouse near An Thuong',
    area: 'My Khe Beach',
    price: 9500000,
    beds: '1 Bed',
    amenities: ['#sea', '#beach', '#pet'],
    lat: 16.0520,
    lng: 108.2410,
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    address: 'Le Quang Dao, My An',
    desc: 'Top-floor apartment with a private green terrace. Pet friendly and surrounded by cozy cafes.'
  },
  {
    id: 4,
    title: 'Green Sanctuary Villa Apartment',
    area: 'Son Tra',
    price: 22000000,
    beds: '3+ Beds',
    amenities: ['#pool', '#pet', '#kitchen'],
    lat: 16.0850,
    lng: 108.2300,
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    address: 'Yet Kieu, Tho Quang',
    desc: 'Quiet retreat at the foot of Son Tra Peninsula. Shared pool, massive garden, perfect for families.'
  },
];

export default function App() {
  const [step, setStep] = useState(1); // Step 1: Filter, Step 2: Select Area, Step 3: Results
  
  // Filter States
  const [bedrooms, setBedrooms] = useState('Any');
  const [minPrice, setMinPrice] = useState('5000000');
  const [maxPrice, setMaxPrice] = useState('25000000');
  const [amenities, setAmenities] = useState(['#sea']);

  // Selection States
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(null);
  const [activeModalProperty, setActiveModalProperty] = useState(null);

  const bedroomOptions = ['Any', 'Studio', '1 Bed', '2 Beds', '3+ Beds'];
  const amenityOptions = ['#pool', '#pet', '#balcony', '#beach', '#sea', '#gym', '#kitchen'];

  const toggleAmenity = (tag) => {
    setAmenities((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Фильтрация по параметрам из Шага 1
  const filterByPreferences = (item) => {
    const matchBeds = bedrooms === 'Any' || item.beds === bedrooms;
    const matchMinPrice = !minPrice || item.price >= Number(minPrice);
    const matchMaxPrice = !maxPrice || item.price <= Number(maxPrice);
    return matchBeds && matchMinPrice && matchMaxPrice;
  };

  // Фильтрация объектов по видимой области карты (для Шага 2 и 3)
  const propertiesInBounds = MOCK_PROPERTIES.filter((item) => {
    if (!filterByPreferences(item)) return false;
    if (!mapBounds) return true;
    return mapBounds.contains([item.lat, item.lng]);
  });

  // Все объекты по параметрам (без учета карты)
  const totalFilteredCount = MOCK_PROPERTIES.filter(filterByPreferences).length;

  // ==========================================
  // STEP 2: AREA SELECTION PAGE
  // ==========================================
  if (step === 2) {
    return (
      <div style={{ height: '100vh', width: '100vw', position: 'relative', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {/* Floating Top Header */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', backgroundColor: '#0D3C3E', color: '#F5F2EA', padding: '0.6rem 1.2rem', borderRadius: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>STEP 2: Select Search Area</span>
          </div>

          <button 
            onClick={() => setStep(1)} 
            style={{ pointerEvents: 'auto', backgroundColor: '#F5F2EA', color: '#0D3C3E', border: '1px solid #E2DAD0', padding: '0.6rem 1.2rem', borderRadius: '2rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            ← Back to Filters
          </button>
        </div>

        {/* Fullscreen Map */}
        <MapContainer center={[16.0600, 108.2300]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AreaListener onBoundsChange={setMapBounds} />

          {/* Отображаем маркеры только для наглядности зоны */}
          {propertiesInBounds.map((prop) => (
            <Marker key={prop.id} position={[prop.lat, prop.lng]} icon={defaultIcon} />
          ))}
        </MapContainer>

        {/* Bottom Floating Panel */}
        <div style={{ 
          position: 'absolute', 
          bottom: '30px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000, 
          backgroundColor: '#0D3C3E', 
          color: '#F5F2EA', 
          padding: '1.25rem 2rem', 
          borderRadius: '1.25rem', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          maxWidth: '90%',
          width: '460px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: '#A36D42', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Area Selected
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {propertiesInBounds.length} apartments found
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
              Move map to change area
            </div>
          </div>

          <button 
            onClick={() => setStep(3)}
            disabled={propertiesInBounds.length === 0}
            style={{ 
              backgroundColor: propertiesInBounds.length > 0 ? '#A36D42' : '#5A6663', 
              color: '#FFF', 
              border: 'none', 
              padding: '0.8rem 1.5rem', 
              borderRadius: '0.75rem', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: propertiesInBounds.length > 0 ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s'
            }}
          >
            Done (Show List) ➔
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 3: RESULTS & DETAILS CATALOG PAGE
  // ==========================================
  if (step === 3) {
    return (
      <div style={{ backgroundColor: '#F5F2EA', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        
        {/* Header */}
        <header style={{ height: '60px', padding: '0 2rem', backgroundColor: '#0D3C3E', color: '#F5F2EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => setStep(1)}>
              Da Nang <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Apartments</span>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#A36D42', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.3rem 0.75rem', borderRadius: '1rem' }}>
              {propertiesInBounds.length} units in selected zone
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => setStep(2)} 
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#F5F2EA', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '0.4rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              📍 Change Area
            </button>
            <button 
              onClick={() => setStep(1)} 
              style={{ backgroundColor: '#ECE6D9', color: '#0D3C3E', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '0.4rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ⚙️ Filters
            </button>
          </div>
        </header>

        {/* Split View */}
        <div style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT: LIST */}
          <div style={{ width: '45%', height: '100%', overflowY: 'auto', padding: '1.5rem', borderRight: '1px solid #E2DAD0', backgroundColor: '#F5F2EA', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#0D3C3E', margin: '0 0 0.25rem 0' }}>
                Selected Area Listings
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#5A6663' }}>
                Click a card to focus on map, or open details.
              </p>
            </div>

            {propertiesInBounds.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5A6663' }}>
                No apartments match your filters in this area. Try moving the map!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {propertiesInBounds.map((prop) => {
                  const isSelected = selectedPropertyId === prop.id;
                  return (
                    <div 
                      key={prop.id} 
                      onClick={() => {
                        setSelectedPropertyId(prop.id);
                        setMapCenterCoords([prop.lat, prop.lng]);
                      }}
                      style={{ 
                        display: 'flex',
                        gap: '1rem',
                        backgroundColor: isSelected ? '#ECE6D9' : '#FFF', 
                        borderRadius: '0.85rem', 
                        overflow: 'hidden', 
                        border: isSelected ? '2px solid #0D3C3E' : '1px solid #E2DAD0', 
                        boxShadow: isSelected ? '0 6px 16px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <img src={prop.img} alt={prop.title} style={{ width: '140px', height: '140px', objectFit: 'cover' }} />
                      <div style={{ padding: '0.85rem 0.85rem 0.85rem 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#A36D42', letterSpacing: '0.05em' }}>{prop.area.toUpperCase()}</div>
                          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', color: '#0D3C3E', margin: '0.2rem 0' }}>{prop.title}</h3>
                          <div style={{ fontSize: '0.75rem', color: '#5A6663' }}>📍 {prop.address}</div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0D3C3E' }}>
                            {prop.price.toLocaleString()} <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#5A6663' }}>VND</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalProperty(prop);
                            }}
                            style={{ backgroundColor: '#0D3C3E', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: MAP */}
          <div style={{ width: '55%', height: '100%', position: 'relative' }}>
            <MapContainer 
              center={[16.0600, 108.2300]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController coords={mapCenterCoords} />

              {propertiesInBounds.map((prop) => (
                <Marker 
                  key={prop.id} 
                  position={[prop.lat, prop.lng]} 
                  icon={defaultIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedPropertyId(prop.id);
                    }
                  }}
                >
                  <Popup>
                    <div style={{ width: '180px' }}>
                      <img src={prop.img} alt={prop.title} style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '0.4rem' }} />
                      <h4 style={{ margin: '0.4rem 0 0.1rem 0', fontSize: '0.85rem', color: '#0D3C3E' }}>{prop.title}</h4>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#A36D42' }}>
                        {prop.price.toLocaleString()} VND / mo
                      </p>
                      <button 
                        onClick={() => setActiveModalProperty(prop)}
                        style={{ width: '100%', backgroundColor: '#0D3C3E', color: '#FFF', border: 'none', padding: '0.3rem', borderRadius: '0.3rem', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        View Full Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

        </div>

        {/* PROPERTY DETAILS MODAL */}
        {activeModalProperty && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ backgroundColor: '#F5F2EA', borderRadius: '1.25rem', maxWidth: '600px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
              
              <button 
                onClick={() => setActiveModalProperty(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, zIndex: 10 }}
              >
                ✕
              </button>

              <img src={activeModalProperty.img} alt={activeModalProperty.title} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />

              <div style={{ padding: '1.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A36D42', letterSpacing: '0.05em' }}>{activeModalProperty.area.toUpperCase()}</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: '#0D3C3E', margin: '0.25rem 0 0.5rem 0' }}>{activeModalProperty.title}</h2>
                <div style={{ fontSize: '0.85rem', color: '#5A6663', marginBottom: '1rem' }}>📍 {activeModalProperty.address}</div>

                <p style={{ color: '#1C2826', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {activeModalProperty.desc}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {activeModalProperty.amenities.map(a => (
                    <span key={a} style={{ backgroundColor: '#ECE6D9', color: '#0D3C3E', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                      {a}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2DAD0', paddingTop: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#5A6663', textTransform: 'uppercase' }}>Monthly Rent</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0D3C3E' }}>
                      {activeModalProperty.price.toLocaleString()} VND
                    </div>
                  </div>

                  <button 
                    onClick={() => alert('Contacting manager for ' + activeModalProperty.title)}
                    style={{ backgroundColor: '#0D3C3E', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Contact Manager
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // STEP 1: LANDING & INITIAL FILTERS
  // ==========================================
  return (
    <div style={{ backgroundColor: '#F5F2EA', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#1C2826' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 4rem', backgroundColor: '#F5F2EA', borderBottom: '1px solid #E2DAD0' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: '#0D3C3E' }}>
          Da Nang <span style={{ fontWeight: 400, fontStyle: 'italic' }}>Apartments</span>
        </div>
        <button 
          onClick={() => setStep(2)}
          style={{ backgroundColor: '#0D3C3E', color: '#F5F2EA', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Select Search Area ➔
        </button>
      </nav>

      {/* HERO SECTION */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '4rem 4rem 6rem 4rem', alignItems: 'center', maxWidth: '1280px', margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#A36D42', textTransform: 'uppercase', marginBottom: '1rem' }}>
            — LONG TERM RENTALS IN DA NANG
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3.75rem', lineHeight: 1.1, color: '#0D3C3E', fontWeight: 600, margin: '0 0 1.5rem 0' }}>
            Find an apartment worth coming home <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>to</span> in Da Nang.
          </h1>
          <p style={{ color: '#5A6663', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '480px' }}>
            Set your budget and preferences, then explore available listings directly on the map zone of your choice.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '100%', 
            height: '420px', 
            borderRadius: '1.5rem', 
            overflow: 'hidden',
            backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', backgroundColor: '#0D3C3E', padding: '1.25rem', borderRadius: '1rem', color: '#F5F2EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 600 }}>My Khe & Son Tra</div>
                <div style={{ fontSize: '0.75rem', color: '#A36D42' }}>Beachfront & quiet residential spots</div>
              </div>
              <button onClick={() => setStep(2)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFF', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                Open Map ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER SECTION */}
      <section id="search-section" style={{ backgroundColor: '#ECE6D9', padding: '5rem 4rem', borderTop: '1px solid #E2DAD0', borderBottom: '1px solid #E2DAD0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#A36D42', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              — STEP 1 / PREFERENCES
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', color: '#0D3C3E', lineHeight: 1.1, margin: '0 0 1rem 0' }}>
              Set your target <br />
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>parameters</span>.
            </h2>
            <p style={{ color: '#5A6663', lineHeight: 1.6, marginBottom: '2rem' }}>
              Next step will let you choose an area on the interactive map with real-time updates.
            </p>
          </div>

          {/* Filter Form */}
          <div style={{ backgroundColor: '#F5F2EA', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #E2DAD0', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
            
            {/* Bedrooms */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5A6663', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                BEDROOMS
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {bedroomOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBedrooms(opt)}
                    style={{
                      padding: '0.5rem 0',
                      borderRadius: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: bedrooms === opt ? '#0D3C3E' : '#ECE6D9',
                      color: bedrooms === opt ? '#ffffff' : '#4A5553',
                      cursor: 'pointer'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5A6663', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                PRICE RANGE (VND)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #D5CEC0', backgroundColor: '#ECE6D9', fontSize: '0.85rem', color: '#0D3C3E', fontWeight: 600 }}
                />
                <input 
                  type="text" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid #D5CEC0', backgroundColor: '#ECE6D9', fontSize: '0.85rem', color: '#0D3C3E', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#5A6663', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                AMENITIES
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {amenityOptions.map((tag) => {
                  const isSelected = amenities.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleAmenity(tag)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        backgroundColor: isSelected ? '#0D3C3E' : '#ECE6D9',
                        color: isSelected ? '#ffffff' : '#4A5553',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', backgroundColor: '#0D3C3E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Next: Select Area on Map ({totalFilteredCount} available) ➔
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}