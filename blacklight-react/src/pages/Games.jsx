import React, { useState } from 'react';
import './Games.css';

const Games = () => {
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

  const [selectedGame, setSelectedGame] = useState(gamesList[0]);

  return (
    <div className="page-container fade-in" style={{ paddingTop: '80px' }}>
      <div className="games-layout-wrapper">
        {/* SIDEBAR FOR GAMES LIST */}
        <aside className="games-sidebar-panel">
          <div className="sidebar-games-header">
            <h2>DEVELOPMENT LOGS</h2>
            <p>Studio project records</p>
          </div>
          <div className="sidebar-games-list">
            {gamesList.map((game) => (
              <button
                key={game.id}
                className={`sidebar-game-btn ${selectedGame.id === game.id ? 'active' : ''}`}
                onClick={() => setSelectedGame(game)}
              >
                <span className="bullet">⚡</span>
                <div className="btn-text">
                  <span className="title">{game.title}</span>
                  <span className="tag">{game.comingSoon ? 'COMING SOON' : 'ACTIVE BUILD'}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* DETAILS OF SELECTED GAME */}
        <main className="game-details-viewport">
          <div className="game-details-content-card glass-panel">
            <div className="game-banner-cover">
              <img src={selectedGame.coverImg} alt={selectedGame.title} />
              {selectedGame.comingSoon && <span className="coming-soon-ribbon">COMING SOON</span>}
              <div className="banner-title-overlay">
                <h1>{selectedGame.title}</h1>
                <p className="details-tagline">{selectedGame.tagline}</p>
              </div>
            </div>

            <div className="details-grid-layout">
              <div className="details-main-column">
                <div className="details-desc-box">
                  {selectedGame.description.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {!selectedGame.comingSoon && (
                  <div className="trailer-wrap-section">
                    <h3>OFFICIAL RECORD TRANSMISSION</h3>
                    <div className="video-container-card">
                      <video controls preload="metadata" key={selectedGame.id}>
                        <source src={selectedGame.trailerUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                {selectedGame.screenshots && selectedGame.screenshots.length > 0 && (
                  <div className="screenshots-wrap-section">
                    <h3>RECORDED IMAGERY</h3>
                    <div className="screenshots-flex-grid">
                      {selectedGame.screenshots.map((src, idx) => (
                        <a key={idx} href={src} target="_blank" rel="noreferrer" className="screenshot-card-link">
                          <img src={src} alt={`Screenshot ${idx + 1}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="details-sidebar-column">
                <div className="features-card-box">
                  <h3>SYSTEM FEATURES</h3>
                  <ul className="features-card-list">
                    {selectedGame.features.map((feature, idx) => (
                      <li key={idx}>💠 {feature}</li>
                    ))}
                  </ul>
                </div>

                {selectedGame.comingSoon ? (
                  <div className="status-indicator-box coming-soon">
                    <h4>clearance restricted</h4>
                    <p>This project is currently in the pre-concept phase. Internal developer logs remain classified.</p>
                  </div>
                ) : (
                  <div className="status-indicator-box active-build">
                    <h4>active combat simulation</h4>
                    <p>This experience is fully integrated into the competitive system database. Visit the Chat room to coordinate with other operatives.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Games;
