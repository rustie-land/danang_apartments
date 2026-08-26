import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { LanguageProvider } from './LanguageContext.jsx';
import { FiltersProvider } from './FiltersContext.jsx';
import Navbar from './components/Navbar.jsx';
import LandingPage from './components/LandingPage.jsx';
import AreaSelectionPage from './components/AreaSelectionPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';

const DEFAULT_CENTER = [16.06, 108.23];
const DEFAULT_ZOOM = 13;
// v7-price-fix deployed
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

// Extract structured fields from free-text description when DB columns are empty.
function normalizeTitle(s = '') {
  return s.replace(/[*_#~`]/g, '').replace(/\s+/g, ' ').replace(/^[^A-Za-z0-9]+/, '').replace(/\s+$/, '').trim();
}
function cleanDesc(s = '') {
  return s
    .replace(/\*{2,}/g, '')        // strip ** bold markdown
    .replace(/Avalaible/gi, 'Available')  // typo fix
    .replace(/---+.*$/gm, '')      // strip trailing "--- ---" separator lines
    .replace(/📌.*$/gm, '')         // strip "📌Group for more options" CTA lines
    .replace(/💌.*$/gm, '')         // strip "💌 Contact ..." lines
    .replace(/💵.*?(VND|USD|THB|₫).*$/gi, '')  // strip standalone price line from description
    .replace(/Rental price:.*$/gim, '')        // strip "Rental price: X" lines
    .replace(/Price:\s*[\d.,]+\s*(VND|USD|THB|million|M)?\s*(?:\/|\s*(?:per|month|mo))?/gi, '') // strip inline "Price: X" (any suffix)
    .replace(/\b\d[\d.,]*\s*(VND|USD|THB|₫|million|M)\b\s*(?:\/|\s*(?:month|mo|per))?/gi, '') // strip any residual price token
    .replace(/t\.me\/[^\s]+/g, '') // strip raw telegram links
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,])/g, '$1')
    .trim();
}
// Normalize contact string into a t.me deep link (username) or wa.me link.
function normalizeContact(raw = '') {
  if (!raw || raw === 'N/A') return { tg: '', wa: '', label: 'Contact owner' };
  const str = String(raw).trim();
  // Telegram username (with or without @, may be followed by comma/space + other info)
  const tgMatch = str.match(/@?([a-zA-Z0-9_]{4,32})/);
  // WhatsApp phone (digits, +, spaces)
  const waMatch = str.match(/(\+?[\d\s]{8,})/);
  const tg = tgMatch ? tgMatch[1].replace(/^@/, '') : '';
  const wa = waMatch ? waMatch[1].replace(/\s+/g, '') : '';
  let label = 'Contact owner';
  if (/Direct TG Message/i.test(str)) label = 'Message on Telegram';
  return { tg, wa, label };
}
function parseFromDescription(desc = '') {
  const out = { title: '', area: '', numeric_price: null, city: '' };
  if (!desc) return out;
  const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines[0]) out.title = normalizeTitle(lines[0]);
  // Price: handle "Rental price: 19,000,000 VND", "💰**Price: 16.5 million**", "💰**Price: X VND**"
  const priceMatch = desc.match(/Rental price:\s*(\d[\d,\.]*)\s*(VND|USD|THB)/i)
    || desc.match(/Price:\s*\*{0,2}\s*([\d.]+)\s*(million|M)?\s*\*{0,2}/i)
    || desc.match(/(\d[\d,\.]*)\s*(VND|USD|THB)/i);
  if (priceMatch) {
    let raw = priceMatch[1].replace(/[,\.]/g, '');
    if (/million/i.test(priceMatch[0]) || /M\b/i.test(priceMatch[0])) raw = String(Number(raw) * 1000000);
    out.numeric_price = Number(raw);
  }
  const locMatch = desc.match(/📍\s*([^|\n]+?)(?:\s*\|\s*([^|\n]+))?/);
  if (locMatch) {
    out.area = normalizeTitle(locMatch[2] || locMatch[1]);
    out.city = normalizeTitle(locMatch[1]);
  }
  return out;
}

