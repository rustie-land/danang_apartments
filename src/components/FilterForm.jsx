import { useFilters } from '../FiltersContext.jsx';
import { useLang } from '../LanguageContext.jsx';
import { BEDROOM_OPTIONS, AMENITY_OPTIONS } from '../i18n.js';

export default function FilterForm({ totalFilteredCount, onNext }) {
  const { t } = useLang();
  const { bedrooms, setBedrooms, minPrice, setMinPrice, maxPrice, setMaxPrice, amenities, toggleAmenity } = useFilters();
  const priceRangeInvalid = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          {t('bedrooms')}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBedrooms(opt.value)}
              aria-pressed={bedrooms === opt.value}
              style={{
                padding: '0.5rem 0',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                backgroundColor: bedrooms === opt.value ? 'var(--as-accent)' : 'var(--as-surface)',
                color: bedrooms === opt.value ? '#fff' : 'var(--as-text-muted)',
                cursor: 'pointer'
              }}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          {t('priceRange')}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input
            type="number"
            min="0"
            step="500000"
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-label="min"
            style={{ padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-alt)', fontSize: '0.9rem', color: 'var(--color-deep)', fontWeight: 600 }}
          />
          <input
            type="number"
            min="0"
            step="500000"
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="max"
            style={{ padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-alt)', fontSize: '0.9rem', color: 'var(--color-deep)', fontWeight: 600 }}
          />
        </div>
        {priceRangeInvalid && (
          <div role="alert" style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#b23b3b' }}>
            {t('priceInvalid')}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.75rem', marginTop: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          {t('amenities')}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {AMENITY_OPTIONS.map((a) => {
            const isSelected = amenities.includes(a.tag);
            return (
              <button
                key={a.tag}
                onClick={() => toggleAmenity(a.tag)}
                aria-pressed={isSelected}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--as-accent)' : 'var(--as-surface)',
                  color: isSelected ? '#fff' : 'var(--as-text-muted)',
                  cursor: 'pointer'
                }}
              >
                {a.tag}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={priceRangeInvalid || totalFilteredCount === 0}
        style={{
          width: '100%',
          padding: '0.9rem',
          borderRadius: '0.5rem',
          backgroundColor: priceRangeInvalid || totalFilteredCount === 0 ? 'var(--as-text-muted)' : 'var(--as-accent)',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: '0.95rem',
          cursor: priceRangeInvalid || totalFilteredCount === 0 ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {totalFilteredCount === 0 ? t('noMatches') : `${t('next')} (${totalFilteredCount}) ➔`}
      </button>
    </div>
  );
}
