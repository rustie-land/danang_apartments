import React, { useState } from 'react';
import { 
  Building2, 
  ChevronRight, 
  Waves, 
  Dumbbell, 
  Compass, 
  CheckCircle2 
} from 'lucide-react';

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
  const [activeDistrict, setActiveDistrict] = useState(null);

  const toggleFeature = (label) => {
    setSelectedFeatures(prev => 
      prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F2EA] text-[#1C2826] font-sans">
      
      {/* NAVIGATION */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#0D3C3E]">
            Da Nang <span className="italic font-normal">Apartments</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#4A5553]">
          <a href="#about" className="hover:text-[#0D3C3E] transition-colors">About</a>
          <a href="#neighborhoods" className="hover:text-[#0D3C3E] transition-colors">Neighborhoods</a>
          <a href="#process" className="hover:text-[#0D3C3E] transition-colors">How it works</a>
          <a href="#contact" className="hover:text-[#0D3C3E] transition-colors">Contact</a>
        </div>

        <button className="bg-[#0D3C3E] text-[#F5F2EA] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1B5255] transition-all">
          Find Apartment
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-16 md:pt-16 md:pb-24 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold tracking-wider text-[#A36D42] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#A36D42]"></span>
            <span>Handpicked Rentals</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal text-[#0D3C3E] leading-[1.15]">
            Find an apartment worth coming home <span className="italic">to</span> in Da Nang.
          </h1>

          <p className="text-lg text-[#5A6663] max-w-xl font-normal leading-relaxed">
            A curated platform tailored for expats, digital nomads, and long-term residents looking for verified, high-quality living spaces near the ocean.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href="#search" className="bg-[#0D3C3E] text-[#F5F2EA] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#1B5255] transition-all">
              Explore Available Units
            </a>
            <a href="#process" className="px-6 py-3.5 rounded-full text-sm font-medium border border-[#D5CEC0] hover:bg-[#ECE6D9] transition-all">
              How it works
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#E2DAD0]/60 max-w-md">
            <div>
              <p className="font-serif text-3xl text-[#0D3C3E]">150+</p>
              <p className="text-xs text-[#6C7774] mt-1">Verified Listings</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-[#0D3C3E]">4</p>
              <p className="text-xs text-[#6C7774] mt-1">Prime Districts</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-[#0D3C3E]">100%</p>
              <p className="text-xs text-[#6C7774] mt-1">Direct Landlords</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 relative">
          <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/5] group">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80" 
              alt="My Khe Beach View" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            <div className="absolute top-5 left-5 bg-[#F5F2EA]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-sm">
              <p className="text-xs font-semibold text-[#0D3C3E]">Featured Location</p>
              <p className="text-xs text-[#5A6663]">My Khe Beachside</p>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
              <span className="text-xs tracking-wider uppercase text-white/80">Prime Ocean View</span>
              <h3 className="font-serif text-2xl font-normal">My Khe Coastline</h3>
              <p className="text-xs text-white/80">Starting from $450 / month</p>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER SECTION */}
      <section id="search" className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-[#ECE6D9] rounded-3xl p-8 md:p-10 border border-[#E2DAD0]">
          <div className="max-w-xl mb-8">
            <span className="text-xs uppercase tracking-wider text-[#A36D42] font-semibold">Step 1 — Preferences</span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#0D3C3E] mt-1">
              Tell us what <span className="italic">home</span> means to you.
            </h2>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6 space-y-4 bg-[#F5F2EA] p-6 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase font-semibold text-[#6C7774] tracking-wider">Monthly Budget</label>
                <span className="font-serif text-2xl text-[#0D3C3E]">${maxPrice} <span className="text-xs font-sans text-[#6C7774]">/ month</span></span>
              </div>
              <input 
                type="range" 
                min="300" 
                max="2000" 
                step="50"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#6C7774]">
                <span>$300/mo</span>
                <span>$2,000/mo+</span>
              </div>
            </div>

            <div className="md:col-span-6 space-y-4 bg-[#F5F2EA] p-6 rounded-2xl">
              <label className="text-xs uppercase font-semibold text-[#6C7774] tracking-wider block">Bedrooms</label>
              <div className="flex flex-wrap gap-2">
                {['Any', 'Studio', '1 Bed', '2 Beds', '3+ Beds'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedBedrooms(option)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedBedrooms === option 
                        ? 'bg-[#0D3C3E] text-[#F5F2EA]' 
                        : 'bg-[#ECE6D9] text-[#4A5553] hover:bg-[#E4DCCD]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-12 space-y-3">
              <label className="text-xs uppercase font-semibold text-[#6C7774] tracking-wider block">Key Amenities</label>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  const isSelected = selectedFeatures.includes(feat.label);
                  return (
                    <button
                      key={feat.id}
                      onClick={() => toggleFeature(feat.label)}
                      className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected 
                          ? 'bg-[#0D3C3E] text-[#F5F2EA] border-[#0D3C3E]' 
                          : 'bg-[#F5F2EA] text-[#4A5553] border-[#E2DAD0] hover:border-[#0D3C3E]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{feat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE STEPS */}
      <section id="process" className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-lg mb-12">
          <span className="text-xs uppercase tracking-wider text-[#A36D42] font-semibold">The Process</span>
          <h2 className="font-serif text-4xl text-[#0D3C3E] mt-1">
            Three steps from <span className="italic">search</span> to signed lease.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Select your zone', desc: 'Choose between beachside vibrant streets or quiet mountain breeze neighborhoods.' },
            { step: '02', title: 'Filter your needs', desc: 'Specify high-speed Wi-Fi, dedicated workspace, sea view, or pet accommodations.' },
            { step: '03', title: 'Move in hassle-free', desc: 'Direct contract with verified owners, transparent deposit conditions and English support.' }
          ].map((card, i) => (
            <div key={i} className="bg-[#ECE6D9] p-8 rounded-3xl border border-[#E2DAD0] flex flex-col justify-between h-64 hover:border-[#0D3C3E]/40 transition-colors">
              <span className="font-serif text-2xl text-[#A36D42]">{card.step}</span>
              <div>
                <h3 className="font-serif text-2xl text-[#0D3C3E] mb-2">{card.title}</h3>
                <p className="text-sm text-[#5A6663] leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOUR CORNERS OF DA NANG */}
      <section id="neighborhoods" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#A36D42] font-semibold">Explore Neighborhoods</span>
            <h2 className="font-serif text-4xl text-[#0D3C3E] mt-1">
              Four corners of <span className="italic">Da Nang</span>, one search.
            </h2>
          </div>
          <button className="mt-4 md:mt-0 text-xs font-semibold uppercase tracking-wider text-[#0D3C3E] hover:text-[#1B5255] inline-flex items-center space-x-1">
            <span>View all 4 zones</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISTRICTS.map((dist) => (
            <div 
              key={dist.id}
              onClick={() => setActiveDistrict(dist.name)}
              className={`bg-[#ECE6D9] p-6 rounded-3xl border border-[#E2DAD0] cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                activeDistrict === dist.name ? 'ring-2 ring-[#0D3C3E]' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-[#F5F2EA] rounded-2xl">
                  <Building2 className="w-5 h-5 text-[#0D3C3E]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#F5F2EA] text-[#A36D42] px-2.5 py-1 rounded-full">
                  {dist.tag}
                </span>
              </div>
              
              <h3 className="font-serif text-2xl text-[#0D3C3E] mb-1">{dist.name}</h3>
              <p className="text-xs text-[#6C7774] mb-4">{dist.count}</p>
              <p className="text-xs text-[#5A6663] leading-relaxed">{dist.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL BANNER */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-[#0D3C3E] text-[#F5F2EA] rounded-3xl p-10 md:p-16 relative overflow-hidden">
          <div className="max-w-3xl space-y-6 relative z-10">
            <span className="font-serif text-6xl text-[#A36D42] leading-none block">“</span>
            <p className="font-serif text-2xl md:text-4xl font-normal leading-snug">
              I drew a circle around My Khe Beach, filtered for sea view and a gym, and had three perfect apartments to choose from within an afternoon. <span className="italic text-[#D38A58]">This is how renting should work.</span>
            </p>
            
            <div className="pt-4 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-[#1B5255] flex items-center justify-center font-bold text-sm">
                MK
              </div>
              <div>
                <p className="text-sm font-semibold">Markus K.</p>
                <p className="text-xs text-[#E6EFEF]/70">Remote Product Designer from Germany</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-[#ECE6D9] rounded-3xl p-10 md:p-16 text-center border border-[#E2DAD0] space-y-6 max-w-4xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-[#A36D42] font-semibold">Start Your Search</span>
          <h2 className="font-serif text-4xl md:text-5xl text-[#0D3C3E]">
            Your next home in <span className="italic">Da Nang</span> is three steps away.
          </h2>
          <p className="text-sm text-[#5A6663] max-w-lg mx-auto leading-relaxed">
            Browse through verified apartments, compare amenities, and schedule a tour directly with English-speaking landlords.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button className="bg-[#0D3C3E] text-[#F5F2EA] px-8 py-3.5 rounded-full text-sm font-medium hover:bg-[#1B5255] transition-all">
              All Apartments
            </button>
            <button className="px-8 py-3.5 rounded-full text-sm font-medium border border-[#D5CEC0] bg-[#F5F2EA] hover:bg-[#E4DCCD] transition-all">
              Talk to an Advisor
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0D3C3E] text-[#F5F2EA] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 space-y-4">
            <span className="font-serif text-2xl font-semibold tracking-tight">
              Da Nang <span className="italic font-normal">Apartments</span>
            </span>
            <p className="text-xs text-[#E6EFEF]/70 max-w-sm leading-relaxed">
              Curated residential rentals tailored for expats and nomads across My Khe, An Thuong, Son Tra, and Hai Chau.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A36D42]">Districts</h4>
            <ul className="space-y-2 text-xs text-[#E6EFEF]/70">
              <li><a href="#" className="hover:text-white">My Khe Beach</a></li>
              <li><a href="#" className="hover:text-white">An Thuong</a></li>
              <li><a href="#" className="hover:text-white">Son Tra</a></li>
              <li><a href="#" className="hover:text-white">Hai Chau</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A36D42]">Company</h4>
            <ul className="space-y-2 text-xs text-[#E6EFEF]/70">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Landlord Portal</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[#1B5255] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#E6EFEF]/50">
          <p>© 2026 Da Nang Apartments. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Editorial Luxury Style</p>
        </div>
      </footer>

    </div>
  );
}