function AppRoutes() {
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(null);
  const [activeModalProperty, setActiveModalProperty] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [mobileView, setMobileView] = useState('list');

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase error:', error);
        } else if (data) {
          const formatted = data.map((item, index) => {
            const desc = item.description || item.description_en || '';
            const parsed = parseFromDescription(desc);
            const numPrice = (item.numeric_price && item.numeric_price > 1000000) ? item.numeric_price : (parsed.numeric_price || 0);
            let bedsLabel = item.beds || 'Studio';
            const roomsVal = Number(item.rooms);
            if (roomsVal === 1) bedsLabel = '1 Bed';
            else if (roomsVal === 2) bedsLabel = '2 Beds';
            else if (roomsVal >= 3) bedsLabel = '3+ Beds';

            const title = item.title || parsed.title || `${bedsLabel} Apartment`;
            const area = (item.area && item.area.length > 1 && item.area !== 'L' ? item.area : null) || item.district || parsed.area || 'Da Nang';

            return {
              id: item.id || item.original_url || `apt-${index}`,
              title,
              beds: bedsLabel,
              price: numPrice,
              amenities: Array.isArray(item.features) ? item.features : [],
              lat: Number(item.lat) || 16.06,
              lng: Number(item.lng) || 108.23,
              imageUrls:
                Array.isArray(item.image_urls) && item.image_urls.length > 0
                  ? item.image_urls
                  : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
              img:
                Array.isArray(item.image_urls) && item.image_urls.length > 0
                  ? item.image_urls[0]
                  : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
            description: cleanDesc(item.description || 'No description provided.'),
            desc: cleanDesc(item.description_en || item.description || 'No description provided.'),
              contact: normalizeContact(item.contact || ''),
              area,
              city: (item.city && item.city.length > 1 && item.city !== 'L' ? item.city : null) || parsed.city || 'Da Nang',
              currency: item.currency || 'VND',
              originalUrl: item.original_url || '',
              createdAt: item.created_at || null,
              location: (item.address && item.address.length > 1 && item.address !== 'L' ? item.address : null) || area,
              address: (item.address && item.address.length > 1 && item.address !== 'L' ? item.address : null) || area,
            };
          });
          setProperties(formatted);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const cities = useMemo(() => {
    const set = new Set(properties.map((p) => p.city).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [properties]);

  const toggleFavorite = (id) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const propertiesInBounds = useMemo(() => {
    // Imported lazily to avoid circular deps; compute via context filter below
    return properties;
  }, [properties]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>⏳ Loading apartments...</h2>
      </div>
    );
  }

  return (
    <FiltersProvider properties={properties} cities={cities}>
      <Navbar />
      <div key={location.pathname} className="page-fade">
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/map"
          element={
            <AreaSelectionPage
              properties={properties}
              initialCenter={DEFAULT_CENTER}
              initialZoom={DEFAULT_ZOOM}
              onBoundsChange={setMapBounds}
            />
          }
        />
        <Route
          path="/results"
          element={
            <ResultsPage
              properties={properties}
              initialCenter={DEFAULT_CENTER}
              initialZoom={DEFAULT_ZOOM}
              selectedPropertyId={selectedPropertyId}
              mapCenterCoords={mapCenterCoords}
              favorites={favorites}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onSelectProperty={(prop) => {
                setSelectedPropertyId(prop.id);
                setMapCenterCoords([prop.lat, prop.lng]);
              }}
              onToggleFavorite={toggleFavorite}
              onOpenDetails={setActiveModalProperty}
              onBackToLanding={() => window.history.back()}
              onBackToMap={() => window.history.back()}
              activeModalProperty={activeModalProperty}
              onCloseModal={() => setActiveModalProperty(null)}
              mobileView={mobileView}
              setMobileView={setMobileView}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </FiltersProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  );
}
