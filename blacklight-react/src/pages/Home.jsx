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
