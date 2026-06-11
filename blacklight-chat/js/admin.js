// ============================================================
//  ADMIN PANEL JS — Full CRUD Dashboard
// ============================================================
const API = window.location.origin;

// ── AUTH GUARD ───────────────────────────────────────────────
(function checkAdmin() {
  const session = Auth.getSession();
  const token   = Auth.getToken();
  if (!session || !token || !session.isAdmin) {
    document.getElementById('accessDenied').style.display = 'flex';
    document.querySelector('.admin-main')?.classList.add('hidden');
    return;
  }
  document.getElementById('adminUsername').textContent = session.username || session.firstName;
})();

// ── HELPER ───────────────────────────────────────────────────
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Auth.getToken()}` };
}

async function apiFetch(url, opts = {}) {
  opts.headers = { ...authHeaders(), ...(opts.headers || {}) };
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── TABS ─────────────────────────────────────────────────────
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    loaders[tab.dataset.tab]?.();
  });
});

// ── LOGOUT ───────────────────────────────────────────────────
document.getElementById('adminLogoutBtn').addEventListener('click', () => {
  Auth.logout();
  window.location.href = 'login.html';
});

// ── STATS ────────────────────────────────────────────────────
async function loadStats() {
  try {
    const s = await apiFetch(`${API}/api/admin/stats`);
    document.getElementById('st-users').textContent         = s.totalUsers;
    document.getElementById('st-players').textContent       = s.totalPlayers;
    document.getElementById('st-tournaments').textContent   = s.totalTournaments;
    document.getElementById('st-registrations').textContent = s.totalRegistrations;
    document.getElementById('st-messages').textContent      = s.unreadMessages;
    document.getElementById('st-open').textContent          = s.openTournaments;
  } catch {}
}

// ── USERS ────────────────────────────────────────────────────
async function loadUsers() {
  document.getElementById('usersBody').innerHTML = '<tr><td colspan="10" class="tbl-loading">Loading...</td></tr>';
  try {
    const users = await apiFetch(`${API}/api/admin/users`);
    const session = Auth.getSession();
    document.getElementById('usersBody').innerHTML = users.map(u => {
      const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
      const statusBadge = isBanned 
        ? `<span class="badge" style="background:rgba(255,51,51,0.1);color:#ff3333" title="Until ${new Date(u.banned_until).toLocaleString()}">🚫 Banned</span>`
        : `<span class="badge" style="background:rgba(80,200,120,0.1);color:#50c878">Active</span>`;
        
      const banBtn = u.id === session?.id 
        ? '' 
        : (isBanned 
          ? `<button class="tbl-btn tbl-btn-edit" style="color:#50c878;border-color:#50c878" onclick="unbanUser(${u.id},'${u.username}')">Unban</button>`
          : `<button class="tbl-btn tbl-btn-delete" onclick="openBanUser(${u.id},'${u.username}')">Ban</button>`);

      return `
      <tr>
        <td>${u.id}</td>
        <td style="font-family:Cinzel,serif;font-size:0.8rem">${u.username}</td>
        <td>${u.first_name} ${u.last_name}</td>
        <td style="font-size:0.8rem;opacity:0.7">${u.email}</td>
        <td>${u.age || '—'}</td>
        <td><span class="badge" style="background:rgba(159,115,255,0.1);color:#9F73FF">${u.theme}</span></td>
        <td><span class="badge ${u.is_admin ? 'badge-admin' : 'badge-user'}">${u.is_admin ? '✓ Admin' : 'User'}</span></td>
        <td>${statusBadge}</td>
        <td style="font-size:0.8rem;opacity:0.6">${fmtDate(u.created_at)}</td>
        <td>
          <button class="tbl-btn tbl-btn-edit" onclick="openEditUser(${u.id})">Edit</button>
          ${banBtn}
          <button class="tbl-btn tbl-btn-delete" onclick="deleteUser(${u.id},'${u.username}')">Delete</button>
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    document.getElementById('usersBody').innerHTML = `<tr><td colspan="10" class="tbl-loading">Error: ${err.message}</td></tr>`;
  }
}

