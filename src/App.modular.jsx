import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext.jsx';
import { FiltersProvider } from './FiltersContext.jsx';
import Navbar from './components/Navbar.jsx';
import LandingPage from './components/LandingPage.jsx';
import AreaSelectionPage from './components/AreaSelectionPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';
import { useProperties } from './features/properties/hooks/useProperties.js';
import { DEFAULT_CENTER } from './features/properties/api/properties.js';

const DEFAULT_ZOOM = 13;

function AppRoutes() {
  const { properties, loading, cities } = useProperties();
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(null);
  const [activeModalProperty, setActiveModalProperty] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [mobileView, setMobileView] = useState('list');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>⏳ Loading apartments...</h2>
      </div>
    );
  }

  const toggleFavorite = (id) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  return (
    <FiltersProvider properties={properties} cities={cities}>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/map"
          element={
            <AreaSelectionPage
              properties={properties}
              initialCenter={DEFAULT_CENTER}
              initialZoom={DEFAULT_ZOOM}
              onBoundsChange={setMapBounds}
            />
          }
        />
        <Route
          path="/results"
          element={
            <ResultsPage
              properties={properties}
              initialCenter={DEFAULT_CENTER}
              initialZoom={DEFAULT_ZOOM}
              selectedPropertyId={selectedPropertyId}
              mapCenterCoords={mapCenterCoords}
              favorites={favorites}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onSelectProperty={(prop) => {
                setSelectedPropertyId(prop.id);
                setMapCenterCoords([prop.lat, prop.lng]);
              }}
              onToggleFavorite={toggleFavorite}
              onOpenDetails={setActiveModalProperty}
              onBackToLanding={() => window.history.back()}
              onBackToMap={() => window.history.back()}
              activeModalProperty={activeModalProperty}
              onCloseModal={() => setActiveModalProperty(null)}
              mobileView={mobileView}
              setMobileView={setMobileView}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </FiltersProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  );
}
