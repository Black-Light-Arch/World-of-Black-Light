// ── AUTH ROUTES ─────────────────────────────────────────────
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router   = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: !!user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  return {
    id: user.id, username: user.username,
    firstName: user.first_name, lastName: user.last_name,
    email: user.email, emoji: user.emoji,
    theme: user.theme, skin: user.skin || 'default', isAdmin: !!user.is_admin
  };
}

// POST /api/register
router.post('/register', (req, res) => {
  try {
    const { username, firstName, lastName, email, password, age, emoji } = req.body;
    if (!username || !firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const existing = one('SELECT id FROM users WHERE email = ? OR username = ?', email, username);
    if (existing) return res.status(409).json({ error: 'Email or username already in use.' });

    const hash = bcrypt.hashSync(password, 10);
    const result = run(
      `INSERT INTO users (username,first_name,last_name,email,password_hash,age,emoji,theme) VALUES (?,?,?,?,?,?,?,'purple')`,
      username, firstName, lastName, email, hash, age || null, emoji || '👁️'
    );
    const user = one('SELECT * FROM users WHERE id = ?', result.lastInsertRowid);
    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Credentials required.' });
    const user = one('SELECT * FROM users WHERE email = ? OR username = ?', username, username);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials.' });
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/me
router.get('/me', (req, res) => {
  try {
    const token   = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    const user    = one('SELECT * FROM users WHERE id = ?', payload.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const player = one('SELECT * FROM players WHERE user_id = ?', user.id);
    const registrations = all(`
      SELECT tr.*, t.name AS tournament_name, t.game, t.start_date, t.prize_pool
      FROM tournament_registrations tr
      JOIN tournaments t ON tr.tournament_id = t.id
      WHERE tr.user_id = ?`, user.id);

    res.json({
      ...safeUser(user), age: user.age,
      createdAt: user.created_at, player, registrations
    });
  } catch { res.status(401).json({ error: 'Invalid token.' }); }
});

// PATCH /api/me/theme
router.patch('/me/theme', (req, res) => {
  try {
    const token   = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    const { theme } = req.body;
    if (!['purple','red','green','amber'].includes(theme))
      return res.status(400).json({ error: 'Invalid theme.' });
    run('UPDATE users SET theme = ? WHERE id = ?', theme, payload.id);
    res.json({ success: true, theme });
  } catch { res.status(401).json({ error: 'Unauthorized.' }); }
});

// PATCH /api/me/emoji
router.patch('/me/emoji', (req, res) => {
  try {
    const token   = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji required.' });
    run('UPDATE users SET emoji = ? WHERE id = ?', emoji, payload.id);
    res.json({ success: true, emoji });
  } catch { res.status(401).json({ error: 'Unauthorized.' }); }
});

// PATCH /api/me/skin
router.patch('/me/skin', (req, res) => {
  try {
    const token   = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    const { skin } = req.body;
    if (!['default','green','cyan','legendary'].includes(skin))
      return res.status(400).json({ error: 'Invalid skin.' });
    run('UPDATE users SET skin = ? WHERE id = ?', skin, payload.id);
    res.json({ success: true, skin });
  } catch (err) { res.status(401).json({ error: 'Unauthorized.' }); }
});

module.exports = router;
