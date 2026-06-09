import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Auth } from '../services/auth';
import { disconnectSocket } from '../services/socket';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState('👁️');
  const [selectedTheme, setSelectedTheme] = useState('purple');
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ score: '—', wins: '—' });
  const [loading, setLoading] = useState(true);

  const [emojiMsg, setEmojiMsg] = useState({ text: '', type: '' });
  const [themeMsg, setThemeMsg] = useState({ text: '', type: '' });

  const emojiList = ['👁️', '💀', '🌑', '👤', '🎮', '🔮', '☠️', '🐺', '🕷️', '🧿', '🌿', '🔥'];
  const themeList = [
    { name: 'purple', label: 'Void', class: 'theme-purple-btn' },
    { name: 'red', label: 'Crimson', class: 'theme-red-btn' },
    { name: 'green', label: 'Phantom', class: 'theme-green-btn' },
    { name: 'amber', label: 'Ember', class: 'theme-amber-btn' }
  ];

  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
      });
      if (!res.ok) {
        throw new Error();
      }
      const data = await res.json();
      setUser(data);
      setSelectedEmoji(data.emoji || '👁️');
      setSelectedTheme(data.theme || 'purple');
      setRegistrations(data.registrations || []);
      
      if (data.player) {
        setStats({
          score: (data.player.score || 0).toLocaleString(),
          wins: data.player.wins || 0
        });
      }

    } catch (err) {
      console.error('Failed to load profile data');
      // If error occurs, fallback to localStorage user
      const localUser = Auth.getSession();
      if (localUser) {
        setUser(localUser);
        setSelectedEmoji(localUser.emoji || '👁️');
        setSelectedTheme(localUser.theme || 'purple');
      } else {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Auth.isLoggedIn()) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, [navigate]);

  const handleSaveEmoji = async () => {
    setEmojiMsg({ text: '', type: '' });
    try {
      const token = Auth.getToken();
      const res = await fetch('/api/me/emoji', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ emoji: selectedEmoji })
      });
      
      if (!res.ok) throw new Error();

      // Update stored session values
      const session = Auth.getSession();
      if (session) {
        session.emoji = selectedEmoji;
        localStorage.setItem('bl_user', JSON.stringify(session));
      }

      setEmojiMsg({ text: '✓ Icon updated successfully!', type: 'success' });
      setTimeout(() => setEmojiMsg({ text: '', type: '' }), 2500);

    } catch (err) {
      setEmojiMsg({ text: '✗ Failed to update emoji icon.', type: 'error' });
    }
  };

  const handleSaveTheme = async (themeName) => {
    setThemeMsg({ text: '', type: '' });
    setSelectedTheme(themeName);
    
    try {
      const token = Auth.getToken();
      const res = await fetch('/api/me/theme', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ theme: themeName })
      });

      if (!res.ok) throw new Error();

      // Apply theme to document body
      document.body.className = `theme-${themeName}`;

      // Update stored session values
      const session = Auth.getSession();
      if (session) {
        session.theme = themeName;
        localStorage.setItem('bl_user', JSON.stringify(session));
      }

      setThemeMsg({ text: `✓ Theme set to ${themeName}!`, type: 'success' });
      setTimeout(() => setThemeMsg({ text: '', type: '' }), 2500);

    } catch (err) {
      setThemeMsg({ text: '✗ Failed to update theme.', type: 'error' });
    }
  };

  const handleLogout = () => {
    Auth.logout();
    disconnectSocket();
    document.body.className = 'theme-purple'; // Reset theme
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page-container fade-in">
        <section className="profile-section">
          <div className="profile-card glass-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Decrypting session profile...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <section className="profile-section">
        <div className="profile-card glass-panel glow-hover">
          
          {/* Avatar circle */}
          <div className="profile-avatar-display">
            <div className="avatar-circle">{selectedEmoji}</div>
            <div className="avatar-glow"></div>
          </div>

          <div className="profile-info">
            <h1>{user?.firstName} {user?.lastName}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-badge-label" style={{ 
              borderColor: user?.isAdmin ? 'rgba(255,215,0,0.4)' : 'var(--border-color)',
              color: user?.isAdmin ? '#FFD700' : 'var(--text-secondary)'
            }}>
              {user?.isAdmin ? '🔐 Administrator' : 'BlackLight Operative'}
            </span>
          </div>

          <div className="profile-divider"></div>

          {/* EMOJI GRID */}
          <div className="profile-section-title">Choose Operative Icon</div>
          <div className="emoji-grid profile-emoji-grid">
            {emojiList.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                onClick={() => setSelectedEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button className="save-emoji-btn btn-primary" onClick={handleSaveEmoji}>
            Save Icon
          </button>
          {emojiMsg.text && (
            <p className={`save-confirm ${emojiMsg.type === 'success' ? 'success' : 'error'}`}>
              {emojiMsg.text}
            </p>
          )}

          <div className="profile-divider"></div>

          {/* THEME GRID */}
          <div className="profile-section-title">Personalized Theme</div>
          <p className="theme-sub">Theme settings sync across devices</p>
          <div className="theme-switcher">
            {themeList.map((theme) => (
              <button
                key={theme.name}
                type="button"
                className={`theme-btn ${theme.class} ${selectedTheme === theme.name ? 'active-theme' : ''}`}
                onClick={() => handleSaveTheme(theme.name)}
                title={theme.label}
              >
                <span className="theme-dot"></span>
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
          {themeMsg.text && (
            <p className={`save-confirm ${themeMsg.type === 'success' ? 'success' : 'error'}`}>
              {themeMsg.text}
            </p>
          )}

          <div className="profile-divider"></div>

          {/* TOURNAMENTS SECTION */}
          <div className="profile-section-title">My Tournament Registrations</div>
          <div className="profile-tournaments-list">
            {registrations.length === 0 ? (
              <p className="empty-regs-txt">No tournament registrations found.</p>
            ) : (
              registrations.map((r) => (
                <div key={r.id} className="profile-tourney-card">
                  <div className="profile-tourney-name">{r.tournament_name}</div>
                  <div className="profile-tourney-meta">
                    <span>🎮 {r.game}</span>
                    <span>📅 {new Date(r.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="profile-tourney-team">
                    Team Handle: <strong>{r.team_name}</strong> &middot; <span className="payment-paid-tag">{r.payment_status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="profile-divider"></div>

          {/* STATS SECTION */}
          <div className="profile-stats">
            <div className="stat-block">
              <span className="stat-number">{stats.score}</span>
              <span className="stat-label">Score</span>
            </div>
            <div className="stat-block">
              <span className="stat-number">{stats.wins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat-block">
              <span className="stat-number">{registrations.length}</span>
              <span className="stat-label">Tournaments</span>
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* ADMIN LINK PANEL */}
          {user?.isAdmin && (
            <div className="admin-link-panel">
              <Link to="/admin" className="btn-secondary admin-btn-nav">
                🔐 Access Admin Dashboard
              </Link>
            </div>
          )}

          <button className="logout-profile-btn btn-primary" onClick={handleLogout}>
            Leave the Dark
          </button>

        </div>
      </section>
    </div>
  );
};

export default Profile;
