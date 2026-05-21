// src/components/Navbar/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORT AUTH CONTEXT
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get Auth State
  const { currentUser, loginWithGoogle, logout } = useAuth(); // <--- DESTRUCTURE AUTH METHODS

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [isDark]);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleTheme = () => setIsDark(!isDark);

  const handleNavClick = (e, path) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (location.pathname !== '/') {
      navigate(`/${path}`);
      setTimeout(() => {
        const element = document.querySelector(path);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.querySelector(path);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        
        <div className="nav-logo" onClick={() => navigate('/')}>
          <Compass className="logo-icon breathing-glow" size={32} />
          <span className="logo-text">WanderLens</span>
        </div>

        <div className="nav-links desktop-only">
          <a href="/#home" onClick={(e) => handleNavClick(e, '#home')} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home<span className="active-dot"></span>
          </a>
          <a href="/#features" onClick={(e) => handleNavClick(e, '#features')} className="nav-link">Features</a>
          <a href="/#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')} className="nav-link">How it Works</a>
          <a href="/#contact" onClick={(e) => handleNavClick(e, '#contact')} className="nav-link">Contact</a>
        </div>

        <div className="nav-actions desktop-only">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Conditional Auth Rendering */}
          {currentUser ? (
            <div className="user-profile-menu">
              <img src={currentUser.photoURL} alt="Profile" className="user-avatar" referrerPolicy="no-referrer" />
              <button className="btn-secondary" onClick={() => { logout(); navigate('/'); }}>
                Logout
              </button>
              <button className="btn-primary glowing-btn" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
            </div>
          ) : (
            <>
              <button className="btn-secondary" onClick={loginWithGoogle}>
                Log In
              </button>
              <button className="btn-primary glowing-btn" onClick={() => navigate('/planner')}>
                Try Now
              </button>
            </>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="/#home" onClick={(e) => handleNavClick(e, '#home')}>Home</a>
        <a href="/#features" onClick={(e) => handleNavClick(e, '#features')}>Features</a>
        <a href="/#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')}>How it Works</a>
        <a href="/#contact" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a>
        
        <button className="theme-toggle-mobile" onClick={toggleTheme}>
           {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
        
        {currentUser ? (
          <>
            <button className="btn-secondary" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>Dashboard</button>
            <button className="btn-primary" onClick={() => { setMobileMenuOpen(false); logout(); }}>Logout</button>
          </>
        ) : (
          <button className="btn-primary" onClick={() => { setMobileMenuOpen(false); loginWithGoogle(); }}>Log In with Google</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;