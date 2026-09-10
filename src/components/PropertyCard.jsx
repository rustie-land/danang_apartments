import SafeImage from './SafeImage.jsx';
import { useLang } from '../LanguageContext.jsx';
import { useState, useEffect } from 'react';

export default function PropertyCard({ property, isSelected, isFavorite, onSelect, onToggleFavorite, onOpenDetails, convertPrice, onHover, isHovered }) {
  const { t } = useLang();
  const [imgIdx, setImgIdx] = useState(0);
  
  const images = property.imageUrls && property.imageUrls.length > 0 
    ? property.imageUrls 
    : [property.img];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setImgIdx(i => (i + 1) % images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleMouseEnter = (e) => {
    if (!isSelected) {
      e.currentTarget.style.boxShadow = 'var(--as-shadow-strong)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = 'var(--as-accent)';
    }
    if (onHover) onHover(property.id);
  };

  const handleMouseLeave = (e) => {
    if (!isSelected) {
      e.currentTarget.style.boxShadow = 'var(--as-shadow-soft)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'var(--as-border)';
    }
    if (onHover) onHover(null);
  };

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
        backgroundColor: isSelected ? 'var(--as-surface)' : 'var(--as-surface)',
        borderRadius: 'var(--as-radius-card)',
        overflow: 'hidden',
        border: isSelected ? '2px solid var(--as-accent)' : '1px solid var(--as-border)',
        boxShadow: isSelected ? 'var(--as-shadow-float)' : 'var(--as-shadow-soft)',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SafeImage
        src={images[imgIdx]}
        alt={`${property.title} — ${property.type || 'apartment'} in ${property.area || 'Asia'}${property.beds ? `, ${property.beds}` : ''}`}
        style={{ 
          width: '140px', 
          height: '140px', 
          objectFit: 'cover', 
          flexShrink: 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '0.5rem',
          display: 'flex',
          gap: '4px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '10px',
          padding: '3px 6px'
        }}>
          {images.map((_, idx) => (
            <div key={idx} style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: idx === imgIdx ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'background-color 0.3s ease'
            }} />
          ))}
        </div>
      )}

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
          fontSize: '0.8rem',
          lineHeight: '28px'
        }}
      >
        {isFavorite ? '♥' : '♡'}
      </button>

      <div style={{ padding: '0.85rem 0.85rem 0.85rem 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--as-accent)', letterSpacing: '0.05em' }}>
            {(property.area && property.area !== 'L' && property.area.length > 1) ? property.area.toUpperCase() : 'DA NANG'}
          </div>
          <h3 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.15rem', color: 'var(--as-text)', margin: '0.2rem 0' }}>
            {property.title}
          </h3>
          <div style={{ fontSize: '0.7rem', color: 'var(--as-text-muted)', lineHeight: 1.4 }}>
            {property.beds ? `${property.beds} · ` : ''}{property.propertyType || 'Apartment'} · {(property.area && property.area !== 'L' && property.area.length > 1) ? property.area : 'Da Nang'}
            {property.areaSqm ? ` · ${property.areaSqm} m²` : ''}{property.floor ? ` · fl. ${property.floor}` : ''}
            {property.feature ? ` · ${property.feature}` : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)' }}>
            {(property.address && property.address !== 'L' && property.address.length > 1) ? property.address : ((property.area && property.area !== 'L' && property.area.length > 1) ? property.area : 'Da Nang')}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--as-text)' }}>
            {convertPrice(property.price)}
            <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--as-text-muted)' }}> {t('perMonth')}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: '1rem', padding: '0.2rem 0.6rem', color: 'var(--as-accent)', fontWeight: 600 }}>✓ Direct</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(property);
                if (window.innerWidth < 900) {
                  const mapPane = document.querySelector('.results-map-pane');
                  if (mapPane && mapPane.classList.contains('mobile-only-hidden')) {
                    const event = new CustomEvent('switchToMap');
                    window.dispatchEvent(event);
                  }
                }
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