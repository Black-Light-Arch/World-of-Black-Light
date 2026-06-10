// ============================================================
//  CHAT & FRIENDS ROUTES
// ============================================================
const express = require('express');
const jwt     = require('jsonwebtoken');
const { one, all, run } = require('../database');
const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

function getUser(req) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

// ── ROOMS ─────────────────────────────────────────────────────

// GET /api/rooms — rooms accessible to the user
router.get('/rooms', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  let rooms;
  if (user.isAdmin) {
    // Admin sees ALL rooms
    rooms = all('SELECT * FROM chat_rooms ORDER BY created_at ASC');
  } else {
    // Regular users see all groups (visible names) and DMs they are members of
    rooms = all(`
      SELECT DISTINCT r.* FROM chat_rooms r
      LEFT JOIN chat_members m ON m.room_name = r.name AND m.username = ?
      WHERE r.type = 'group' OR (r.type = 'private' AND m.username IS NOT NULL)
      ORDER BY r.created_at ASC
    `, user.username);
  }

  // Enrich rooms
  const enriched = rooms.map(r => {
    const members = all('SELECT username, role FROM chat_members WHERE room_name = ?', r.name);
    const lastMsg = one('SELECT content, sender FROM chat_messages WHERE room = ? AND deleted = 0 ORDER BY id DESC LIMIT 1', r.name);
    const reqPending = one("SELECT 1 FROM join_requests WHERE room_name = ? AND username = ? AND status = 'pending'", r.name, user.username);
    return {
      name: r.name,
      type: r.type,
      displayName: r.display_name || r.name,
      privacy: r.privacy,
      owner: r.owner,
      members,
      lastMessage: lastMsg || null,
      _member: members.some(m => m.username === user.username),
      _requested: !!reqPending,
      _role: members.find(m => m.username === user.username)?.role || 'guest'
    };
  });
  res.json(enriched);
});

// POST /api/rooms — create room
router.post('/rooms', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, type, displayName, privacy = 'public', owner, members = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name required.' });

  try {
    run(`INSERT OR IGNORE INTO chat_rooms (name,type,display_name,privacy,owner) VALUES (?,?,?,?,?)`,
      name, type || 'group', displayName || name, privacy, owner || user.username);

    const allMembers = [...new Set([...(members), user.username])];
    for (const username of allMembers) {
      const role = username === (owner || user.username) ? 'owner' : 'member';
      run(`INSERT OR IGNORE INTO chat_members (room_name,username,role) VALUES (?,?,?)`, name, username, role);
    }

    const room = one('SELECT * FROM chat_rooms WHERE name = ?', name);
    const roomMembers = all('SELECT username, role FROM chat_members WHERE room_name = ?', name);
    res.status(201).json({
      name: room.name, type: room.type, displayName: room.display_name,
      privacy: room.privacy, owner: room.owner, members: roomMembers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room.' });
  }
});

// DELETE /api/rooms/:name — delete room (owner or admin)
router.delete('/rooms/:name', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (!user.isAdmin && room.owner !== user.username) return res.status(403).json({ error: 'Only owner or admin.' });
  run('DELETE FROM chat_rooms WHERE name = ?', req.params.name);
  res.json({ success: true });
});

// POST /api/rooms/:name/join — request to join a group
router.post('/rooms/:name/join', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  // Already a member?
  const member = one('SELECT * FROM chat_members WHERE room_name = ? AND username = ?', room.name, user.username);
  if (member) return res.json({ status: 'already_member' });

  run(`INSERT OR IGNORE INTO join_requests (room_name,username,status) VALUES (?,?,'pending')`, room.name, user.username);

  // Notify owner and moderators
  const io = req.app.get('socketio');
  if (io) {
    if (room.owner) {
      io.to(`user:${room.owner}`).emit('join_request', { room: room.name, username: user.username });
    }
    const moderators = all("SELECT username FROM chat_members WHERE room_name = ? AND role = 'moderator'", room.name);
    moderators.forEach(mod => {
      io.to(`user:${mod.username}`).emit('join_request', { room: room.name, username: user.username });
    });
  }

  res.json({ status: 'requested' });
});

