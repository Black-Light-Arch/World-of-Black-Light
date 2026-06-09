// ============================================================
//  PLAYERS PAGE JS — Fetch, Search, Filter, Render
// ============================================================

const API = window.location.origin;

let allPlayers  = [];
let searchTimer = null;

// ── DOM REFS ─────────────────────────────────────────────────
const grid        = document.getElementById('playersGrid');
const noResults   = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const gameFilter  = document.getElementById('gameFilter');
const sortSelect  = document.getElementById('sortSelect');
const addBtn      = document.getElementById('addPlayerBtn');
const addModal    = document.getElementById('addPlayerModal');
const closeAddModal = document.getElementById('closeAddModal');
const addPlayerForm = document.getElementById('addPlayerForm');
const addPlayerMsg  = document.getElementById('addPlayerMsg');

// ── RANK CONFIG ──────────────────────────────────────────────
const RANK_ICONS = { Bronze:'🥉', Silver:'🥈', Gold:'🥇', Platinum:'💠', Diamond:'💎' };

// ── FETCH PLAYERS ────────────────────────────────────────────
async function fetchPlayers() {
  const search = searchInput.value.trim();
  const game   = gameFilter.value;
  const sort   = sortSelect.value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (game)   params.set('game', game);
  if (sort)   params.set('sort', sort);

  try {
    const res  = await fetch(`${API}/api/players?${params}`);
    const data = await res.json();
    allPlayers = data;
    renderPlayers(data);
  } catch (err) {
    grid.innerHTML = `<p style="text-align:center;opacity:0.5;grid-column:1/-1">Failed to load players. Is the server running?</p>`;
  }
}

// ── RENDER PLAYER CARDS ──────────────────────────────────────
function renderPlayers(players) {
  if (!players.length) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';
  grid.innerHTML = players.map(p => `
    <div class="player-card">
      <div class="player-card-top">
        <div class="player-avatar">${p.emoji || '👤'}</div>
        <div class="player-name-wrap">
          <h3>${p.gamer_tag}</h3>
          <span>${p.first_name} ${p.last_name}</span>
        </div>
      </div>
      <span class="rank-badge rank-${p.rank}">${RANK_ICONS[p.rank] || ''} ${p.rank}</span>
      <div class="player-stats">
        <div class="stat-item">
          <span class="s-val">${(p.score || 0).toLocaleString()}</span>
          <span class="s-lbl">Score</span>
        </div>
        <div class="stat-item">
          <span class="s-val">${p.wins || 0}</span>
          <span class="s-lbl">Wins</span>
        </div>
        <div class="stat-item">
          <span class="s-val">${p.losses || 0}</span>
          <span class="s-lbl">Losses</span>
        </div>
      </div>
      <div class="player-game-tag">🎮 ${p.game}</div>
      ${p.bio ? `<p class="player-bio">${p.bio}</p>` : ''}
    </div>
  `).join('');
}

// ── SEARCH DEBOUNCE ──────────────────────────────────────────
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchPlayers, 300);
});

gameFilter.addEventListener('change', fetchPlayers);
sortSelect.addEventListener('change', fetchPlayers);

// ── ADD PLAYER MODAL ─────────────────────────────────────────
function checkAddBtn() {
  const session = Auth.getSession();
  if (session && addBtn) addBtn.style.display = 'block';
}

if (addBtn) addBtn.addEventListener('click', () => {
  addModal.style.display = 'flex';
});

if (closeAddModal) closeAddModal.addEventListener('click', () => {
  addModal.style.display = 'none';
});

addModal?.addEventListener('click', (e) => {
  if (e.target === addModal) addModal.style.display = 'none';
});

if (addPlayerForm) {
  addPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gamerTag = document.getElementById('pGamerTag').value.trim();
    const game     = document.getElementById('pGame').value;
    const bio      = document.getElementById('pBio').value.trim();
    let valid = true;

    document.getElementById('pGamerTagErr').textContent = '';
    document.getElementById('pGameErr').textContent = '';

    if (!gamerTag) { document.getElementById('pGamerTagErr').textContent = 'Gamer tag is required.'; valid = false; }
    if (!game)     { document.getElementById('pGameErr').textContent = 'Please select a game.'; valid = false; }
    if (!valid) return;

    try {
      const token = Auth.getToken();
      const res   = await fetch(`${API}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ gamerTag, game, bio })
      });
      const data = await res.json();
      if (!res.ok) { addPlayerMsg.textContent = '❌ ' + data.error; addPlayerMsg.style.color = '#ff6b6b'; return; }
      addPlayerMsg.textContent = '✅ Profile created!';
      addPlayerMsg.style.color = '#4ade80';
      setTimeout(() => { addModal.style.display = 'none'; fetchPlayers(); }, 1500);
    } catch {
      addPlayerMsg.textContent = '❌ Server error.';
      addPlayerMsg.style.color = '#ff6b6b';
    }
  });
}

// ── INIT ─────────────────────────────────────────────────────
fetchPlayers();
checkAddBtn();
