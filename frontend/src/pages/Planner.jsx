// src/pages/Planner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin, Calendar, DollarSign, Users, Sparkles, Activity, Loader2, ArrowLeft, Clock, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import './Planner.css';

// --- LEAFLET ICON FIX ---
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

const Planner = () => {
  const { currentUser } = useAuth();
  
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itineraryData, setItineraryData] = useState(null);
  
  // NEW: State to hold the real-world street route
  const [routePath, setRoutePath] = useState(null);
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  const [formData, setFormData] = useState({
    destination: '',
    days: 3,
    budget: 500,
    travelers: 2,
    vibe: 'balanced'
  });

  // --- OSRM REAL-WORLD ROUTING ENGINE ---
  useEffect(() => {
    const fetchRealWorldRoute = async () => {
      if (!itineraryData) {
        setRoutePath(null);
        return;
      }

      // 1. Extract all coordinates in OSRM format (Longitude, Latitude)
      const coords = [];
      itineraryData.itinerary.forEach(day => {
        day.locations.forEach(loc => {
          if (loc.coordinates?.lat && loc.coordinates?.lng) {
            coords.push(`${loc.coordinates.lng},${loc.coordinates.lat}`);
          }
        });
      });

      if (coords.length < 2) return;

      try {
        // 2. Call the free OSRM driving API
        const coordinateString = coords.join(';');
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson`);
        const data = await response.json();

        // 3. Convert OSRM GeoJSON back to Leaflet format (Latitude, Longitude)
        if (data.code === 'Ok' && data.routes.length > 0) {
          const routeGeoJSON = data.routes[0].geometry.coordinates;
          const leafletPath = routeGeoJSON.map(coord => [coord[1], coord[0]]);
          setRoutePath(leafletPath);
        }
      } catch (error) {
        console.error("OSRM Routing failed. Falling back to straight lines.", error);
      }
    };

    fetchRealWorldRoute();
  }, [itineraryData]);

  // Autocomplete Logic
  const handleDestinationChange = (e) => {
    const query = e.target.value;
    setFormData({ ...formData, destination: query });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&featuretype=city&addressdetails=0`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching location profiles:", error);
      }
    }, 200); 
  };

  const selectSuggestion = (place) => {
    setFormData({ ...formData, destination: place.display_name });
    setMapCenter([parseFloat(place.lat), parseFloat(place.lon)]);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Generate Trip API Call
  const handleGenerateClick = async () => {
    if (!formData.destination) {
      alert("Please designate a target location!");
      return;
    }

    setIsLoading(true);
    setItineraryData(null); 
    setRoutePath(null); // Clear old route

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Backend Processing Halt: ${data.detail || 'Critical pipeline exception.'}`);
        setIsLoading(false);
        return;
      }

      const aiData = data.data;
      setItineraryData(aiData);

      if (aiData.itinerary?.[0]?.locations?.[0]?.coordinates) {
        const firstLoc = aiData.itinerary[0].locations[0].coordinates;
        setMapCenter([firstLoc.lat, firstLoc.lng]);
      }

    } catch (error) {
      console.error("Connection link ruptured:", error);
      alert("Failed connection sequence to server core.");
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Save
  const handleSaveTrip = async () => {
    if (!currentUser) {
      alert("You must be logged in to save trips!");
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'trips'), {
        userId: currentUser.uid,
        destination: formData.destination,
        days: formData.days,
        budget: formData.budget,
        trip_summary: itineraryData.trip_summary,
        total_estimated_cost: itineraryData.total_estimated_cost,
        itinerary: itineraryData.itinerary,
        createdAt: serverTimestamp()
      });
      alert("Trip saved successfully to your Dashboard!");
    } catch (error) {
      console.error("Error saving trip:", error);
      alert("Failed to save trip. Check your database permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  // Fallback straight lines if OSRM fails
  const getFallbackCoordinates = () => {
    if (!itineraryData) return [];
    const coords = [];
    itineraryData.itinerary.forEach(day => {
      day.locations.forEach(loc => {
        if (loc.coordinates?.lat && loc.coordinates?.lng) {
          coords.push([loc.coordinates.lat, loc.coordinates.lng]);
        }
      });
    });
    return coords;
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h1>Trip Engine</h1>
        <p className="subtitle">
          {currentUser ? `Welcome back, ${currentUser.displayName.split(' ')[0]}. ` : ''} 
          {itineraryData ? 'Your optimized route is ready.' : 'Configure your parameters below.'}
        </p>
      </div>
      
      <div className="planner-layout">
        
        {/* LEFT COLUMN */}
        <div className="glass-brutal-card planner-sidebar-card">
          
          {isLoading && (
            <div className="loading-overlay">
              <Loader2 size={48} className="spinner-large" />
              <h3>AI Engine Processing...</h3>
              <p>Calculating optimal routes and budgets.</p>
            </div>
          )}

          {!isLoading && !itineraryData && (
            <>
              <div className="planner-form-scroll-body">
                <div>
                  <h2 className="form-section-title"><MapPin size={20} /> Location & Time</h2>
                  
                  <div className="input-wrapper autocomplete-wrapper" style={{ marginBottom: '1rem' }}>
                    <label>Destination</label>
                    <div className="icon-input">
                      <MapPin size={18} />
                      <input 
                        type="text" 
                        name="destination" 
                        placeholder="e.g. Paris, Tokyo" 
                        value={formData.destination} 
                        onChange={handleDestinationChange} 
                        autoComplete="off"
                      />
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="suggestions-dropdown">
                        {suggestions.map((place, idx) => (
                          <li key={idx} className="suggestion-item" onClick={() => selectSuggestion(place)}>
                            {place.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="input-wrapper">
                    <label>Duration (Days)</label>
                    <div className="icon-input">
                      <Calendar size={18} />
                      <input type="number" name="days" min="1" max="14" value={formData.days} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="form-section-title"><Activity size={20} /> Constraints</h2>
                  <div className="input-wrapper" style={{ marginBottom: '1rem' }}>
                    <label>Total Budget ($)</label>
                    <div className="icon-input">
                      <DollarSign size={18} />
                      <input type="number" name="budget" step="50" value={formData.budget} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="input-wrapper" style={{ marginBottom: '1rem' }}>
                    <label>Travelers</label>
                    <div className="icon-input">
                      <Users size={18} />
                      <input type="number" name="travelers" min="1" max="10" value={formData.travelers} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="input-wrapper">
                    <label>Trip Vibe</label>
                    <div className="icon-input">
                      <Sparkles size={18} />
                      <select name="vibe" value={formData.vibe} onChange={handleInputChange}>
                        <option value="balanced">Balanced (Mix of everything)</option>
                        <option value="fast">Fast-paced (See it all)</option>
                        <option value="chill">Chill (Relaxed, more cafes)</option>
                        <option value="culture">Culture Heavy (Museums)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="planner-form-footer">
                <button className="btn-primary generate-btn" onClick={handleGenerateClick}>
                  <Sparkles size={18} style={{marginRight: '0.5rem'}} /> Generate Itinerary
                </button>
              </div>
            </>
          )}

          {!isLoading && itineraryData && (
            <div className="itinerary-results">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className="btn-secondary" onClick={() => setItineraryData(null)} style={{ padding: '0.5rem 1rem' }}>
                  <ArrowLeft size={16} style={{ marginRight: '0.5rem' }}/> Recalculate
                </button>
                
                {currentUser && (
                  <button 
                    className="btn-primary" 
                    onClick={handleSaveTrip} 
                    disabled={isSaving}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    {isSaving ? <Loader2 size={16} className="spinner" /> : <Tag size={16} style={{ marginRight: '0.5rem' }}/>} 
                    {isSaving ? 'Saving...' : 'Save to Dashboard'}
                  </button>
                )}
              </div>
              
              <div className="results-header">
                <h2>{itineraryData.trip_summary}</h2>
                <div className="cost-badge"><DollarSign size={16}/> Est. Cost: ${itineraryData.total_estimated_cost}</div>
              </div>

              {itineraryData.itinerary.map((dayData, idx) => (
                <div key={idx} className="day-card" style={{marginTop: '1rem'}}>
                  <div className="day-title">Day {dayData.day}</div>
                  
                  {dayData.locations.map((loc, lIdx) => (
                    <div key={lIdx} className="location-item">
                      <MapPin size={22} className="location-dot" />
                      <div className="location-details">
                        <h4>{loc.name}</h4>
                        <div className="location-meta">
                          <span className="meta-pill"><Clock size={12}/> {loc.duration_hours}h</span>
                          <span className="meta-pill"><DollarSign size={12}/> {loc.cost_usd}</span>
                          <span className="meta-pill"><Tag size={12}/> <span style={{textTransform: 'capitalize'}}>{loc.type}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Map Frame */}
        <div className="map-container-wrapper">
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true}>
            <MapUpdater center={mapCenter} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Draw the Real-World Route OR Fallback to Dotted Lines */}
            {routePath ? (
              <Polyline 
                positions={routePath} 
                pathOptions={{ color: 'var(--color-primary)', weight: 5, opacity: 0.8 }} 
              />
            ) : itineraryData && (
              <Polyline 
                positions={getFallbackCoordinates()} 
                pathOptions={{ color: 'var(--color-primary)', weight: 4, dashArray: '8, 8' }} 
              />
            )}

            {itineraryData ? (
              itineraryData.itinerary.map((day, dIdx) => (
                day.locations.map((loc, lIdx) => (
                  loc.coordinates?.lat && loc.coordinates?.lng && (
                    <Marker key={`marker-${dIdx}-${lIdx}`} position={[loc.coordinates.lat, loc.coordinates.lng]}>
                      <Popup>
                        <div style={{textAlign: 'center', fontFamily: 'sans-serif'}}>
                          <strong style={{fontSize: '1.05rem'}}>{loc.name}</strong><br/>
                          <span style={{color: 'var(--color-secondary)', fontWeight: 'bold', fontSize:'0.9rem'}}>Day {day.day}</span><br/>
                          ${loc.cost_usd} • {loc.duration_hours}h
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))
              ))
            ) : (
              <Marker position={mapCenter}>
                <Popup><strong>Awaiting Parameters</strong><br/>Enter destination coordinate anchors to mount maps.</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  );
};

export default Planner;