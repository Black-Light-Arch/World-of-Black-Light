// ============================================================
//  LEADERBOARD PAGE JS
// ============================================================
const API = window.location.origin;

const RANK_ICONS  = { Bronze:'🥉', Silver:'🥈', Gold:'🥇', Platinum:'💠', Diamond:'💎' };
const POS_MEDALS  = { 1:'🥇', 2:'🥈', 3:'🥉' };

let allData = [];

async function loadLeaderboard() {
  const game = document.getElementById('lbGameFilter').value;
  const params = game ? `?game=${encodeURIComponent(game)}` : '';
  try {
    const res  = await fetch(`${API}/api/leaderboard${params}`);
    allData = await res.json();
    renderPodium(allData.slice(0,3));
    renderTable(allData);
  } catch {
    document.getElementById('lbBody').innerHTML =
      `<tr><td colspan="7" class="lb-loading">Failed to load. Is the server running?</td></tr>`;
  }
}

function renderPodium(top3) {
  if (top3.length < 1) return;
  const wrap = document.getElementById('podiumWrap');

  // Ensure we have 3 slots
  while (top3.length < 3) top3.push(null);

  const positions = [
    { pos: 1, p: top3[0] },
    { pos: 2, p: top3[1] },
    { pos: 3, p: top3[2] },
  ];

  wrap.innerHTML = positions.map(({ pos, p }) => {
    if (!p) return `<div class="podium-item podium-pos-${pos}">
      <div class="podium-block">${pos}</div></div>`;
    return `
    <div class="podium-item podium-pos-${pos}">
      <div class="podium-avatar">${p.emoji || '👤'}</div>
      <div class="podium-name">${p.gamer_tag}</div>
      <div class="podium-score">${(p.score||0).toLocaleString()} pts</div>
      <div class="podium-block">${POS_MEDALS[pos] || pos}</div>
    </div>`;
  }).join('');
}

function renderTable(players) {
  const tbody = document.getElementById('lbBody');
  const maxScore = players[0]?.score || 1;

  if (!players.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="lb-loading">No players found.</td></tr>`;
    return;
  }

  tbody.innerHTML = players.map((p, i) => {
    const pos = i + 1;
    const pct = Math.min(100, (p.score / maxScore) * 100);
    const rowClass = pos <= 3 ? `lb-row-${pos}` : '';

    return `<tr class="${rowClass}">
      <td><span class="rank-pos">${POS_MEDALS[pos] || pos}</span></td>
      <td>
        <div class="lb-player-cell">
          <div class="lb-avatar">${p.emoji || '👤'}</div>
          <div>
            <div class="lb-player-name">${p.gamer_tag}</div>
            <div style="font-size:0.75rem;opacity:0.4">@${p.username}</div>
          </div>
        </div>
      </td>
      <td style="opacity:0.6;font-size:0.85rem">🎮 ${p.game}</td>
      <td><span class="lb-rank-badge rank-${p.rank}">${RANK_ICONS[p.rank]||''} ${p.rank}</span></td>
      <td><span class="lb-score">${(p.score||0).toLocaleString()}</span></td>
      <td style="opacity:0.6;font-size:0.85rem">${p.wins}W / ${p.losses}L</td>
      <td class="score-bar-cell">
        <div class="score-bar">
          <div class="score-bar-fill" style="width:${pct}%"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Animate score bars
  setTimeout(() => {
    document.querySelectorAll('.score-bar-fill').forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.04}s`;
    });
  }, 50);
}

document.getElementById('lbGameFilter').addEventListener('change', loadLeaderboard);

loadLeaderboard();
