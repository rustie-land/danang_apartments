import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MapController from './MapController.jsx';
import PropertyCard from './PropertyCard.jsx';
import PropertyModal from './PropertyModal.jsx';
import MarkerClusterGroup from './MarkerClusterGroup.jsx';
import { defaultIcon, activeIcon } from '../leafletIcon.js';
import { SORT_OPTIONS } from '../data/mockProperties.js';
import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultsPage({
  initialCenter,
  initialZoom,
  selectedPropertyId,
  mapCenterCoords,
  favorites,
  setSortBy,
  onSelectProperty,
  onToggleFavorite,
  onOpenDetails,
  activeModalProperty,
  onCloseModal,
  mobileView,
  setMobileView,
}) {
  const { t } = useLang();
  const { properties, filterByPreferences, convertPrice, sortBy } = useFilters();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

  useEffect(() => {
    try { setSavedSearches(JSON.parse(localStorage.getItem('as_saved_searches') || '[]')); } catch { setSavedSearches([]); }
    const timer = setTimeout(() => setShowCards(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Listen for "switch to map" event from card "On map" button
  useEffect(() => {
    const handleSwitchToMap = () => setMobileView('map');
    window.addEventListener('switchToMap', handleSwitchToMap);
    return () => window.removeEventListener('switchToMap', handleSwitchToMap);
  }, []);

  const saveSearch = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('as_saved_searches') || '[]');
      saved.push({ ts: Date.now(), label: `${filteredProperties.length} stays` });
      localStorage.setItem('as_saved_searches', JSON.stringify(saved.slice(-5)));
      setSavedSearches(saved.slice(-5));
      alert('🔔 Search saved! We\'ll keep your filters for next visit.');
    } catch { alert('🔔 Search saved.'); }
  };

  const filteredProperties = properties.filter(filterByPreferences);
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'date-desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'date-asc') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    return 0;
  });

  if (!showCards) {
    return (
      <div className="results-split">
        <div className="results-list-pane" style={{ padding: '2rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ 
              height: '180px', 
              borderRadius: 'var(--as-radius-card)', 
              background: 'linear-gradient(90deg, var(--as-surface) 25%, var(--as-surface-alt) 50%, var(--as-surface) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              marginBottom: '1.25rem'
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`results-split${mobileView === 'map' ? ' results-split--show-map' : ''}${mobileView === 'list' ? ' results-split--show-list' : ''}`}>
      <div className="results-list-pane">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.8rem', color: 'var(--as-text)', margin: 0 }}>{t('results')}</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--as-text-muted)' }}>{sortedProperties.length} {t('objectsInZone')}</span>
        </div>

        {sortedProperties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ padding: '2rem', textAlign: 'center', color: 'var(--as-text-muted)' }}
          >
            <p>{t('noResults')}</p>
          </motion.div>
        ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.12, delayChildren: 0.2 }
              }
            }}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <AnimatePresence>
              {sortedProperties.map((prop, index) => (
                <motion.div
                  key={prop.id}
                  variants={{
                    hidden: { opacity: 0, y: 50, scale: 0.9 },
                    show: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { 
                        duration: 0.6, 
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: index * 0.05
                      }
                    }
                  }}
                  layout
                  whileHover={{ 
                    y: -4, 
                    transition: { duration: 0.2 }
                  }}
                >
                  <PropertyCard
                    property={prop}
                    isSelected={selectedPropertyId === prop.id}
                    isFavorite={favorites.includes(prop.id)}
                    onSelect={onSelectProperty}
                    onToggleFavorite={onToggleFavorite}
                    onOpenDetails={onOpenDetails}
                    convertPrice={convertPrice}
                    onHover={setHoveredPropertyId}
                    isHovered={hoveredPropertyId === prop.id}
                    onSwitchToMap={() => setMobileView('map')}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="results-map-pane">
        {mobileView === 'map' && (
          <button onClick={() => setMobileView('list')} style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 500, border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#fff', color: 'var(--as-text)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ← List
          </button>
        )}
        <MapContainer center={initialCenter} zoom={initialZoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController coords={mapCenterCoords} mobileView={mobileView} />

          <MarkerClusterGroup
            markers={sortedProperties.filter(p => p.lat && p.lng)}
            onMarkerClick={onSelectProperty}
            hoveredId={hoveredPropertyId}
            activeIcon={activeIcon}
            defaultIcon={defaultIcon}
          />
        </MapContainer>
      </div>

      {activeModalProperty && <PropertyModal property={activeModalProperty} onClose={onCloseModal} convertPrice={convertPrice} t={t} />}
    </div>
  );
}
