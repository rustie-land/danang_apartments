import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import AreaListener from './AreaListener.jsx';
import { defaultIcon } from '../leafletIcon.js';

export default function AreaSelectionPage({ propertiesInBounds, initialCenter, initialZoom, onBoundsChange, onBack, onDone }) {
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', fontFamily: 'var(--font-sans)' }}>
      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ pointerEvents: 'auto', backgroundColor: 'var(--color-deep)', color: 'var(--color-bg)', padding: '0.6rem 1.2rem', borderRadius: '2rem', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ШАГ 2: Выбор зоны поиска</span>
        </div>

        <button
          onClick={onBack}
          style={{ pointerEvents: 'auto', backgroundColor: 'var(--color-bg)', color: 'var(--color-deep)', border: '1px solid var(--color-border)', padding: '0.6rem 1.2rem', borderRadius: '2rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', boxShadow: 'var(--shadow-soft)' }}
        >
          ← Назад к фильтрам
        </button>
      </div>

      <MapContainer center={initialCenter} zoom={initialZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AreaListener onBoundsChange={onBoundsChange} />
        {propertiesInBounds.map((prop) => (
          <Marker key={prop.id} position={[prop.lat, prop.lng]} icon={defaultIcon} />
        ))}
      </MapContainer>

      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'var(--color-deep)',
          color: 'var(--color-bg)',
          padding: '1.25rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-strong)',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          maxWidth: '92%',
          width: '460px'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Зона выбрана
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
            {propertiesInBounds.length === 0 ? 'Нет объектов в этой зоне' : `${propertiesInBounds.length} объектов найдено`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
            {propertiesInBounds.length === 0 ? 'Попробуйте переместить или отдалить карту' : 'Двигайте карту, чтобы изменить зону'}
          </div>
        </div>

        <button
          onClick={onDone}
          disabled={propertiesInBounds.length === 0}
          style={{
            backgroundColor: propertiesInBounds.length > 0 ? 'var(--color-accent)' : 'var(--color-disabled)',
            color: '#fff',
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
          Готово (список) ➔
        </button>
      </div>
    </div>
  );
}
