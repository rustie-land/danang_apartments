import React, { useState } from 'react';

export default function SearchPreferences({ onContinue }) {
  // Локальные состояния для интерактивности
  const [bedrooms, setBedrooms] = useState('Any');
  const [minPrice, setMinPrice] = useState('155');
  const [maxPrice, setMaxPrice] = useState('84949043');
  const [selectedAmenities, setSelectedAmenities] = useState(['#sea']);

  const bedroomOptions = ['Any', 'Studio', '1 Bed', '2 Beds', '3+ Beds'];
  const amenityOptions = ['#pool', '#pet', '#balcony', '#beach', '#sea', '#gym', '#kitchen'];

  const toggleAmenity = (tag) => {
    setSelectedAmenities(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue({ bedrooms, minPrice, maxPrice, selectedAmenities });
    }
  };

  return (
    <div style={{ backgroundColor: '#F5F2EA', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1C2826' }}>
      
      {/* ---------------- NAVBAR ---------------- */}
      <header style={{ backgroundColor: '#0D3C3E', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', fontWeight: 600, color: '#F5F2EA' }}>
            rightmove <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Da Nang</span>
          </span>
        </div>

        {/* Wizard Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>
          <div style={{ backgroundColor: '#F5F2EA', color: '#0D3C3E', padding: '0.4rem 1rem', borderRadius: '9999px', fontWeight: 600 }}>
            1. Search Preferences
          </div>
          <span style={{ color: 'rgba(245, 242, 234, 0.4)' }}>➔</span>
          <div style={{ color: 'rgba(245, 242, 234, 0.7)' }}>
            2. Draw Area
          </div>
          <span style={{ color: 'rgba(245, 242, 234, 0.4)' }}>➔</span>
          <div style={{ color: 'rgba(245, 242, 234, 0.7)' }}>
            3. Properties (69)
          </div>
        </div>
      </header>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{ 
          backgroundColor: '#ECE6D9', 
          borderRadius: '2rem', 
          padding: '2.5rem', 
          border: '1px solid #E2DAD0',
          boxShadow: '0 10px 30px -10px rgba(13, 60, 62, 0.08)' 
        }}>
          
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.75rem', color: '#0D3C3E', fontWeight: 600, margin: 0, lineHeight: 1.1 }}>
              Search Options
            </h1>
            <p style={{ color: '#5A6663', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Set your target price and bedroom preferences
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* BEDROOMS */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#A36D42', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Bedrooms
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {bedroomOptions.map((opt) => {
                  const isActive = bedrooms === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBedrooms(opt)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: isActive ? '#0D3C3E' : '#F5F2EA',
                        color: isActive ? '#F5F2EA' : '#4A5553',
                        boxShadow: isActive ? '0 4px 12px rgba(13, 60, 62, 0.15)' : 'none'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRICE RANGE (VND) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A36D42', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Price Range (VND)
                </label>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0D3C3E' }}>
                  {minPrice || '0'} - {maxPrice || '0'} VND
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input 
                  type="text" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min Price"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.85rem',
                    border: '1px solid #D5CEC0',
                    backgroundColor: '#F5F2EA',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#0D3C3E',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <input 
                  type="text" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max Price"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.85rem',
                    border: '1px solid #D5CEC0',
                    backgroundColor: '#F5F2EA',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#0D3C3E',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* AMENITIES */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#A36D42', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Amenities
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {amenityOptions.map((tag) => {
                  const isSelected = selectedAmenities.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleAmenity(tag)}
                      style={{
                        padding: '0.5rem 0.9rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isSelected ? '#0D3C3E' : '#D5CEC0',
                        backgroundColor: isSelected ? '#0D3C3E' : '#F5F2EA',
                        color: isSelected ? '#F5F2EA' : '#4A5553',
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

            {/* CONTINUE BUTTON */}
            <div style={{ paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={handleContinue}
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  borderRadius: '1rem',
                  backgroundColor: '#0D3C3E',
                  color: '#F5F2EA',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(13, 60, 62, 0.2)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>✏️ Continue to Map & Draw Area</span>
                <span>➔</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}