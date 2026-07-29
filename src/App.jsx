import React from 'react';

export default function SearchPreferences({
  bedrooms,
  setBedrooms,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  amenities,
  toggleAmenity,
  onContinue
}) {
  const bedroomOptions = ['Any', 'Studio', '1 Bed', '2 Beds', '3+ Beds'];
  const amenityOptions = ['#pool', '#pet', '#balcony', '#beach', '#sea', '#gym', '#kitchen'];

  return (
    <div style={{ backgroundColor: '#F5F2EA', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* --- TOP NAVBAR (Точная копия со скриншота) --- */}
      <header style={{ 
        backgroundColor: '#0D3C3E', 
        padding: '0.875rem 2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        color: '#ffffff'
      }}>
        {/* Logo */}
        <div style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, color: '#F5F2EA' }}>
            rightmove <span style={{ fontWeight: 400, fontStyle: 'italic' }}>Da Nang</span>
          </span>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          <div style={{ backgroundColor: '#13B1A6', color: '#ffffff', padding: '0.4rem 1rem', borderRadius: '9999px' }}>
            1. Search Preferences
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>➔</span>
          <div style={{ color: 'rgba(255,255,255,0.8)' }}>
            2. Draw Area
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>➔</span>
          <div style={{ color: 'rgba(255,255,255,0.8)' }}>
            3. Properties (69)
          </div>
        </div>
      </header>

      {/* --- MAIN CARD (1 в 1 как на скриншоте) --- */}
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 1rem' }}>
        <div style={{ 
          backgroundColor: '#ECE6D9', 
          borderRadius: '1.5rem', 
          padding: '2.5rem', 
          width: '100%', 
          maxWidth: '620px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
          border: '1px solid #E2DAD0'
        }}>
          
          {/* Header */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.25rem', fontWeight: 700, color: '#0D3C3E', margin: '0 0 0.25rem 0' }}>
            Search Options
          </h1>
          <p style={{ color: '#5A6663', fontSize: '0.9rem', margin: '0 0 1.75rem 0' }}>
            Set your target price and bedroom preferences
          </p>

          {/* BEDROOMS */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#5A6663', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              BEDROOMS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {bedroomOptions.map((opt) => {
                const isActive = bedrooms === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBedrooms && setBedrooms(opt)}
                    style={{
                      padding: '0.65rem 0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#0D3C3E' : '#F5F2EA',
                      color: isActive ? '#ffffff' : '#4A5553',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRICE RANGE (VND) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5A6663', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                PRICE RANGE (VND)
              </label>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A896' }}>
                {minPrice || '155'} - {maxPrice || '84.949.043'} VND
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input 
                type="text" 
                value={minPrice} 
                onChange={(e) => setMinPrice && setMinPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #D5CEC0',
                  backgroundColor: '#F5F2EA',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0D3C3E',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <input 
                type="text" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice && setMaxPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #D5CEC0',
                  backgroundColor: '#F5F2EA',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0D3C3E',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* AMENITIES */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight 700, color: '#5A6663', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              AMENITIES
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {amenityOptions.map((tag) => {
                const isSelected = amenities?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleAmenity && toggleAmenity(tag)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: isSelected ? '#0D3C3E' : '#F5F2EA',
                      color: isSelected ? '#ffffff' : '#4A5553',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BUTTON: CONTINUE TO MAP */}
          <button
            type="button"
            onClick={onContinue}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '0.75rem',
              backgroundColor: '#00A896', // Бирюзово-зеленая кнопка как на скриншоте
              color: '#ffffff',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 168, 150, 0.2)'
            }}
          >
            ✏️ Continue to Map & Draw Area ➔
          </button>

        </div>
      </main>
    </div>
  );
}