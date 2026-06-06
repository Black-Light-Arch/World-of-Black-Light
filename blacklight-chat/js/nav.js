// ============================================================
//  WORLD OF BLACKLIGHT — DYNAMIC NAV (v2)
// ============================================================

(function () {
    const path     = window.location.pathname;
    const inSubdir = path.includes('/story-pages/') ||
                     path.includes('/games-pages/') ||
                     path.includes('/games/');
    const prefix   = inSubdir ? '../' : '';

    function buildNav() {
        const session  = Auth.isLoggedIn() ? Auth.getSession() : null;
        const authArea = document.getElementById('nav-auth');
        if (!authArea) return;

        if (session) {
            authArea.innerHTML = `
                <a href="${prefix}chat.html" class="nav-chat-link" title="Chat">💬</a>
                <a href="${prefix}profile.html" class="nav-profile" title="Your Profile">
                    <span class="nav-emoji">${session.emoji}</span>
                    <span class="nav-username">${session.firstName}</span>
                </a>
                <a href="#" id="nav-logout" class="nav-logout-btn">Logout</a>`;

            document.getElementById('nav-logout').addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
                window.location.href = prefix + 'index.html';
            });
        } else {
            authArea.innerHTML = `
                <a href="${prefix}signup.html">Sign Up</a>
                <a href="${prefix}login.html">Login</a>`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildNav);
    } else {
        buildNav();
    }
})();