let editingUserId = null;
async function openEditUser(id) {
  const users = await apiFetch(`${API}/api/admin/users`);
  const u = users.find(x => x.id === id);
  if (!u) return;
  editingUserId = id;
  document.getElementById('editUserId').value    = id;
  document.getElementById('euFirstName').value   = u.first_name;
  document.getElementById('euLastName').value    = u.last_name;
  document.getElementById('euUsername').value    = u.username;
  document.getElementById('euEmail').value       = u.email;
  document.getElementById('euTheme').value       = u.theme;
  document.getElementById('euIsAdmin').checked   = !!u.is_admin;
  document.getElementById('euPassword').value    = '';
  document.getElementById('editUserMsg').textContent = '';
  document.getElementById('editUserModal').style.display = 'flex';
}

document.getElementById('editUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('editUserMsg');
  try {
    await apiFetch(`${API}/api/admin/users/${editingUserId}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: document.getElementById('euFirstName').value,
        lastName:  document.getElementById('euLastName').value,
        username:  document.getElementById('euUsername').value,
        email:     document.getElementById('euEmail').value,
        theme:     document.getElementById('euTheme').value,
        isAdmin:   document.getElementById('euIsAdmin').checked,
        password:  document.getElementById('euPassword').value || undefined
      })
    });
    msg.textContent = '✅ Saved!'; msg.style.color = '#4ade80';
    setTimeout(() => { document.getElementById('editUserModal').style.display = 'none'; loadUsers(); loadStats(); }, 1000);
  } catch (err) { msg.textContent = '❌ ' + err.message; msg.style.color = '#ff6b6b'; }
});

async function deleteUser(id, username) {
  if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
  try {
    await apiFetch(`${API}/api/admin/users/${id}`, { method: 'DELETE' });
    loadUsers(); loadStats();
  } catch (err) { alert('Error: ' + err.message); }
}

// ── PLAYERS ──────────────────────────────────────────────────
async function loadPlayers() {
  document.getElementById('playersBody').innerHTML = '<tr><td colspan="8" class="tbl-loading">Loading...</td></tr>';
  try {
    const players = await apiFetch(`${API}/api/admin/players`);
    document.getElementById('playersBody').innerHTML = players.map(p => `
      <tr>
        <td>${p.id}</td>
        <td style="font-family:Cinzel,serif;font-size:0.8rem;color:#9F73FF">${p.gamer_tag}</td>
        <td style="opacity:0.7">@${p.username}</td>
        <td style="opacity:0.7">🎮 ${p.game}</td>
        <td><span class="badge rank-${p.rank}">${p.rank}</span></td>
        <td style="font-family:Cinzel,serif;color:#9F73FF">${(p.score||0).toLocaleString()}</td>
        <td style="opacity:0.6">${p.wins}W/${p.losses}L</td>
        <td>
          <button class="tbl-btn tbl-btn-edit" onclick="openEditPlayer(${p.id})">Edit</button>
          <button class="tbl-btn tbl-btn-delete" onclick="deletePlayer(${p.id},'${p.gamer_tag}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('playersBody').innerHTML = `<tr><td colspan="8" class="tbl-loading">Error: ${err.message}</td></tr>`;
  }
}

let editingPlayerId = null;
async function openEditPlayer(id) {
  const players = await apiFetch(`${API}/api/admin/players`);
  const p = players.find(x => x.id === id);
  if (!p) return;
  editingPlayerId = id;
  document.getElementById('epPlayerId').value  = id;
  document.getElementById('epGamerTag').value  = p.gamer_tag;
  document.getElementById('epGame').value      = p.game;
  document.getElementById('epScore').value     = p.score;
  document.getElementById('epWins').value      = p.wins;
  document.getElementById('epLosses').value    = p.losses;
  document.getElementById('epRank').value      = p.rank;
  document.getElementById('editPlayerMsg').textContent = '';
  document.getElementById('editPlayerModal').style.display = 'flex';
}

document.getElementById('editPlayerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('editPlayerMsg');
  try {
    await apiFetch(`${API}/api/admin/players/${editingPlayerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        gamerTag: document.getElementById('epGamerTag').value,
        game:     document.getElementById('epGame').value,
        score:    parseInt(document.getElementById('epScore').value),
        wins:     parseInt(document.getElementById('epWins').value),
        losses:   parseInt(document.getElementById('epLosses').value),
        rank:     document.getElementById('epRank').value,
      })
    });
    msg.textContent = '✅ Saved!'; msg.style.color = '#4ade80';
    setTimeout(() => { document.getElementById('editPlayerModal').style.display = 'none'; loadPlayers(); loadStats(); }, 1000);
  } catch (err) { msg.textContent = '❌ ' + err.message; msg.style.color = '#ff6b6b'; }
});

async function deletePlayer(id, tag) {
  if (!confirm(`Delete player "${tag}"?`)) return;
  try { await apiFetch(`${API}/api/admin/players/${id}`, { method: 'DELETE' }); loadPlayers(); loadStats(); }
  catch (err) { alert('Error: ' + err.message); }
}

// ── TOURNAMENTS ──────────────────────────────────────────────
async function loadTournaments() {
  document.getElementById('tournamentsBody').innerHTML = '<tr><td colspan="9" class="tbl-loading">Loading...</td></tr>';
  try {
    const ts = await apiFetch(`${API}/api/admin/tournaments`);
    document.getElementById('tournamentsBody').innerHTML = ts.map(t => `
      <tr>
        <td>${t.id}</td>
        <td style="font-family:Cinzel,serif;font-size:0.8rem">${t.name}</td>
        <td>🎮 ${t.game}</td>
        <td style="color:#FFD700">${t.prize_pool}</td>
        <td>${t.entry_fee === 0 ? 'FREE' : '$'+t.entry_fee}</td>
        <td>${t.registered_count||0}/${t.max_slots}</td>
        <td style="opacity:0.7">${fmtDate(t.start_date)}</td>
        <td><span class="badge badge-${t.status}">${t.status}</span></td>
        <td>
          <button class="tbl-btn tbl-btn-delete" onclick="deleteTournament(${t.id},'${t.name}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('tournamentsBody').innerHTML = `<tr><td colspan="9" class="tbl-loading">Error: ${err.message}</td></tr>`;
  }
}

async function deleteTournament(id, name) {
  if (!confirm(`Delete tournament "${name}" and all registrations?`)) return;
  try { await apiFetch(`${API}/api/tournaments/${id}`, { method: 'DELETE' }); loadTournaments(); loadStats(); }
  catch (err) { alert('Error: ' + err.message); }
}

// Add Tournament
document.getElementById('openAddTournamentBtn').addEventListener('click', () => {
  document.getElementById('addTournamentModal').style.display = 'flex';
});

document.getElementById('addTournamentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('addTournamentMsg');
  try {
    await apiFetch(`${API}/api/tournaments`, {
      method: 'POST',
      body: JSON.stringify({
        name:      document.getElementById('atName').value,
        game:      document.getElementById('atGame').value,
        description: document.getElementById('atDesc').value,
        prizePool: document.getElementById('atPrize').value,
        maxSlots:  parseInt(document.getElementById('atSlots').value),
        entryFee:  parseInt(document.getElementById('atFee').value),
        startDate: document.getElementById('atDate').value,
        status:    document.getElementById('atStatus').value,
      })
    });
    msg.textContent = '✅ Tournament created!'; msg.style.color = '#4ade80';
    setTimeout(() => { document.getElementById('addTournamentModal').style.display = 'none'; loadTournaments(); loadStats(); document.getElementById('addTournamentForm').reset(); }, 1200);
  } catch (err) { msg.textContent = '❌ ' + err.message; msg.style.color = '#ff6b6b'; }
});

// ── REGISTRATIONS ────────────────────────────────────────────
async function loadRegistrations() {
  document.getElementById('registrationsBody').innerHTML = '<tr><td colspan="8" class="tbl-loading">Loading...</td></tr>';
  try {
    const regs = await apiFetch(`${API}/api/admin/registrations`);
    document.getElementById('registrationsBody').innerHTML = regs.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>@${r.username}</td>
        <td style="font-family:Cinzel,serif;font-size:0.75rem">${r.tournament_name}</td>
        <td>${r.team_name}</td>
        <td>🎮 ${r.game}</td>
        <td><span class="badge badge-paid">${r.payment_status}</span></td>
        <td style="opacity:0.6;font-size:0.8rem">${fmtDate(r.registered_at)}</td>
        <td>
          <button class="tbl-btn tbl-btn-delete" onclick="deleteRegistration(${r.id})">Remove</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('registrationsBody').innerHTML = `<tr><td colspan="8" class="tbl-loading">Error: ${err.message}</td></tr>`;
  }
}

async function deleteRegistration(id) {
  if (!confirm('Remove this registration?')) return;
  try { await apiFetch(`${API}/api/admin/registrations/${id}`, { method: 'DELETE' }); loadRegistrations(); loadStats(); }
  catch (err) { alert('Error: ' + err.message); }
}

// ── MESSAGES ─────────────────────────────────────────────────
async function loadMessages() {
  document.getElementById('messagesBody').innerHTML = '<tr><td colspan="8" class="tbl-loading">Loading...</td></tr>';
  try {
    const msgs = await apiFetch(`${API}/api/admin/messages`);
    document.getElementById('messagesBody').innerHTML = msgs.map(m => `
      <tr style="${!m.is_read ? 'background:rgba(255,200,80,0.03)' : ''}">
        <td>${m.id}</td>
        <td style="font-weight:${!m.is_read?'bold':'normal'}">${m.name}</td>
        <td style="opacity:0.7;font-size:0.8rem">${m.email}</td>
        <td>${m.subject}</td>
        <td><span class="msg-preview" title="${m.message}">${m.message}</span></td>
        <td><span class="badge ${m.is_read ? 'badge-read' : 'badge-unread'}">${m.is_read ? 'Read' : 'New'}</span></td>
        <td style="opacity:0.6;font-size:0.8rem">${fmtDate(m.created_at)}</td>
        <td>
          ${!m.is_read ? `<button class="tbl-btn tbl-btn-read" onclick="markRead(${m.id})">Mark Read</button>` : ''}
          <button class="tbl-btn tbl-btn-delete" onclick="deleteMessage(${m.id})">Delete</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('messagesBody').innerHTML = `<tr><td colspan="8" class="tbl-loading">Error: ${err.message}</td></tr>`;
  }
}

async function markRead(id) {
  try { await apiFetch(`${API}/api/admin/messages/${id}/read`, { method: 'PATCH' }); loadMessages(); loadStats(); }
  catch (err) { alert(err.message); }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try { await apiFetch(`${API}/api/admin/messages/${id}`, { method: 'DELETE' }); loadMessages(); loadStats(); }
  catch (err) { alert(err.message); }
}

// ── MODAL CLOSE BUTTONS ──────────────────────────────────────
['closeEditUser','closeEditPlayer','closeAddTournament','closeBanUser'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// ── LOADER MAP ───────────────────────────────────────────────
const loaders = {
  users: loadUsers,
  players: loadPlayers,
  tournaments: loadTournaments,
  registrations: loadRegistrations,
  messages: loadMessages
};

// ── INIT ─────────────────────────────────────────────────────
loadStats();
loadUsers(); // default tab

// Ban user triggers
let banningUserId = null;
function openBanUser(id, username) {
  banningUserId = id;
  document.getElementById('banUserId').value = id;
  document.getElementById('banUserSub').textContent = `Restrict clearance for @${username}`;
  document.getElementById('banDuration').value = '10m';
  document.getElementById('banUserMsg').textContent = '';
  document.getElementById('banUserModal').style.display = 'flex';
}

document.getElementById('banUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('banUserMsg');
  msg.textContent = 'Applying ban...';
  msg.style.color = '#aaa';
  const duration = document.getElementById('banDuration').value;
  
  let bannedUntil = null;
  if (duration === 'permanent') {
    bannedUntil = '9999-12-31T23:59:59.999Z';
  } else {
    const date = new Date();
    if (duration === '10m') date.setMinutes(date.getMinutes() + 10);
    else if (duration === '1h') date.setHours(date.getHours() + 1);
    else if (duration === '1d') date.setDate(date.getDate() + 1);
    else if (duration === '1w') date.setDate(date.getDate() + 7);
    bannedUntil = date.toISOString();
  }

  try {
    await apiFetch(`${API}/api/admin/users/${banningUserId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ bannedUntil })
    });
    msg.textContent = '✅ Banned!'; msg.style.color = '#4ade80';
    setTimeout(() => {
      document.getElementById('banUserModal').style.display = 'none';
      loadUsers();
      loadStats();
    }, 1000);
  } catch (err) {
    msg.textContent = '❌ ' + err.message; msg.style.color = '#ff6b6b';
  }
});

async function unbanUser(id, username) {
  if (!confirm(`Unban user "${username}"?`)) return;
  try {
    await apiFetch(`${API}/api/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ bannedUntil: null })
    });
    alert(`User "${username}" has been unbanned.`);
    loadUsers();
    loadStats();
  } catch (err) {
    alert('Error unbanning: ' + err.message);
  }
}
