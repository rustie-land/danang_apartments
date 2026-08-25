import { useEffect, useRef, useState } from 'react';
import SafeImage from './SafeImage.jsx';
import { useLang } from '../LanguageContext.jsx';

function ImageCarousel({ images }) {
  const imgs = images && images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(imgs.length - 1, 0));
  const touchX = useRef(null);

  // Автопрокрутка (только если больше 1 фото)
  useEffect(() => {
    if (imgs.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % imgs.length);
    }, 4000);
    return () => clearInterval(id);
  }, [imgs.length]);

  const go = (dir) => {
    setIndex((i) => (i + dir + imgs.length) % imgs.length);
  };

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  if (imgs.length === 0) return null;

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '260px', backgroundColor: '#000', touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <SafeImage
        src={imgs[safeIndex]}
        alt={`Фото ${safeIndex + 1}`}
        style={{ width: '100%', height: '260px', objectFit: 'cover' }}
      />

      {imgs.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Предыдущее фото"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', zIndex: 5 }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Следующее фото"
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', zIndex: 5 }}
          >
            ›
          </button>
          <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.35rem', zIndex: 5 }}>
            {imgs.map((_, i) => (
              <span
                key={i}
                style={{ width: i === safeIndex ? '18px' : '7px', height: '7px', borderRadius: '9999px', backgroundColor: i === safeIndex ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width 0.2s' }}
              />
            ))}
          </div>
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', zIndex: 5 }}>
            {safeIndex + 1} / {imgs.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function PropertyModal({ property, onClose, convertPrice, t: tProp }) {
  const { t } = useLang();
  const T = tProp || t;
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

        <ImageCarousel images={property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls : [property.img]} />

        <div style={{ padding: '1.75rem 1.75rem 2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
            {property.area ? property.area.toUpperCase() : 'ASIA'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-deep)', margin: '0.25rem 0 0.5rem 0' }}>
            {property.title}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>📍 {property.address}</div>

          <p style={{ color: 'var(--as-text)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{property.desc || 'No description provided.'}</p>

          {/* Key terms (long-term) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '0.75rem' }}>
              <div title="Refundable security deposit (typically 1 month rent)" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-muted)' }}>Deposit</div>
              <div style={{ fontWeight: 700, color: 'var(--as-text)' }}>{property.deposit ? convertPrice(property.deposit) : 'Contact owner'}</div>
            </div>
            <div style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-muted)' }}>Utilities</div>
              <div style={{ fontWeight: 700, color: 'var(--as-text)' }}>{property.utilities || 'Contact owner'}</div>
            </div>
            <div style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-muted)' }}>Min term</div>
              <div style={{ fontWeight: 700, color: 'var(--as-text)' }}>{property.minTerm || 'Flexible'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {property.amenities.map((a) => (
              <span key={a} style={{ backgroundColor: 'var(--as-surface)', color: 'var(--as-text)', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--as-border)' }}>
                {a}
              </span>
            ))}
          </div>

          {/* Host profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '0.85rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#D9A679,#C77B4E)', flexShrink: 0 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--as-text)' }}>{property.host || 'Verified owner'} <span style={{ fontSize: '0.7rem', color: 'var(--as-accent)', fontWeight: 600 }}>✓ Verified owner</span></div>
              <div style={{ fontSize: '0.78rem', color: 'var(--as-text-muted)' }}>{property.hostStats || 'Responds within 2h · 28 stays hosted'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--as-border)', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--as-text-muted)', textTransform: 'uppercase' }}>{T('rentPerMonth')}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--as-text)' }}>{convertPrice(property.price)} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>{T('perMonth')}</span></div>
            </div>

            <button
              onClick={() => {
                const msg = encodeURIComponent(`Hi! I'm interested in "${property.title}" (${convertPrice(property.price)}/mo). Is it still available?`);
                window.open(`https://t.me/ainavii?text=${msg}`, '_blank');
              }}
              style={{ backgroundColor: 'var(--as-accent)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--as-radius-pill)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {T('contact')}
            </button>
            <a href="mailto:savvin.rg@gmail.com?subject=Asia Stays inquiry" style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)', textDecoration: 'underline', marginLeft: '0.5rem' }}>or email</a>
          </div>
        </div>
      </div>
    </div>
  );
}