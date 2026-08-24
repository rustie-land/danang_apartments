import SafeImage from './SafeImage.jsx';
import FilterForm from './FilterForm.jsx';
import SearchCapsule from './SearchCapsule.jsx';
import QuickFilters from './QuickFilters.jsx';
import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { t } = useLang();
  const { filterByPreferences, properties, selectedCity } = useFilters();
  const navigate = useNavigate();

  const totalFilteredCount = properties.filter(filterByPreferences).length;
  const goResults = () => navigate('/results');
  const goMap = () => navigate('/map');

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <SearchCapsule onSearch={goResults} />
      <QuickFilters onAllFilters={goResults} />
      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--as-text-muted)', paddingBottom: '0.5rem' }}>
        {totalFilteredCount} {t('apartmentsAvailable') || 'apartments available'} {selectedCity && selectedCity !== 'All' ? `in ${selectedCity}` : 'across Asia'}
      </div>

      <section className="hero-grid">
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
            — {t('tagline')}
          </div>
          <h1 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '3.75rem', lineHeight: 1.1, color: 'var(--as-text)', fontWeight: 600, margin: '0 0 1.5rem 0' }}>
            {t('heroTitle').split(' across ')[0]} <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>across {t('heroTitle').split(' across ')[1] || 'Asia'}</span>.
          </h1>
          <p style={{ color: 'var(--as-text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '480px' }}>
            {t('heroSubtitle')}
          </p>
          <button
            onClick={goResults}
            style={{ backgroundColor: 'var(--as-accent)', color: '#fff', border: 'none', padding: '0.85rem 1.75rem', borderRadius: 'var(--as-radius-pill)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'transform .2s, background .2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--as-accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--as-accent)'; }}
          >
            Find rentals ➔
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ width: '100%', height: '420px', borderRadius: 'var(--as-radius-card)', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #E8DCC8 0%, #D9A679 55%, #B5623A 100%)', display: 'flex', alignItems: 'flex-end', padding: '1.5rem' }}>
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', backgroundColor: 'rgba(26,26,26,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', padding: '1.25rem', borderRadius: 'var(--as-radius-card)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.25rem', fontWeight: 600 }}>{t('brand')}</div>
                <div style={{ fontSize: '0.75rem', color: '#E8DCC8' }}>Verified · Direct · Monthly</div>
              </div>
              <button onClick={goMap} style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', padding: '0.5rem 0.85rem', borderRadius: 'var(--as-radius-pill)', fontSize: '0.75rem', cursor: 'pointer' }}>
                {t('selectZone')} ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="search-section" style={{ backgroundColor: 'var(--as-surface)', padding: '5rem 0', borderTop: '1px solid var(--as-border)', borderBottom: '1px solid var(--as-border)' }}>
        <div className="filter-grid">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              — {t('howItWorks') || 'How it works'}
            </div>
            <h2 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '2.5rem', color: 'var(--as-text)', lineHeight: 1.15, margin: '0 0 1rem 0' }}>
              {t('filtersTitle') || 'Refine your search'}
            </h2>
            <p style={{ color: 'var(--as-text-muted)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
              {t('selectAreaHint')}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              ['1', 'Search', 'Filter by city, move-in date, term, rooms and budget.'],
              ['2', 'Pick an area', 'Pan the map and choose your zone — only relevant stays show.'],
              ['3', 'Contact owner', 'Message verified owners directly. No agencies, no fees.'],
            ].map(([n, t1, d]) => (
              <div key={n} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', backgroundColor: '#fff', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.1rem' }}>
                <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--as-accent)', flexShrink: 0, width: '2rem' }}>{n}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--as-text)', marginBottom: '0.25rem' }}>{t1}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--as-text-muted)', lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
