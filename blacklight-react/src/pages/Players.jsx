import React, { useState, useEffect, useRef } from 'react';
import { Auth } from '../services/auth';
import './Players.css';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [sortSelect, setSortSelect] = useState('score');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(Auth.getSession());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [gamerTagInput, setGamerTagInput] = useState('');
  const [gameInput, setGameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [errors, setErrors] = useState({});
  const [modalMsg, setModalMsg] = useState({ text: '', type: '' });

  const searchTimeoutRef = useRef(null);

  const RANK_ICONS = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💠', Diamond: '💎' };

  const fetchPlayers = async (searchVal = search, gameVal = gameFilter, sortVal = sortSelect) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set('search', searchVal.trim());
    if (gameVal) params.set('game', gameVal);
    if (sortVal) params.set('sort', sortVal);

    try {
      const res = await fetch(`/api/players?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on inputs change with a 300ms debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPlayers(search, gameFilter, sortSelect);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, gameFilter, sortSelect]);

  // Initial load
  useEffect(() => {
    setSession(Auth.getSession());
  }, []);

  const handleAddProfile = async (e) => {
    e.preventDefault();
    setErrors({});
    setModalMsg({ text: '', type: '' });

    let valid = true;
    let newErrors = {};

    if (!gamerTagInput.trim()) {
      newErrors.gamerTag = 'Gamer tag is required.';
      valid = false;
    }
    if (!gameInput) {
      newErrors.game = 'Please select a game.';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = Auth.getToken();
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          gamerTag: gamerTagInput.trim(), 
          game: gameInput, 
          bio: bioInput.trim() 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalMsg({ text: '❌ ' + (data.error || 'Server error.'), type: 'error' });
        return;
      }

      setModalMsg({ text: '✅ Profile created successfully!', type: 'success' });
      
      setTimeout(() => {
        setShowModal(false);
        setGamerTagInput('');
        setGameInput('');
        setBioInput('');
        setModalMsg({ text: '', type: '' });
        fetchPlayers();
      }, 1500);

    } catch (err) {
      setModalMsg({ text: '❌ Server connection error.', type: 'error' });
    }
  };

  return (
    <div className="page-container fade-in">
      {/* HERO */}
      <section className="page-hero">
        <h1>⚔️ Players</h1>
        <p>Meet the elite warriors of the BlackLight universe</p>
      </section>

      {/* CONTROLS */}
      <section className="players-controls">
        <div className="controls-inner">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search by gamer tag or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row">
            <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
              <option value="">All Games</option>
              <option value="Battle Royale">Battle Royale</option>
              <option value="FPS Arena">FPS Arena</option>
              <option value="Shadow Tactics">Shadow Tactics</option>
              <option value="Void Runner">Void Runner</option>
              <option value="Dark Siege">Dark Siege</option>
            </select>
            
            <select value={sortSelect} onChange={(e) => setSortSelect(e.target.value)}>
              <option value="score">Sort: Score</option>
              <option value="wins">Sort: Wins</option>
              <option value="rank">Sort: Rank</option>
            </select>

            {session && (
              <button className="btn-add-player" onClick={() => setShowModal(true)}>
                + Add My Profile
              </button>
            )}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="players-section">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading players...</p>
          </div>
        ) : players.length === 0 ? (
          <p className="no-results">No players found matching your filters.</p>
        ) : (
          <div className="players-grid">
            {players.map((p) => (
              <div key={p.id} className="player-card glass-panel glow-hover">
                <div className="player-card-top">
                  <div className="player-avatar">{p.emoji || '👤'}</div>
                  <div className="player-name-wrap">
                    <h3>{p.gamer_tag}</h3>
                    <span>{p.first_name} {p.last_name}</span>
                  </div>
                </div>
                <span className={`rank-badge rank-${p.rank}`}>
                  {RANK_ICONS[p.rank] || '🥉'} {p.rank}
                </span>
                
                <div className="player-stats">
                  <div className="stat-item">
                    <span className="s-val">{(p.score || 0).toLocaleString()}</span>
                    <span className="s-lbl">Score</span>
                  </div>
                  <div className="stat-item">
                    <span className="s-val">{p.wins || 0}</span>
                    <span className="s-lbl">Wins</span>
                  </div>
                  <div className="stat-item">
                    <span className="s-val">{p.losses || 0}</span>
                    <span className="s-lbl">Losses</span>
                  </div>
                </div>

                <div className="player-game-tag">🎮 {p.game}</div>
                {p.bio && <p className="player-bio">{p.bio}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <h2>Create Player Profile</h2>
            <p className="modal-sub">Set up your competitive statistics</p>

            <form onSubmit={handleAddProfile} noValidate>
              <div className="input-group">
                <label htmlFor="pGamerTag">Gamer Tag *</label>
                <input 
                  type="text" 
                  id="pGamerTag" 
                  placeholder="e.g. SHADOWBLADE" 
                  value={gamerTagInput}
                  onChange={(e) => setGamerTagInput(e.target.value)}
                  className={errors.gamerTag ? 'invalid' : ''}
                  required
                />
                {errors.gamerTag && <small className="error">{errors.gamerTag}</small>}
              </div>

              <div className="input-group">
                <label htmlFor="pGame">Primary Game *</label>
                <select 
                  id="pGame" 
                  value={gameInput}
                  onChange={(e) => setGameInput(e.target.value)}
                  className={errors.game ? 'invalid' : ''}
                  required
                >
                  <option value="">Select game...</option>
                  <option value="Battle Royale">Battle Royale</option>
                  <option value="FPS Arena">FPS Arena</option>
                  <option value="Shadow Tactics">Shadow Tactics</option>
                  <option value="Void Runner">Void Runner</option>
                  <option value="Dark Siege">Dark Siege</option>
                </select>
                {errors.game && <small className="error">{errors.game}</small>}
              </div>

              <div className="input-group">
                <label htmlFor="pBio">Bio</label>
                <textarea 
                  id="pBio" 
                  placeholder="Describe your playstyle..." 
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" className="btn-submit">Create Profile</button>
              
              {modalMsg.text && (
                <p className={`form-msg ${modalMsg.type === 'success' ? 'success' : 'error'}`} style={{ color: modalMsg.type === 'success' ? '#4ade80' : '#ff6b6b', marginTop: '12px', textAlign: 'center' }}>
                  {modalMsg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
