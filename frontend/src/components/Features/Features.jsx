// src/components/Features/Features.jsx
import React, { useEffect, useRef } from 'react';
import { BrainCircuit, Calculator, Network, Activity, Info } from 'lucide-react';
import './Features.css';

const featuresData = [
  {
    id: 'ai-plan',
    title: 'AI-Powered Planning',
    desc: 'Natural language processing turns your vague vacation ideas into structured itineraries.',
    icon: <BrainCircuit size={40} className="feature-icon brain-icon" />,
    tooltip: 'LLM prompts for local secrets',
    customEffect: <div className="sparkles">✨</div>
  },
  {
    id: 'budget-opt',
    title: 'Budget Optimization',
    desc: 'Max experience per dollar. We mathematically calculate the highest value activities for your wallet.',
    icon: <Calculator size={40} className="feature-icon calc-icon" />,
    tooltip: 'Knapsack algorithm - max experience per dollar',
    customEffect: <div className="progress-track"><div className="progress-fill"></div></div>
  },
  {
    id: 'smart-route',
    title: 'Smart Routing',
    desc: 'Stop wasting time on trains. We map the absolute fastest path between your points of interest.',
    icon: <Network size={40} className="feature-icon route-icon" />,
    tooltip: "Dijkstra's shortest path - saves hours",
    customEffect: (
      <div className="route-animation">
        <span className="route-node n1"></span>
        <span className="route-line"></span>
        <span className="route-node n2"></span>
      </div>
    )
  },
  {
    id: 'live-data',
    title: 'Real-Time Constraints',
    desc: 'If it rains, we pivot. Dynamic itinerary adjustments based on live weather and crowd data.',
    icon: <Activity size={40} className="feature-icon live-icon" />,
    tooltip: 'Weather, crowds, prices - dynamic adaptation',
    customEffect: <div className="live-indicator"><span className="live-dot"></span> Live Sync</div>
  }
];

const Features = () => {
  const sectionRef = useRef(null);

  // Scroll reveal logic using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 } // Triggers when 10% of the element is visible
    );

    const cards = sectionRef.current.querySelectorAll('.feature-card-wrapper');
    cards.forEach((card) => observer.observe(card));

    return () => cards.forEach((card) => observer.unobserve(card));
  }, []);

  return (
    <section className="features-section" id="features" ref={sectionRef}>
      <div className="features-header">
        <h2 className="section-title">The Engine Room</h2>
        <p className="section-subtitle">Complex algorithms wrapped in a beautiful interface.</p>
      </div>

      <div className="features-grid">
        {featuresData.map((feature, index) => (
          <div 
            key={feature.id} 
            className="feature-card-wrapper" 
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {/* Reusing your global glass-brutal-card class! */}
            <div className={`feature-card glass-brutal-card ${feature.id}`}>
              <div className="feature-icon-container">
                {feature.icon}
                {feature.customEffect}
              </div>
              
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>

              {/* Tooltip implementation */}
              <div className="feature-tooltip-trigger">
                <Info size={16} /> Technical Detail
                <div className="feature-tooltip">{feature.tooltip}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;