import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          — About Asia Stays
        </div>
        <h1 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '3rem', color: 'var(--as-text)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Long-term rentals across Asia, direct from owners.
        </h1>
        <p style={{ color: 'var(--as-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Asia Stays is a peer-to-peer marketplace for monthly and long-term apartment rentals in Da Nang, Pattaya, Phuket and beyond. We connect renters directly with property owners — no agencies, no hidden fees.
        </p>
        <p style={{ color: 'var(--as-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--as-text)' }}>[TEMPLATE]</strong> Our mission is to make moving abroad simple and trustworthy. [Add founding story, team, geography, milestones here.]
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', margin: '2rem 0' }}>
          {[['Cities', '6 APAC hubs'], ['Listings', '1,200+ verified'], ['Owners', '380 direct'], ['Avg. stay', '5.4 months']].map(([k, v]) => (
            <div key={k} style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.8rem', color: 'var(--as-accent)' }}>{v}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--as-text-muted)' }}>{k}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/owners" style={{ color: 'var(--as-accent)', fontWeight: 600, marginRight: '1.5rem' }}>List your place →</Link>
          <Link to="/contacts" style={{ color: 'var(--as-accent)', fontWeight: 600 }}>Contact us →</Link>
        </div>
      </div>
    </div>
  );
}
