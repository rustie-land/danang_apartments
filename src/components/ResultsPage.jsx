import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MapController from './MapController.jsx';
import PropertyCard from './PropertyCard.jsx';
import PropertyModal from './PropertyModal.jsx';
import SafeImage from './SafeImage.jsx';
import { defaultIcon } from '../leafletIcon.js';
import { SORT_OPTIONS } from '../data/mockProperties.js';

export default function ResultsPage({
  properties,
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
  onBackToLanding,
  onBackToMap,
  activeModalProperty,
  onCloseModal,
  mobileView,
  setMobileView
}) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar" style={{ height: '60px', backgroundColor: 'var(--color-deep)', color: 'var(--color-bg)', zIndex: 1000, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer' }} onClick={onBackToLanding}>
            Asia Stays
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.3rem 0.75rem', borderRadius: '1rem' }}>
            {properties.length} объектов в выбранной зоне
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }} htmlFor="sort-select">
            Сортировка:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '0.4rem', border: 'none' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button onClick={onBackToMap} style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'var(--color-bg)', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '0.4rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
            📍 Изменить зону
          </button>
          <div className="mobile-toggle" style={{ display: 'none', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '0.6rem', padding: '0.2rem' }}>
            <button
              onClick={() => setMobileView('list')}
              style={{ border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: mobileView === 'list' ? 'var(--color-bg)' : 'transparent', color: mobileView === 'list' ? 'var(--color-deep)' : 'var(--color-bg)' }}
            >
              Список
            </button>
            <button
              onClick={() => setMobileView('map')}
              style={{ border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: mobileView === 'map' ? 'var(--color-bg)' : 'transparent', color: mobileView === 'map' ? 'var(--color-deep)' : 'var(--color-bg)' }}
            >
              Карта
            </button>
          </div>
          <button onClick={onBackToLanding} style={{ backgroundColor: '#ece6d9', color: 'var(--color-deep)', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '0.4rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
            ⚙️ Фильтры
          </button>
        </div>
      </header>

      <div className="results-split">
        <div className={`results-list-pane${mobileView === 'map' ? ' mobile-only-hidden' : ''}`}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-deep)', margin: '0 0 0.25rem 0' }}>
              Объекты в выбранной зоне
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>Нажмите на карточку, чтобы найти объект на карте.</p>
          </div>

          {properties.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
              Нет объектов, подходящих под фильтры, в этой зоне. Попробуйте передвинуть карту или изменить фильтры.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isSelected={selectedPropertyId === prop.id}
                  isFavorite={favorites.includes(prop.id)}
                  onSelect={onSelectProperty}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`results-map-pane${mobileView === 'list' ? ' mobile-only-hidden' : ''}`}>
          <MapContainer center={initialCenter} zoom={initialZoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController coords={mapCenterCoords} />

            {properties.map((prop) => (
              <Marker
                key={prop.id}
                position={[prop.lat, prop.lng]}
                icon={defaultIcon}
                eventHandlers={{ click: () => onSelectProperty(prop) }}
              >
                <Popup>
                  <div style={{ width: '180px' }}>
                    <SafeImage src={prop.img} alt={prop.title} style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '0.4rem' }} />
                    <h4 style={{ margin: '0.4rem 0 0.1rem 0', fontSize: '0.85rem', color: 'var(--color-deep)' }}>{prop.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {prop.price.toLocaleString('ru-RU')} VND / мес
                    </p>
                    <button
                      onClick={() => onOpenDetails(prop)}
                      style={{ width: '100%', backgroundColor: 'var(--color-deep)', color: '#fff', border: 'none', padding: '0.3rem', borderRadius: '0.3rem', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Все детали
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {activeModalProperty && <PropertyModal property={activeModalProperty} onClose={onCloseModal} />}
    </div>
  );
}