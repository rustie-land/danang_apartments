import SafeImage from './SafeImage.jsx';
import { useLang } from '../LanguageContext.jsx';

export default function PropertyCard({ property, isSelected, isFavorite, onSelect, onToggleFavorite, onOpenDetails, convertPrice }) {
  const { t } = useLang();
  return (
    <div
      onClick={() => onOpenDetails(property)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenDetails(property);
      }}
      style={{
        display: 'flex',
        gap: '1rem',
        backgroundColor: isSelected ? 'var(--as-surface)' : '#fff',
        borderRadius: 'var(--as-radius-card)',
        overflow: 'hidden',
        border: isSelected ? '2px solid var(--as-accent)' : '1px solid var(--as-border)',
        boxShadow: isSelected ? 'var(--as-shadow-soft)' : '0 2px 8px rgba(26,26,26,0.03)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,26,26,0.08)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,26,26,0.03)'; }}
    >
      <SafeImage
        src={property.img}
        alt={`${property.title} — ${property.type || 'apartment'} in ${property.area || 'Asia'}${property.beds ? `, ${property.beds}` : ''}`}
        style={{ width: '140px', height: '140px', objectFit: 'cover', flexShrink: 0 }}
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(property.id);
        }}
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        aria-pressed={isFavorite}
        style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255,255,255,0.9)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          lineHeight: '28px'
        }}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      <div style={{ padding: '0.85rem 0.85rem 0.85rem 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--as-accent)', letterSpacing: '0.05em' }}>
            {property.area ? property.area.toUpperCase() : 'ASIA'}
          </div>
          <h3 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.15rem', color: 'var(--as-text)', margin: '0.2rem 0' }}>
            {property.title}
          </h3>
          <div style={{ fontSize: '0.7rem', color: 'var(--as-text-muted)', lineHeight: 1.4 }}>
            {property.beds ? `${property.beds} · ` : ''}{property.type || 'Apartment'} · {property.area || 'Asia'}
            {property.feature ? ` · ${property.feature}` : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)' }}>📍 {property.address}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--as-text)' }}>
            {convertPrice(property.price)}
            <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--as-text-muted)' }}> {t('perMonth')}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: '1rem', padding: '0.2rem 0.6rem', color: 'var(--as-accent)', fontWeight: 600 }}>✓ Verified</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(property);
              }}
              style={{
                backgroundColor: 'var(--as-accent)',
                color: '#fff',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.4rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              On map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}