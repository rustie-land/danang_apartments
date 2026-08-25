import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--as-text)', color: '#EDE8DF', padding: '3rem 1.5rem 2rem', marginTop: '4rem', fontSize: '0.9rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--as-font-serif)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Asia Stays</div>
          <p style={{ color: '#cfc7ba', lineHeight: 1.6 }}>Long-term rentals across Asia. Direct from owners, no agencies, no fees.</p>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89e8e', marginBottom: '0.75rem' }}>Explore</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/" style={{ color: '#EDE8DF', textDecoration: 'none' }}>Stays</Link>
            <Link to="/about" style={{ color: '#EDE8DF', textDecoration: 'none' }}>About</Link>
            <Link to="/owners" style={{ color: '#EDE8DF', textDecoration: 'none' }}>For Owners</Link>
            <Link to="/trust" style={{ color: '#EDE8DF', textDecoration: 'none' }}>Trust & Safety</Link>
            <Link to="/faq" style={{ color: '#EDE8DF', textDecoration: 'none' }}>FAQ</Link>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89e8e', marginBottom: '0.75rem' }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#EDE8DF' }}>
            <span>✉ savvin.rg@gmail.com</span>
            <span>💬 @MrBin_arenda</span>
            <Link to="/contacts" style={{ color: '#EDE8DF' }}>Contact form →</Link>
            <span style={{ color: '#cfc7ba' }}>Da Nang · Pattaya · Phuket</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89e8e', marginBottom: '0.75rem' }}>Cities</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#EDE8DF' }}>
            <span>Da Nang, VN</span>
            <span>Pattaya, TH</span>
            <span>Phuket, TH</span>
            <span>Hai Phong, VN</span>
          </div>
        </div>
      </div>

      {/* Trust block */}
      <div style={{ maxWidth: '1280px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: '0.8rem', color: '#cfc7ba', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <span>🛡️ Keep communication on-platform. Never pay or share documents outside Asia Stays.</span>
        <span>© 2026 Asia Stays · Da Nang · Pattaya · Phuket</span>
      </div>
    </footer>
  );
}
