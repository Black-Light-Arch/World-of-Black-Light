// ── LEADERBOARD ROUTES ──────────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

// GET /api/leaderboard
router.get('/', (req, res) => {
  const { game } = req.query;
  let sql = `SELECT p.id, p.gamer_tag, p.score, p.wins, p.losses, p.rank, p.game,
             u.username, u.emoji, u.theme
             FROM players p JOIN users u ON p.user_id = u.id`;
  const params = [];
  if (game) { sql += ' WHERE p.game = ?'; params.push(game); }
  sql += ' ORDER BY p.score DESC LIMIT 50';
  const rows = all(sql, ...params);
  // Add rank position
  const ranked = rows.map((r, i) => ({ ...r, position: i + 1 }));
  res.json(ranked);
});

// PUT /api/leaderboard/:playerId — update score (admin)
router.put('/:playerId', (req, res) => {
  try {
    const token = (req.headers.authorization||'').replace('Bearer ','');
    const user  = jwt.verify(token, JWT_SECRET);
    if (!user.isAdmin) return res.status(403).json({ error: 'Admin only.' });

    const p = one('SELECT * FROM players WHERE id = ?', req.params.playerId);
    if (!p) return res.status(404).json({ error: 'Player not found.' });

    const { score, wins, losses } = req.body;
    const newScore = score ?? p.score;
    let rankBadge = 'Bronze';
    if (newScore >= 8000) rankBadge = 'Diamond';
    else if (newScore >= 6000) rankBadge = 'Platinum';
    else if (newScore >= 4000) rankBadge = 'Gold';
    else if (newScore >= 2000) rankBadge = 'Silver';

    run('UPDATE players SET score=?,wins=?,losses=?,rank=? WHERE id=?',
      newScore, wins ?? p.wins, losses ?? p.losses, rankBadge, req.params.playerId);
    res.json(one('SELECT * FROM players WHERE id = ?', req.params.playerId));
  } catch { res.status(401).json({ error: 'Unauthorized.' }); }
});

module.exports = router;
