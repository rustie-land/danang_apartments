import SafeImage from './SafeImage.jsx';

export default function PropertyCard({ property, isSelected, isFavorite, onSelect, onToggleFavorite, onOpenDetails, convertPrice }) {
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
        backgroundColor: isSelected ? 'var(--color-bg-alt)' : '#fff',
        borderRadius: '0.85rem',
        overflow: 'hidden',
        border: isSelected ? '2px solid var(--color-deep)' : '1px solid var(--color-border)',
        boxShadow: isSelected ? 'var(--shadow-soft)' : '0 2px 8px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      <SafeImage
        src={property.img}
        alt={property.title}
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
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
            {property.area ? property.area.toUpperCase() : 'ASIA'}
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-deep)', margin: '0.2rem 0' }}>
            {property.title}
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>📍 {property.address}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-deep)' }}>
            {convertPrice(property.price)}
            <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--color-muted)' }}> / мес</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(property);
            }}
            style={{
              backgroundColor: 'var(--color-deep)',
              color: '#fff',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.4rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            На карте
          </button>
        </div>
      </div>
    </div>
  );
}