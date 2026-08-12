import SafeImage from './SafeImage.jsx';
import FilterForm from './FilterForm.jsx';
import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { t } = useLang();
  const { filterByPreferences, properties } = useFilters();
  const navigate = useNavigate();

  const totalFilteredCount = properties.filter(filterByPreferences).length;
  const goMap = () => navigate('/map');

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <section className="hero-grid">
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
            — {t('tagline')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.75rem', lineHeight: 1.1, color: 'var(--color-deep)', fontWeight: 600, margin: '0 0 1.5rem 0' }}>
            {t('heroTitle').split(' across ')[0]} <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>across {t('heroTitle').split(' across ')[1] || 'Asia'}</span>.
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '480px' }}>
            {t('heroSubtitle')}
          </p>
          <button
            onClick={goMap}
            style={{ backgroundColor: 'var(--color-deep)', color: 'var(--color-bg)', border: 'none', padding: '0.85rem 1.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >
            {t('browse')} ➔
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ width: '100%', height: '420px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            <SafeImage
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
              alt="Asia Stays hero"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', backgroundColor: 'var(--color-deep)', padding: '1.25rem', borderRadius: '1rem', color: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600 }}>{t('brand')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{t('heroSubtitle')}</div>
              </div>
              <button onClick={goMap} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                {t('selectZone')} ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="search-section" style={{ backgroundColor: 'var(--color-bg-alt)', padding: '5rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="filter-grid">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              — {t('filters')}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--color-deep)', lineHeight: 1.1, margin: '0 0 1rem 0' }}>
              {t('heroTitle')}
            </h2>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
              {t('selectAreaHint')}
            </p>
          </div>

          <FilterForm totalFilteredCount={totalFilteredCount} onNext={goMap} />
        </div>
      </section>
    </div>
  );
}
