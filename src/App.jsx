import React, { useState, useMemo } from 'react';
import { mockApartments } from './mockData';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [maxPrice, setMaxPrice] = useState(20000000);
  const [filterRooms, setFilterRooms] = useState('All');

  const filteredApartments = useMemo(() => {
    return mockApartments.filter(apt => {
      const matchesDistrict = filterDistrict === 'All' || apt.district === filterDistrict;
      const matchesPrice = apt.price <= maxPrice;
      const matchesRooms = filterRooms === 'All' || apt.rooms === filterRooms;
      const matchesSearch = 
        apt.street_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        apt.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDistrict && matchesPrice && matchesRooms && matchesSearch;
    });
  }, [searchQuery, filterDistrict, maxPrice, filterRooms]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌴</span>
            <h1 className="text-xl font-bold tracking-tight">Danang Apartments</h1>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              type="text"
              placeholder="Search by street or district..."
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span>⚙️</span> Filters
            </h2>
            
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">District</label>
              <select 
                className="w-full p-2.5 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              >
                <option value="All">All Districts</option>
                <option value="My Khe">My Khe</option>
                <option value="Son Tra">Son Tra</option>
                <option value="Hai Chau">Hai Chau</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Rooms</label>
              <div className="grid grid-cols-2 gap-2">
                {['All', 'Studio', '1BR', '2BR', '3BR'].map(room => (
                  <button 
                    key={room}
                    onClick={() => setFilterRooms(room)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      filterRooms === room ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Max Price: <span className="text-blue-600">{maxPrice.toLocaleString()} VND</span>
              </label>
              <input 
                type="range" 
                min="1000000" 
                max="20000000" 
                step="500000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          <div className="w-full h-64 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 font-medium text-center px-4">
            Interactive Map coming soon... 🗺️ <br/> 
            (Stay tuned for Da Nang district markers)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApartments.map(apt => (
              <div key={apt.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="relative h-52 overflow-hidden">
                  <img src={apt.image} alt="Apartment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm">
                    {apt.price.toLocaleString()} {apt.currency}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{apt.property_type}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{apt.rooms}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{apt.street_name}</h3>
                  <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                    <span>📍</span> {apt.district}
                  </p>
                  
                  <div className="flex gap-3 mb-6">
                    {apt.attributes.pool && <span title="Pool" className="text-xl">🏊‍♂️</span>}
                    {apt.attributes.gym && <span title="Gym" className="text-xl">🏋️‍♂️</span>}
                    {apt.attributes.ac && <span title="AC" className="text-xl">❄️</span>}
                    {apt.attributes.balcony && <span title="Balcony" className="text-xl">🌅</span>}
                  </div>
                  
                  <a 
                    href={`https://t.me/${apt.contact_info.replace('@', '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    Contact Agent
                  </a>
                </div>
              </div>
            ))}

            {filteredApartments.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="text-4xl mb-4">🏜️</div>
                <h3 className="text-xl font-semibold text-gray-800">No apartments found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;