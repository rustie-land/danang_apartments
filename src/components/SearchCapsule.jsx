import { useState } from 'react';
import { useFilters } from '../FiltersContext.jsx';

const AMENITY_OPTS = ['#pool', '#ac', '#balcony', '#gym', '#pet', '#kitchen', '#sea', '#beach'];

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
          <div className="as-dropdown" onClick={(e) => e.stopPropagation()}>
            <h4>Location</h4>
            <input placeholder="City, district, metro, complex…" defaultValue={selectedCity !== 'All' ? selectedCity : ''} onChange={(e) => setSelectedCity(e.target.value || 'All')} onClick={(e) => e.stopPropagation()} />
            <div className="as-zoom-hint">⦿ Or pick area on map</div>
          </div>
        </div>

        {/* WHEN */}
        <div {...segProps('when')}>
          <div {...segHeaderProps('when')}>
            <label>When</label>
            <div className="val muted">Flexible · long-term</div>
          </div>
          <div className="as-dropdown" onClick={(e) => e.stopPropagation()}>
            <h4>Move-in & Term</h4>
            <input type="text" placeholder="Move-in date (flexible)" onClick={(e) => e.stopPropagation()} />
            <div className="as-term-row">
              {['1+mo', '6+mo', '1yr+'].map((t) => (
                <button key={t} title="Minimum rental term" className={term === t ? 'on' : ''} onClick={(e) => { e.stopPropagation(); setTerm(term === t ? 'Any' : t); }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* HOME */}
        <div {...segProps('home')}>
          <div {...segHeaderProps('home')}>
            <label>Home</label>
            <div className="val">{bedrooms && bedrooms !== 'Any' ? `${bedrooms} rooms` : 'Any'} · {minPrice || '8M'}–{maxPrice || '25M'}</div>
          </div>
          <div className="as-dropdown" onClick={(e) => e.stopPropagation()}>
            <h4>Type & Budget / month</h4>
            <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} onClick={(e) => e.stopPropagation()}>
              <option value="Any">Studio / Any</option>
              <option value="1 Bed">1 room</option>
              <option value="2 Beds">2 rooms</option>
              <option value="3+ Beds">3+</option>
            </select>
            <div className="as-hist">
              <span style={{ height: '30%' }}></span><span style={{ height: '55%' }}></span>
              <span style={{ height: '70%' }} className="hot"></span><span style={{ height: '90%' }} className="hot"></span>
              <span style={{ height: '60%' }}></span><span style={{ height: '40%' }}></span><span style={{ height: '25%' }}></span>
            </div>
            <div className="as-zoom-hint">8M – 25M VND / mo · drag to adjust</div>
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} onInput={(e) => setMinPrice(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: '45%', display: 'inline-block', marginRight: '5%' }} />
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onInput={(e) => setMaxPrice(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: '45%', display: 'inline-block' }} />
          </div>
        </div>

        {/* MORE */}
        <div {...segProps('more')}>
          <div {...segHeaderProps('more')}>
            <label>More</label>
            <div className="val">{activeCount > 0 ? `${activeCount} selected` : 'Pets · amenities'}</div>
          </div>
          <div className="as-dropdown" style={{ minWidth: '320px' }} onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>

        <button className="as-btn" onClick={onSearch}>🔍<span className="lbl">Find</span></button>
      </div>
    </div>
  );
}
