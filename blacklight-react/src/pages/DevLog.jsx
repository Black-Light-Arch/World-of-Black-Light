import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Auth } from '../services/auth';
import './DevLog.css';

const DevLog = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(Auth.isLoggedIn());

  useEffect(() => {
    setIsLoggedIn(Auth.isLoggedIn());
  }, []);

  const logs = [
    {
      id: 1,
      title: "Lighting System Experiments",
      date: "Jan 2026",
      image: "/assets/images/devlog/devlog1.jpg",
      body: "Focused on building atmospheric horror lighting using Unreal Engine. Tested dynamic red pulse lights, shadow movement behavior, and environment fog layering. The goal was to create tension through light density rather than darkness alone — making the player instinctively aware of something present without showing it directly."
    },
    {
      id: 2,
      title: "Hospital Environment Design",
      date: "Dec 2025",
      image: "/assets/images/devlog/devlog2.jpg",
      body: "Created the abandoned hospital layout, including corridor flow, environmental storytelling props, and tension-based room structure. Blueprint iteration 7 finalized Ward C — the primary gameplay zone. Each room is designed to guide the player without feeling guided."
    },
    {
      id: 3,
      title: "Creature Presence System",
      date: "Nov 2025",
      image: "/assets/images/devlog/devlog3.jpg",
      body: "Developed a non-direct AI presence system designed to create psychological fear through sound cues, shadow movement, and environmental reactions. The creature is never shown directly in early encounters — only its behavioral signature is detectable, making it feel like an idea rather than an entity."
    }
  ];

  if (!isLoggedIn) {
    return (
      <div className="page-container fade-in">
        <section className="page-hero">
          <h1>🔒 Restricted Access</h1>
          <p>This terminal requires security credentials</p>
        </section>

        <section className="content-section login-gate-wrapper">
          <div className="login-gate glass-panel glow-hover">
            <div className="login-gate-icon">🔒</div>
            <h2>Members Only</h2>
            <p>Development logs are restricted to BlackLight members. Sign in to access the studio's internal engineering records.</p>
            <div className="gate-actions">
              <Link to="/login" className="btn-primary">Sign In</Link>
              <Link to="/signup" className="btn-secondary">Create Account</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>🛠️ DevLog</h1>
        <p>Behind the creation of the BlackLight universe</p>
      </section>

      <section className="content-section devlog-content">
        <div className="devlog-list">
          {logs.map((log) => (
            <article key={log.id} className="devlog-entry glass-panel glow-hover">
              <div className="devlog-meta">
                <h2>{log.title}</h2>
                <span className="devlog-date">{log.date}</span>
              </div>
              <div className="devlog-img-wrap">
                <img src={log.image} alt={log.title} />
              </div>
              <p className="devlog-body-txt">{log.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DevLog;
