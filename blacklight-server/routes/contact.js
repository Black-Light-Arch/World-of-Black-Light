// ── CONTACT ROUTES ──────────────────────────────────────────
const express = require('express');
const jwt     = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function adminCheck(req, res) {
  try {
    const token = (req.headers.authorization||'').replace('Bearer ','');
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

// POST /api/contact
router.post('/', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ error: 'All fields are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email.' });
    run(`INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)`,
      name.trim(), email.trim(), subject.trim(), message.trim());
    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to save message.' }); }
});

// GET /api/contact (admin)
router.get('/', (req, res) => {
  const user = adminCheck(req, res);
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  res.json(all('SELECT * FROM contact_messages ORDER BY created_at DESC'));
});

// PATCH /api/contact/:id/read (admin)
router.patch('/:id/read', (req, res) => {
  const user = adminCheck(req, res);
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  run('UPDATE contact_messages SET is_read = 1 WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// DELETE /api/contact/:id (admin)
router.delete('/:id', (req, res) => {
  const user = adminCheck(req, res);
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  run('DELETE FROM contact_messages WHERE id = ?', req.params.id);
  res.json({ success: true });
});

module.exports = router;
