import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MapController from './MapController.jsx';
import PropertyCard from './PropertyCard.jsx';
import PropertyModal from './PropertyModal.jsx';
import SafeImage from './SafeImage.jsx';
import { defaultIcon } from '../leafletIcon.js';
import { SORT_OPTIONS } from '../data/mockProperties.js';
import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ResultsPage({
  initialCenter,
  initialZoom,
  selectedPropertyId,
  mapCenterCoords,
  favorites,
  sortBy,
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
  const { properties, filterByPreferences, convertPrice } = useFilters();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = properties.filter(filterByPreferences);
  const sorted = [...visible].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: '52px', backgroundColor: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/map')} style={{ backgroundColor: 'var(--color-deep)', color: 'var(--color-bg)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
            📍 {t('changeZone')}
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{visible.length} {t('objectsInZone')}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="mobile-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" style={{ display: 'none', border: 'none', backgroundColor: 'var(--color-deep)', color: 'var(--color-bg)', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '1rem', cursor: 'pointer' }}>
            ☰
          </button>
          <div className={`navbar-tools${menuOpen ? ' menu-open' : ''}`} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{t('sort')}:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: '#fff' }}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
              ))}
            </select>
            <div className="mobile-toggle" style={{ display: 'none', gap: '0.4rem', backgroundColor: 'var(--color-bg)', borderRadius: '0.6rem', padding: '0.2rem', border: '1px solid var(--color-border)' }}>
              <button onClick={() => setMobileView('list')} style={{ border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: mobileView === 'list' ? 'var(--color-deep)' : 'transparent', color: mobileView === 'list' ? '#fff' : 'var(--color-deep)' }}>{t('list')}</button>
              <button onClick={() => setMobileView('map')} style={{ border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: mobileView === 'map' ? 'var(--color-deep)' : 'transparent', color: mobileView === 'map' ? '#fff' : 'var(--color-deep)' }}>{t('map')}</button>
            </div>
          </div>
        </div>
      </header>

      <div className="results-split">
        <div className={`results-list-pane${mobileView === 'map' ? ' mobile-only-hidden' : ''}`}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-deep)', margin: '0 0 0.25rem 0' }}>{t('results')}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>{t('noResults')}</p>
          </div>

          {sorted.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>{t('noResults')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {sorted.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isSelected={selectedPropertyId === prop.id}
                  isFavorite={favorites.includes(prop.id)}
                  onSelect={onSelectProperty}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetails={onOpenDetails}
                  convertPrice={convertPrice}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`results-map-pane${mobileView === 'list' ? ' mobile-only-hidden' : ''}`}>
          <MapContainer center={initialCenter} zoom={initialZoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapController coords={mapCenterCoords} />

            {sorted.map((prop) => (
              <Marker key={prop.id} position={[prop.lat, prop.lng]} icon={defaultIcon} eventHandlers={{ click: () => onSelectProperty(prop) }}>
                <Popup>
                  <div style={{ width: '180px' }}>
                    <SafeImage src={prop.img} alt={prop.title} style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '0.4rem' }} />
                    <h4 style={{ margin: '0.4rem 0 0.1rem 0', fontSize: '0.85rem', color: 'var(--color-deep)' }}>{prop.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>{convertPrice(prop.price)}</p>
                    <button onClick={() => onOpenDetails(prop)} style={{ width: '100%', backgroundColor: 'var(--color-deep)', color: '#fff', border: 'none', padding: '0.3rem', borderRadius: '0.3rem', fontSize: '0.7rem', cursor: 'pointer' }}>{t('details')}</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {activeModalProperty && <PropertyModal property={activeModalProperty} onClose={onCloseModal} convertPrice={convertPrice} t={t} />}
    </div>
  );
}
