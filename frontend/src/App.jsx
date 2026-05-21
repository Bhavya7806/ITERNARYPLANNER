// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import SavedTrip from './pages/SavedTrip'; // <--- NEW IMPORT
import Navbar from './components/Navbar/Navbar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> 
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/trip/:id" element={<SavedTrip />} /> {/* <--- NEW ROUTE */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;