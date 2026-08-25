const FAQ = [
  { q: 'How does payment work for long-term stays?', a: 'Rent is paid monthly to the owner. Asia Stays holds no deposit unless agreed. We recommend a written lease for stays over 6 months.' },
  { q: 'Are utilities (electricity, water, internet) included?', a: 'Each listing shows whether utilities are included in the monthly price. Use the "Utilities included" filter to see only those.' },
  { q: 'What is the minimum lease term?', a: 'Most listings start at 1 month. Use the Term filter (1+ mo / 6+ mo / 1 yr+) to match your plans.' },
  { q: 'Is the owner verified?', a: 'Verified owners pass ID and phone checks. Look for the ✓ Verified badge on the listing and host profile.' },
  { q: 'Can I bring pets?', a: 'Use the "Pets" quick filter. Each listing states its pet policy (cats / small dogs / large dogs).' },
  { q: 'How do I contact the owner?', a: 'Open a listing and tap "Contact owner". You can message directly — keep communication on-platform for safety.' },
  { q: 'Can I cancel or shorten my lease?', a: 'Cancellation terms are set per listing. Always confirm the policy with the owner before moving in.' },
];

export default function FAQPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          — FAQ
        </div>
        <h1 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '3rem', color: 'var(--as-text)', lineHeight: 1.1, marginBottom: '2rem' }}>
          Frequently asked questions
        </h1>
        <div>
          {FAQ.map((item, i) => (
            <details key={i} style={{ borderBottom: '1px solid var(--as-border)', padding: '1.25rem 0' }}>
              <summary style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.2rem', color: 'var(--as-text)', cursor: 'pointer', fontWeight: 600 }}>
                {item.q}
              </summary>
              <p style={{ color: 'var(--as-text-muted)', lineHeight: 1.6, marginTop: '0.75rem' }}>{item.a}</p>
            </details>
          ))}
        </div>
        <p style={{ color: 'var(--as-text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
          Didn't find your answer? <a href="/contacts" style={{ color: 'var(--as-accent)' }}>Contact support →</a>
        </p>
      </div>
    </div>
  );
}
