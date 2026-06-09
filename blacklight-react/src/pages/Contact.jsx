import React, { useState, useEffect, useRef } from 'react';
import './Contact.css';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);

  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  const mapInitializedRef = useRef(false);

  const handleMessageChange = (e) => {
    const val = e.target.value;
    if (val.length <= 1000) {
      setMessage(val);
      setCharCount(val.length);
    }
  };

  const validateForm = () => {
    setErrors({});
    let tempErrors = {};
    let valid = true;

    if (!name.trim() || name.trim().length < 2) {
      tempErrors.name = 'Name must be at least 2 characters.';
      valid = false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address.';
      valid = false;
    }
    if (!subject.trim() || subject.trim().length < 3) {
      tempErrors.subject = 'Subject must be at least 3 characters.';
      valid = false;
    }
    if (!message.trim() || message.trim().length < 10) {
      tempErrors.message = 'Message must be at least 10 characters.';
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({ text: '❌ ' + (data.error || 'Failed to send message.'), type: 'error' });
      } else {
        setStatusMsg({ text: '✅ Message sent! We\'ll get back to you shortly.', type: 'success' });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setCharCount(0);
      }
    } catch (err) {
      setStatusMsg({ text: '❌ Server error. Please try again later.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Dynamic import of Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Dynamic import of Leaflet script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (window.L && !mapInitializedRef.current) {
        const LAT = 24.8607;
        const LNG = 67.0011;
        const map = window.L.map('contactMap').setView([LAT, LNG], 13);
        
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const customIcon = window.L.divIcon({
          className: '',
          html: `<div style="
            background: linear-gradient(135deg, #5E17EB, #9F73FF);
            width: 36px; height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex; align-items: center; justify-content: center;
            border: 2px solid rgba(159,115,255,0.5);
            box-shadow: 0 0 15px rgba(94,23,235,0.6);
          "><span style="transform:rotate(45deg);font-size:16px;">👁️</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -40]
        });

        window.L.marker([LAT, LNG], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:serif;color:#111;line-height:1.4;">
              <strong>BlackLight Studios</strong><br>
              Karachi, Pakistan<br>
              <small>support@blacklight.gg</small>
            </div>
          `)
          .openPopup();
        
        mapInitializedRef.current = true;
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>📡 Contact</h1>
        <p>Reach the shadow council — we respond within 24 hours</p>
      </section>

      <section className="content-section contact-layout">
        
        {/* LEFT: FORM */}
        <div className="contact-form-side">
          <div className="contact-info-cards">
            <div className="info-card glass-panel">
              <span className="info-card-icon">📧</span>
              <div>
                <strong>Email</strong>
                <p>support@blacklight.gg</p>
              </div>
            </div>
            <div className="info-card glass-panel">
              <span className="info-card-icon">💬</span>
              <div>
                <strong>Discord</strong>
                <p>discord.gg/blacklight</p>
              </div>
            </div>
            <div className="info-card glass-panel">
              <span className="info-card-icon">📍</span>
              <div>
                <strong>HQ</strong>
                <p>Karachi, Pakistan</p>
              </div>
            </div>
          </div>

          <h2 className="form-heading">Send a Message</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row-2">
              <div className="input-group">
                <label htmlFor="cName">Full Name *</label>
                <input 
                  type="text" 
                  id="cName" 
                  placeholder="Your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'invalid' : ''}
                  required
                />
                {errors.name && <small className="error">{errors.name}</small>}
              </div>
              <div className="input-group">
                <label htmlFor="cEmail">Email *</label>
                <input 
                  type="email" 
                  id="cEmail" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'invalid' : ''}
                  required
                />
                {errors.email && <small className="error">{errors.email}</small>}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="cSubject">Subject *</label>
              <input 
                type="text" 
                id="cSubject" 
                placeholder="What's this about?" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={errors.subject ? 'invalid' : ''}
                required
              />
              {errors.subject && <small className="error">{errors.subject}</small>}
            </div>

            <div className="input-group">
              <label htmlFor="cMessage">Message *</label>
              <textarea 
                id="cMessage" 
                rows="6" 
                placeholder="Write your message here..." 
                value={message}
                onChange={handleMessageChange}
                className={errors.message ? 'invalid' : ''}
                required
              ></textarea>
              {errors.message && <small className="error">{errors.message}</small>}
              <div className="char-counter">
                <span>{charCount}</span> / 1000
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </button>

            {statusMsg.text && (
              <div className={`contact-response status-${statusMsg.type}`}>
                {statusMsg.text}
              </div>
            )}
          </form>
        </div>

        {/* RIGHT: MAP */}
        <div className="contact-map-side">
          <h2 className="form-heading">Our HQ</h2>
          <div id="contactMap"></div>
          <p className="map-note">📍 BlackLight Studios, Karachi, Pakistan</p>
        </div>

      </section>
    </div>
  );
};

export default Contact;
