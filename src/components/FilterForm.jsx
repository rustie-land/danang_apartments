import { BEDROOM_OPTIONS, AMENITY_OPTIONS } from '../data/mockProperties.js';

export default function FilterForm({ bedrooms, setBedrooms, minPrice, setMinPrice, maxPrice, setMaxPrice, amenities, toggleAmenity, totalFilteredCount, onNext }) {
  const priceRangeInvalid = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          Спальни
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setBedrooms(opt)}
              aria-pressed={bedrooms === opt}
              style={{
                padding: '0.5rem 0',
                borderRadius: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                backgroundColor: bedrooms === opt ? 'var(--color-deep)' : 'var(--color-bg-alt)',
                color: bedrooms === opt ? '#fff' : '#4a5553',
                cursor: 'pointer'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          Диапазон цен (VND / мес)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input
            type="number"
            min="0"
            step="500000"
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-label="Минимальная цена"
            style={{ padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-alt)', fontSize: '0.85rem', color: 'var(--color-deep)', fontWeight: 600 }}
          />
          <input
            type="number"
            min="0"
            step="500000"
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="Максимальная цена"
            style={{ padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-alt)', fontSize: '0.85rem', color: 'var(--color-deep)', fontWeight: 600 }}
          />
        </div>
        {priceRangeInvalid && (
          <div role="alert" style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#b23b3b' }}>
            Минимальная цена больше максимальной — исправьте диапазон.
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.75rem', marginTop: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
          Удобства
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {AMENITY_OPTIONS.map((tag) => {
            const isSelected = amenities.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleAmenity(tag)}
                aria-pressed={isSelected}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--color-deep)' : 'var(--color-bg-alt)',
                  color: isSelected ? '#fff' : '#4a5553',
                  cursor: 'pointer'
                }}
              >
                {tag}
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
          padding: '0.8rem',
          borderRadius: '0.5rem',
          backgroundColor: priceRangeInvalid || totalFilteredCount === 0 ? 'var(--color-disabled)' : 'var(--color-deep)',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: priceRangeInvalid || totalFilteredCount === 0 ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {totalFilteredCount === 0 ? 'Нет объектов под эти фильтры' : `Далее: выбрать зону на карте (${totalFilteredCount}) ➔`}
      </button>
    </div>
  );
}