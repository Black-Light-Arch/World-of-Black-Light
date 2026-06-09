import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Auth } from '../services/auth';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(Auth.getSession());
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [tabData, setTabData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [euFirstName, setEuFirstName] = useState('');
  const [euLastName, setEuLastName] = useState('');
  const [euUsername, setEuUsername] = useState('');
  const [euEmail, setEuEmail] = useState('');
  const [euTheme, setEuTheme] = useState('purple');
  const [euIsAdmin, setEuIsAdmin] = useState(false);
  const [euPassword, setEuPassword] = useState('');
  const [editUserMsg, setEditUserMsg] = useState({ text: '', type: '' });

  // Edit Player Modal State
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [epGamerTag, setEpGamerTag] = useState('');
  const [epGame, setEpGame] = useState('Battle Royale');
  const [epScore, setEpScore] = useState(0);
  const [epWins, setEpWins] = useState(0);
  const [epLosses, setEpLosses] = useState(0);
  const [epRank, setEpRank] = useState('Bronze');
  const [editPlayerMsg, setEditPlayerMsg] = useState({ text: '', type: '' });

  // Add Tournament Modal State
  const [showAddTournamentModal, setShowAddTournamentModal] = useState(false);
  const [atName, setAtName] = useState('');
  const [atGame, setAtGame] = useState('Battle Royale');
  const [atDesc, setAtDesc] = useState('');
  const [atPrize, setAtPrize] = useState('');
  const [atSlots, setAtSlots] = useState(32);
  const [atFee, setAtFee] = useState(0);
  const [atDate, setAtDate] = useState('');
  const [atStatus, setAtStatus] = useState('open');
  const [addTournamentMsg, setAddTournamentMsg] = useState({ text: '', type: '' });

  const authHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Auth.getToken()}`
    };
  };

  const apiFetch = async (url, opts = {}) => {
    opts.headers = { ...authHeaders(), ...(opts.headers || {}) };
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  };

  const loadStats = async () => {
    try {
      const s = await apiFetch('/api/admin/stats');
      setStats(s);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadTabData = async (tab = activeTab) => {
    setLoading(true);
    try {
      let data = [];
      if (tab === 'users') {
        data = await apiFetch('/api/admin/users');
      } else if (tab === 'players') {
        data = await apiFetch('/api/admin/players');
      } else if (tab === 'tournaments') {
        data = await apiFetch('/api/admin/tournaments');
      } else if (tab === 'registrations') {
        data = await apiFetch('/api/admin/registrations');
      } else if (tab === 'messages') {
        data = await apiFetch('/api/admin/messages');
      }
      setTabData(data);
    } catch (err) {
      console.error(`Failed to load ${tab} data`, err);
      setTabData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session || !session.isAdmin) {
      navigate('/login');
      return;
    }
    loadStats();
    loadTabData(activeTab);
  }, [activeTab]);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // USERS CRUD
  const handleOpenEditUser = (user) => {
    setEditUser(user);
    setEuFirstName(user.first_name || '');
    setEuLastName(user.last_name || '');
    setEuUsername(user.username || '');
    setEuEmail(user.email || '');
    setEuTheme(user.theme || 'purple');
    setEuIsAdmin(!!user.is_admin);
    setEuPassword('');
    setEditUserMsg({ text: '', type: '' });
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserMsg({ text: 'Saving changes...', type: 'info' });
    try {
      await apiFetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: euFirstName,
          lastName: euLastName,
          username: euUsername,
          email: euEmail,
          theme: euTheme,
          isAdmin: euIsAdmin,
          password: euPassword || undefined
        })
      });
      setEditUserMsg({ text: '✅ Saved successfully!', type: 'success' });
      setTimeout(() => {
        setShowEditUserModal(false);
        loadStats();
        loadTabData('users');
      }, 1000);
    } catch (err) {
      setEditUserMsg({ text: '❌ ' + err.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      loadStats();
      loadTabData('users');
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  // PLAYERS CRUD
  const handleOpenEditPlayer = (player) => {
    setEditPlayer(player);
    setEpGamerTag(player.gamer_tag || '');
    setEpGame(player.game || 'Battle Royale');
    setEpScore(player.score || 0);
    setEpWins(player.wins || 0);
    setEpLosses(player.losses || 0);
    setEpRank(player.rank || 'Bronze');
    setEditPlayerMsg({ text: '', type: '' });
    setShowEditPlayerModal(true);
  };

  const handleEditPlayerSubmit = async (e) => {
    e.preventDefault();
    setEditPlayerMsg({ text: 'Saving...', type: 'info' });
    try {
      await apiFetch(`/api/admin/players/${editPlayer.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          gamerTag: epGamerTag,
          game: epGame,
          score: parseInt(epScore, 10),
          wins: parseInt(epWins, 10),
          losses: parseInt(epLosses, 10),
          rank: epRank
        })
      });
      setEditPlayerMsg({ text: '✅ Saved!', type: 'success' });
      setTimeout(() => {
        setShowEditPlayerModal(false);
        loadStats();
        loadTabData('players');
      }, 1000);
    } catch (err) {
      setEditPlayerMsg({ text: '❌ ' + err.message, type: 'error' });
    }
  };

  const handleDeletePlayer = async (id, tag) => {
    if (!window.confirm(`Delete player "${tag}"?`)) return;
    try {
      await apiFetch(`/api/admin/players/${id}`, { method: 'DELETE' });
      loadStats();
      loadTabData('players');
    } catch (err) {
      alert('Error deleting player: ' + err.message);
    }
  };

  // TOURNAMENTS CRUD
  const handleOpenAddTournament = () => {
    setAtName('');
    setAtGame('Battle Royale');
    setAtDesc('');
    setAtPrize('');
    setAtSlots(32);
    setAtFee(0);
    setAtDate('');
    setAtStatus('open');
    setAddTournamentMsg({ text: '', type: '' });
    setShowAddTournamentModal(true);
  };

  const handleAddTournamentSubmit = async (e) => {
    e.preventDefault();
    setAddTournamentMsg({ text: 'Creating tournament...', type: 'info' });
    try {
      await apiFetch('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify({
          name: atName,
          game: atGame,
          description: atDesc,
          prizePool: atPrize,
          maxSlots: parseInt(atSlots, 10),
          entryFee: parseInt(atFee, 10),
          startDate: atDate,
          status: atStatus
        })
      });
      setAddTournamentMsg({ text: '✅ Tournament created!', type: 'success' });
      setTimeout(() => {
        setShowAddTournamentModal(false);
        loadStats();
        loadTabData('tournaments');
      }, 1200);
    } catch (err) {
      setAddTournamentMsg({ text: '❌ ' + err.message, type: 'error' });
    }
  };

  const handleDeleteTournament = async (id, name) => {
    if (!window.confirm(`Delete tournament "${name}" and all registrations?`)) return;
    try {
      await apiFetch(`/api/tournaments/${id}`, { method: 'DELETE' });
      loadStats();
      loadTabData('tournaments');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // REGISTRATIONS CRUD
  const handleDeleteRegistration = async (id) => {
    if (!window.confirm('Remove this tournament registration?')) return;
    try {
      await apiFetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
      loadStats();
      loadTabData('registrations');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // MESSAGES CRUD
  const handleMarkMessageRead = async (id) => {
    try {
      await apiFetch(`/api/admin/messages/${id}/read`, { method: 'PATCH' });
      loadStats();
      loadTabData('messages');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await apiFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      loadStats();
      loadTabData('messages');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container admin-theme-wrap fade-in">
      {/* HEADER */}
      <header className="admin-dashboard-header">
        <div className="admin-brand-top">
          <span className="brand-eye">👁️</span>
          <span>BlackLight <strong>Admin</strong></span>
        </div>
        <div className="admin-user-info-bar">
          <span className="admin-tag-label">Operative: {session?.username}</span>
          <Link to="/" className="btn-secondary back-to-site-btn">← Back to Site</Link>
        </div>
      </header>

      <section className="content-section" style={{ paddingTop: '20px' }}>
        {/* STATS PANEL */}
        {stats && (
          <div className="admin-stats-dashboard">
            <div className="astat-card"><span className="val">{stats.totalUsers}</span><label>Users</label></div>
            <div className="astat-card"><span className="val">{stats.totalPlayers}</span><label>Players</label></div>
            <div className="astat-card"><span className="val">{stats.totalTournaments}</span><label>Tournaments</label></div>
            <div className="astat-card"><span className="val">{stats.totalRegistrations}</span><label>Registrations</label></div>
            <div className="astat-card"><span className="val" style={{ color: stats.unreadMessages > 0 ? '#ffaa00' : 'inherit' }}>{stats.unreadMessages}</span><label>Unread Msgs</label></div>
            <div className="astat-card"><span className="val">{stats.openTournaments}</span><label>Open Tourneys</label></div>
          </div>
        )}

        {/* TABS */}
        <div className="admin-tabs-row">
          <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
          <button className={`admin-tab-btn ${activeTab === 'players' ? 'active' : ''}`} onClick={() => setActiveTab('players')}>⚔️ Players</button>
          <button className={`admin-tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`} onClick={() => setActiveTab('tournaments')}>🏆 Tournaments</button>
          <button className={`admin-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`} onClick={() => setActiveTab('registrations')}>📋 Registrations</button>
          <button className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>📨 Messages</button>
        </div>

        {/* DETAILS TABLE */}
        <div className="admin-table-container glass-panel">
          {loading ? (
            <div className="tbl-loading-placeholder">
              <div className="spinner"></div>
              <p>Fetching records...</p>
            </div>
          ) : (
            <div className="table-scroll-wrapper">
              <table className="admin-table-records">
                
                {activeTab === 'users' && (
                  <>
                    <thead>
                      <tr><th>#</th><th>Username</th><th>Name</th><th>Email</th><th>Age</th><th>Theme</th><th>Admin</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {tabData.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td className="font-cinzel">{u.username}</td>
                          <td>{u.first_name} {u.last_name}</td>
                          <td className="opacity-70">{u.email}</td>
                          <td>{u.age || '—'}</td>
                          <td><span className="badge-theme-color">{u.theme}</span></td>
                          <td>
                            <span className={`admin-role-tag ${u.is_admin ? 'role-admin' : 'role-user'}`}>
                              {u.is_admin ? '✓ Admin' : 'User'}
                            </span>
                          </td>
                          <td className="opacity-50">{fmtDate(u.created_at)}</td>
                          <td>
                            <button className="tbl-action-btn edit" onClick={() => handleOpenEditUser(u)}>Edit</button>
                            <button className="tbl-action-btn delete" onClick={() => handleDeleteUser(u.id, u.username)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'players' && (
                  <>
                    <thead>
                      <tr><th>#</th><th>Gamer Tag</th><th>User</th><th>Game</th><th>Rank</th><th>Score</th><th>W/L</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {tabData.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td className="font-cinzel primary-color">{p.gamer_tag}</td>
                          <td className="opacity-70">@{p.username}</td>
                          <td className="opacity-70">🎮 {p.game}</td>
                          <td><span className={`lb-rank-badge rank-${p.rank}`}>{p.rank}</span></td>
                          <td className="font-cinzel primary-color">{(p.score || 0).toLocaleString()}</td>
                          <td className="opacity-60">{p.wins}W/{p.losses}L</td>
                          <td>
                            <button className="tbl-action-btn edit" onClick={() => handleOpenEditPlayer(p)}>Edit</button>
                            <button className="tbl-action-btn delete" onClick={() => handleDeletePlayer(p.id, p.gamer_tag)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'tournaments' && (
                  <>
                    <thead>
                      <tr><th>#</th><th>Name</th><th>Game</th><th>Prize</th><th>Fee</th><th>Slots</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {tabData.map((t) => (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td className="font-cinzel">{t.name}</td>
                          <td>🎮 {t.game}</td>
                          <td className="gold-text">{t.prize_pool}</td>
                          <td>{t.entry_fee === 0 ? 'FREE' : '$' + t.entry_fee}</td>
                          <td>{t.registered_count || 0}/{t.max_slots}</td>
                          <td className="opacity-70">{fmtDate(t.start_date)}</td>
                          <td><span className={`admin-role-tag ${t.status === 'open' ? 'role-admin' : 'role-user'}`}>{t.status}</span></td>
                          <td>
                            <button className="tbl-action-btn delete" onClick={() => handleDeleteTournament(t.id, t.name)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'right', padding: '16px' }}>
                          <button className="btn-primary" onClick={handleOpenAddTournament}>+ Add Tournament</button>
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {activeTab === 'registrations' && (
                  <>
                    <thead>
                      <tr><th>#</th><th>User</th><th>Tournament</th><th>Team</th><th>Game</th><th>Payment</th><th>Registered</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {tabData.map((r) => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>@{r.username}</td>
                          <td className="font-cinzel">{r.tournament_name}</td>
                          <td>{r.team_name}</td>
                          <td>🎮 {r.game}</td>
                          <td><span className="badge-theme-color green">{r.payment_status}</span></td>
                          <td className="opacity-50">{fmtDate(r.registered_at)}</td>
                          <td>
                            <button className="tbl-action-btn delete" onClick={() => handleDeleteRegistration(r.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'messages' && (
                  <>
                    <thead>
                      <tr><th>#</th><th>From</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th><th>Received</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {tabData.map((m) => (
                        <tr key={m.id} style={{ background: !m.is_read ? 'rgba(159, 115, 255, 0.02)' : 'none' }}>
                          <td>{m.id}</td>
                          <td style={{ fontWeight: !m.is_read ? 'bold' : 'normal' }}>{m.name}</td>
                          <td className="opacity-70">{m.email}</td>
                          <td>{m.subject}</td>
                          <td><span className="msg-preview-cell" title={m.message}>{m.message}</span></td>
                          <td>
                            <span className={`admin-role-tag ${m.is_read ? 'role-user' : 'role-admin'}`} style={{ borderColor: m.is_read ? '' : '#ffaa00', color: m.is_read ? '' : '#ffaa00' }}>
                              {m.is_read ? 'Read' : 'New'}
                            </span>
                          </td>
                          <td className="opacity-50">{fmtDate(m.created_at)}</td>
                          <td>
                            {!m.is_read && (
                              <button className="tbl-action-btn edit" onClick={() => handleMarkMessageRead(m.id)}>Mark Read</button>
                            )}
                            <button className="tbl-action-btn delete" onClick={() => handleDeleteMessage(m.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

              </table>
            </div>
          )}
        </div>
      </section>

      {/* EDIT USER MODAL */}
      {showEditUserModal && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditUserModal(false)}>✕</button>
            <h2>Edit User Dashboard</h2>
            <p className="modal-sub">Modify agent parameters</p>
            
            <form onSubmit={handleEditUserSubmit}>
              <div className="form-row-2">
                <div className="input-group">
                  <label>First Name</label>
                  <input type="text" value={euFirstName} onChange={(e) => setEuFirstName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" value={euLastName} onChange={(e) => setEuLastName(e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <label>Username</label>
                <input type="text" value={euUsername} onChange={(e) => setEuUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" value={euEmail} onChange={(e) => setEuEmail(e.target.value)} required />
              </div>
              <div className="form-row-2">
                <div className="input-group">
                  <label>Theme</label>
                  <select value={euTheme} onChange={(e) => setEuTheme(e.target.value)}>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="amber">Amber</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Password (optional)</label>
                  <input type="password" placeholder="Leave blank to keep" value={euPassword} onChange={(e) => setEuPassword(e.target.value)} />
                </div>
              </div>
              <div className="input-group admin-grant-checkbox">
                <label className="agree-checkbox-lbl">
                  <input type="checkbox" checked={euIsAdmin} onChange={(e) => setEuIsAdmin(e.target.checked)} />
                  <span>Grant Admin Privileges</span>
                </label>
              </div>

              <button type="submit" className="btn-submit">Save Agent Changes</button>
              
              {editUserMsg.text && (
                <p className="form-msg" style={{ 
                  color: editUserMsg.type === 'success' ? '#4ade80' : editUserMsg.type === 'error' ? '#ff6b6b' : '#aaa',
                  marginTop: '12px', textAlign: 'center'
                }}>
                  {editUserMsg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {showEditPlayerModal && (
        <div className="modal-overlay" onClick={() => setShowEditPlayerModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditPlayerModal(false)}>✕</button>
            <h2>Edit Player Profile</h2>
            <p className="modal-sub">Modify competitive ratings</p>
            
            <form onSubmit={handleEditPlayerSubmit}>
              <div className="form-row-2">
                <div className="input-group">
                  <label>Gamer Tag</label>
                  <input type="text" value={epGamerTag} onChange={(e) => setEpGamerTag(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Primary Game</label>
                  <select value={epGame} onChange={(e) => setEpGame(e.target.value)}>
                    <option>Battle Royale</option>
                    <option>FPS Arena</option>
                    <option>Shadow Tactics</option>
                    <option>Void Runner</option>
                    <option>Dark Siege</option>
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="input-group">
                  <label>Score</label>
                  <input type="number" value={epScore} onChange={(e) => setEpScore(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Wins</label>
                  <input type="number" value={epWins} onChange={(e) => setEpWins(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Losses</label>
                  <input type="number" value={epLosses} onChange={(e) => setEpLosses(e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <label>Competitive Rank</label>
                <select value={epRank} onChange={(e) => setEpRank(e.target.value)}>
                  <option>Bronze</option>
                  <option>Silver</option>
                  <option>Gold</option>
                  <option>Platinum</option>
                  <option>Diamond</option>
                </select>
              </div>

              <button type="submit" className="btn-submit">Save Player Stats</button>

              {editPlayerMsg.text && (
                <p className="form-msg" style={{ 
                  color: editPlayerMsg.type === 'success' ? '#4ade80' : editPlayerMsg.type === 'error' ? '#ff6b6b' : '#aaa',
                  marginTop: '12px', textAlign: 'center'
                }}>
                  {editPlayerMsg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ADD TOURNAMENT MODAL */}
      {showAddTournamentModal && (
        <div className="modal-overlay" onClick={() => setShowAddTournamentModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddTournamentModal(false)}>✕</button>
            <h2>Create Tournament</h2>
            <p className="modal-sub">Initialize competitive grid</p>
            
            <form onSubmit={handleAddTournamentSubmit}>
              <div className="input-group">
                <label>Tournament Name *</label>
                <input type="text" value={atName} onChange={(e) => setAtName(e.target.value)} required />
              </div>
              
              <div className="form-row-2">
                <div className="input-group">
                  <label>Game Category *</label>
                  <select value={atGame} onChange={(e) => setAtGame(e.target.value)}>
                    <option>Battle Royale</option>
                    <option>FPS Arena</option>
                    <option>Shadow Tactics</option>
                    <option>Void Runner</option>
                    <option>Dark Siege</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Initial Status</label>
                  <select value={atStatus} onChange={(e) => setAtStatus(e.target.value)}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea rows="2" value={atDesc} onChange={(e) => setAtDesc(e.target.value)} placeholder="Tournament description..."></textarea>
              </div>

              <div className="form-row-3">
                <div className="input-group">
                  <label>Prize Pool</label>
                  <input type="text" placeholder="e.g. $5,000" value={atPrize} onChange={(e) => setAtPrize(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Max Slots</label>
                  <input type="number" value={atSlots} onChange={(e) => setAtSlots(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Entry Fee ($)</label>
                  <input type="number" value={atFee} onChange={(e) => setAtFee(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Start Date *</label>
                <input type="date" value={atDate} onChange={(e) => setAtDate(e.target.value)} required />
              </div>

              <button type="submit" className="btn-submit">Create Tournament</button>

              {addTournamentMsg.text && (
                <p className="form-msg" style={{ 
                  color: addTournamentMsg.type === 'success' ? '#4ade80' : addTournamentMsg.type === 'error' ? '#ff6b6b' : '#aaa',
                  marginTop: '12px', textAlign: 'center'
                }}>
                  {addTournamentMsg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
