// src/components/HowItWorks/HowItWorks.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Users, Cpu, Map as MapIcon, CloudRain, Sun } from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Live Demo State
  const [budget, setBudget] = useState(500);
  const [isRaining, setIsRaining] = useState(false);
  const [activeNode, setActiveNode] = useState(null);

  // Scroll reveal logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = (node) => {
    setActiveNode(node);
  };

  return (
    <section className="how-it-works-section" id="how-it-works" ref={sectionRef}>
      <div className="section-header text-center">
        <h2 className="section-title">How the Magic Happens</h2>
        <p className="section-subtitle">From a vague idea to a mathematically perfect trip.</p>
      </div>

      {/* --- TIMELINE SECTION --- */}
      <div className={`timeline-container ${isVisible ? 'animate-timeline' : ''}`}>
        {/* Animated Connecting Line */}
        <svg className="timeline-connector" preserveAspectRatio="none">
          <line x1="0" y1="50%" x2="100%" y2="50%" className="dashed-line" />
        </svg>

        <div className="timeline-step">
          <div className="step-icon-wrapper spin-in">
            <span className="step-number">1</span>
            <Users size={24} />
          </div>
          <h3>Inputs</h3>
          <p>Add travelers, dates, and strict budget limits.</p>
          <div className="step-preview-btn">
            Preview
            <div className="step-tooltip glass-brutal-card">
              {"{ budget: 1500, pax: 2, vibe: 'chill' }"}
            </div>
          </div>
        </div>

        <div className="timeline-step">
          <div className="step-icon-wrapper fake-load">
            <Cpu size={24} className="load-icon" />
            <div className="checkmark">✔</div>
          </div>
          <h3>Optimization</h3>
          <p>AI parses intent; Dijkstra & Knapsack optimize.</p>
          <div className="step-preview-btn">
            Preview
            <div className="step-tooltip glass-brutal-card">
              Processing 42,000 route permutations...
            </div>
          </div>
        </div>

        <div className="timeline-step">
          <div className="step-icon-wrapper confetti-burst">
            <MapIcon size={24} />
          </div>
          <h3>Live Itinerary</h3>
          <p>Get a dynamic route that adapts in real-time.</p>
          <div className="step-preview-btn">
            Preview
            <div className="step-tooltip glass-brutal-card">
              Route locked. $320 under budget!
            </div>
          </div>
        </div>
      </div>

      {/* --- LIVE DEMO MINI SECTION --- */}
      <div className="demo-container glass-brutal-card">
        <div className="demo-header">
          <h3>Algorithm Sandbox</h3>
          <div className="status-badge">Live Visualization</div>
        </div>

        <div className="demo-layout">
          {/* Controls */}
          <div className="demo-controls">
            <div className="control-group">
              <label>Budget Simulator</label>
              <input 
                type="range" 
                min="100" max="1000" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value)} 
                className="brutal-slider"
              />
              <span className="budget-display">${budget}</span>
            </div>

            <div className="control-group">
              <label>Weather Override</label>
              <button 
                className={`btn-secondary weather-btn ${isRaining ? 'raining' : ''}`}
                onClick={() => setIsRaining(!isRaining)}
              >
                {isRaining ? <CloudRain size={18} /> : <Sun size={18} />}
                {isRaining ? 'Storming' : 'Clear Skies'}
              </button>
            </div>
          </div>

          {/* Interactive Map Area */}
          <div className="demo-map-area">
            <svg className="demo-paths" viewBox="0 0 400 200">
              <path 
                d="M 50,100 L 200,50 L 350,150" 
                className={`base-path ${activeNode ? 'path-active' : ''}`} 
              />
            </svg>

            <div 
              className={`demo-node node-paris ${budget < 300 ? 'node-expensive' : 'node-cheap'} ${activeNode === 'paris' ? 'selected' : ''}`}
              onClick={() => handleNodeClick('paris')}
            >
              📍 Paris
              {isRaining && <span className="weather-badge">⚠️ Rain</span>}
            </div>

            <div 
              className={`demo-node node-lyon ${budget < 500 ? 'node-expensive' : 'node-cheap'} ${activeNode === 'lyon' ? 'selected' : ''}`}
              onClick={() => handleNodeClick('lyon')}
            >
              🚂 Lyon
            </div>

            <div 
              className={`demo-node node-marseille ${budget < 800 ? 'node-expensive' : 'node-cheap'} ${activeNode === 'marseille' ? 'selected' : ''}`}
              onClick={() => handleNodeClick('marseille')}
            >
              🏖 Marseille
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;