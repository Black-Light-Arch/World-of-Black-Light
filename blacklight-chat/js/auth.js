// ============================================================
//  WORLD OF BLACKLIGHT — AUTH SYSTEM (v2)
//  Bridges old localStorage API with new JWT backend
// ============================================================

const WOB_SESSION_KEY = 'wob_session';
const BL_JWT_KEY      = 'bl_jwt';
const BL_USER_KEY     = 'bl_user';

// Server URL — update this to your deployed server address
const BL_SERVER = window.BL_SERVER || window.location.origin;

const Auth = {

    // ── Get current session (backward-compatible) ─────────────────
    getSession() {
        try {
            const u = localStorage.getItem(BL_USER_KEY);
            if (u) {
                const user = JSON.parse(u);
                return {
                    email:     user.email     || '',
                    firstName: user.username  || user.firstName || 'User',
                    lastName:  user.lastName  || '',
                    emoji:     user.emoji     || '👁️',
                    username:  user.username,
                    isAdmin:   user.isAdmin   || false
                };
            }
            return JSON.parse(localStorage.getItem(WOB_SESSION_KEY));
        } catch { return null; }
    },

    isLoggedIn() { return !!this.getSession(); },

    getToken() { return localStorage.getItem(BL_JWT_KEY); },

    async loginAPI(usernameOrEmail, password) {
        const res  = await fetch(`${BL_SERVER}/api/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username: usernameOrEmail, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem(BL_JWT_KEY,  data.token);
        localStorage.setItem(BL_USER_KEY, JSON.stringify(data.user));
        return data.user;
    },

    async registerAPI(userData) {
        const res  = await fetch(`${BL_SERVER}/api/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        localStorage.setItem(BL_JWT_KEY,  data.token);
        localStorage.setItem(BL_USER_KEY, JSON.stringify(data.user));
        return data.user;
    },

    logout() {
        localStorage.removeItem(WOB_SESSION_KEY);
        localStorage.removeItem(BL_JWT_KEY);
        localStorage.removeItem(BL_USER_KEY);
    },

    // Legacy stubs
    getUsers()         { return []; },
    registerUser()     { return false; },
    login()            { return null; },
    setSession(s)      { localStorage.setItem(WOB_SESSION_KEY, JSON.stringify(s)); },
    updateEmoji(emoji) {
        const session = this.getSession();
        if (session) { session.emoji = emoji; this.setSession(session); }
        const u = localStorage.getItem(BL_USER_KEY);
        if (u) { const obj = JSON.parse(u); obj.emoji = emoji; localStorage.setItem(BL_USER_KEY, JSON.stringify(obj)); }
    }
};
