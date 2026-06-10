// ── ADMIN ROUTES ─────────────────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { one, all, run } = require('../database');
const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function adminCheck(req, res, next) {
  try {
    const token = (req.headers.authorization||'').replace('Bearer ','');
    const user  = jwt.verify(token, JWT_SECRET);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
    req.user = user; next();
  } catch { res.status(401).json({ error: 'Unauthorized.' }); }
}

// ── STATS ──────────────────────────────────────────────────
router.get('/stats', adminCheck, (req, res) => {
  res.json({
    totalUsers:         one('SELECT COUNT(*) as c FROM users').c,
    totalPlayers:       one('SELECT COUNT(*) as c FROM players').c,
    totalTournaments:   one('SELECT COUNT(*) as c FROM tournaments').c,
    totalRegistrations: one('SELECT COUNT(*) as c FROM tournament_registrations').c,
    unreadMessages:     one('SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0').c,
    openTournaments:    one("SELECT COUNT(*) as c FROM tournaments WHERE status = 'open'").c,
  });
});

// ── USERS ─────────────────────────────────────────────────
router.get('/users', adminCheck, (req, res) => {
  res.json(all(`SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.age, u.emoji, u.theme, u.is_admin, u.created_at,
    p.id as player_id, p.gamer_tag, p.score, p.rank, p.game
    FROM users u LEFT JOIN players p ON p.user_id = u.id ORDER BY u.created_at DESC`));
});

router.put('/users/:id', adminCheck, (req, res) => {
  const u = one('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  const { username, firstName, lastName, email, age, emoji, theme, isAdmin, password } = req.body;
  let hash = u.password_hash;
  if (password && password.length >= 8) hash = bcrypt.hashSync(password, 10);
  run(`UPDATE users SET username=?,first_name=?,last_name=?,email=?,age=?,emoji=?,theme=?,is_admin=?,password_hash=? WHERE id=?`,
    username||u.username, firstName||u.first_name, lastName||u.last_name,
    email||u.email, age??u.age, emoji||u.emoji, theme||u.theme,
    isAdmin!==undefined ? (isAdmin?1:0) : u.is_admin, hash, req.params.id);
  res.json(one('SELECT id,username,first_name,last_name,email,age,emoji,theme,is_admin,created_at FROM users WHERE id=?', req.params.id));
});

router.delete('/users/:id', adminCheck, (req, res) => {
  if (req.user.id === parseInt(req.params.id)) return res.status(400).json({ error: 'Cannot delete yourself.' });
  run('DELETE FROM users WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// ── PLAYERS ────────────────────────────────────────────────
router.get('/players', adminCheck, (req, res) => {
  res.json(all(`SELECT p.*, u.username, u.email, u.first_name, u.last_name
    FROM players p JOIN users u ON p.user_id = u.id ORDER BY p.score DESC`));
});

router.put('/players/:id', adminCheck, (req, res) => {
  const p = one('SELECT * FROM players WHERE id = ?', req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found.' });
  const { gamerTag, rank, score, wins, losses, game, bio } = req.body;
  run(`UPDATE players SET gamer_tag=?,rank=?,score=?,wins=?,losses=?,game=?,bio=? WHERE id=?`,
    gamerTag||p.gamer_tag, rank||p.rank, score??p.score, wins??p.wins, losses??p.losses, game||p.game, bio??p.bio, req.params.id);
  res.json(one('SELECT * FROM players WHERE id = ?', req.params.id));
});

router.delete('/players/:id', adminCheck, (req, res) => {
  run('DELETE FROM players WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// ── TOURNAMENTS ────────────────────────────────────────────
router.get('/tournaments', adminCheck, (req, res) => {
  res.json(all(`SELECT t.*, (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id) as registered_count
    FROM tournaments t ORDER BY t.created_at DESC`));
});

// ── REGISTRATIONS ──────────────────────────────────────────
router.get('/registrations', adminCheck, (req, res) => {
  res.json(all(`SELECT tr.*, u.username, u.email, u.first_name, u.last_name, t.name as tournament_name, t.game
    FROM tournament_registrations tr
    JOIN users u ON tr.user_id = u.id JOIN tournaments t ON tr.tournament_id = t.id
    ORDER BY tr.registered_at DESC`));
});

router.delete('/registrations/:id', adminCheck, (req, res) => {
  const reg = one('SELECT * FROM tournament_registrations WHERE id = ?', req.params.id);
  if (reg) {
    run('UPDATE tournaments SET current_slots = MAX(0, current_slots - 1) WHERE id = ?', reg.tournament_id);
    run('DELETE FROM tournament_registrations WHERE id = ?', req.params.id);
  }
  res.json({ success: true });
});

// ── MESSAGES ───────────────────────────────────────────────
router.get('/messages', adminCheck, (req, res) => {
  res.json(all('SELECT * FROM contact_messages ORDER BY created_at DESC'));
});

router.patch('/messages/:id/read', adminCheck, (req, res) => {
  run('UPDATE contact_messages SET is_read = 1 WHERE id = ?', req.params.id);
  res.json({ success: true });
});

router.delete('/messages/:id', adminCheck, (req, res) => {
  run('DELETE FROM contact_messages WHERE id = ?', req.params.id);
  res.json({ success: true });
});

module.exports = router;
