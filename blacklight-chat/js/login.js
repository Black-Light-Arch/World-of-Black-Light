// ============================================================
//  WORLD OF BLACKLIGHT — LOGIN (v2 — uses backend API)
// ============================================================

const loginForm = document.getElementById('loginForm');
const loginMsg  = document.getElementById('loginMessage');
const toggleBtn = document.getElementById('togglePassword');
const loginPwd  = document.getElementById('loginPassword');

// Support both email field (original) and username field (new)
// The form has id="loginEmail" but we accept username or email
const loginEmailEl = document.getElementById('loginEmail');

let passwordVisible = false;
toggleBtn && toggleBtn.addEventListener('click', () => {
    passwordVisible = !passwordVisible;
    loginPwd.type         = passwordVisible ? 'text' : 'password';
    toggleBtn.textContent = passwordVisible ? '👁️' : '🙈';
});

function showFieldError(input, msg) {
    const err = input.closest('.input-group')?.querySelector('.error');
    if (err) err.textContent = msg;
    input.classList.add('invalid');
    input.classList.remove('valid');
}
function clearFieldError(input) {
    const err = input.closest('.input-group')?.querySelector('.error');
    if (err) err.textContent = '';
    input.classList.remove('invalid');
}

loginEmailEl && loginEmailEl.addEventListener('input', () => clearFieldError(loginEmailEl));
loginPwd     && loginPwd.addEventListener('input',     () => clearFieldError(loginPwd));

loginForm && loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMsg.textContent = '';

    const identifier = loginEmailEl.value.trim();
    const password   = loginPwd.value;

    let valid = true;
    if (!identifier) { showFieldError(loginEmailEl, '✗ Username or email required'); valid = false; }
    else clearFieldError(loginEmailEl);
    if (!password)   { showFieldError(loginPwd,      '✗ Password is required');      valid = false; }
    else clearFieldError(loginPwd);
    if (!valid) return;

    loginMsg.textContent = 'Authenticating…';
    loginMsg.style.color = '#888';

    try {
        const user = await Auth.loginAPI(identifier, password);
        loginMsg.textContent = `✓ Welcome back, ${user.username}. Entering the dark...`;
        loginMsg.style.color = '#50c878';
        loginMsg.style.textShadow = '0 0 20px rgba(80,200,120,0.5)';
        setTimeout(() => { window.location.href = 'index.html'; }, 1400);
    } catch (err) {
        loginMsg.textContent = '✗ ' + err.message;
        loginMsg.style.color = '#dc5050';
        loginMsg.style.textShadow = '0 0 10px rgba(220,80,80,0.4)';
    }
});
