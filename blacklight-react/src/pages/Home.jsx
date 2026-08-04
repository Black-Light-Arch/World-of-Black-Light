import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="page-container fade-in">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">World of BlackLight</h1>
          <p className="hero-tagline">Where light dies &mdash; stories awaken.</p>
          <div className="scroll-indicator">&#8595;</div>
        </div>
      </section>

      {/* FEATURED BOOTCAMP ACADEMY BANNER */}
      <section className="featured-section" style={{ paddingBottom: 0 }}>
        <h2 className="featured-title-hdr" style={{ color: '#00e5ff' }}>⚡ BlackLight Academy</h2>
        <Link to="/courses" className="featured-game-card glass-panel glow-hover" style={{ textDecoration: 'none' }}>
          <div className="featured-img-wrap">
            <img 
              src="/assets/images/courses/ai_bootcamp_hero.png" 
              alt="AI Creative Skills Bootcamp" 
              onError={(e) => { e.target.src = '/assets/images/screenshots/game1.jpg'; }}
            />
          </div>
          <div className="featured-info">
            <div style={{ background: 'rgba(255,170,0,0.15)', color: '#ffaa00', border: '1px solid #ffaa00', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', display: 'inline-block', marginBottom: 10, fontWeight: 700 }}>
              1-MONTH LIVE MENTORSHIP
            </div>
            <h3 style={{ fontSize: '1.8rem', color: '#fff' }}>AI Creative Skills Bootcamp</h3>
            <p style={{ color: '#aaa', fontSize: '0.95rem', margin: '10px 0 15px' }}>
              Master AI Automation, Adobe Photoshop, Poster Designing, 3D Character Creation & Canva. Live mentorship, cash prizes up to Rs. 5,000 & official E-Certificate!
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
              <div>
                <span style={{ textDecoration: 'line-through', color: '#777', fontSize: '0.85rem' }}>Rs. 7,000</span>
                <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '1.4rem', marginLeft: 8 }}>Rs. 4,500</span>
              </div>
              <span className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.75rem' }}>Explore & Enroll &rarr;</span>
            </div>
          </div>
        </Link>
      </section>

      {/* FEATURED GAME */}
      <section className="featured-section">
        <h2 className="featured-title-hdr">Featured Experience</h2>
        <Link to="/games" className="featured-game-card">
          <div className="featured-img-wrap">
            <img src="/assets/images/screenshots/game1.jpg" alt="The One Who's Watching" />
          </div>
          <div className="featured-info">
            <h3>The One Who&#8217;s Watching</h3>
            <p>
              Something is wrong in this town.
              The lights flicker. The air feels heavy.
              And someone is always watching.
            </p>
            <span className="btn-primary">Enter &rarr;</span>
          </div>
        </Link>
      </section>

      {/* STORIES PREVIEW */}
      <section className="stories-section">
        <h2>Archive Preview</h2>
        <p>Restricted records of unexplained events and dimensional anomalies.</p>
        <div className="stories-grid">
          <div className="story-tile">
            <img src="/assets/images/covers/story1.jpg" alt="Classified File 01" />
            <h3>Classified File 01</h3>
          </div>
          <div className="story-tile">
            <img src="/assets/images/covers/story2.jpg" alt="Echo Log" />
            <h3>Echo Log</h3>
          </div>
        </div>
        <Link to="/stories" className="btn-secondary">Enter The Archive &rarr;</Link>
      </section>

      {/* DEVLOG PREVIEW */}
      <section className="devlog-section">
        <h2>Development Log</h2>
        <div className="devlog-preview-card">
          <h3>Lighting Experiments in Unreal</h3>
          <p>Breaking down atmosphere control, shadow density behavior, and tension design...</p>
          <Link to="/devlog" className="btn-primary">Read Log &rarr;</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
