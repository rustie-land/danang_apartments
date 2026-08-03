import SafeImage from './SafeImage.jsx';
import FilterForm from './FilterForm.jsx';

export default function LandingPage({ filterProps, totalFilteredCount, onGoToMap }) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <nav className="navbar" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-deep)' }}>
          Da Nang <span style={{ fontWeight: 400, fontStyle: 'italic' }}>Apartments</span>
        </div>
        <button
          onClick={onGoToMap}
          style={{ backgroundColor: 'var(--color-deep)', color: 'var(--color-bg)', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Выбрать зону поиска ➔
        </button>
      </nav>

      <section className="hero-grid">
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
            — ДОЛГОСРОЧНАЯ АРЕНДА В ДА НАНГЕ
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.75rem', lineHeight: 1.1, color: 'var(--color-deep)', fontWeight: 600, margin: '0 0 1.5rem 0' }}>
            Квартира, в которую <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>захочется возвращаться</span>.
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '480px' }}>
            Задайте бюджет и пожелания, затем изучите доступные варианты прямо на карте в выбранной вами зоне.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ width: '100%', height: '420px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            <SafeImage
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
              alt="Панорама пляжа Дананга"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', backgroundColor: 'var(--color-deep)', padding: '1.25rem', borderRadius: '1rem', color: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600 }}>My Khe & Son Tra</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>Пляжные и тихие жилые районы</div>
              </div>
              <button onClick={onGoToMap} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                Открыть карту ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="search-section" style={{ backgroundColor: 'var(--color-bg-alt)', padding: '5rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="filter-grid">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              — ШАГ 1 / ПРЕДПОЧТЕНИЯ
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--color-deep)', lineHeight: 1.1, margin: '0 0 1rem 0' }}>
              Задайте нужные <br />
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>параметры</span>.
            </h2>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              На следующем шаге вы выберете зону на интерактивной карте — список объектов обновится в реальном времени.
            </p>
          </div>

          <FilterForm {...filterProps} totalFilteredCount={totalFilteredCount} onNext={onGoToMap} />
        </div>
      </section>
    </div>
  );
}