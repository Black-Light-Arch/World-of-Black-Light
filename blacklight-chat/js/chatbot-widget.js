// ============================================================
//  WORLD OF BLACKLIGHT — FLOATING CHATBOT WIDGET
//  Features: AI chat + "Talk to Support" (connect to admin)
//  Include this script on every page after auth.js
//  <script src="js/chatbot-widget.js"></script>
// ============================================================

(function () {

    const SERVER = window.BL_SERVER || window.location.origin;

    // Don't show on the full chat page
    if (window.location.pathname.includes('chat.html')) return;

    // ── Inject styles ─────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
    #bl-chatbot-btn-wrap {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9998;
    }
    #bl-chatbot-btn {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #0d0d0d;
        border: 1.5px solid #9F73FF55;
        box-shadow: 0 0 18px #9F73FF33, 0 4px 16px #00000088;
        cursor: pointer;
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
        animation: blPulse 3s ease-in-out infinite;
        outline: none;
    }
    #bl-chatbot-btn:hover {
        border-color: #9F73FF;
        box-shadow: 0 0 28px #9F73FF66, 0 4px 20px #00000099;
        transform: scale(1.07);
    }
    @keyframes blPulse {
        0%,100% { box-shadow: 0 0 14px #9F73FF22, 0 4px 14px #00000066; }
        50%      { box-shadow: 0 0 26px #9F73FF55, 0 4px 18px #00000099; }
    }
    #bl-chatbot-panel {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 350px;
        height: 500px;
        background: #080808;
        border: 1px solid #1e1e1e;
        border-radius: 16px;
        box-shadow: 0 8px 40px #00000099, 0 0 30px #9F73FF11;
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: 'Crimson Text', Georgia, serif;
        animation: blSlideUp 0.22s ease;
    }
    @keyframes blSlideUp {
        from { opacity:0; transform: translateY(16px) scale(0.97); }
        to   { opacity:1; transform: translateY(0)  scale(1);      }
    }
    #bl-chatbot-panel.open { display: flex; }

    /* ── Header ── */
    .bl-chat-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px 0;
        background: #060606;
        flex-shrink: 0;
    }
    .bl-chat-header-icon {
        width: 32px; height: 32px; border-radius: 50%;
        background: #1a0a2e;
        border: 1px solid #9F73FF44;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.95rem; flex-shrink: 0;
        transition: background 0.3s, border-color 0.3s;
    }
    .bl-chat-header-icon.support-mode {
        background: #0a1a2e;
        border-color: #4488ff44;
    }
    .bl-chat-header-text { flex: 1; }
    .bl-chat-header-name {
        font-family: 'Cinzel', serif;
        font-size: 0.78rem; letter-spacing: 2px; color: #c8b8ff;
        transition: color 0.3s;
    }
    .bl-chat-header-name.support-mode { color: #88bbff; }
    .bl-chat-header-sub { font-size: 0.68rem; color: #444; margin-top: 1px; }
    .bl-chat-header-actions { display: flex; gap: 6px; }
    .bl-hdr-btn {
        background: none; border: none; color: #555;
        cursor: pointer; font-size: 0.85rem; padding: 2px 4px;
        transition: color 0.2s;
    }
    .bl-hdr-btn:hover { color: #9F73FF; }

    /* ── Mode Tabs ── */
    .bl-mode-tabs {
        display: flex;
        gap: 0;
        margin: 10px 16px 0;
        background: #111;
        border-radius: 8px;
        padding: 3px;
        flex-shrink: 0;
    }
    .bl-mode-tab {
        flex: 1;
        padding: 6px 8px;
        border: none;
        background: transparent;
        color: #555;
        font-family: 'Cinzel', serif;
        font-size: 0.68rem;
        letter-spacing: 1px;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }
    .bl-mode-tab.active {
        background: #1a0a2e;
        color: #9F73FF;
        box-shadow: 0 0 10px #9F73FF22;
    }
    .bl-mode-tab.active.support {
        background: #0a1520;
        color: #5599ff;
        box-shadow: 0 0 10px #4488ff22;
    }
    .bl-mode-tab:not(.active):hover { color: #888; }

    /* ── Messages ── */
    .bl-chat-msgs {
        flex: 1; overflow-y: auto; padding: 12px 14px;
        display: flex; flex-direction: column; gap: 10px;
    }
    .bl-chat-msgs::-webkit-scrollbar { width: 2px; }
    .bl-chat-msgs::-webkit-scrollbar-thumb { background: #1e1e1e; }
    .bl-msg { display: flex; gap: 8px; max-width: 90%; }
    .bl-msg.user  { align-self: flex-end;  flex-direction: row-reverse; }
    .bl-msg.bot   { align-self: flex-start; }
    .bl-msg.system { align-self: center; max-width: 100%; }
    .bl-msg-avatar {
        width: 26px; height: 26px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.8rem; flex-shrink: 0; background: #111;
        border: 1px solid #222;
    }
    .bl-msg-bubble {
        padding: 8px 11px; border-radius: 10px;
        font-size: 0.87rem; line-height: 1.55;
    }
    .bl-msg.bot  .bl-msg-bubble {
        background: #0d0a20; border: 1px solid #9F73FF33;
        color: #c8b8ff; border-bottom-left-radius: 3px;
    }
    .bl-msg.user .bl-msg-bubble {
        background: #1e1336; border: 1px solid #9F73FF44;
        color: #e0d4ff; border-bottom-right-radius: 3px;
    }
    .bl-msg.system .bl-msg-bubble {
        background: #0a1a0a; border: 1px solid #44aa4433;
        color: #6aaa6a; font-size: 0.78rem;
        text-align: center; border-radius: 8px; font-style: italic;
    }
    .bl-msg.support-bot .bl-msg-bubble {
        background: #0a1020; border: 1px solid #4488ff33;
        color: #88bbff; border-bottom-left-radius: 3px;
    }

    /* ── Typing ── */
    .bl-typing {
        display: flex; gap: 4px; align-items: center; padding: 4px 2px;
    }
    .bl-typing span {
        width: 5px; height: 5px; background: #9F73FF66;
        border-radius: 50%; animation: blTyping 1.2s infinite;
    }
    .bl-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bl-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blTyping {
        0%,80%,100% { opacity:0.2; transform:scale(0.8); }
        40%          { opacity:1;   transform:scale(1);   }
    }

    /* ── Footer / Input ── */
    .bl-chat-footer {
        padding: 10px 12px;
        border-top: 1px solid #1a1a1a;
        background: #060606;
        display: flex; gap: 8px;
        flex-shrink: 0;
    }
    .bl-chat-input {
        flex: 1; background: #0f0f0f; border: 1px solid #222;
        border-radius: 16px; padding: 8px 13px;
        color: #eee; font-family: 'Crimson Text', serif;
        font-size: 0.88rem; outline: none; resize: none;
        max-height: 80px; transition: border-color 0.2s;
    }
    .bl-chat-input:focus { border-color: #9F73FF44; }
    .bl-chat-input.support-mode:focus { border-color: #4488ff44; }
    .bl-chat-input::placeholder { color: #2e2e2e; }
    .bl-send-btn {
        width: 34px; height: 34px; border-radius: 50%;
        background: #9F73FF; border: none; color: #fff;
        font-size: 0.9rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; align-self: flex-end;
        transition: background 0.2s, transform 0.1s;
    }
    .bl-send-btn:hover  { background: #7a50dd; }
    .bl-send-btn:active { transform: scale(0.93); }
    .bl-send-btn.support-mode { background: #2255bb; }
    .bl-send-btn.support-mode:hover { background: #3366dd; }

    /* ── Support CTA ── */
    .bl-support-cta {
        padding: 12px 14px;
        background: #060606;
        border-top: 1px solid #1a1a1a;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .bl-support-cta-title {
        font-family: 'Cinzel', serif;
        font-size: 0.72rem;
        letter-spacing: 1px;
        color: #5599ff;
        text-align: center;
    }
    .bl-support-open-btn {
        width: 100%;
        padding: 9px;
        background: linear-gradient(135deg, #1a2a4a, #0d1a30);
        border: 1px solid #4488ff44;
        border-radius: 8px;
        color: #88bbff;
        font-family: 'Cinzel', serif;
        font-size: 0.72rem;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    .bl-support-open-btn:hover {
        background: linear-gradient(135deg, #223355, #112244);
        border-color: #4488ff88;
        color: #aaccff;
        transform: translateY(-1px);
        box-shadow: 0 4px 16px #4488ff22;
    }

    /* ── Banner ── */
    .bl-chat-banner {
        padding: 7px 14px;
        background: #040404;
        border-top: 1px solid #111;
        font-size: 0.68rem; color: #444;
        text-align: center; flex-shrink: 0;
    }
    .bl-chat-banner a { color: #9F73FF66; text-decoration: none; }
    .bl-chat-banner a:hover { color: #9F73FF; }

    /* ── Unread badge ── */
    #bl-unread-badge {
        position: absolute;
        top: -5px; right: -5px;
        width: 20px; height: 20px;
        background: #9F73FF;
        border-radius: 50%;
        font-size: 0.62rem; color: #fff;
        display: none; align-items: center; justify-content: center;
        font-family: monospace; z-index: 1;
        border: 2px solid #0d0d0d;
    }
    `;
    document.head.appendChild(style);

    // ── Inject HTML ───────────────────────────────────────────────
    const wrap = document.createElement('div');
    wrap.id = 'bl-chatbot-btn-wrap';
    wrap.innerHTML = `
        <div id="bl-unread-badge"></div>
        <button id="bl-chatbot-btn" title="BlackLight Chat" aria-label="Open chat">👁</button>
    `;
    document.body.appendChild(wrap);

    const panel = document.createElement('div');
    panel.id = 'bl-chatbot-panel';
    panel.innerHTML = `
        <div class="bl-chat-header">
            <div class="bl-chat-header-icon" id="bl-header-icon">🤖</div>
            <div class="bl-chat-header-text">
                <div class="bl-chat-header-name" id="bl-header-name">BLACKLIGHT AI</div>
                <div class="bl-chat-header-sub" id="bl-header-sub">Studio assistant</div>
            </div>
            <div class="bl-chat-header-actions">
                <button class="bl-hdr-btn" id="bl-goto-chat" title="Open full chat">⛶</button>
                <button class="bl-hdr-btn" id="bl-close-btn" title="Close">✕</button>
            </div>
        </div>

        <div class="bl-mode-tabs">
            <button class="bl-mode-tab active" id="bl-tab-ai" data-mode="ai">🤖 AI</button>
            <button class="bl-mode-tab" id="bl-tab-support" data-mode="support">💬 Support</button>
        </div>

        <div class="bl-chat-msgs" id="bl-msgs"></div>

        <!-- AI Mode Footer -->
        <div class="bl-chat-footer" id="bl-ai-footer">
            <textarea class="bl-chat-input" id="bl-input" placeholder="Ask about BlackLight…" rows="1"></textarea>
            <button class="bl-send-btn" id="bl-send">➤</button>
        </div>

        <!-- Support Mode Footer -->
        <div class="bl-support-cta" id="bl-support-footer" style="display:none;">
            <div class="bl-support-cta-title">💬 CONNECT WITH OUR TEAM</div>
            <button class="bl-support-open-btn" id="bl-open-support">
                <span>🔗</span> Open Private Chat with Admin
            </button>
        </div>

        <div class="bl-chat-banner">
            Full messaging → <a href="chat.html">Open Chat</a>
        </div>
    `;
    document.body.appendChild(panel);

    // ── State ─────────────────────────────────────────────────────
    let isOpen    = false;
    let isTyping  = false;
    let aiHistory = [];
    let unread    = 0;
    let currentMode = 'ai';  // 'ai' | 'support'

    // Support mode message history (local only — for context display)
    const supportMessages = [];

    const btn        = document.getElementById('bl-chatbot-btn');
    const msgs       = document.getElementById('bl-msgs');
    const input      = document.getElementById('bl-input');
    const sendBtn    = document.getElementById('bl-send');
    const badge      = document.getElementById('bl-unread-badge');
    const tabAI      = document.getElementById('bl-tab-ai');
    const tabSupport = document.getElementById('bl-tab-support');
    const aiFoot     = document.getElementById('bl-ai-footer');
    const supFoot    = document.getElementById('bl-support-footer');
    const headerIcon = document.getElementById('bl-header-icon');
    const headerName = document.getElementById('bl-header-name');
    const headerSub  = document.getElementById('bl-header-sub');

    // ── Toggle panel ──────────────────────────────────────────────
    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        btn.textContent = isOpen ? '✕' : '👁';
        if (isOpen) {
            unread = 0;
            badge.style.display = 'none';
            if (currentMode === 'ai') {
                input.focus();
                if (msgs.children.length === 0) addBotMsg(getGreeting());
            } else {
                if (msgs.children.length === 0) showSupportWelcome();
            }
        }
    });

    document.getElementById('bl-close-btn').addEventListener('click', () => {
        isOpen = false;
        panel.classList.remove('open');
        btn.textContent = '👁';
    });

    document.getElementById('bl-goto-chat').addEventListener('click', () => {
        window.location.href = 'chat.html';
    });

    // ── Mode switching ────────────────────────────────────────────
    tabAI.addEventListener('click', () => switchMode('ai'));
    tabSupport.addEventListener('click', () => switchMode('support'));

    function switchMode(mode) {
        currentMode = mode;
        msgs.innerHTML = '';

        if (mode === 'ai') {
            tabAI.classList.add('active');
            tabAI.classList.remove('support');
            tabSupport.classList.remove('active');
            aiFoot.style.display = 'flex';
            supFoot.style.display = 'none';
            headerIcon.textContent = '🤖';
            headerIcon.classList.remove('support-mode');
            headerName.textContent = 'BLACKLIGHT AI';
            headerName.classList.remove('support-mode');
            headerSub.textContent = 'Studio assistant';
            input.placeholder = 'Ask about BlackLight…';
            input.classList.remove('support-mode');
            sendBtn.classList.remove('support-mode');
            if (aiHistory.length > 0) {
                // Re-render AI history
                aiHistory.forEach(h => {
                    if (h.role === 'user') addUserMsg(h.content, true);
                    else addBotMsg(h.content, false, true);
                });
            } else {
                addBotMsg(getGreeting());
            }
        } else {
            tabSupport.classList.add('active', 'support');
            tabAI.classList.remove('active');
            aiFoot.style.display = 'none';
            supFoot.style.display = 'flex';
            headerIcon.textContent = '🎧';
            headerIcon.classList.add('support-mode');
            headerName.textContent = 'LIVE SUPPORT';
            headerName.classList.add('support-mode');
            headerSub.textContent = 'Connect with our team';
            showSupportWelcome();
        }
    }

    function showSupportWelcome() {
        msgs.innerHTML = '';
        // System message
        const sysRow = document.createElement('div');
        sysRow.className = 'bl-msg system';
        sysRow.innerHTML = `<div class="bl-msg-bubble">🔒 Secure channel</div>`;
        msgs.appendChild(sysRow);

        // Support welcome
        const row = document.createElement('div');
        row.className = 'bl-msg bot';
        row.innerHTML = `
            <div class="bl-msg-avatar">🎧</div>
            <div class="bl-msg-bubble" style="background:#0a1020;border:1px solid #4488ff33;color:#88bbff;border-bottom-left-radius:3px;">
                Need help from a real person? Click the button below to open a private conversation with our admin team. They'll be notified and respond as soon as possible.
            </div>`;
        msgs.appendChild(row);
        msgs.scrollTop = msgs.scrollHeight;
    }

    // ── Open support chat ─────────────────────────────────────────
    document.getElementById('bl-open-support').addEventListener('click', () => {
        // Check if logged in
        const token = localStorage.getItem('bl_jwt');
        const userData = localStorage.getItem('bl_user');

        if (!token || !userData) {
            // Not logged in — prompt them
            addSystemMsg('⚠ You need to sign in first to use live support.');
            const loginRow = document.createElement('div');
            loginRow.className = 'bl-msg system';
            loginRow.innerHTML = `<div class="bl-msg-bubble" style="color:#9F73FF99;">
                <a href="login.html" style="color:#9F73FF;text-decoration:none;">→ Sign in</a> &nbsp;|&nbsp;
                <a href="signup.html" style="color:#9F73FF;text-decoration:none;">→ Create account</a>
            </div>`;
            msgs.appendChild(loginRow);
            msgs.scrollTop = msgs.scrollHeight;
            return;
        }

        // Logged in — open private chat with admin
        addSystemMsg('✓ Connecting you to admin support…');
        setTimeout(() => {
            // Navigate to chat.html with a flag to auto-open support conversation
            window.location.href = 'chat.html?support=1';
        }, 800);
    });

    // ── AI Send message ───────────────────────────────────────────
    sendBtn.addEventListener('click', sendMsg);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });

    async function sendMsg() {
        const text = input.value.trim();
        if (!text || isTyping) return;
        input.value = '';
        input.style.height = 'auto';
        addUserMsg(text);
        aiHistory.push({ role: 'user', content: text });

        isTyping = true;
        const typingEl = addTypingIndicator();

        try {
            const res  = await fetch(`${SERVER}/api/ai/chat`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ message: text, history: aiHistory.slice(-8) })
            });
            const data = await res.json();
            typingEl.remove();
            const reply = data.reply || 'The darkness offers no answer…';
            aiHistory.push({ role: 'assistant', content: reply });
            addBotMsg(reply);
            if (!isOpen) showUnread();
        } catch {
            typingEl.remove();
            addBotMsg('The signal was lost. Please try again.');
        } finally {
            isTyping = false;
        }
    }

    // ── Message builders ─────────────────────────────────────────
    function addBotMsg(text, silent = false) {
        const row = document.createElement('div');
        row.className = 'bl-msg bot';
        row.innerHTML = `<div class="bl-msg-avatar">🤖</div><div class="bl-msg-bubble">${escHtml(text)}</div>`;
        msgs.appendChild(row);
        msgs.scrollTop = msgs.scrollHeight;
        if (!silent && !isOpen) showUnread();
    }

    function addUserMsg(text, silent = false) {
        const session = (typeof Auth !== 'undefined' && Auth.isLoggedIn()) ? Auth.getSession() : null;
        const emoji   = session?.emoji || '👤';
        const row     = document.createElement('div');
        row.className = 'bl-msg user';
        row.innerHTML = `<div class="bl-msg-avatar">${emoji}</div><div class="bl-msg-bubble">${escHtml(text)}</div>`;
        msgs.appendChild(row);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function addSystemMsg(text) {
        const row = document.createElement('div');
        row.className = 'bl-msg system';
        row.innerHTML = `<div class="bl-msg-bubble">${escHtml(text)}</div>`;
        msgs.appendChild(row);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function addTypingIndicator() {
        const row = document.createElement('div');
        row.className = 'bl-msg bot';
        row.innerHTML = `<div class="bl-msg-avatar">🤖</div><div class="bl-typing"><span></span><span></span><span></span></div>`;
        msgs.appendChild(row);
        msgs.scrollTop = msgs.scrollHeight;
        return row;
    }

    function showUnread() {
        unread++;
        badge.textContent   = unread;
        badge.style.display = 'flex';
    }

    function escHtml(t) {
        return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }

    function getGreeting() {
        const hour = new Date().getHours();
        const time = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        const session = (typeof Auth !== 'undefined' && Auth.isLoggedIn()) ? Auth.getSession() : null;
        const name    = session ? `, ${session.firstName || session.username}` : '';
        return `Good ${time}${name}. I am the BlackLight AI — your guide through the darkness. Ask me about our games, stories, the studio, or how to reach us.`;
    }

})();
