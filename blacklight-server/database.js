// ============================================================
//  WORLD OF BLACKLIGHT — DATABASE v3.0
//  Node.js built-in SQLite — run with --experimental-sqlite
// ============================================================
const { DatabaseSync } = require('node:sqlite');
const bcrypt           = require('bcryptjs');
const path             = require('path');

const DB_PATH = path.join(__dirname, 'blacklight.db');
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ── CORE SCHEMA ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,
    first_name    TEXT    NOT NULL,
    last_name     TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    age           INTEGER,
    emoji         TEXT    DEFAULT '👁️',
    theme         TEXT    DEFAULT 'purple',
    is_admin      INTEGER DEFAULT 0,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS players (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    gamer_tag   TEXT    NOT NULL,
    rank        TEXT    DEFAULT 'Bronze',
    score       INTEGER DEFAULT 0,
    wins        INTEGER DEFAULT 0,
    losses      INTEGER DEFAULT 0,
    game        TEXT    DEFAULT 'Battle Royale',
    bio         TEXT    DEFAULT '',
    avatar_url  TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    game          TEXT    NOT NULL,
    description   TEXT    DEFAULT '',
    prize_pool    TEXT    DEFAULT '$0',
    max_slots     INTEGER DEFAULT 32,
    current_slots INTEGER DEFAULT 0,
    entry_fee     INTEGER DEFAULT 0,
    start_date    TEXT    NOT NULL,
    status        TEXT    DEFAULT 'open',
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tournament_registrations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id  INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id        INTEGER REFERENCES users(id)       ON DELETE CASCADE,
    team_name      TEXT    NOT NULL,
    payment_status TEXT    DEFAULT 'paid',
    registered_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(tournament_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id     INTEGER REFERENCES players(id)     ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES tournaments(id)  ON DELETE SET NULL,
    score         INTEGER DEFAULT 0,
    rank_position INTEGER DEFAULT 0,
    updated_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    message    TEXT NOT NULL,
    is_read    INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── CHAT SCHEMA ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_rooms (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    UNIQUE NOT NULL,
    type        TEXT    NOT NULL DEFAULT 'group',
    display_name TEXT   DEFAULT '',
    privacy     TEXT    DEFAULT 'public',
    owner       TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name  TEXT    NOT NULL,
    username   TEXT    NOT NULL,
    role       TEXT    DEFAULT 'member',
    joined_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(room_name, username)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    room             TEXT    NOT NULL,
    sender           TEXT    NOT NULL,
    content          TEXT    NOT NULL,
    type             TEXT    DEFAULT 'text',
    original_content TEXT    DEFAULT NULL,
    deleted          INTEGER DEFAULT 0,
    deleted_by       TEXT    DEFAULT NULL,
    timestamp        TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user1      TEXT    NOT NULL,
    user2      TEXT    NOT NULL,
    status     TEXT    DEFAULT 'pending',
    created_at TEXT    DEFAULT (datetime('now')),
    UNIQUE(user1, user2)
  );

  CREATE TABLE IF NOT EXISTS join_requests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name  TEXT    NOT NULL,
    username   TEXT    NOT NULL,
    status     TEXT    DEFAULT 'pending',
    requested_at TEXT  DEFAULT (datetime('now')),
    UNIQUE(room_name, username)
  );
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN skin TEXT DEFAULT 'default'");
} catch (e) {
  // column already exists
}

// ── HELPERS ───────────────────────────────────────────────────
function one(sql, ...args) { return db.prepare(sql).get(...args); }
function all(sql, ...args) { return db.prepare(sql).all(...args); }
function run(sql, ...args) { return db.prepare(sql).run(...args); }

