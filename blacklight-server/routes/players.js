// ── PLAYERS ROUTES ──────────────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router  = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Unauthorized.' }); }
}

// GET /api/players
router.get('/', (req, res) => {
  try {
    const { search, game, sort } = req.query;
    let sql = `SELECT p.*, u.username, u.first_name, u.last_name, u.emoji, u.theme
               FROM players p JOIN users u ON p.user_id = u.id WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ` AND (p.gamer_tag LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (game) { sql += ` AND p.game = ?`; params.push(game); }
    switch (sort) {
      case 'wins':  sql += ' ORDER BY p.wins DESC';  break;
      case 'rank':  sql += ' ORDER BY p.rank ASC';   break;
      default:      sql += ' ORDER BY p.score DESC'; break;
    }
    res.json(all(sql, ...params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch players.' }); }
});

// GET /api/players/:id
router.get('/:id', (req, res) => {
  const player = one(`SELECT p.*, u.username, u.first_name, u.last_name, u.emoji, u.theme
    FROM players p JOIN users u ON p.user_id = u.id WHERE p.id = ?`, req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found.' });
  res.json(player);
});

// POST /api/players
router.post('/', authMiddleware, (req, res) => {
  try {
    const { gamerTag, game, bio } = req.body;
    if (!gamerTag || !game) return res.status(400).json({ error: 'Gamer tag and game required.' });
    const existing = one('SELECT id FROM players WHERE user_id = ?', req.user.id);
    if (existing) return res.status(409).json({ error: 'Player profile already exists.' });
    const result = run(
      `INSERT INTO players (user_id,gamer_tag,rank,score,wins,losses,game,bio) VALUES (?,?,'Bronze',0,0,0,?,?)`,
      req.user.id, gamerTag, game, bio || ''
    );
    res.status(201).json(one('SELECT * FROM players WHERE id = ?', result.lastInsertRowid));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create player.' }); }
});

// PUT /api/players/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const p = one('SELECT * FROM players WHERE id = ?', req.params.id);
    if (!p) return res.status(404).json({ error: 'Player not found.' });
    if (p.user_id !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ error: 'Forbidden.' });
    const { gamerTag, rank, score, wins, losses, game, bio } = req.body;
    run(`UPDATE players SET gamer_tag=?,rank=?,score=?,wins=?,losses=?,game=?,bio=? WHERE id=?`,
      gamerTag || p.gamer_tag, rank || p.rank,
      score ?? p.score, wins ?? p.wins, losses ?? p.losses,
      game || p.game, bio ?? p.bio, req.params.id);
    res.json(one('SELECT * FROM players WHERE id = ?', req.params.id));
  } catch (err) { res.status(500).json({ error: 'Failed to update.' }); }
});

// DELETE /api/players/:id — admin only
router.delete('/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  run('DELETE FROM players WHERE id = ?', req.params.id);
  res.json({ success: true });
});

module.exports = router;
