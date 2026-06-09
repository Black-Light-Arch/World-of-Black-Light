// ============================================
//  WORLD OF BLACKLIGHT — PROFILE PAGE v2
//  Fetches real data from /api/me, theme sync
// ============================================

const API = window.location.origin;
const THEME_COLORS = { purple: '#9F73FF', red: '#ff4444', green: '#4ade80', amber: '#FFC850' };

document.addEventListener('DOMContentLoaded', async () => {

  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Fetch full user data from API
  let userData = null;
  try {
    const res = await fetch(`${API}/api/me`, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    if (res.ok) userData = await res.json();
  } catch {}

  const session = Auth.getSession();
  const user    = userData || session;

  // ── POPULATE PROFILE ─────────────────────────────────────
  document.getElementById('profileName').textContent  = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim();
  document.getElementById('profileEmail').textContent = user.email || '';
  document.getElementById('avatarDisplay').textContent = user.emoji || '👁️';

  const badge = document.getElementById('profileBadge');
  if (user.isAdmin) {
    badge.textContent = '🔐 Administrator';
    badge.style.color = '#FFD700';
    badge.style.borderColor = 'rgba(255,215,0,0.4)';
    document.getElementById('adminLinkWrap').style.display = 'block';
  } else {
    badge.textContent = 'BlackLight Member';
  }

  // ── PLAYER STATS ─────────────────────────────────────────
  if (user.player) {
    document.getElementById('statScore').textContent = (user.player.score || 0).toLocaleString();
    document.getElementById('statWins').textContent  = user.player.wins || 0;
  } else {
    document.getElementById('statScore').textContent = '—';
    document.getElementById('statWins').textContent  = '—';
  }

  // ── TOURNAMENT REGISTRATIONS ──────────────────────────────
  const tourDiv = document.getElementById('profileTournaments');
  const regs    = user.registrations || [];
  document.getElementById('statTournaments').textContent = regs.length;

  if (regs.length === 0) {
    tourDiv.innerHTML = '<p style="opacity:0.4;font-style:italic;font-size:0.9rem">No tournament registrations yet.</p>';
  } else {
    tourDiv.innerHTML = regs.map(r => `
      <div style="padding:12px;border:1px solid rgba(159,115,255,0.12);border-radius:8px;margin-bottom:10px;text-align:left;background:rgba(255,255,255,0.02)">
        <div style="font-family:Cinzel,serif;font-size:0.8rem;color:#9F73FF;margin-bottom:4px">${r.tournament_name}</div>
        <div style="font-size:0.8rem;opacity:0.6">🎮 ${r.game} · 📅 ${new Date(r.start_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
        <div style="font-size:0.75rem;margin-top:4px;opacity:0.5">Team: ${r.team_name} · <span style="color:#4ade80">${r.payment_status}</span></div>
      </div>
    `).join('');
  }

  // ── EMOJI PICKER ─────────────────────────────────────────
  const emojiGrid = document.getElementById('profileEmojiGrid');
  const options   = emojiGrid.querySelectorAll('.emoji-option');
  let currentEmoji = user.emoji || '👁️';

  options.forEach(btn => {
    if (btn.dataset.emoji === currentEmoji) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      options.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentEmoji = btn.dataset.emoji;
      document.getElementById('avatarDisplay').textContent = currentEmoji;
    });
  });

  document.getElementById('saveEmojiBtn').addEventListener('click', async () => {
    const confirm = document.getElementById('saveConfirm');
    try {
      await fetch(`${API}/api/me/emoji`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Auth.getToken()}` },
        body: JSON.stringify({ emoji: currentEmoji })
      });
      Auth.updateEmoji(currentEmoji);
      confirm.textContent = '✓ Icon updated!'; confirm.style.color = '#4ade80';
      if (typeof buildNav === 'function') buildNav();
    } catch {
      confirm.textContent = '✗ Failed to save.'; confirm.style.color = '#ff6b6b';
    }
    setTimeout(() => { confirm.textContent = ''; }, 2500);
  });

  // ── THEME SWITCHER ────────────────────────────────────────
  const currentTheme = user.theme || 'purple';
  applyTheme(currentTheme);
  markActiveTheme(currentTheme);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const theme = btn.dataset.theme;
      const msg   = document.getElementById('themeConfirm');
      try {
        const res = await fetch(`${API}/api/me/theme`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Auth.getToken()}` },
          body: JSON.stringify({ theme })
        });
        if (res.ok) {
          applyTheme(theme);
          markActiveTheme(theme);
          // Update stored user
          const stored = localStorage.getItem('bl_user');
          if (stored) {
            const obj = JSON.parse(stored);
            obj.theme = theme;
            localStorage.setItem('bl_user', JSON.stringify(obj));
          }
          msg.textContent = `✓ Theme set to ${theme}!`; msg.style.color = '#4ade80';
        }
      } catch {
        msg.textContent = '✗ Failed.'; msg.style.color = '#ff6b6b';
      }
      setTimeout(() => { msg.textContent = ''; }, 2500);
    });
  });

  // ── LOGOUT ───────────────────────────────────────────────
  document.getElementById('profileLogout').addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'index.html';
  });
});

function applyTheme(theme) {
  const root = document.documentElement;
  const colors = {
    purple: { primary: '#9F73FF', glow: '#5E17EB', bg: '#0F0C29' },
    red:    { primary: '#ff4444', glow: '#cc0000', bg: '#1a0000' },
    green:  { primary: '#4ade80', glow: '#16a34a', bg: '#001a0a' },
    amber:  { primary: '#FFC850', glow: '#d97706', bg: '#1a1000' },
  };
  const c = colors[theme] || colors.purple;
  root.style.setProperty('--theme-primary', c.primary);
  root.style.setProperty('--theme-glow', c.glow);
  root.style.setProperty('--theme-bg', c.bg);
  document.querySelectorAll('.avatar-circle, .save-emoji-btn, .profile-section-title, .profile-badge').forEach(el => {
    el.style.borderColor = `rgba(${hexToRgb(c.primary)},0.4)`;
    el.style.color = c.primary;
  });
  document.querySelectorAll('.stat-number').forEach(el => { el.style.color = c.primary; });
  document.querySelector('.profile-card')?.style.setProperty('border-color', `rgba(${hexToRgb(c.glow)},0.3)`);
}

function markActiveTheme(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active-theme', btn.dataset.theme === theme);
  });
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
