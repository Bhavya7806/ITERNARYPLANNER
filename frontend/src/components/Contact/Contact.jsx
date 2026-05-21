// src/components/Contact/Contact.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Mail, Copy, Check, Terminal, AtSign, MessageSquare, Send, MapPin, Loader2 } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | sending | sent
  const [showToast, setShowToast] = useState(false);
  
  // Copy to clipboard state
  const [copied, setCopied] = useState(false);

  // Scroll Reveal Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('team@wanderlens.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(true);
      setTimeout(() => setEmailError(false), 800); // Remove shake class after animation
      return;
    }

    setSubmitStatus('sending');
    
    // Fake API Call
    setTimeout(() => {
      setSubmitStatus('sent');
      setShowToast(true);
      
      // Reset form
      setTimeout(() => {
        setSubmitStatus('idle');
        setEmail('');
        setTimeout(() => setShowToast(false), 3000); // Hide toast after 3s
      }, 2000);
    }, 1500);
  };

  return (
    <section className="contact-section" id="contact" ref={sectionRef}>
      <div className={`contact-layout ${isVisible ? 'animate-in' : ''}`}>
        
        {/* Left Side: Contact Form */}
        <div className="contact-form-container glass-brutal-card slide-in-left">
          <div className="form-header">
            <h2>Get in Touch</h2>
            <p>Report a bug, request a feature, or just say hi.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="John Doe" required className="brutal-input" />
            </div>

            <div className={`input-group ${emailError ? 'shake-error' : ''}`}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="john@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="brutal-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="4" placeholder="How can we help?" required className="brutal-input textarea"></textarea>
            </div>

            <button 
              type="submit" 
              className={`btn-primary submit-btn ${submitStatus === 'sending' ? 'sending' : ''}`}
              disabled={submitStatus !== 'idle'}
            >
              {submitStatus === 'idle' && <><Send size={18} /> Send Message</>}
              {submitStatus === 'sending' && <><Loader2 size={18} className="spinner" /> Sending...</>}
              {submitStatus === 'sent' && <><Check size={18} /> Sent! ✨</>}
            </button>
          </form>
        </div>

        {/* Right Side: Info & Socials */}
        <div className="contact-info-container slide-in-right">
          
          <div className="info-block">
            <h3>Direct Contact</h3>
            <div className="email-box glass-brutal-card" onClick={handleCopyEmail}>
              <Mail className="info-icon" />
              <span>team@wanderlens.com</span>
              {copied ? <Check size={18} className="copy-icon success" /> : <Copy size={18} className="copy-icon" />}
            </div>
          </div>

          <div className="info-block">
            <h3>Community & Code</h3>
            <div className="social-grid">
              <a href="#discord" className="social-card discord glass-brutal-card">
                <MessageSquare size={24} className="social-icon" />
                <span>Discord</span>
              </a>
              <a href="#github" className="social-card github glass-brutal-card">
                <Terminal size={24} className="social-icon" />
                <span>GitHub <span className="open-source-badge">FOSS</span></span>
              </a>
              <a href="#twitter" className="social-card twitter glass-brutal-card">
                <AtSign size={24} className="social-icon" />
                <span>@wanderlens</span>
              </a>
            </div>
          </div>

          {/* Static Map Placeholder */}
          <div className="map-placeholder glass-brutal-card">
            <svg viewBox="0 0 400 200" className="bg-map-lines">
              <path d="M 0,100 Q 100,50 200,100 T 400,100" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"/>
            </svg>
            <MapPin size={32} className="pulsing-pin" color="var(--color-secondary)" />
            <span className="map-label">HQ: The Internet</span>
          </div>

        </div>
      </div>

      {/* Success Toast */}
      <div className={`toast-notification glass-brutal-card ${showToast ? 'show' : ''}`}>
        <Check size={20} color="var(--color-success)" />
        <span>Message received loud and clear!</span>
      </div>
    </section>
  );
};

export default Contact;