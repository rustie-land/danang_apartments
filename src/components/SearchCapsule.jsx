import { useState } from 'react';
import { useFilters } from '../FiltersContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const AMENITY_OPTS = ['#pool', '#ac', '#balcony', '#gym', '#pet', '#kitchen', '#sea', '#beach'];

function formatPrice(price) {
  if (!price) return 'Any';
  const num = Number(price);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

export default function SearchCapsule({ onSearch }) {
  const {
    bedrooms, setBedrooms,
    minPrice, setMinPrice, maxPrice, setMaxPrice,
    selectedCity, setSelectedCity,
    term, setTerm, pets, setPets, noCommission, setNoCommission, repair, setRepair,
    amenities, toggleAmenity,
    sortBy, setSortBy,
  } = useFilters();
  const [openSeg, setOpenSeg] = useState(null);

  const toggle = (seg) => setOpenSeg(openSeg === seg ? null : seg);
  const activeCount = (pets ? 1 : 0) + (noCommission ? 1 : 0) + (repair ? 1 : 0) + (term !== 'Any' ? 1 : 0) + amenities.length;

  // keyboard support: Enter/Space opens the segment
  const onKey = (e, seg) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(seg); }
  };

  const segProps = (seg) => ({
    className: `as-seg ${openSeg === seg ? 'open' : ''}`,
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e) => onKey(e, seg),
    'aria-expanded': openSeg === seg,
  });

  // Header click toggles the segment open/closed. The dropdown body stops
  // propagation so interacting with inputs/selects never collapses it.
  const segHeaderProps = (seg) => ({
    onClick: (e) => { e.stopPropagation(); toggle(seg); },
  });

  return (
    <div className="as-capsule-wrap">
      <div className="as-capsule" onClick={(e) => { if (!e.target.closest('.as-seg')) setOpenSeg(null); }}>
        {/* WHERE */}
        <div {...segProps('where')}>
          <div {...segHeaderProps('where')}>
            <label>Where</label>
            <div className="val">{selectedCity && selectedCity !== 'All' ? selectedCity : 'Da Nang, VN'}</div>
          </div>
          <AnimatePresence>
            {openSeg === 'where' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="as-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <h4>Location</h4>
                <input placeholder="City, district, metro, complex…" defaultValue={selectedCity !== 'All' ? selectedCity : ''} onChange={(e) => setSelectedCity(e.target.value || 'All')} onClick={(e) => e.stopPropagation()} />
                <div className="as-zoom-hint">⦿ Or pick area on map</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* WHEN */}
        <div {...segProps('when')}>
          <div {...segHeaderProps('when')}>
            <label>When</label>
            <div className="val muted">Flexible · long-term</div>
          </div>
          <AnimatePresence>
            {openSeg === 'when' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="as-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <h4>Move-in & Term</h4>
                <input type="text" placeholder="Move-in date (flexible)" onClick={(e) => e.stopPropagation()} />
                <div className="as-term-row">
                  {['1+mo', '6+mo', '1yr+'].map((t) => (
                    <button key={t} title="Minimum rental term" className={term === t ? 'on' : ''} onClick={(e) => { e.stopPropagation(); setTerm(term === t ? 'Any' : t); }}>{t}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HOME */}
        <div {...segProps('home')}>
          <div {...segHeaderProps('home')}>
            <label>Home</label>
            <div className="val">{bedrooms && bedrooms !== 'Any' ? `${bedrooms} rooms` : 'Any'} · {minPrice || '8M'}–{maxPrice || '25M'}</div>
          </div>
          <AnimatePresence>
            {openSeg === 'home' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="as-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <h4>Type & Budget / month</h4>
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} onClick={(e) => e.stopPropagation()}>
                  <option value="Any">Studio / Any</option>
                  <option value="1 Bed">1 room</option>
                  <option value="2 Beds">2 rooms</option>
                  <option value="3+ Beds">3+</option>
                </select>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)' }}>Price range</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--as-accent)' }}>{formatPrice(minPrice)} – {formatPrice(maxPrice)}</span>
                  </div>
                  <div style={{ position: 'relative', height: '32px' }}>
                    <input
                      type="range"
                      min="2000000"
                      max="60000000"
                      step="200000"
                      value={minPrice || 8000000}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), maxPrice - 200000);
                        setMinPrice(val);
                      }}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '4px',
                        background: 'transparent',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                    <input
                      type="range"
                      min="2000000"
                      max="60000000"
                      step="200000"
                      value={maxPrice || 25000000}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), minPrice + 200000);
                        setMaxPrice(val);
                      }}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '4px',
                        background: 'transparent',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MORE */}
        <div {...segProps('more')}>
          <div {...segHeaderProps('more')}>
            <label>More</label>
            <div className="val">{activeCount > 0 ? `${activeCount} selected` : 'Pets · amenities'}</div>
          </div>
          <AnimatePresence>
            {openSeg === 'more' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="as-dropdown"
                style={{ minWidth: '320px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h4>Preferences</h4>
                <div className="as-toggle-row">
                  <label className="as-toggle"><input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} onClick={(e) => e.stopPropagation()} /> 🐾 Pets allowed</label>
                  <label className="as-toggle"><input type="checkbox" checked={noCommission} onChange={(e) => setNoCommission(e.target.checked)} onClick={(e) => e.stopPropagation()} /> 🚫 No commission</label>
                  <label className="as-toggle"><input type="checkbox" checked={repair} onChange={(e) => setRepair(e.target.checked)} onClick={(e) => e.stopPropagation()} /> 🛠 Repair included</label>
                </div>
                <h4 style={{ marginTop: '1rem' }}>Amenities</h4>
                <div className="as-amenity-grid">
                  {AMENITY_OPTS.map((a) => (
                    <button key={a} className={amenities.includes(a) ? 'on' : ''} onClick={(e) => { e.stopPropagation(); toggleAmenity(a); }}>{a}</button>
                  ))}
                </div>
                <h4 style={{ marginTop: '1rem' }}>Sort by</h4>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--color-border-strong)', backgroundColor: '#fff', fontSize: '0.85rem' }}>
                  <option value="default">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="as-btn" onClick={onSearch}>🔍<span className="lbl">Find</span></button>
      </div>
    </div>
  );
}
