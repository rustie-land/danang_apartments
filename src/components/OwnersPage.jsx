import { Link } from 'react-router-dom';

export default function OwnersPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          — For Owners
        </div>
        <h1 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '3rem', color: 'var(--as-text)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          List your place, reach long-term tenants.
        </h1>
        <p style={{ color: 'var(--as-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Asia Stays connects you directly with renters looking for monthly stays across Asia. No agency fees, no middlemen — you keep control of your calendar and your tenants.
        </p>

        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {[
            ['1. Post in minutes', '[TEMPLATE] Add photos, price per month, deposit and utilities. Verified owners get a ✓ badge.'],
            ['2. Get matched', 'Tenants filter by city, term and amenities. Your listing appears to the right renters.'],
            ['3. Communicate directly', 'Chat with prospective tenants on-platform. No commission, ever.'],
          ].map(([t, d]) => (
            <div key={t} style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.3rem', color: 'var(--as-text)', fontWeight: 600 }}>{t}</div>
              <div style={{ color: 'var(--as-text-muted)', marginTop: '0.4rem' }}>{d}</div>
            </div>
          ))}
        </div>

        <button style={{ backgroundColor: 'var(--as-accent)', color: '#fff', border: 'none', padding: '0.85rem 1.75rem', borderRadius: 'var(--as-radius-pill)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
          [TEMPLATE] Become a host
        </button>
        <p style={{ color: 'var(--as-text-muted)', marginTop: '1rem', fontSize: '0.85rem' }}>
          Questions? <Link to="/contacts" style={{ color: 'var(--as-accent)' }}>Contact us →</Link>
        </p>
      </div>
    </div>
  );
}
