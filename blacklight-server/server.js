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
    friends:   [{ type: String }], // list of friend usernames
    friendRequestsSent:     [{ type: String }],
    friendRequestsReceived: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    room:            { type: String, required: true },   // 'ai', 'private:<userA>:<userB>', 'group:<name>'
    sender:          { type: String, required: true },   // username or 'AI'
    content:         { type: String, required: true },
    originalContent: { type: String, default: null },    // stored before deletion for admin view
    deleted:         { type: Boolean, default: false },
    deletedBy:       { type: String, default: null },
    readBy:          [{ type: String }],                 // list of users who have read the message
    timestamp:       { type: Date, default: Date.now }
});
const roomSchema = new mongoose.Schema({
    name:         { type: String, required: true, unique: true },
    displayName:  { type: String },
    type:         { type: String, enum: ['ai', 'private', 'group'], required: true },
    members:      [{ type: String }],           // usernames
    admins:       [{ type: String }],           // always includes all admins
    isPrivate:    { type: Boolean, default: false }, // private groups require search to join
    joinRequests: [{ type: String }],           // pending join requests (usernames)
    createdBy:    { type: String },
    createdAt:    { type: Date, default: Date.now }
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
app.get('/api/rooms/:name', authMiddleware, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        const room = await Room.findOne({ name });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        
        // Allow creator, admin, or members
        const isCreator = room.createdBy === req.user.username;
        const isMember = room.members.includes(req.user.username);
        if (!req.user.isAdmin && !isMember && !isCreator && room.isPrivate) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(room);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms', authMiddleware, async (req, res) => {
    try {
        const { name, type, members, isPrivate, privacy, displayName } = req.body;
        const finalIsPrivate = isPrivate !== undefined ? !!isPrivate : (privacy === 'private');
        const admins = await User.find({ isAdmin: true }).select('username');
        const adminNames = admins.map(a => a.username);
        const allMembers = [...new Set([...(members || []), req.user.username, ...adminNames])];

        // Check if room already exists
        const existing = await Room.findOne({ name });
        if (existing) {
            return res.json(existing);
        }

        const room = await Room.create({ 
            name, 
            displayName: displayName || (type === 'group' ? name.replace(/^group:/, '') : name),
            type, 
            members: allMembers, 
            admins: adminNames, 
            isPrivate: finalIsPrivate,
            createdBy: req.user.username 
        });
        res.json(room);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Discover Public Groups
app.get('/api/groups/discover', authMiddleware, async (req, res) => {
    try {
        const rooms = await Room.find({
            type: 'group',
            isPrivate: false,
            members: { $ne: req.user.username },
            joinRequests: { $ne: req.user.username }
        });
        res.json(rooms);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Request to join a group
app.post('/api/rooms/:name/request-join', authMiddleware, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        const room = await Room.findOne({ name });
        if (!room) return res.status(404).json({ error: 'Group not found' });
        if (room.members.includes(req.user.username)) {
            return res.status(400).json({ error: 'Already a member' });
        }
        await Room.updateOne({ name }, { $addToSet: { joinRequests: req.user.username } });
        
        // Notify creator via socket
        for (const [sid, info] of onlineUsers.entries()) {
            if (info.username === room.createdBy) {
                io.to(sid).emit('join_request', { room: room.name, username: req.user.username });
            }
        }
        res.json({ success: true, message: 'Join request sent' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Search groups by exact name (for private or public groups)
app.get('/api/rooms/search', authMiddleware, async (req, res) => {
    try {
        const queryName = req.query.name;
        if (!queryName) return res.status(400).json({ error: 'Query name required' });
        const room = await Room.findOne({ name: { $regex: new RegExp(`^group:${queryName}$`, 'i') } });
        if (!room) return res.status(404).json({ error: 'Group not found' });
        res.json({
            name: room.name,
            type: room.type,
            isPrivate: room.isPrivate,
            createdBy: room.createdBy,
            isMember: room.members.includes(req.user.username),
            hasRequested: room.joinRequests.includes(req.user.username)
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Approve join request
app.post('/api/rooms/:name/approve-request', authMiddleware, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        const { username } = req.body;
        const room = await Room.findOne({ name });
        if (!room) return res.status(404).json({ error: 'Group not found' });
        if (room.createdBy !== req.user.username && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await Room.updateOne({ name }, {
            $addToSet: { members: username },
            $pull: { joinRequests: username }
        });
        
        // Notify approved user if online
        for (const [sid, info] of onlineUsers.entries()) {
            if (info.username === username) {
                io.to(sid).emit('join_approved', { room });
            }
        }
        res.json({ success: true, message: 'Request approved' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reject join request
app.post('/api/rooms/:name/reject-request', authMiddleware, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        const { username } = req.body;
        const room = await Room.findOne({ name });
        if (!room) return res.status(404).json({ error: 'Group not found' });
        if (room.createdBy !== req.user.username && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await Room.updateOne({ name }, {
            $pull: { joinRequests: username }
        });
        
        // Notify rejected user if online
        for (const [sid, info] of onlineUsers.entries()) {
            if (info.username === username) {
                io.to(sid).emit('join_rejected', { room: room.name });
            }
        }
        res.json({ success: true, message: 'Request rejected' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REST: Friend Routes ──────────────────────────────────────
app.post('/api/friends/request', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        if (username === req.user.username) return res.status(400).json({ error: 'You cannot add yourself' });
        const targetUser = await User.findOne({ username });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        const currentUser = await User.findOne({ username: req.user.username });
        if (currentUser.friends.includes(username)) return res.status(400).json({ error: 'Already friends' });
        await User.updateOne({ username: req.user.username }, { $addToSet: { friendRequestsSent: username } });
        await User.updateOne({ username }, { $addToSet: { friendRequestsReceived: req.user.username } });
        
        // Notify online user via socket
        for (const [sid, info] of onlineUsers.entries()) {
            if (info.username === username) {
                io.to(sid).emit('friend_request', { from: req.user.username, fromEmoji: currentUser.emoji || '👁️' });
            }
        }
        res.json({ success: true, message: 'Friend request sent' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/friends/accept', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        await User.updateOne({ username: req.user.username }, {
            $addToSet: { friends: username },
            $pull: { friendRequestsReceived: username }
        });
        await User.updateOne({ username }, {
            $addToSet: { friends: req.user.username },
            $pull: { friendRequestsSent: req.user.username }
        });
        const sorted = [req.user.username, username].sort();
        const roomName = `private:${sorted[0]}:${sorted[1]}`;
        const display = `💬 ${username}`;
        let room = await Room.findOne({ name: roomName });
        if (!room) {
            const admins = await User.find({ isAdmin: true }).select('username');
            const adminNames = admins.map(a => a.username);
            const allMembers = [req.user.username, username, ...adminNames];
            room = await Room.create({ 
                name: roomName, 
                displayName: display,
                type: 'private', 
                members: allMembers, 
                admins: adminNames,
                createdBy: 'system' 
            });
        }
        
        // Notify online user via socket
        for (const [sid, info] of onlineUsers.entries()) {
            if (info.username === username) {
                io.to(sid).emit('friend_accepted', { from: req.user.username });
            }
        }
        res.json({ success: true, message: 'Friend request accepted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/friends/reject', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        await User.updateOne({ username: req.user.username }, { $pull: { friendRequestsReceived: username } });
        await User.updateOne({ username }, { $pull: { friendRequestsSent: req.user.username } });
        res.json({ success: true, message: 'Friend request rejected' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/friends', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const friendsList = await User.find({ username: { $in: user.friends } }).select('-password');
        const onlineUsernames = new Set([...onlineUsers.values()].map(u => u.username));
        const friendsWithStatus = friendsList.map(f => ({
            username: f.username,
            email: f.email,
            emoji: f.emoji,
            isOnline: onlineUsernames.has(f.username)
        }));
        res.json(friendsWithStatus);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/friends/requests', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const pendingList = await User.find({ username: { $in: user.friendRequestsReceived } }).select('username emoji');
        res.json(pendingList);
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
        
        // Mark all messages in this room as read by this user
        await Message.updateMany(
            { room, readBy: { $ne: req.user.username } },
            { $addToSet: { readBy: req.user.username } }
        );
        
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
                originalContent: content,
                readBy: [socket.username]
            });
            const payload = {
                _id: msg._id, room, sender: socket.username,
                content, timestamp: msg.timestamp, deleted: false,
                readBy: msg.readBy
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

    // Mark messages as read
    socket.on('mark_read', async ({ room }) => {
        if (!socket.username) return;
        try {
            const result = await Message.updateMany(
                { room, readBy: { $ne: socket.username } },
                { $addToSet: { readBy: socket.username } }
            );
            if (result.modifiedCount > 0) {
                // Notify others in the room that this user has read messages
                socket.to(room).emit('messages_read', { room, username: socket.username });
            }
        } catch (e) { console.error('Mark read error:', e); }
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
