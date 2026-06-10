// ── TOURNAMENTS ROUTES ──────────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router  = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function authMiddleware(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization||'').replace('Bearer ',''), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized.' }); }
}
function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  next();
}

// GET /api/tournaments
router.get('/', (req, res) => {
  const rows = all(`SELECT t.*,
    (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id) as registered_count
    FROM tournaments t ORDER BY t.created_at DESC`);
  res.json(rows);
});

// GET /api/tournaments/:id
router.get('/:id', (req, res) => {
  const t = one('SELECT * FROM tournaments WHERE id = ?', req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found.' });
  const registrations = all(`SELECT tr.*, u.username, u.first_name, u.last_name, u.emoji
    FROM tournament_registrations tr JOIN users u ON tr.user_id = u.id
    WHERE tr.tournament_id = ?`, req.params.id);
  res.json({ ...t, registrations });
});

// POST /api/tournaments (admin)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { name, game, description, prizePool, maxSlots, entryFee, startDate, status } = req.body;
  if (!name || !game || !startDate) return res.status(400).json({ error: 'Name, game, startDate required.' });
  const r = run(`INSERT INTO tournaments (name,game,description,prize_pool,max_slots,entry_fee,start_date,status) VALUES (?,?,?,?,?,?,?,?)`,
    name, game, description||'', prizePool||'$0', maxSlots||32, entryFee||0, startDate, status||'open');
  res.status(201).json(one('SELECT * FROM tournaments WHERE id = ?', r.lastInsertRowid));
});

// PUT /api/tournaments/:id (admin)
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const t = one('SELECT * FROM tournaments WHERE id = ?', req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found.' });
  const { name, game, description, prizePool, maxSlots, entryFee, startDate, status } = req.body;
  run(`UPDATE tournaments SET name=?,game=?,description=?,prize_pool=?,max_slots=?,entry_fee=?,start_date=?,status=? WHERE id=?`,
    name||t.name, game||t.game, description??t.description, prizePool||t.prize_pool,
    maxSlots||t.max_slots, entryFee??t.entry_fee, startDate||t.start_date, status||t.status, req.params.id);
  res.json(one('SELECT * FROM tournaments WHERE id = ?', req.params.id));
});

// DELETE /api/tournaments/:id (admin)
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  run('DELETE FROM tournaments WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// POST /api/tournaments/:id/register
router.post('/:id/register', authMiddleware, (req, res) => {
  try {
    const t = one('SELECT * FROM tournaments WHERE id = ?', req.params.id);
    if (!t) return res.status(404).json({ error: 'Tournament not found.' });
    if (t.status !== 'open') return res.status(400).json({ error: 'Tournament not open for registration.' });
    const { teamName } = req.body;
    if (!teamName) return res.status(400).json({ error: 'Team name required.' });
    const exists = one('SELECT id FROM tournament_registrations WHERE tournament_id=? AND user_id=?', req.params.id, req.user.id);
    if (exists) return res.status(409).json({ error: 'Already registered.' });
    const r = run(`INSERT INTO tournament_registrations (tournament_id,user_id,team_name,payment_status) VALUES (?,?,?,'paid')`,
      req.params.id, req.user.id, teamName);
    run('UPDATE tournaments SET current_slots = current_slots + 1 WHERE id = ?', req.params.id);
    res.status(201).json({ success: true, registrationId: r.lastInsertRowid });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Already registered.' });
    console.error(err); res.status(500).json({ error: 'Registration failed.' });
  }
});

module.exports = router;
