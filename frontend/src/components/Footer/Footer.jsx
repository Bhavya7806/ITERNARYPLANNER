// src/components/Footer/Footer.jsx
import React, { useState, useEffect } from 'react';
import { Compass, ArrowUp, Terminal, AtSign, MessageSquare, Briefcase, Sparkles } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        
        <div className="footer-grid">
          {/* Column 1: Brand */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <Compass className="logo-icon" size={28} />
              <span className="logo-text">WanderLens</span>
            </div>
            <div className="no-billing-badge">
              <Sparkles size={14} className="sparkle-icon" />
              No billing. Ever.
            </div>
            <p className="brand-desc">Open-source routing and budget algorithms for the modern traveler.</p>
          </div>

          {/* Column 2: Product */}
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#">Pricing (It's Free)</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">GitHub Repo</a></li>
              <li><a href="#">API Documentation</a></li>
              <li><a href="#">Algorithm Specs</a></li>
              <li><a href="#">System Status</a></li>
            </ul>
          </div>

          {/* Column 4: Legal & Social */}
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Preferences</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© {new Date().getFullYear()} WanderLens. Built with zero budget constraints.</p>
          
          <div className="footer-socials">
            <a href="#" className="social-link"><AtSign size={20} /></a>
            <a href="#" className="social-link"><Terminal size={20} /></a>
            <a href="#" className="social-link"><MessageSquare size={20} /></a>
            <a href="#" className="social-link"><Briefcase size={20} /></a>
          </div>
        </div>
      </div>

      <button 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`} 
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <ArrowUp size={24} />
      </button>
    </footer>
  );
};

export default Footer;