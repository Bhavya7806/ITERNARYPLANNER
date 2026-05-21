// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { MapPin, Calendar, DollarSign, Trash2, ArrowRight, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate('/');
  }, [currentUser, navigate]);

  // Fetch Trips from Firestore
  useEffect(() => {
    const fetchTrips = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, "trips"), 
          where("userId", "==", currentUser.uid),
          // Note: If you use orderBy, Firebase will require you to click a link in the console to build an index.
          // We are skipping orderBy here to keep it working out of the box immediately.
        );
        
        const querySnapshot = await getDocs(q);
        const trips = [];
        querySnapshot.forEach((doc) => {
          trips.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort manually by date on the client side to avoid Firebase indexing requirements initially
        trips.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setSavedTrips(trips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [currentUser]);

  // Delete a trip
  const handleDelete = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    
    try {
      await deleteDoc(doc(db, "trips", tripId));
      setSavedTrips(savedTrips.filter(trip => trip.id !== tripId));
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Failed to delete trip.");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="app-container" style={{ paddingTop: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 2rem 2rem 2rem' }}>
      
      <div style={{ marginBottom: '3rem', borderBottom: '2px solid var(--color-text)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Command Center</h1>
        <p className="subtitle" style={{ fontSize: '1.1rem', fontWeight: '600' }}>
          Welcome back, {currentUser.displayName}. Here are your optimized routing files.
        </p>
      </div>
      
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
          <Loader2 size={48} className="spinner" style={{ color: 'var(--color-primary)' }} />
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Accessing secure database...</p>
        </div>
      ) : savedTrips.length === 0 ? (
        <div className="glass-brutal-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No trips planned yet!</h3>
          <p style={{ marginBottom: '2rem' }}>Time to let the algorithms do some work.</p>
          <button className="btn-primary" onClick={() => navigate('/planner')}>
            Initialize Engine
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {savedTrips.map((trip) => (
            <div key={trip.id} className="glass-brutal-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: '1.2', paddingRight: '1rem' }}>
                  {trip.trip_summary}
                </h3>
                <button 
                  onClick={() => handleDelete(trip.id)} 
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                  title="Delete Trip"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--color-primary)" />
                  <span>{trip.destination}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="var(--color-primary)" />
                  <span>{trip.days} Days Optimized</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={16} color="var(--color-success)" />
                  <span>${trip.total_estimated_cost} Est. Cost (Budget: ${trip.budget})</span>
                </div>
              </div>

              {/* View Full Trip Logic will be added in the final polishing step */}
              {/* UPDATE THIS BUTTON */}
  <button 
    className="btn-secondary" 
    style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
    onClick={() => navigate(`/trip/${trip.id}`)} /* <--- CHANGED THIS LINE */
  >
    View Itinerary <ArrowRight size={16} />
  </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;