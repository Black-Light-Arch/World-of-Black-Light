import React, { useState } from 'react';
import './Games.css';

const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const gamesList = [
    {
      id: 'watching',
      title: "The One Who's Watching",
      tagline: "Psychological Horror Experience",
      coverImg: "/assets/images/screenshots/game1.jpg",
      screenshots: [
        "/assets/images/screenshots/game1.jpg",
        "/assets/images/screenshots/game2.jpg",
        "/assets/images/screenshots/game3.jpg"
      ],
      description: [
        "The town feels wrong. Lights flicker without reason. Shadows linger longer than they should.",
        "As you explore the abandoned streets, you begin to realize something terrifying: you are never truly alone.",
        "Something watches from the darkness. And it knows you are here."
      ],
      features: [
        "Atmospheric psychological horror",
        "Dynamic lighting system",
        "Immersive sound design",
        "Unreal Engine cinematic environments",
        "Story-driven exploration"
      ],
      trailerUrl: "/assets/video/trailer.mp4"
    },
    {
      id: 'future',
      title: "Project: Phantom Void",
      tagline: "First-Person Sci-Fi Terror",
      coverImg: "/assets/images/covers/story3.jpg",
      screenshots: [],
      description: [
        "In the vacuum of deep space, silence is a warning. Signals from a long-lost relay station trigger a search operation that uncovers a cosmic anomaly.",
        "Unravel the secrets of the Phantom Void before the local reality collapses entirely."
      ],
      features: [
        "Cosmic horror setting",
        "Zero-gravity movement puzzles",
        "Interdimensional shifting mechanics",
        "Sound-reactive environment AI"
      ],
      comingSoon: true
    }
  ];

  return (
    <div className="page-container fade-in">
      <section className="page-hero">
        <h1>⚔️ Games</h1>
        <p>Step into the terrifying worlds of BlackLight Studio</p>
      </section>

      <section className="content-section">
        <div className="games-grid">
          {gamesList.map((game) => (
            <div 
              key={game.id} 
              className={`game-tile-card glass-panel glow-hover ${selectedGame?.id === game.id ? 'active' : ''}`}
              onClick={() => setSelectedGame(game)}
            >
              <div className="tile-image-wrap">
                <img src={game.coverImg} alt={game.title} />
                {game.comingSoon && <span className="coming-soon-badge">COMING SOON</span>}
              </div>
              <div className="tile-info">
                <h3>{game.title}</h3>
                <p>{game.tagline}</p>
                <button className="btn-secondary tile-btn">
                  {game.comingSoon ? 'Learn More' : 'Enter Void &rarr;'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EXPANDED DETAILS SECTION */}
        {selectedGame && (
          <div className="game-details-overlay glass-panel fade-in">
            <button className="details-close-btn" onClick={() => setSelectedGame(null)}>✕ Close</button>
            
            <div className="details-layout">
              <div className="details-main">
                <h2>{selectedGame.title}</h2>
                <p className="details-tagline">{selectedGame.tagline}</p>
                
                <div className="details-desc">
                  {selectedGame.description.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {!selectedGame.comingSoon && (
                  <div className="trailer-wrap">
                    <h3>Official Trailer</h3>
                    <div className="video-container">
                      <video controls preload="metadata">
                        <source src={selectedGame.trailerUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                {selectedGame.screenshots.length > 0 && (
                  <div className="screenshots-wrap">
                    <h3>Screenshots</h3>
                    <div className="screenshots-grid">
                      {selectedGame.screenshots.map((src, idx) => (
                        <a key={idx} href={src} target="_blank" rel="noreferrer" className="screenshot-link">
                          <img src={src} alt={`Screenshot ${idx + 1}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="details-sidebar">
                <h3>Game Features</h3>
                <ul className="features-list">
                  {selectedGame.features.map((feature, idx) => (
                    <li key={idx}>⚡ {feature}</li>
                  ))}
                </ul>

                {selectedGame.comingSoon ? (
                  <div className="coming-soon-box">
                    <h4>Status: In Concept Phase</h4>
                    <p>Internal pre-production logs are restricted. Check the DevLog tab for engineering journals.</p>
                  </div>
                ) : (
                  <div className="play-status-box">
                    <h4>Status: Active Alpha</h4>
                    <p>Register for tournaments to compete on public builds.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Games;
