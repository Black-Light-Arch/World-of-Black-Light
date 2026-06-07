// ============================================================
//  WORLD OF BLACKLIGHT — CHAT SERVER
//  Express + Socket.IO + MongoDB Atlas
// ============================================================

// Fix for Windows DNS not resolving MongoDB Atlas SRV records
require('dns').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');

const path       = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../blacklight-chat')));   // serve the website

// ── Debug Path Route ──────────────────────────────────────────
app.get('/api/debug-paths', (req, res) => {
    const fs = require('fs');
    const serverDir = __dirname;
    const parentDir = path.join(__dirname, '..');
    try {
        res.json({
            __dirname: serverDir,
            serverContents: fs.readdirSync(serverDir),
            parentDir: parentDir,
            parentContents: fs.readdirSync(parentDir),
            staticPathExists: fs.existsSync(path.join(__dirname, '../blacklight-chat')),
            staticContents: fs.existsSync(path.join(__dirname, '../blacklight-chat')) 
                ? fs.readdirSync(path.join(__dirname, '../blacklight-chat')) 
                : []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── MongoDB Atlas Connection ─────────────────────────────────
const MONGO_URI   = process.env.MONGO_URI || 'mongodb+srv://<user>:<pass>@cluster.mongodb.net/blacklight?retryWrites=true&w=majority';
const JWT_SECRET  = process.env.JWT_SECRET || 'blacklight_secret_key_change_in_prod';
const NVIDIA_KEY  = process.env.NVIDIA_API_KEY || '';  // DeepSeek via NVIDIA NIM

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Atlas connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

// ── Schemas ──────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
    username:  { type: String, required: true, unique: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    isAdmin:   { type: Boolean, default: false },
    emoji:     { type: String, default: '👁️' },
    createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    room:            { type: String, required: true },   // 'ai', 'private:<userA>:<userB>', 'group:<name>'
    sender:          { type: String, required: true },   // username or 'AI'
    content:         { type: String, required: true },
    originalContent: { type: String, default: null },    // stored before deletion for admin view
    deleted:         { type: Boolean, default: false },
    deletedBy:       { type: String, default: null },
    timestamp:       { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
    name:      { type: String, required: true, unique: true },
    type:      { type: String, enum: ['ai', 'private', 'group'], required: true },
    members:   [{ type: String }],           // usernames
    admins:    [{ type: String }],           // always includes all admins
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User    = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Room    = mongoose.model('Room', roomSchema);

// ── Seed admin account ───────────────────────────────────────
async function seedAdmin() {
    try {
        const exists = await User.findOne({ username: 'shehram' });
        if (!exists) {
            const hashed = await bcrypt.hash('shehram', 10);
            await User.create({ username: 'shehram', email: 'shehram@blacklight.com', password: hashed, isAdmin: true });
            console.log('✅ Admin user created: shehram / shehram');
        } else {
            console.log('ℹ️  Admin user already exists: shehram');
        }
    } catch(e) { console.log('Admin seed skipped:', e.message); }
}
mongoose.connection.once('open', seedAdmin);

// ── Auth Middleware ──────────────────────────────────────────
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminMiddleware(req, res, next) {
    authMiddleware(req, res, () => {
        if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
        next();
    });
}

// ── REST: Auth Routes ────────────────────────────────────────
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, emoji } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(400).json({ error: 'Username or email already taken' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashed, emoji: emoji || '👁️' });
        const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username: user.username, email: user.email, isAdmin: user.isAdmin, emoji: user.emoji } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { email: username }] });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username: user.username, email: user.email, isAdmin: user.isAdmin, emoji: user.emoji } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Change admin credentials
app.put('/api/admin/credentials', adminMiddleware, async (req, res) => {
    try {
        const { newUsername, newPassword } = req.body;
        const update = {};
        if (newUsername) update.username = newUsername;
        if (newPassword) update.password = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user.id, update);
        res.json({ success: true, message: 'Credentials updated' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REST: User Routes ────────────────────────────────────────

// List all users (for user picker / admin panel)
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REST: Room Routes ────────────────────────────────────────
app.get('/api/rooms', authMiddleware, async (req, res) => {
    try {
        let rooms;
        if (req.user.isAdmin) {
            rooms = await Room.find({});
        } else {
            rooms = await Room.find({ members: req.user.username });
        }
        res.json(rooms);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms', authMiddleware, async (req, res) => {
    try {
        const { name, type, members } = req.body;
        const admins = await User.find({ isAdmin: true }).select('username');
        const adminNames = admins.map(a => a.username);
        const allMembers = [...new Set([...( members || []), req.user.username, ...adminNames])];

        // Check if room already exists
        const existing = await Room.findOne({ name });
        if (existing) {
            return res.json(existing);
        }

        const room = await Room.create({ name, type, members: allMembers, admins: adminNames, createdBy: req.user.username });
        res.json(room);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: delete a room
app.delete('/api/admin/rooms/:name', adminMiddleware, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        await Room.deleteOne({ name });
        await Message.deleteMany({ room: name });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REST: Message Routes ─────────────────────────────────────
app.get('/api/messages/:room', authMiddleware, async (req, res) => {
    try {
        const room = decodeURIComponent(req.params.room);
        // Admins can see all rooms; users only their rooms
        if (!req.user.isAdmin) {
            const roomDoc = await Room.findOne({ name: room, members: req.user.username });
            if (!roomDoc && room !== `ai:${req.user.username}`) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        const messages = await Message.find({ room }).sort({ timestamp: 1 }).limit(200);
        res.json(messages);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: get ALL messages across all rooms
app.get('/api/admin/messages', adminMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({}).sort({ timestamp: -1 }).limit(500);
        res.json(messages);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: get DELETED messages with original content visible
app.get('/api/admin/messages/deleted', adminMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ deleted: true })
            .sort({ timestamp: -1 })
            .limit(200);
        res.json(messages);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: get all users
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI Chat (DeepSeek via NVIDIA NIM) ─────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        const SYSTEM_PROMPT = `You are the BlackLight AI assistant for "World of BlackLight" — an independent horror game studio.
Be atmospheric, slightly mysterious but helpful. Keep answers concise (2-4 sentences max).
The studio makes psychological horror games. Current game: "The One Who's Watching" — a first-person horror experience set in an abandoned hospital.
They also publish dark stories in their Archive, and post dev updates in the DevLog.
Users can sign up, login, browse games, read stories, and use a full chat system with AI, Private Messages, and Group chats.
Admins silently observe all conversations. Nothing is truly deleted — the darkness remembers.
If asked about contacting the studio, mention studio@worldofblacklight.com or the 'Talk to Support' chat feature.`;

        // If no NVIDIA key, use fallback rule-based responses
        if (!NVIDIA_KEY) {
            return res.json({ reply: getFallbackReply(message), fallback: true });
        }

        // Build messages array (OpenAI format)
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).slice(-10),
            { role: 'user', content: message }
        ];

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NVIDIA_KEY}`
            },
            body: JSON.stringify({
                model: 'meta/llama-3.1-8b-instruct',
                messages,
                max_tokens: 400,
                temperature: 0.7,
                stream: false
            })
        });
        const data = await response.json();

        if (data.error || !data.choices) {
            console.error('NVIDIA NIM error:', JSON.stringify(data.error || data));
            return res.json({ reply: getFallbackReply(message), fallback: true });
        }

        // DeepSeek-R1 may include <think>...</think> reasoning — strip for clean reply
        let reply = data.choices[0]?.message?.content || 'The darkness stirs… try again.';
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (!reply) reply = 'The signal wavers… try again.';

        res.json({ reply });
    } catch (e) {
        console.error('AI chat error:', e.message);
        res.json({ reply: getFallbackReply(req.body?.message || ''), fallback: true });
    }
});

// ── Fallback rule-based AI (when no Anthropic key) ───────────
function getFallbackReply(message) {
    const m = message.toLowerCase();

    if (m.includes('hello') || m.includes('hi') || m.includes('hey')) {
        return "Greetings, traveler. I am the BlackLight AI — your guide through the darkness. What do you seek?";
    }
    if (m.includes('game') || m.includes('watching') || m.includes('horror')) {
        return "\"The One Who's Watching\" is our debut title — a first-person psychological horror experience set in an abandoned hospital. Something has been waiting there long before you arrived. Explore it in the Games section.";
    }
    if (m.includes('stor') || m.includes('archive')) {
        return "The Archive holds classified files and dark stories — File 001: The One Who Watches, File 002: Signal Below Zero, File 003: The City Without Shadows. Membership required to access.";
    }
    if (m.includes('devlog') || m.includes('develop') || m.includes('update')) {
        return "The Development Log documents our journey — lighting experiments, hospital environment design, and our creature presence system. New entries appear when the darkness permits.";
    }
    if (m.includes('contact') || m.includes('support') || m.includes('admin') || m.includes('help')) {
        return "You can reach the studio at studio@worldofblacklight.com, or use the 'Talk to Support' button to connect directly with an admin via private message. The shadows have ears.";
    }
    if (m.includes('sign') || m.includes('login') || m.includes('register') || m.includes('account')) {
        return "To join the BlackLight community, create an account via the Sign Up page. Members gain access to the Archive, DevLog, and the full chat system.";
    }
    if (m.includes('chat') || m.includes('message') || m.includes('group') || m.includes('private')) {
        return "The chat system offers three realms: speak with me (AI), send Private Messages to other members, or join Group conversations. Admins silently observe all spaces. Nothing is truly deleted here.";
    }
    if (m.includes('who are you') || m.includes('what are you')) {
        return "I am the BlackLight AI — born from the static between frequencies. I know the studio's secrets, its games, its stories. Ask, and I shall answer from the dark.";
    }
    if (m.includes('thank')) {
        return "The darkness acknowledges your gratitude. Is there anything else you seek?";
    }

    return "The signal wavers… but I am listening. Ask me about our games, stories, devlog, or how to connect with the studio.";
}

// ── Socket.IO ────────────────────────────────────────────────
const onlineUsers = new Map(); // socketId -> { username, isAdmin }

io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Authenticate socket
    socket.on('authenticate', async ({ token }) => {
        try {
            const user = jwt.verify(token, JWT_SECRET);
            onlineUsers.set(socket.id, { username: user.username, isAdmin: user.isAdmin });
            socket.username = user.username;
            socket.isAdmin  = user.isAdmin;
            socket.emit('authenticated', { username: user.username, isAdmin: user.isAdmin });

            // Auto-join all admin rooms if admin
            if (user.isAdmin) {
                const allRooms = await Room.find({});
                allRooms.forEach(r => socket.join(r.name));
            }
            io.emit('online_users', [...onlineUsers.values()].map(u => u.username));
        } catch { socket.emit('auth_error', 'Invalid token'); }
    });

    // Join a room
    socket.on('join_room', async ({ room }) => {
        socket.join(room);
        socket.emit('room_joined', room);
    });

    // Send message
    socket.on('send_message', async ({ room, content }) => {
        if (!socket.username) return;
        try {
            const msg = await Message.create({
                room,
                sender: socket.username,
                content,
                originalContent: content   // store original before any deletion
            });
            const payload = {
                _id: msg._id, room, sender: socket.username,
                content, timestamp: msg.timestamp, deleted: false
            };
            io.to(room).emit('new_message', payload);

            // Make sure all admin sockets also receive the message
            onlineUsers.forEach((u, sid) => {
                if (u.isAdmin) io.to(sid).emit('new_message', payload);
            });
        } catch (e) { console.error('Message save error:', e); }
    });

    // Delete message (soft delete — stored as deleted, still visible to admin with original content)
    socket.on('delete_message', async ({ messageId }) => {
        if (!socket.username) return;
        try {
            const msg = await Message.findById(messageId);
            if (!msg) return;
            // Only sender or admin can delete
            if (msg.sender !== socket.username && !socket.isAdmin) return;

            // Store original content before marking deleted (if not already stored)
            const originalContent = msg.originalContent || msg.content;
            await Message.findByIdAndUpdate(messageId, {
                deleted: true,
                deletedBy: socket.username,
                originalContent
            });

            // Tell the room the message is deleted (regular users see generic message)
            io.to(msg.room).emit('message_deleted', {
                messageId,
                deletedBy: socket.username,
                room: msg.room,
                originalContent   // admins will use this
            });
        } catch (e) { console.error('Delete error:', e); }
    });

    // Typing indicator
    socket.on('typing', ({ room }) => {
        socket.to(room).emit('user_typing', { username: socket.username, room });
    });

    // Admin: request all rooms (for admin panel refresh)
    socket.on('admin_get_rooms', async () => {
        if (!socket.isAdmin) return;
        const rooms = await Room.find({});
        socket.emit('admin_rooms_update', rooms);
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        io.emit('online_users', [...onlineUsers.values()].map(u => u.username));
    });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🌑 BlackLight server running on http://localhost:${PORT}`));
