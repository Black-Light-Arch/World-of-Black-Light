// ============================================================
//  TOURNAMENT PAGE JS
// ============================================================
const API = window.location.origin;

let currentTournament = null;

// ── RENDER TOURNAMENTS ───────────────────────────────────────
async function loadTournaments() {
  try {
    const res   = await fetch(`${API}/api/tournaments`);
    const data  = await res.json();
    renderTournaments(data);
  } catch {
    document.getElementById('tournamentGrid').innerHTML =
      `<p style="grid-column:1/-1;text-align:center;opacity:0.5">Could not load tournaments. Is the server running?</p>`;
  }
}

function renderTournaments(tournaments) {
  const grid = document.getElementById('tournamentGrid');
  if (!tournaments.length) { grid.innerHTML = '<p style="opacity:0.4;text-align:center;grid-column:1/-1">No tournaments available.</p>'; return; }

  grid.innerHTML = tournaments.map(t => {
    const registered = t.registered_count || t.current_slots || 0;
    const pct = Math.min(100, (registered / t.max_slots) * 100);
    const isClosed = t.status === 'closed' || registered >= t.max_slots;
    const fmtDate = new Date(t.start_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

    return `
    <div class="tournament-card">
      <span class="t-status-badge t-status-${t.status}">${t.status.toUpperCase()}</span>
      <h2>${t.name}</h2>
      <p class="t-game-tag">🎮 ${t.game}</p>
      <p class="t-desc">${t.description}</p>
      <div class="t-meta-grid">
        <div class="t-meta-item">
          <span class="tm-label">Prize Pool</span>
          <span class="tm-val t-prize">${t.prize_pool}</span>
        </div>
        <div class="t-meta-item">
          <span class="tm-label">Entry Fee</span>
          <span class="tm-val">${t.entry_fee === 0 ? 'FREE' : '$' + t.entry_fee}</span>
        </div>
        <div class="t-meta-item">
          <span class="tm-label">Start Date</span>
          <span class="tm-val">${fmtDate}</span>
        </div>
        <div class="t-meta-item">
          <span class="tm-label">Slots</span>
          <span class="tm-val">${registered}/${t.max_slots}</span>
        </div>
      </div>
      <div class="t-slots-bar">
        <div class="t-slots-fill" style="width:${pct}%"></div>
      </div>
      <p class="t-slots-text">${t.max_slots - registered} slots remaining</p>
      <button class="btn-register" ${isClosed ? 'disabled' : ''} onclick="openRegModal(${JSON.stringify(t).replace(/"/g, '&quot;')})">
        ${isClosed ? '🔒 Closed' : '⚔️ Register Now'}
      </button>
    </div>`;
  }).join('');
}

// ── REGISTRATION MODAL ───────────────────────────────────────
function openRegModal(t) {
  const session = Auth.getSession();
  if (!session) {
    document.getElementById('loginGate').style.display = 'flex';
    return;
  }
  currentTournament = t;
  document.getElementById('modalTournamentName').textContent = t.name;
  document.getElementById('modalTournamentGame').textContent = '🎮 ' + t.game;
  document.getElementById('modalPrize').textContent  = t.prize_pool;
  document.getElementById('modalFee').textContent    = t.entry_fee === 0 ? 'FREE' : '$' + t.entry_fee;
  document.getElementById('modalSlots').textContent  = `${t.max_slots - (t.registered_count||t.current_slots||0)} left`;
  document.getElementById('modalDate').textContent   = new Date(t.start_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  document.getElementById('paymentAmount').textContent = t.entry_fee === 0 ? 'FREE' : '$' + t.entry_fee;

  // Prefill email
  if (session) document.getElementById('regEmail').value = session.email || '';

  showStep(1);
  document.getElementById('registerModal').style.display = 'flex';
}

function showStep(n) {
  [1,2,3].forEach(i => {
    const el = document.getElementById(`step${i}`);
    if (el) el.style.display = i === n ? 'block' : 'none';
  });
}

// Close modal
document.getElementById('closeRegModal').addEventListener('click', () => {
  document.getElementById('registerModal').style.display = 'none';
});
document.getElementById('registerModal').addEventListener('click', (e) => {
  if (e.target.id === 'registerModal') document.getElementById('registerModal').style.display = 'none';
});

// ── STEP 1: REGISTRATION FORM ────────────────────────────────
document.getElementById('regForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const teamName = document.getElementById('regTeamName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const agree    = document.getElementById('regAgree').checked;
  let valid = true;

  ['regTeamErr','regEmailErr','regAgreeErr'].forEach(id => document.getElementById(id).textContent = '');

  if (!teamName) { document.getElementById('regTeamErr').textContent = 'Team/player name is required.'; valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('regEmailErr').textContent = 'Valid email required.'; valid = false; }
  if (!agree) { document.getElementById('regAgreeErr').textContent = 'You must agree to the rules.'; valid = false; }

  if (valid) showStep(2);
});

// ── STEP 2: PAYMENT FORM ─────────────────────────────────────
const cardNumber = document.getElementById('cardNumber');
const cardBrand  = document.getElementById('cardBrand');

cardNumber.addEventListener('input', () => {
  let v = cardNumber.value.replace(/\D/g,'').substring(0,16);
  cardNumber.value = v.replace(/(.{4})/g,'$1 ').trim();
  cardBrand.textContent = v.startsWith('4') ? '💳' : v.startsWith('5') ? '💳' : v.startsWith('3') ? '💳' : '💳';
});

document.getElementById('cardExpiry').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g,'');
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
  e.target.value = v;
});

