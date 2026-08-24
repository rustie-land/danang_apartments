import { useState } from 'react';
import { useFilters } from '../FiltersContext.jsx';

export default function SearchCapsule({ onSearch }) {
  const { bedrooms, setBedrooms, minPrice, setMinPrice, maxPrice, setMaxPrice, selectedCity, setSelectedCity } = useFilters();
  const [openSeg, setOpenSeg] = useState(null);

  const toggle = (seg) => setOpenSeg(openSeg === seg ? null : seg);

  return (
    <div className="as-capsule-wrap">
      <div className="as-capsule" onClick={(e) => { if (!e.target.closest('.as-seg')) setOpenSeg(null); }}>
        {/* WHERE */}
        <div className={`as-seg ${openSeg === 'where' ? 'open' : ''}`} onClick={() => toggle('where')}>
          <label>Where</label>
          <div className="val">{selectedCity && selectedCity !== 'All' ? selectedCity : 'Da Nang, VN'}</div>
          <div className="as-dropdown">
            <h4>Location</h4>
            <input placeholder="City, district, metro, complex…" defaultValue={selectedCity !== 'All' ? selectedCity : ''} onChange={(e) => setSelectedCity(e.target.value || 'All')} />
            <div className="as-zoom-hint">⦿ Or pick area on map</div>
          </div>
        </div>

        {/* WHEN */}
        <div className={`as-seg ${openSeg === 'when' ? 'open' : ''}`} onClick={() => toggle('when')}>
          <label>When</label>
          <div className="val muted">Flexible · long-term</div>
          <div className="as-dropdown">
            <h4>Move-in & Term</h4>
            <input type="text" placeholder="Move-in date (flexible)" />
            <div className="as-term-row">
              <button className="on">1+ mo</button>
              <button>6+ mo</button>
              <button>1 yr+</button>
            </div>
          </div>
        </div>

        {/* HOME */}
        <div className={`as-seg ${openSeg === 'home' ? 'open' : ''}`} onClick={() => toggle('home')}>
          <label>Home</label>
          <div className="val">{bedrooms && bedrooms !== 'Any' ? `${bedrooms} rooms` : 'Any'} · {minPrice || '8M'}–{maxPrice || '25M'}</div>
          <div className="as-dropdown">
            <h4>Type & Budget / month</h4>
            <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
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
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ width: '45%', display: 'inline-block', marginRight: '5%' }} />
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: '45%', display: 'inline-block' }} />
          </div>
        </div>

        <button className="as-btn" onClick={onSearch}>🔍<span className="lbl">Find</span></button>
      </div>
    </div>
  );
}
