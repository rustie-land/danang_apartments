import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { mockApartments } from './mockData';

// Фикс для иконок Leaflet в React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const App = () => {
  const [filter, setFilter] = useState('All');

  const filteredApartments = filter === 'All' 
    ? mockApartments 
    : mockApartments.filter(apt => apt.district === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Danang Apartments</h1>
          <p className="text-gray-600 text-lg">Найди идеальное жилье в Дананге 🌴</p>
        </header>

        
        <section className="mb-10">
          <div className="h-[450px] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <MapContainer center="{[16.068," 108.245]} zoom="{13}" style="{{" height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors"/>
              {filteredApartments.map(apt => (
                <Marker key="{apt.id}" position="{apt.coordinates}">
                  <Popup>
                    <div className="p-1">
                      <img src={apt.image} alt="" className="w-full h-20 object-cover rounded mb-2" />
                      <div className="font-bold text-blue-600">{apt.street_name}</div>
                      <div className="text-sm font-semibold">{apt.price.toLocaleString()} VND</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>

        
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {['All', 'My Khe', 'Son Tra', 'Hai Chau'].map(district => (
            <button
              key={district}
              onClick={() => setFilter(district)}
              className={`px-6 py-2 rounded-full font-semibold transition-all shadow-sm ${
                filter === district 
                ? 'bg-blue-600 text-white scale-105' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {district}
            </button>
          ))}
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApartments.map(apt => (
            <div key={apt.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="relative h-48">
                <img src={apt.image} alt={apt.street_name} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {apt.district}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{apt.street_name}</h3>
                    <p className="text-gray-500 text-sm">{apt.property_type} • {apt.rooms}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-600">
                      {(apt.price / 1000000).toFixed(1)}M
                    </span>
                    <span className="text-xs text-gray-400 block uppercase">VND / month</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  {apt.attributes.pool && <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase">Pool</span>}
                  {apt.attributes.gym && <span className="bg-green-50 text-green-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase">Gym</span>}
                  {apt.attributes.ac && <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase">AC</span>}
                </div>

                <a 
                  href={`https://t.me/${apt.contact_info.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  Contact Agent
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredApartments.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl font-medium">Ничего не найдено в этом районе 😅</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;