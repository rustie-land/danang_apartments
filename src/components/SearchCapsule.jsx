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
  } = useFilters();
  const [openSeg, setOpenSeg] = useState(null);

  const toggle = (seg) => setOpenSeg(openSeg === seg ? null : seg);
  const activeCount = (pets ? 1 : 0) + (noCommission ? 1 : 0) + (repair ? 1 : 0) + (term !== 'Any' ? 1 : 0) + amenities.length;

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
              {['1+mo', '6+mo', '1yr+'].map((t) => (
                <button key={t} className={term === t ? 'on' : ''} onClick={() => setTerm(term === t ? 'Any' : t)}>{t}</button>
              ))}
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

        {/* MORE */}
        <div className={`as-seg ${openSeg === 'more' ? 'open' : ''}`} onClick={() => toggle('more')}>
          <label>More</label>
          <div className="val">{activeCount > 0 ? `${activeCount} selected` : 'Pets · amenities'}</div>
          <div className="as-dropdown" style={{ minWidth: '320px' }}>
            <h4>Preferences</h4>
            <div className="as-toggle-row">
              <label className="as-toggle"><input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} /> 🐾 Pets allowed</label>
              <label className="as-toggle"><input type="checkbox" checked={noCommission} onChange={(e) => setNoCommission(e.target.checked)} /> 🚫 No commission</label>
              <label className="as-toggle"><input type="checkbox" checked={repair} onChange={(e) => setRepair(e.target.checked)} /> 🛠 Repair included</label>
            </div>
            <h4 style={{ marginTop: '1rem' }}>Amenities</h4>
            <div className="as-amenity-grid">
              {AMENITY_OPTS.map((a) => (
                <button key={a} className={amenities.includes(a) ? 'on' : ''} onClick={() => toggleAmenity(a)}>{a}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="as-btn" onClick={onSearch}>🔍<span className="lbl">Find</span></button>
      </div>
    </div>
  );
}
