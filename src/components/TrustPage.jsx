const POINTS = [
  ['✓ Verified owners', 'ID and phone checks. Look for the ✓ Verified badge on profiles and listings.'],
  ['⭐ Two-way reviews', 'Renters and owners rate each other after each stay — accountability on both sides.'],
  ['💬 On-platform messaging', 'Keep all communication inside Asia Stays so we can help if something goes wrong.'],
  ['🛡️ Dispute resolution', 'Our team mediates conflicts with evidence from both parties.'],
  ['🚫 Off-platform warning', 'Never pay or share documents outside Asia Stays. Scammers ask to move to phone/email early — report them.'],
];

export default function TrustPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          — Trust & Safety
        </div>
        <h1 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '3rem', color: 'var(--as-text)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Rent with confidence
        </h1>
        <p style={{ color: 'var(--as-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Asia Stays is built on direct, transparent relationships between renters and owners. Here is how we keep it safe.
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {POINTS.map(([t, d]) => (
            <div key={t} style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.3rem', color: 'var(--as-text)', fontWeight: 600 }}>{t}</div>
              <div style={{ color: 'var(--as-text-muted)', marginTop: '0.4rem' }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--as-text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
          Need help? <a href="/contacts" style={{ color: 'var(--as-accent)' }}>Contact support →</a>
        </p>
      </div>
    </div>
  );
}
