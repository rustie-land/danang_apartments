import React, { useState } from 'react';
import { Building2, ChevronRight, Waves, Dumbbell, Compass, CheckCircle2 } from 'lucide-react';

const DISTRICTS = [
  { id: 'my-khe', name: 'My Khe Beach', count: '142 listings', tag: 'Beachfront', desc: 'Walkable to the coast, vibrant expat hub & surfing spot.' },
  { id: 'an-thuong', name: 'An Thuong', count: '98 listings', tag: 'Expat Quarter', desc: 'Pedestrian-friendly streets packed with cafes & bars.' },
  { id: 'son-tra', name: 'Son Tra', count: '54 listings', tag: 'Nature & Quiet', desc: 'Lush green surroundings near Monkey Mountain.' },
  { id: 'hai-chau', name: 'Hai Chau', count: '115 listings', tag: 'City Center', desc: 'Commercial core, Han River views & local markets.' }
];

const FEATURES = [
  { id: 'sea_view', label: 'Sea view', icon: Waves },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'balcony', label: 'Balcony', icon: Compass },
  { id: 'pet_friendly', label: 'Pet-friendly', icon: CheckCircle2 }
];

export default function App() {
  const [maxPrice, setMaxPrice] = useState(800);
  const [selectedBedrooms, setSelectedBedrooms] = useState('Any');
  const [selectedFeatures, setSelectedFeatures] = useState(['Sea view']);

  const toggleFeature = (label) => {
    setSelectedFeatures(prev => 
      prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
    );
  };

  return (
    <div style={{ backgroundColor: '#F5F2EA', color: '#1C2826', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* NAVBAR */}
      <nav style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', fontWeight: 600, color: '#0D3C3E' }}>
          Da Nang <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Apartments</span>
        </span>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', fontWeight: 500, color: '#4A5553' }}>
          <a href="#about" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#neighborhoods" style={{ color: 'inherit', textDecoration: 'none' }}>Neighborhoods</a>
          <a href="#process" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
        </div>

        <button className="btn-primary">Find Apartment</button>
      </nav>

      {/* HERO SECTION */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#A36D42', textTransform: 'uppercase' }}>
            ● Handpicked Rentals
          </span>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3.75rem', lineHeight: '1.1', color: '#0D3C3E', fontWeight: 400 }}>
            Find an apartment worth coming home <span style={{ fontStyle: 'italic' }}>to</span> in Da Nang.
          </h1>

          <p style={{ color: '#5A6663', fontSize: '1.125rem', lineHeight: '1.6', maxWidth: '500px' }}>
            A curated platform tailored for expats, digital nomads, and long-term residents looking for verified, high-quality living spaces near the ocean.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary">Explore Available Units</button>
            <button className="btn-outline">How it works</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', paddingTop: '2rem', borderTop: '1px solid #E2DAD0', marginTop: '1rem' }}>
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: '#0D3C3E' }}>150+</p>
              <p style={{ fontSize: '0.75rem', color: '#6C7774' }}>Verified Listings</p>
            </div>
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: '#0D3C3E' }}>4</p>
              <p style={{ fontSize: '0.75rem', color: '#6C7774' }}>Prime Districts</p>
            </div>
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: '#0D3C3E' }}>100%</p>
              <p style={{ fontSize: '0.75rem', color: '#6C7774' }}>Direct Landlords</p>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div style={{ position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', height: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80" 
            alt="My Khe Beach View" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: 'white' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Prime Ocean View</span>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', fontWeight: 400 }}>My Khe Coastline</h3>
          </div>
        </div>
      </section>

      {/* FILTER CARD */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ backgroundColor: '#ECE6D9', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #E2DAD0' }}>
          <span style={{ fontSize: '0.75rem', color: '#A36D42', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 1 — Preferences</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', color: '#0D3C3E', margin: '0.5rem 0 1.5rem 0' }}>
            Tell us what <span style={{ fontStyle: 'italic' }}>home</span> means to you.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Price slider */}
            <div style={{ backgroundColor: '#F5F2EA', padding: '1.25rem', borderRadius: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6C7774', textTransform: 'uppercase' }}>Monthly Budget</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#0D3C3E', fontWeight: 600 }}>${maxPrice}/mo</span>
              </div>
              <input 
                type="range" 
                min="300" 
                max="2000" 
                step="50"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>

            {/* Bedrooms */}
            <div style={{ backgroundColor: '#F5F2EA', padding: '1.25rem', borderRadius: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6C7774', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Bedrooms</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Any', 'Studio', '1 Bed', '2 Beds'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedBedrooms(opt)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedBedrooms === opt ? '#0D3C3E' : '#ECE6D9',
                      color: selectedBedrooms === opt ? '#F5F2EA' : '#4A5553'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISTRICTS */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', color: '#0D3C3E', marginBottom: '2rem' }}>
          Four corners of <span style={{ fontStyle: 'italic' }}>Da Nang</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {DISTRICTS.map((d) => (
            <div key={d.id} style={{ backgroundColor: '#ECE6D9', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2DAD0' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#A36D42', textTransform: 'uppercase', background: '#F5F2EA', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{d.tag}</span>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#0D3C3E', marginTop: '0.75rem' }}>{d.name}</h3>
              <p style={{ fontSize: '0.75rem', color: '#6C7774', marginBottom: '0.5rem' }}>{d.count}</p>
              <p style={{ fontSize: '0.8rem', color: '#5A6663', lineHeight: '1.4' }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL BANNER */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ backgroundColor: '#0D3C3E', color: '#F5F2EA', padding: '3rem 2.5rem', borderRadius: '1.5rem' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', lineHeight: '1.3', fontWeight: 400 }}>
            “I drew a circle around My Khe Beach, filtered for sea view and a gym, and had three perfect apartments to choose from within an afternoon.”
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: '1.5rem', color: '#A36D42', fontWeight: 600 }}>— Markus K., Remote Product Designer</p>
        </div>
      </section>

    </div>
  );
}