document.getElementById('payBackBtn').addEventListener('click', () => showStep(1));

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cardName   = document.getElementById('cardName').value.trim();
  const cardNum    = document.getElementById('cardNumber').value.replace(/\s/g,'');
  const expiry     = document.getElementById('cardExpiry').value;
  const cvv        = document.getElementById('cardCVV').value;
  let valid = true;

  ['cardNameErr','cardNumErr','cardExpErr','cardCVVErr'].forEach(id => document.getElementById(id).textContent = '');

  if (!cardName) { document.getElementById('cardNameErr').textContent = 'Cardholder name required.'; valid = false; }
  if (cardNum.length !== 16 || !/^\d+$/.test(cardNum)) { document.getElementById('cardNumErr').textContent = 'Enter a valid 16-digit card number.'; valid = false; }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) { document.getElementById('cardExpErr').textContent = 'Format: MM/YY.'; valid = false; }
  if (cvv.length < 3) { document.getElementById('cardCVVErr').textContent = 'Enter 3-4 digit CVV.'; valid = false; }
  if (!valid) return;

  const payBtn = document.getElementById('payBtn');
  payBtn.textContent = '⏳ Processing...';
  payBtn.disabled = true;

  // Simulate payment delay then register
  await new Promise(r => setTimeout(r, 1500));

  try {
    const teamName = document.getElementById('regTeamName').value.trim();
    const token    = Auth.getToken();
    const res = await fetch(`${API}/api/tournaments/${currentTournament.id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ teamName })
    });
    const data = await res.json();
    if (!res.ok) {
      payBtn.textContent = 'Pay & Register'; payBtn.disabled = false;
      document.getElementById('cardNameErr').textContent = data.error || 'Registration failed.';
      return;
    }
    // Success
    document.getElementById('successTournamentName').textContent = currentTournament.name;
    document.getElementById('successDate').textContent = new Date(currentTournament.start_date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    showStep(3);
    setTimeout(loadTournaments, 500);
  } catch {
    payBtn.textContent = 'Pay & Register'; payBtn.disabled = false;
    document.getElementById('cardNameErr').textContent = 'Server error. Please try again.';
  }
});

// ── INIT ─────────────────────────────────────────────────────
loadTournaments();
