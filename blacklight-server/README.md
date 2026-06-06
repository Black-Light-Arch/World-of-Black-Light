# 🌑 World of BlackLight — Chat System Setup

## What was added

- **`blacklight-server/`** — Node.js backend (Express + Socket.IO + MongoDB Atlas)
- **`blacklight-chat/chat.html`** — Full WhatsApp-style chat page (AI, Private, Group chats)
- **`blacklight-chat/js/chatbot-widget.js`** — Floating AI chatbot on every page
- **`blacklight-chat/js/auth.js`** — Updated to use JWT + MongoDB backend
- **`blacklight-chat/js/login.js`** — Updated to call backend API
- **`blacklight-chat/js/signup.js`** — Updated to call backend API

---

## Step 1 — Create a MongoDB Atlas database (free)

1. Go to **https://cloud.mongodb.com** and create a free account
2. Create a **free cluster** (M0 Sandbox)
3. Under **Database Access** → Add a database user (e.g. `blacklight` / choose a password)
4. Under **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Click **Connect** → **Connect your application** → copy the connection string

It looks like:
```
mongodb+srv://blacklight:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/blacklight?retryWrites=true&w=majority
```

---

## Step 2 — Configure the server

Open `blacklight-server/.env` and fill in your connection string:

```env
MONGO_URI=mongodb+srv://blacklight:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/blacklight?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here
PORT=3000
```

---

## Step 3 — Install & run the server

```bash
cd blacklight-server
npm install
node server.js
```

You should see:
```
✅ MongoDB Atlas connected
✅ Admin user created: shehram / shehram
🌑 BlackLight server running on http://localhost:3000
```

---

## Step 4 — Open the website

Open `blacklight-chat/index.html` in a browser (or use Live Server in VS Code).

The website will talk to `http://localhost:3000` automatically.

---

## Admin login

| Field    | Value     |
|----------|-----------|
| Username | `shehram` |
| Password | `shehram` |

After logging in you can **change your username and password** inside the Admin Panel on the Chat page (⚙ Panel button, top right of chat).

---

## Features

### Chat page (`chat.html`)
| Feature | Details |
|---------|---------|
| **AI Chat** | Talk to BlackLight AI — knows about the studio, games, stories |
| **Private Messages** | Direct messages between any two users |
| **Group Chats** | Create groups; all admins are auto-added to every group |
| **Admin sees everything** | Admins can view all rooms, all messages (even "deleted" ones show as deleted with who deleted them) |
| **Soft delete** | Messages marked deleted stay in the database; regular users see "message deleted", admins see who deleted it |
| **Real-time** | Socket.IO — messages appear instantly, typing indicators work |
| **Online users** | Admin panel shows who's currently online |

### Floating widget (all pages)
- 👁 button fixed bottom-right on every page
- Shows unread badge when AI replies while closed
- Expand → full chat page button
- AI greets user by name if logged in

### Security
- Passwords are **bcrypt-hashed** — never stored in plain text
- JWTs expire after 7 days
- Admin routes are protected — only admin tokens can access them
- Users can only see rooms they're members of (admins bypass this)

---

## Deploying to the internet (optional)

To make the server public so others can use the chat:

**Option A — Railway (free, easy):**
1. Push `blacklight-server/` to a GitHub repo
2. Go to **https://railway.app** → New Project → Deploy from GitHub
3. Add your `MONGO_URI` and `JWT_SECRET` as environment variables
4. Railway gives you a URL like `https://blacklight-server-production.up.railway.app`

**Option B — Render (free):**
1. Same as above at **https://render.com**

Once deployed, update one line in `blacklight-chat/chat.html`:
```js
const SERVER = 'https://YOUR_RAILWAY_URL_HERE';
```

And add this before `auth.js` in each page that uses the widget:
```html
<script>window.BL_SERVER = 'https://YOUR_RAILWAY_URL_HERE';</script>
```

---

## File structure

```
blacklight-server/
├── server.js          ← main server (Express + Socket.IO + MongoDB)
├── .env               ← your config (MONGO_URI, JWT_SECRET)
└── package.json

blacklight-chat/       ← your existing website (with new files added)
├── chat.html          ← NEW: full chat page
├── js/
│   ├── auth.js        ← UPDATED: now calls backend
│   ├── login.js       ← UPDATED: backend login
│   ├── signup.js      ← UPDATED: backend signup
│   ├── nav.js         ← UPDATED: adds 💬 chat link
│   └── chatbot-widget.js  ← NEW: floating AI widget
└── ... (all original files untouched)
```