// POST /api/rooms/:name/approve/:username — approve join request (owner/mod/admin)
router.post('/rooms/:name/approve/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  
  const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room.name, user.username);
  const hasPermission = user.isAdmin || room.owner === user.username || (member && member.role === 'moderator');
  if (!hasPermission) return res.status(403).json({ error: 'Only owner, moderator, or admin can approve requests.' });

  run(`INSERT OR IGNORE INTO chat_members (room_name,username,role) VALUES (?,?,'member')`, room.name, req.params.username);
  run(`UPDATE join_requests SET status = 'approved' WHERE room_name = ? AND username = ?`, room.name, req.params.username);

  // Notify target via Socket.IO
  const io = req.app.get('socketio');
  if (io) {
    io.to(`user:${req.params.username}`).emit('join_approved', {
      room: { name: room.name, displayName: room.display_name || room.name }
    });
  }

  res.json({ success: true });
});

// POST /api/rooms/:name/reject/:username
router.post('/rooms/:name/reject/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  
  const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room.name, user.username);
  const hasPermission = user.isAdmin || room.owner === user.username || (member && member.role === 'moderator');
  if (!hasPermission) return res.status(403).json({ error: 'Only owner, moderator, or admin can reject requests.' });

  run(`UPDATE join_requests SET status = 'rejected' WHERE room_name = ? AND username = ?`, room.name, req.params.username);
  res.json({ success: true });
});

// PATCH /api/rooms/:name/role — set role (owner/admin)
router.patch('/rooms/:name/role', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (!user.isAdmin && room.owner !== user.username) return res.status(403).json({ error: 'Only owner or admin.' });
  const { username, role } = req.body;
  if (!['member','moderator','muted','guest'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  run(`UPDATE chat_members SET role = ? WHERE room_name = ? AND username = ?`, role, room.name, username);
  res.json({ success: true });
});

// DELETE /api/rooms/:name/kick/:username — kick member
router.delete('/rooms/:name/kick/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  // Owner/admin or moderator can kick non-owners
  const actorMember = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room.name, user.username);
  const canKick = user.isAdmin || room.owner === user.username || actorMember?.role === 'moderator';
  if (!canKick) return res.status(403).json({ error: 'Insufficient permissions.' });

  run('DELETE FROM chat_members WHERE room_name = ? AND username = ?', room.name, req.params.username);
  res.json({ success: true });
});

// GET /api/rooms/:name/members
router.get('/rooms/:name/members', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const members = all(`
    SELECT cm.username, cm.role, cm.joined_at, u.emoji, u.first_name, u.last_name
    FROM chat_members cm
    LEFT JOIN users u ON u.username = cm.username
    WHERE cm.room_name = ?
    ORDER BY CASE cm.role WHEN 'owner' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
  `, req.params.name);
  res.json(members);
});

// GET /api/rooms/:name/requests — pending join requests (owner/mod/admin)
router.get('/rooms/:name/requests', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const room = one('SELECT * FROM chat_rooms WHERE name = ?', req.params.name);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  
  const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room.name, user.username);
  const hasPermission = user.isAdmin || room.owner === user.username || (member && member.role === 'moderator');
  if (!hasPermission) return res.status(403).json({ error: 'Only owner, moderator, or admin.' });

  const requests = all('SELECT * FROM join_requests WHERE room_name = ? AND status = ?', req.params.name, 'pending');
  res.json(requests);
});

// ── MESSAGES ──────────────────────────────────────────────────

