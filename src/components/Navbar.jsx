import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { BEDROOM_OPTIONS, AMENITY_OPTIONS } from '../i18n.js';

function FilterPopover({ onClose }) {
  const { t } = useLang();
  const { bedrooms, setBedrooms, minPrice, setMinPrice, maxPrice, setMaxPrice, amenities, toggleAmenity } = useFilters();
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '110%',
        right: 0,
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: 'var(--shadow-strong)',
        padding: '1.25rem',
        width: 'min(92vw, 340px)',
        zIndex: 3000,
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>{t('bedrooms')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBedrooms(opt.value)}
              style={{ padding: '0.4rem 0.7rem', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', backgroundColor: bedrooms === opt.value ? 'var(--color-deep)' : 'var(--color-bg-alt)', color: bedrooms === opt.value ? '#fff' : '#4a5553', cursor: 'pointer' }}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>{t('priceRange')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} aria-label="min" style={{ padding: '0.5rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-alt)', fontSize: '0.85rem', color: 'var(--color-deep)', fontWeight: 600 }} />
          <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="max" style={{ padding: '0.5rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-alt)', fontSize: '0.85rem', color: 'var(--color-deep)', fontWeight: 600 }} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>{t('amenities')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {AMENITY_OPTIONS.map((a) => {
            const sel = amenities.includes(a.tag);
            return (
              <button
                key={a.tag}
                onClick={() => toggleAmenity(a.tag)}
                style={{ padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, border: 'none', backgroundColor: sel ? 'var(--color-deep)' : 'var(--color-bg-alt)', color: sel ? '#fff' : '#4a5553', cursor: 'pointer' }}
              >
                {a.tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CityDropdown() {
  const { t } = useLang();
  const { selectedCity, setSelectedCity, cities } = useFilters();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} style={{ border: '1px solid var(--color-border-strong)', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-deep)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        🌆 {selectedCity === 'All' ? t('allCities') : selectedCity} ▾
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: 'var(--shadow-strong)', padding: '0.4rem', minWidth: '160px', zIndex: 3000 }}>
          {cities.map((c) => (
            <button key={c} onClick={() => { setSelectedCity(c); setOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: selectedCity === c ? 'var(--color-bg-alt)' : 'transparent', color: 'var(--color-deep)', padding: '0.45rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.8rem', fontWeight: selectedCity === c ? 700 : 400, cursor: 'pointer' }}>
              {c === 'All' ? t('allCities') : c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const { currency, setCurrency } = useFilters();
  const [popover, setPopover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-deep)',
        color: 'var(--color-bg)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.6rem 1.5rem' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-bg)', textDecoration: 'none', cursor: 'pointer' }}>
          {t('brand')}
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <CityDropdown />
          <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.2rem' }}>
            {['VND', 'USD', 'THB'].map((cur) => (
              <button key={cur} onClick={() => setCurrency(cur)} style={{ border: 'none', borderRadius: '0.35rem', padding: '0.35rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: currency === cur ? 'var(--color-bg)' : 'transparent', color: currency === cur ? 'var(--color-deep)' : 'var(--color-bg)' }}>
                {cur}
              </button>
            ))}
          </div>

          <button className="mobile-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" style={{ display: 'none', border: 'none', backgroundColor: 'rgba(255,255,255,0.12)', color: 'var(--color-bg)', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '1rem', cursor: 'pointer' }}>
            ☰
          </button>

          <div className={`navbar-tools${menuOpen ? ' menu-open' : ''}`} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setPopover((p) => !p)} style={{ border: 'none', borderRadius: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--color-bg)', color: 'var(--color-deep)' }}>
              {t('allFilters')}
            </button>
            <button onClick={toggle} style={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.4rem', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--color-bg)' }}>
              {lang === 'en' ? 'RU' : 'EN'}
            </button>
          </div>
        </div>
      </div>

      {popover && <FilterPopover onClose={() => setPopover(false)} />}
    </header>
  );
}