// ── SEED DATA ─────────────────────────────────────────────────
function seedDatabase() {
  const userCount = one('SELECT COUNT(*) as c FROM users').c;
  if (userCount > 0) return;

  console.log('🌱 Seeding database...');

  const adminHash = bcrypt.hashSync('Admin@1234', 10);
  const userHash  = bcrypt.hashSync('Player@123', 10);

  run(`INSERT INTO users (username,first_name,last_name,email,password_hash,age,emoji,theme,is_admin)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    'admin','Admin','BlackLight','admin@blacklight.gg', adminHash, 25,'👁️','purple',1);

  const sampleUsers = [
    ['shadowblade',  'Alex',  'Storm',  'alex@mail.com',  userHash, 22, '⚔️', 'red'   ],
    ['voidwalker',   'Sam',   'Void',   'sam@mail.com',   userHash, 19, '🌑', 'purple'],
    ['neonpulse',    'Maya',  'Neon',   'maya@mail.com',  userHash, 24, '🔮', 'amber' ],
    ['darkphoenix',  'Ryu',   'Dark',   'ryu@mail.com',   userHash, 20, '🔥', 'red'   ],
    ['spectralrift', 'Zara',  'Rift',   'zara@mail.com',  userHash, 21, '🧿', 'green' ],
    ['ironveil',     'Kai',   'Iron',   'kai@mail.com',   userHash, 23, '💀', 'purple'],
    ['lunarshard',   'Nia',   'Lunar',  'nia@mail.com',   userHash, 18, '🌙', 'amber' ],
    ['crimsonedge',  'Dex',   'Crimsn', 'dex@mail.com',   userHash, 25, '☠️', 'red'   ],
  ];

  const games  = ['Battle Royale','FPS Arena','Shadow Tactics','Void Runner','Dark Siege'];
  const ranks  = ['Bronze','Silver','Gold','Platinum','Diamond'];
  const scores = [8500, 7200, 6100, 5300, 4800, 3900, 2700, 1500];

  sampleUsers.forEach(([username, first, last, email, hash, age, emoji, theme], i) => {
    const res = run(
      `INSERT INTO users (username,first_name,last_name,email,password_hash,age,emoji,theme,is_admin) VALUES (?,?,?,?,?,?,?,?,0)`,
      username, first, last, email, hash, age, emoji, theme
    );
    const userId = res.lastInsertRowid;
    const score  = scores[i];
    const wins   = Math.floor(score / 100);
    const losses = Math.floor(wins * 0.3);
    run(
      `INSERT INTO players (user_id,gamer_tag,rank,score,wins,losses,game,bio) VALUES (?,?,?,?,?,?,?,?)`,
      userId, username.toUpperCase(),
      ranks[Math.min(Math.floor(score / 2000), 4)],
      score, wins, losses, games[i % games.length],
      `Elite player of ${games[i % games.length]}. Fear the dark.`
    );
  });

  // Tournaments
  run(`INSERT INTO tournaments (name,game,description,prize_pool,max_slots,current_slots,entry_fee,start_date,status) VALUES (?,?,?,?,?,?,?,?,?)`,
    'Shadow Cup 2026','Battle Royale','The premier BlackLight battle royale championship.','$10,000',64,38,500,'2026-07-15','open');
  run(`INSERT INTO tournaments (name,game,description,prize_pool,max_slots,current_slots,entry_fee,start_date,status) VALUES (?,?,?,?,?,?,?,?,?)`,
    'Void Invitational','FPS Arena','Fast-paced FPS tournament for elite players.','$5,000',32,20,300,'2026-07-22','open');
  run(`INSERT INTO tournaments (name,game,description,prize_pool,max_slots,current_slots,entry_fee,start_date,status) VALUES (?,?,?,?,?,?,?,?,?)`,
    'Dark Siege Open','Dark Siege','Open tournament for all ranks. Prove yourself.','$2,500',128,85,100,'2026-08-01','open');
  run(`INSERT INTO tournaments (name,game,description,prize_pool,max_slots,current_slots,entry_fee,start_date,status) VALUES (?,?,?,?,?,?,?,?,?)`,
    'Phantom Finals','Shadow Tactics','Closed qualifier — invite only.','$20,000',16,16,0,'2026-06-30','closed');

  // Sample contact messages
  run(`INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)`,
    'Ghost_Rider','ghost@mail.com','Tournament Query','When does registration open for Season 2?');
  run(`INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)`,
    'NightOwl','owl@mail.com','Bug Report','Leaderboard not updating after match end.');

  // Seed a sample general group chat
  run(`INSERT OR IGNORE INTO chat_rooms (name,type,display_name,privacy,owner) VALUES (?,?,?,?,?)`,
    'group:general:public', 'group', 'General', 'public', 'admin');
  run(`INSERT OR IGNORE INTO chat_members (room_name,username,role) VALUES (?,?,?)`,
    'group:general:public', 'admin', 'owner');

  console.log('✅ Database seeded!');
}

seedDatabase();

module.exports = { db, one, all, run };