// GET /api/messages/:room — fetch history
router.get('/messages/:room', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const roomName = decodeURIComponent(req.params.room);

  // Admin can see any room; others must be members
  if (!user.isAdmin) {
    const member = one('SELECT * FROM chat_members WHERE room_name = ? AND username = ?', roomName, user.username);
    if (!member && !roomName.startsWith(`private:${user.username}`) && !roomName.includes(user.username)) {
      return res.status(403).json({ error: 'Not a member of this room.' });
    }
  }

  const messages = all(`
    SELECT m.*, u.skin FROM chat_messages m
    LEFT JOIN users u ON m.sender = u.username
    WHERE m.room = ?
    ORDER BY m.id ASC LIMIT 200
  `, roomName);

  // For non-admins, hide deleted message content
  const mapped = messages.map(m => ({
    _id: m.id,
    room: m.room,
    sender: m.sender,
    skin: m.skin || 'default',
    content: m.deleted && !user.isAdmin ? '[deleted]' : m.content,
    originalContent: user.isAdmin ? m.original_content : undefined,
    type: m.type || 'text',
    deleted: !!m.deleted,
    deletedBy: m.deleted_by,
    timestamp: m.timestamp
  }));
  res.json(mapped);
});

// GET /api/admin/messages/deleted
router.get('/admin/messages/deleted', (req, res) => {
  const user = getUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const msgs = all('SELECT * FROM chat_messages WHERE deleted = 1 ORDER BY id DESC LIMIT 100');
  res.json(msgs.map(m => ({ ...m, _id: m.id })));
});

// DELETE /api/messages/:id
router.delete('/messages/:id', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const msg = one('SELECT * FROM chat_messages WHERE id = ?', req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  const canDelete = user.isAdmin || msg.sender === user.username;
  if (!canDelete) {
    // Moderator can delete in their rooms
    const modCheck = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', msg.room, user.username);
    if (!modCheck || modCheck.role === 'member' || modCheck.role === 'guest') {
      return res.status(403).json({ error: 'Cannot delete this message.' });
    }
  }

  run(`UPDATE chat_messages SET deleted = 1, deleted_by = ?, original_content = content, content = '[deleted]' WHERE id = ?`,
    user.username, req.params.id);
  res.json({ success: true });
});

// ── FRIENDS ───────────────────────────────────────────────────

// GET /api/friends
router.get('/friends', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const friends = all(`
    SELECT f.*, 
      CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END as friend_username,
      u.emoji, u.first_name, u.last_name
    FROM friendships f
    JOIN users u ON u.username = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END
    WHERE (f.user1 = ? OR f.user2 = ?) AND f.status = 'accepted'
  `, user.username, user.username, user.username, user.username);
  res.json(friends);
});

// GET /api/friends/requests
router.get('/friends/requests', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const requests = all(`
    SELECT f.*, u.emoji, u.first_name, u.last_name
    FROM friendships f
    JOIN users u ON u.username = f.user1
    WHERE f.user2 = ? AND f.status = 'pending'
  `, user.username);
  res.json(requests);
});

// POST /api/friends/request
router.post('/friends/request', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { username } = req.body;
  if (!username || username === user.username) return res.status(400).json({ error: 'Invalid username.' });
  const target = one('SELECT id FROM users WHERE username = ?', username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  try {
    run(`INSERT OR IGNORE INTO friendships (user1,user2,status) VALUES (?,?,'pending')`, user.username, username);
    res.json({ success: true });
  } catch { res.status(409).json({ error: 'Request already sent.' }); }
});

// POST /api/friends/accept
router.post('/friends/accept', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { username } = req.body;
  run(`UPDATE friendships SET status = 'accepted' WHERE user1 = ? AND user2 = ? AND status = 'pending'`,
    username, user.username);
  res.json({ success: true });
});

// DELETE /api/friends/:username
router.delete('/friends/:username', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  run(`DELETE FROM friendships WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)`,
    user.username, req.params.username, req.params.username, user.username);
  res.json({ success: true });
});

// GET /api/users — list of users (for DMs, adding friends)
router.get('/users', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const users = all('SELECT id, username, first_name, last_name, emoji, is_admin as isAdmin FROM users WHERE username != ? ORDER BY username', user.username);
  res.json(users);
});

module.exports = router;
