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
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [legendaryUnlocked, setLegendaryUnlocked] = useState(localStorage.getItem('legendary_skin_unlocked') === 'true');
  const [skinMsg, setSkinMsg] = useState({ text: '', type: '' });
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
      setSelectedSkin(data.skin || 'default');
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

  const handleUnlockLegendary = async () => {
    if (typeof window.ethereum === 'undefined') {
      setSkinMsg({ text: '🔌 MetaMask Web3 not detected. Please install it to unlock Legendary clearance.', type: 'error' });
      return;
    }
    try {
      setSkinMsg({ text: '📡 Connecting MetaMask wallet...', type: 'info' });
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      setSkinMsg({ text: '⏳ Staging transaction payload...', type: 'info' });
      const transactionParameters = {
        to: '0x9A5A203102052965E9bc8b94c54bAA82ab3e16F7',
        from: from,
        value: '0x11c37937e08000', // 0.005 ETH in hex wei
      };

      setSkinMsg({ text: '✍️ Confirm the 0.005 ETH signature in MetaMask...', type: 'info' });
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      setSkinMsg({ text: '📡 Writing skin token to database...', type: 'info' });
      const token = Auth.getToken();
      const res = await fetch('/api/me/skin', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ skin: 'legendary' })
      });
      if (!res.ok) throw new Error('Database link failed.');

      localStorage.setItem('legendary_skin_unlocked', 'true');
      setLegendaryUnlocked(true);
      setSelectedSkin('legendary');

      const session = Auth.getSession();
      if (session) {
        session.skin = 'legendary';
        localStorage.setItem('bl_user', JSON.stringify(session));
      }

      setSkinMsg({ text: `🎉 Legendary Skin unlocked! Hash: ${txHash.substring(0, 10)}...`, type: 'success' });
      setTimeout(() => setSkinMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setSkinMsg({ text: `❌ Web3 Error: ${err.message || 'Signature rejected'}`, type: 'error' });
    }
  };

  const handleSaveSkin = async (skinName) => {
    if (skinName === 'legendary' && !legendaryUnlocked) {
      handleUnlockLegendary();
      return;
    }
    setSkinMsg({ text: '', type: '' });
    try {
      const token = Auth.getToken();
      const res = await fetch('/api/me/skin', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ skin: skinName })
      });
      if (!res.ok) throw new Error();

      const session = Auth.getSession();
      if (session) {
        session.skin = skinName;
        localStorage.setItem('bl_user', JSON.stringify(session));
      }

      setSelectedSkin(skinName);
      setSkinMsg({ text: `✓ Cosmetic skin set to ${skinName}!`, type: 'success' });
      setTimeout(() => setSkinMsg({ text: '', type: '' }), 2500);
    } catch (err) {
      setSkinMsg({ text: '✗ Failed to update skin.', type: 'error' });
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

          {/* COSMETIC SKINS CUSTOMIZER */}
          <div className="profile-section-title">Cosmetic Avatar Skins</div>
          <p className="theme-sub">Skins change name tags look in chat streams</p>
          <div className="skins-customizer-grid">
            <button 
              type="button" 
              className={`skin-select-btn skin-default ${selectedSkin === 'default' ? 'active-skin' : ''}`}
              onClick={() => handleSaveSkin('default')}
            >
              <span>Default Operator</span>
            </button>
            <button 
              type="button" 
              className={`skin-select-btn skin-green ${selectedSkin === 'green' ? 'active-skin' : ''}`}
              onClick={() => handleSaveSkin('green')}
            >
              <span className="effect-green">Green Spectre</span>
            </button>
            <button 
              type="button" 
              className={`skin-select-btn skin-cyan ${selectedSkin === 'cyan' ? 'active-skin' : ''}`}
              onClick={() => handleSaveSkin('cyan')}
            >
              <span className="effect-cyan">Cyan Phantom</span>
            </button>
            <button 
              type="button" 
              className={`skin-select-btn skin-legendary ${selectedSkin === 'legendary' ? 'active-skin' : ''}`}
              onClick={() => handleSaveSkin('legendary')}
            >
              <span className="effect-legendary">
                {legendaryUnlocked ? 'Legendary Decryptor' : '👑 Unlock Legendary (0.005 ETH)'}
              </span>
            </button>
          </div>
          {skinMsg.text && (
            <p className={`save-confirm ${skinMsg.type === 'success' ? 'success' : skinMsg.type === 'info' ? 'info' : 'error'}`}>
              {skinMsg.text}
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
