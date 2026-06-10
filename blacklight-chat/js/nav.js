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
        const nav = document.querySelector('.navbar nav');
        if (!nav) return;

        const session  = Auth.isLoggedIn() ? Auth.getSession() : null;
        
        let linksHtml = `
            <a href="${prefix}index.html">Home</a>
            <a href="${prefix}games.html">Games</a>
            <a href="${prefix}stories.html">Stories</a>
            <a href="${prefix}devlog.html">DevLog</a>
            <a href="${prefix}players.html">Players</a>
            <a href="${prefix}tournament.html">Tournaments</a>
            <a href="${prefix}leaderboard.html">Leaderboard</a>
            <a href="${prefix}contact.html">Contact</a>
            <a href="${prefix}about.html">About</a>
        `;

        let authHtml = '';
        let authHtmlMobile = '';
        if (session) {
            authHtml = `
                <a href="${prefix}chat.html" class="nav-chat-link" title="Chat" style="display:inline-flex;align-items:center;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                </a>
                <a href="${prefix}profile.html" class="nav-profile" title="Your Profile" style="display:inline-flex;align-items:center;gap:6px;">
                    <span class="nav-emoji">${session.emoji || '👁️'}</span>
                    <span class="nav-username">${session.firstName}</span>
                </a>
                <a href="#" id="nav-logout" class="nav-logout-btn">Logout</a>`;
            authHtmlMobile = authHtml.replace('id="nav-logout"', 'id="nav-logout-mobile"');
        } else {
            authHtml = `
                <a href="${prefix}signup.html">Sign Up</a>
                <a href="${prefix}login.html">Login</a>`;
            authHtmlMobile = authHtml;
        }

        // Build Desktop Nav Content
        nav.innerHTML = linksHtml + `<div id="nav-auth" style="display:inline-flex;align-items:center;gap:15px;margin-left:30px;">${authHtml}</div>`;

        // Build Mobile Drawer overlay
        let drawer = document.querySelector('.mobile-menu-drawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.className = 'mobile-menu-drawer';
            document.body.appendChild(drawer);
        }
        drawer.innerHTML = linksHtml + `<div id="nav-auth">${authHtmlMobile}</div>`;

        // Mobile Nav Toggle Button setup
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            let toggleBtn = navbar.querySelector('.mobile-nav-toggle');
            if (!toggleBtn) {
                toggleBtn = document.createElement('button');
                toggleBtn.className = 'mobile-nav-toggle';
                toggleBtn.setAttribute('aria-label', 'Toggle navigation');
                toggleBtn.innerHTML = '☰';
                navbar.appendChild(toggleBtn);
            }
            
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                drawer.classList.toggle('open');
                toggleBtn.innerHTML = drawer.classList.contains('open') ? '✕' : '☰';
            };
        }

        // Close mobile drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (drawer && drawer.classList.contains('open')) {
                const toggleBtn = document.querySelector('.mobile-nav-toggle');
                const isClickInside = drawer.contains(e.target) || (toggleBtn && toggleBtn.contains(e.target));
                if (!isClickInside) {
                    drawer.classList.remove('open');
                    if (toggleBtn) toggleBtn.innerHTML = '☰';
                }
            }
        });

        // Setup logout handlers
        const handleLogout = (e) => {
            e.preventDefault();
            Auth.logout();
            window.location.href = prefix + 'index.html';
        };

        const logoutBtn = document.getElementById('nav-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        const logoutBtnMobile = document.getElementById('nav-logout-mobile');
        if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);

        // Highlight active page
        const currentPage = path.split('/').pop() || 'index.html';
        document.querySelectorAll('.navbar nav a, .mobile-menu-drawer a').forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref && (linkHref.endsWith(currentPage) || (currentPage === 'index.html' && linkHref.endsWith('/')))) {
                link.classList.add('active');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildNav);
    } else {
        buildNav();
    }
})();
