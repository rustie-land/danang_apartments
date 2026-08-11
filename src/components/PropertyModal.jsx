import { useEffect, useRef } from 'react';
import SafeImage from './SafeImage.jsx';

export default function PropertyModal({ property, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!property) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Детали объекта: ${property.title}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-strong)', position: 'relative' }}
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Закрыть окно с деталями"
          style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, zIndex: 10 }}
        >
          ✕
        </button>

        <SafeImage src={property.img} alt={property.title} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />

        <div style={{ padding: '1.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
            {property.area ? property.area.toUpperCase() : 'ASIA'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-deep)', margin: '0.25rem 0 0.5rem 0' }}>
            {property.title}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>📍 {property.address}</div>

          <p style={{ color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{property.desc}</p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {property.amenities.map((a) => (
              <span key={a} style={{ backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-deep)', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                {a}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Аренда в месяц</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-deep)' }}>{property.price.toLocaleString('ru-RU')} VND</div>
            </div>

            <button
              onClick={() => alert('Связываемся с менеджером по объекту: ' + property.title)}
              style={{ backgroundColor: 'var(--color-deep)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Связаться с менеджером
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}