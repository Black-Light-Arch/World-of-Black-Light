// ============================================================
//  WORLD OF BLACKLIGHT — EXPRESS + SOCKET.IO SERVER v3.0
//  Node.js + Express + SQLite (built-in) + Socket.IO
//  Start: node --experimental-sqlite server.js
// ============================================================
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const http     = require('http');
const socketIO = require('socket.io');
const jwt      = require('jsonwebtoken');
const { one, all, run } = require('./database');

const app  = express();
const server = http.createServer(app);
const io     = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'blacklight-super-secret-2026';

// Store io in express app so routes can access it
app.set('socketio', io);

// ── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '100mb' })); // support large base64 file transfers
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ── SERVE STATIC FRONTEND ────────────────────────────────────
const FRONTEND = path.join(__dirname, '..', 'World of Black Light', 'blacklight-react', 'dist');
app.use(express.static(FRONTEND));

// ── API ROUTES ───────────────────────────────────────────────
app.use('/api',             require('./routes/auth'));
app.use('/api/players',     require('./routes/players'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/contact',     require('./routes/contact'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api',             require('./routes/chat'));
app.use('/api/ai',          require('./routes/ai'));

// ── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
  status: 'OK', project: 'World of BlackLight', version: '3.0.0', time: new Date().toISOString()
}));

// ── CATCH-ALL ────────────────────────────────────────────────
app.get('*', (_, res) => res.sendFile(path.join(FRONTEND, 'index.html')));

// ── SOCKET.IO PRESENCE & REAL-TIME CHAT ───────────────────────
const onlineUsers = new Map(); // username -> socket.id

io.on('connection', (socket) => {
  // 1. Authenticate connection
  socket.on('authenticate', ({ token }) => {
    try {
      if (!token) return;
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.username = decoded.username;
      socket.userId   = decoded.id;
      socket.isAdmin  = !!decoded.isAdmin;

      // Join personal room for targeted alerts (like friend/join requests)
      socket.join(`user:${decoded.username}`);
      
      // Store in online map
      onlineUsers.set(decoded.username, socket.id);
      
      // If admin, join admin spy channel
      if (socket.isAdmin) {
        socket.join('admin_spy');
      }

      // Broadcast updated online users
      io.emit('online_users', Array.from(onlineUsers.keys()));
      socket.emit('authenticated', { username: decoded.username });
    } catch (err) {
      socket.emit('unauthorized', { error: 'Auth failed' });
    }
  });

  // 2. Join a Room
  socket.on('join_room', ({ room }) => {
    if (!socket.username) return;

    // Permissions check: Admins bypass. DMs must include user. Groups must be joined.
    if (!socket.isAdmin) {
      if (room.startsWith('private:')) {
        const parts = room.split(':');
        if (parts[1] !== socket.username && parts[2] !== socket.username) {
          return socket.emit('error_message', { error: 'Access denied to DM.' });
        }
      } else if (room.startsWith('group:')) {
        const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room, socket.username);
        if (!member) {
          return socket.emit('error_message', { error: 'Not a member of this group.' });
        }
      }
    }

    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }
    socket.join(room);
    socket.currentRoom = room;

    // Send read confirmation to the other members
    io.to(room).emit('messages_read', { room, username: socket.username });
  });

  // 3. Send Text Message
  socket.on('send_message', async ({ room, content }) => {
    if (!socket.username) return;

    // Validate permission (not muted)
    if (!socket.isAdmin && room.startsWith('group:')) {
      const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room, socket.username);
      if (!member) return;
      if (member.role === 'muted') {
        return socket.emit('error_message', { error: 'You are muted in this group.' });
      }
    }

    try {
      // Save message in DB
      const res = run(
        `INSERT INTO chat_messages (room, sender, content, type) VALUES (?, ?, ?, ?)`,
        room, socket.username, content, 'text'
      );
      const messageId = res.lastInsertRowid;

      const user = one('SELECT skin FROM users WHERE username = ?', socket.username);
      const skin = user ? (user.skin || 'default') : 'default';

      const msgObj = {
        _id: messageId,
        room,
        sender: socket.username,
        skin,
        content,
        type: 'text',
        deleted: false,
        timestamp: new Date().toISOString()
      };

      // Broadcast to room
      io.to(room).emit('new_message', msgObj);

      // Send to spy room for admins
      io.to('admin_spy').emit('spy_message', msgObj);
    } catch (e) {
      console.error('Save message error:', e);
    }
  });

  // 4. Send File / Document (NOT saved to Database)
  socket.on('send_file', ({ room, filename, filetype, filesize, data }) => {
    if (!socket.username) return;

    // Verify permission (not muted)
    if (!socket.isAdmin && room.startsWith('group:')) {
      const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', room, socket.username);
      if (!member || member.role === 'muted') return;
    }

    const user = one('SELECT skin FROM users WHERE username = ?', socket.username);
    const skin = user ? (user.skin || 'default') : 'default';

    const fileMsg = {
      _id: `file-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      room,
      sender: socket.username,
      skin,
      content: data, // base64 string
      type: 'file',
      filename,
      filetype,
      filesize,
      deleted: false,
      timestamp: new Date().toISOString()
    };

    // Broadcast in real-time only
    io.to(room).emit('new_message', fileMsg);

    // Send to admin spy feed
    io.to('admin_spy').emit('spy_message', fileMsg);
  });

  // 5. Delete Message
  socket.on('delete_message', ({ messageId }) => {
    if (!socket.username) return;

    const msg = one('SELECT * FROM chat_messages WHERE id = ?', messageId);
    if (!msg) return;

    const isOwner = msg.sender === socket.username;
    let isMod   = false;

    if (!socket.isAdmin && !isOwner) {
      const member = one('SELECT role FROM chat_members WHERE room_name = ? AND username = ?', msg.room, socket.username);
      isMod = member && member.role === 'moderator';
    }

    if (socket.isAdmin || isOwner || isMod) {
      run(
        `UPDATE chat_messages SET deleted = 1, deleted_by = ?, original_content = content, content = '[deleted]' WHERE id = ?`,
        socket.username, messageId
      );

      const updateData = {
        messageId,
        deletedBy: socket.username,
        room: msg.room,
        originalContent: msg.content
      };

      io.to(msg.room).emit('message_deleted', updateData);
      io.to('admin_spy').emit('spy_message_deleted', updateData);
    }
  });

  // 6. Typing Indicator
  socket.on('typing', ({ room }) => {
    if (!socket.username) return;
    socket.to(room).emit('user_typing', { username: socket.username, room });
  });

  // 7. Disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// ── START SERVER ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  WORLD OF BLACKLIGHT — SOCKET.IO v3  ║');
  console.log(`║   http://localhost:${PORT}              ║`);
  console.log('╚═══════════════════════════════════════╝');
  console.log('\n  Admin:  admin / Admin@1234');
  console.log('  Player: shadowblade / Player@123\n');
});
