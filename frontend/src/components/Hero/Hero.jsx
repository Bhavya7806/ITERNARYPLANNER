// src/components/Hero/Hero.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate(); // Router Hook
  
  // Parallax gradient tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const headline = "Smart travel, zero billing.".split(" ");

  const scrollToAlgorithm = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section" id="home">
      {/* Background Gradient Parallax Orb */}
      <div 
        className="parallax-orb" 
        style={{ transform: `translate(${mousePos.x * 0.05}px, ${mousePos.y * 0.05}px)` }}
      ></div>

      {/* Animated SVG Map Nodes in Background */}
      <svg className="bg-nodes" viewBox="0 0 800 400">
        <path d="M 100,200 L 400,100 L 700,300" className="pulsing-line" />
        <circle cx="100" cy="200" r="8" className="floating-dot dot-1" />
        <circle cx="400" cy="100" r="8" className="floating-dot dot-2" />
        <circle cx="700" cy="300" r="8" className="floating-dot dot-3" />
      </svg>

      <div className="hero-content">
        <div className="hero-text-container">
          <h1 className="hero-headline">
            {headline.map((word, index) => (
              <span key={index} className="staggered-word" style={{ animationDelay: `${index * 0.15}s` }}>
                {word}&nbsp;
              </span>
            ))}
          </h1>
          <p className="hero-subheadline">
            AI-powered itineraries, strict budget optimization, and real-time routing. 
            All engineered for perfect trips without the paywalls.
          </p>
          <div className="hero-cta-group">
            {/* Navigates to Planner Interface */}
            <button className="btn-primary hero-btn-main" onClick={() => navigate('/planner')}>
              Start Planning
            </button>
            <button className="btn-secondary hero-btn-alt" onClick={scrollToAlgorithm}>
              View Algorithm
            </button>
          </div>
        </div>

        {/* 3D Floating Itinerary Card */}
        <div className="hero-visual">
          <div className="floating-card-3d glass-brutal-card">
            <div className="card-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="card-title">itinerary_preview.json</span>
            </div>
            <div className="card-body">
              <div className="mock-route">
                <div className="mock-node">📍 Paris <span className="mock-time">09:00</span></div>
                <div className="mock-line"></div>
                <div className="mock-node highlight">🚂 Lyon <span className="mock-time">13:30</span></div>
                <div className="mock-line"></div>
                <div className="mock-node">🏖 Marseille <span className="mock-time">18:00</span></div>
              </div>
              <div className="mock-budget">Budget Optimized: $450 saved</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;