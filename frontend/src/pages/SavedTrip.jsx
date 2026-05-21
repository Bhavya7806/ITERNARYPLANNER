// src/pages/SavedTrip.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'; // Changed to onSnapshot for Real-Time
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { MapPin, DollarSign, Clock, Tag, ArrowLeft, Loader2, ThumbsUp, ThumbsDown, Share2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SavedTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routePath, setRoutePath] = useState(null);
  const [copied, setCopied] = useState(false);

  // 1. REAL-TIME FIREBASE LISTENER
  useEffect(() => {
    const docRef = doc(db, 'trips', id);
    
    // onSnapshot listens for live updates from ANY browser
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTrip(docSnap.data());
        setIsLoading(false);
      } else {
        alert("Trip not found!");
        navigate('/dashboard');
      }
    }, (error) => {
      console.error("Error with real-time listener:", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [id, navigate]);

  // 2. OSRM Routing
  useEffect(() => {
    const fetchRealWorldRoute = async () => {
      if (!trip) return;
      const coords = [];
      trip.itinerary.forEach(day => {
        day.locations.forEach(loc => {
          if (loc.coordinates?.lat && loc.coordinates?.lng) {
            coords.push(`${loc.coordinates.lng},${loc.coordinates.lat}`);
          }
        });
      });

      if (coords.length < 2) return;

      try {
        const coordinateString = coords.join(';');
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
          const routeGeoJSON = data.routes[0].geometry.coordinates;
          const leafletPath = routeGeoJSON.map(coord => [coord[1], coord[0]]);
          setRoutePath(leafletPath);
        }
      } catch (error) {
        console.error("OSRM Routing failed.", error);
      }
    };
    fetchRealWorldRoute();
  }, [trip]);

  // 3. LIVE MULTI-USER VOTING SYSTEM
  const handleVote = async (dayIndex, locIndex, voteType) => {
    if (!trip) return;
    
    // Deep copy the itinerary array
    const newItinerary = JSON.parse(JSON.stringify(trip.itinerary));
    const location = newItinerary[dayIndex].locations[locIndex];
    
    // Initialize votes if they don't exist
    if (!location.votes) location.votes = { up: 0, down: 0 };
    
    if (voteType === 'up') location.votes.up += 1;
    if (voteType === 'down') location.votes.down += 1;

    try {
      const docRef = doc(db, 'trips', id);
      await updateDoc(docRef, { itinerary: newItinerary });
      // We don't need to update state manually because onSnapshot will instantly catch the change!
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  // 4. SOCIAL SHARE & PDF EXPORT
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    window.print(); // Triggers the browser's native Save to PDF
  };

  const getMapCenter = () => {
    if (trip?.itinerary?.[0]?.locations?.[0]?.coordinates) {
      const { lat, lng } = trip.itinerary[0].locations[0].coordinates;
      return [lat, lng];
    }
    return [48.8566, 2.3522];
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 size={48} className="spinner" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="planner-container" id="printable-area">
      <div className="planner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn-secondary no-print" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
            <ArrowLeft size={16} style={{ marginRight: '0.5rem' }}/> Back to Dashboard
          </button>
          <h1>{trip.trip_summary}</h1>
          <p className="subtitle">{trip.days} Days in {trip.destination} • Target Budget: ${trip.budget}</p>
        </div>
        
        {/* SHARE & EXPORT BUTTONS */}
        <div className="no-print" style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={handleShare} style={{ position: 'relative' }}>
            <Share2 size={18} style={{ marginRight: '0.5rem' }}/> Share
            {copied && <span style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', background: '#000', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Copied!</span>}
          </button>
          <button className="btn-primary" onClick={handleExportPDF}>
            <Download size={18} style={{ marginRight: '0.5rem' }}/> PDF
          </button>
        </div>
      </div>
      
      <div className="planner-layout">
        <div className="glass-brutal-card planner-sidebar-card">
          <div className="itinerary-results">
            <div className="results-header">
              <h2>Final Itinerary</h2>
              <div className="cost-badge"><DollarSign size={16}/> Final Cost: ${trip.total_estimated_cost}</div>
            </div>

            {trip.itinerary.map((dayData, dIdx) => (
              <div key={dIdx} className="day-card" style={{marginTop: '1rem'}}>
                <div className="day-title">Day {dayData.day}</div>
                
                {dayData.locations.map((loc, lIdx) => (
                  <div key={lIdx} className="location-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
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

                    {/* LIVE VOTING CONTROLS */}
                    <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => handleVote(dIdx, lIdx, 'up')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ThumbsUp size={16} color="var(--color-success)" /> 
                        <span style={{ fontWeight: 'bold' }}>{loc.votes?.up || 0}</span>
                      </button>
                      <button onClick={() => handleVote(dIdx, lIdx, 'down')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ThumbsDown size={16} color="#ef4444" />
                        <span style={{ fontWeight: 'bold' }}>{loc.votes?.down || 0}</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="map-container-wrapper no-print">
          <MapContainer center={getMapCenter()} zoom={12} scrollWheelZoom={true}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {routePath && <Polyline positions={routePath} pathOptions={{ color: 'var(--color-primary)', weight: 5, opacity: 0.8 }} />}
            {trip.itinerary.map((day, dIdx) => (
              day.locations.map((loc, lIdx) => (
                loc.coordinates?.lat && loc.coordinates?.lng && (
                  <Marker key={`marker-${dIdx}-${lIdx}`} position={[loc.coordinates.lat, loc.coordinates.lng]}>
                    <Popup><strong>{loc.name}</strong><br/>Day {day.day}</Popup>
                  </Marker>
                )
              ))
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default SavedTrip;