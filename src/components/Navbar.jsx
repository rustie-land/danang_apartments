import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { BEDROOM_OPTIONS, AMENITY_OPTIONS } from '../i18n.js';

function FilterPopover({ onClose }) {
  const { t } = useLang();
  const { bedrooms, setBedrooms, minPrice, setMinPrice, maxPrice, setMaxPrice, amenities, toggleAmenity, term, setTerm, pets, setPets, noCommission, setNoCommission, repair, setRepair, selectedCity, setSelectedCity } = useFilters();
  const ref = useRef(null);

  const clearAll = () => {
    setBedrooms('Any'); setMinPrice('0'); setMaxPrice('25000000');
    amenities.forEach((a) => toggleAmenity(a));
    setTerm('Any'); setPets(false); setNoCommission(false); setRepair(false); setSelectedCity('All');
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--as-text)' }}>{t('allFilters') || 'Filters'}</div>
        <button onClick={clearAll} style={{ fontSize: '0.75rem', color: 'var(--as-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('clearAll') || 'Clear all'}</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>{t('bedrooms')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBedrooms(opt.value)}
              style={{ padding: '0.4rem 0.7rem', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', backgroundColor: bedrooms === opt.value ? 'var(--as-accent)' : 'var(--as-surface)', color: bedrooms === opt.value ? '#fff' : 'var(--as-text)', cursor: 'pointer' }}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>{t('priceRange')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} aria-label="min" style={{ padding: '0.5rem 0.7rem', borderRadius: '0.4rem', border: `1px solid ${Number(minPrice) > Number(maxPrice) && maxPrice ? 'var(--as-accent)' : 'var(--as-border)'}`, backgroundColor: 'var(--as-surface)', fontSize: '0.85rem', color: 'var(--as-text)', fontWeight: 600 }} />
          <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="max" style={{ padding: '0.5rem 0.7rem', borderRadius: '0.4rem', border: `1px solid ${Number(maxPrice) < Number(minPrice) && minPrice ? 'var(--as-accent)' : 'var(--as-border)'}`, backgroundColor: 'var(--as-surface)', fontSize: '0.85rem', color: 'var(--as-text)', fontWeight: 600 }} />
        </div>
        {Number(minPrice) > Number(maxPrice) && maxPrice > 0 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--as-accent)', marginTop: '0.3rem' }}>Min should be ≤ max</div>
        )}
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', margin: '0.75rem 0 0.4rem', letterSpacing: '0.05em' }}>{t('amenities')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {AMENITY_OPTIONS.map((a) => {
            const sel = amenities.includes(a.tag);
            return (
              <button
                key={a.tag}
                onClick={() => toggleAmenity(a.tag)}
                style={{ padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, border: 'none', backgroundColor: sel ? 'var(--as-accent)' : 'var(--as-surface)', color: sel ? '#fff' : 'var(--as-text)', cursor: 'pointer' }}
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
      <button onClick={() => setOpen((o) => !o)} style={{ border: '1px solid var(--as-border)', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--as-surface)', color: 'var(--as-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        🌆 {selectedCity === 'All' ? t('allCities') : selectedCity} ▾
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: 'var(--as-shadow-float)', padding: '0.4rem', minWidth: '160px', zIndex: 3000 }}>
          {cities.map((c) => (
            <button key={c} onClick={() => { setSelectedCity(c); setOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: selectedCity === c ? 'var(--as-surface)' : 'transparent', color: 'var(--as-text)', padding: '0.45rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.8rem', fontWeight: selectedCity === c ? 700 : 400, cursor: 'pointer' }}>
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
        backgroundColor: 'rgba(253,251,247,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--as-border)',
        color: 'var(--as-text)',
        boxShadow: '0 2px 10px rgba(26,26,26,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.7rem 1.5rem', position: 'relative' }}>
        <Link to="/" style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--as-text)', textDecoration: 'none', cursor: 'pointer', flexShrink: 0 }}>
          {t('brand')}
        </Link>

        <div className="nav-links" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
          <Link to="/about" style={{ color: 'var(--as-text)', textDecoration: 'none' }}>About</Link>
          <Link to="/owners" style={{ color: 'var(--as-text)', textDecoration: 'none' }}>Owners</Link>
          <Link to="/trust" style={{ color: 'var(--as-text)', textDecoration: 'none' }}>Trust</Link>
          <Link to="/faq" style={{ color: 'var(--as-text)', textDecoration: 'none' }}>FAQ</Link>
          <Link to="/contacts" style={{ color: 'var(--as-accent)', textDecoration: 'none' }}>Contacts</Link>
        </div>

        <div className="nav-tools" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <CityDropdown />
          <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: 'var(--as-surface)', borderRadius: '0.5rem', padding: '0.2rem' }}>
            {['VND', 'USD', 'THB'].map((cur) => (
              <button key={cur} onClick={() => setCurrency(cur)} style={{ border: 'none', borderRadius: '0.35rem', padding: '0.35rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: currency === cur ? 'var(--as-accent)' : 'transparent', color: currency === cur ? '#fff' : 'var(--as-text)' }}>{cur}</button>
            ))}
          </div>

          <button className="mobile-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" style={{ display: 'none', border: '1px solid var(--as-border)', backgroundColor: '#fff', color: 'var(--as-text)', borderRadius: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '1rem', cursor: 'pointer' }}>☰</button>

          <div className="navbar-tools" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setPopover((p) => !p)} style={{ border: '1px solid var(--as-border)', borderRadius: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#fff', color: 'var(--as-text)' }}>{t('allFilters')}</button>
            <button onClick={toggle} style={{ border: '1px solid var(--as-border)', borderRadius: '0.4rem', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--as-text)' }}>{lang === 'en' ? 'RU' : 'EN'}</button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-nav-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'rgba(253,251,247,0.98)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--as-border)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 999 }}>
            <Link to="/about" onClick={() => setMenuOpen(false)} style={{ color: 'var(--as-text)', textDecoration: 'none', fontWeight: 600 }}>About</Link>
            <Link to="/owners" onClick={() => setMenuOpen(false)} style={{ color: 'var(--as-text)', textDecoration: 'none', fontWeight: 600 }}>Owners</Link>
            <Link to="/trust" onClick={() => setMenuOpen(false)} style={{ color: 'var(--as-text)', textDecoration: 'none', fontWeight: 600 }}>Trust</Link>
            <Link to="/faq" onClick={() => setMenuOpen(false)} style={{ color: 'var(--as-text)', textDecoration: 'none', fontWeight: 600 }}>FAQ</Link>
            <Link to="/contacts" onClick={() => setMenuOpen(false)} style={{ color: 'var(--as-accent)', textDecoration: 'none', fontWeight: 600 }}>Contacts</Link>
          </div>
        )}

        <style>{`
          .nav-links{display:none!important}
          .navbar-tools{display:none!important}
          .mobile-burger{display:flex!important}
          @media(min-width:1024px){
            .nav-links{display:flex!important}
            .navbar-tools{display:flex!important}
            .mobile-burger{display:none!important}
            .mobile-nav-menu{display:none!important}
          }
        `}</style>
      </div>

      {popover && <FilterPopover onClose={() => setPopover(false)} />}
    </header>
  );
}
