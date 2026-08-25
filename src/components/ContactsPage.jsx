import { useState } from 'react';

export default function ContactsPage() {
  const [sent, setSent] = useState(false);
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--as-accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          — Contacts
        </div>
        <h1 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '3rem', color: 'var(--as-text)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Get in touch
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
            <div style={{ fontWeight: 600, color: 'var(--as-text)' }}><a href="mailto:savvin.rg@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>savvin.rg@gmail.com</a></div>
          </div>
          <div style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telegram</div>
            <div style={{ fontWeight: 600, color: 'var(--as-text)' }}><a href="https://t.me/MrBin_arenda" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>@MrBin_arenda</a></div>
          </div>
          <div style={{ backgroundColor: 'var(--as-surface)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cities</div>
            <div style={{ fontWeight: 600, color: 'var(--as-text)' }}>Da Nang · Pattaya · Phuket</div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ backgroundColor: '#fff', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-card)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.5rem', color: 'var(--as-text)', marginBottom: '1rem' }}>Send a message</h2>
          <input placeholder="Your name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--as-border)', marginBottom: '0.75rem', fontSize: '0.95rem' }} />
          <input type="email" placeholder="Email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--as-border)', marginBottom: '0.75rem', fontSize: '0.95rem' }} />
          <textarea placeholder="How can we help?" rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--as-border)', marginBottom: '0.75rem', fontSize: '0.95rem', fontFamily: 'inherit' }} />
          <button type="submit" style={{ backgroundColor: 'var(--as-accent)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--as-radius-pill)', fontWeight: 700, cursor: 'pointer' }}>
            {sent ? '✓ Sent' : 'Send message'}
          </button>
          {sent && <p style={{ color: 'var(--as-text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>Thanks! We'll get back to you via email or Telegram.</p>}
        </form>

        <p style={{ color: 'var(--as-text-muted)', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          Questions about a listing or the platform? Email savvin.rg@gmail.com or message @MrBin_arenda on Telegram.
        </p>
      </div>
    </div>
  );
}
