// ============================================================
//  WORLD OF BLACKLIGHT — SIGNUP (v2 — uses backend API)
// ============================================================

const signupForm    = document.getElementById('signupForm');
const firstName     = document.getElementById('firstName');
const lastName      = document.getElementById('lastName');
const age           = document.getElementById('age');
const email         = document.getElementById('email');
const password      = document.getElementById('password');
const confirmPwd    = document.getElementById('confirmPassword');
const selectedEmoji = document.getElementById('selectedEmoji');
const emojiError    = document.getElementById('emojiError');
const emailMessage  = document.getElementById('emailMessage');
const strengthFill  = document.getElementById('strengthFill');
const confirmError  = document.getElementById('confirmError');
const successMsg    = document.getElementById('successMessage');

// ── Password Visibility Toggles ────────────────────────────────────
const togglePassword = document.getElementById('togglePassword');
const toggleConfirm  = document.getElementById('toggleConfirm');

togglePassword && togglePassword.addEventListener('click', () => {
    const v = password.type === 'text';
    password.type = v ? 'password' : 'text';
    togglePassword.textContent = v ? '🙈' : '👁️';
});

toggleConfirm && toggleConfirm.addEventListener('click', () => {
    const v = confirmPwd.type === 'text';
    confirmPwd.type = v ? 'password' : 'text';
    toggleConfirm.textContent = v ? '🙈' : '👁️';
});

// ── Emoji Picker ──────────────────────────────────────────────────
document.querySelectorAll('.emoji-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedEmoji.value = btn.dataset.emoji;
        if (emojiError) emojiError.textContent = '';
    });
});

// ── Field helpers ─────────────────────────────────────────────────
function showError(input, message) {
    const err = input.closest('.input-group')?.querySelector('.error');
    if (err) err.textContent = message;
    input.classList.add('invalid');
    input.classList.remove('valid');
}
function clearError(input) {
    const err = input.closest('.input-group')?.querySelector('.error');
    if (err) err.textContent = '';
    input.classList.remove('invalid');
    input.classList.add('valid');
}

// ── Email live validation ─────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
email && email.addEventListener('input', () => {
    const val = email.value.trim();
    if (!val) { emailMessage.textContent = ''; email.classList.remove('valid','invalid'); return; }
    if (emailRegex.test(val)) {
        emailMessage.textContent = '✓ Valid Email';
        emailMessage.className   = 'valid';
        email.classList.add('valid'); email.classList.remove('invalid');
    } else {
        emailMessage.textContent = '✗ Invalid Email Format';
        emailMessage.className   = 'invalid-msg';
        email.classList.add('invalid'); email.classList.remove('valid');
    }
});

// ── Password strength ─────────────────────────────────────────────
function calcStrength(pwd) {
    let s = 0;
    if (pwd.length >= 8)          s++;
    if (/[A-Z]/.test(pwd))        s++;
    if (/[a-z]/.test(pwd))        s++;
    if (/[0-9]/.test(pwd))        s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
}
const strengthColors = ['','#dc3030','#e07030','#d4b800','#50c878','#9F73FF'];
const strengthWidths = ['0%','20%','40%','60%','80%','100%'];

const checklist  = document.getElementById('pwdChecklist');
const chkLength  = document.getElementById('chk-length');
const chkUpper   = document.getElementById('chk-upper');
const chkLower   = document.getElementById('chk-lower');
const chkNumber  = document.getElementById('chk-number');
const chkSpecial = document.getElementById('chk-special');

function updateChecklist(val) {
    [[chkLength, val.length >= 8],[chkUpper,/[A-Z]/.test(val)],[chkLower,/[a-z]/.test(val)],
     [chkNumber,/[0-9]/.test(val)],[chkSpecial,/[^A-Za-z0-9]/.test(val)]]
    .forEach(([el,pass]) => el && el.classList.toggle('met', pass));
}

password && password.addEventListener('input', () => {
    const val = password.value, score = calcStrength(val);
    checklist && checklist.classList.toggle('visible', val.length > 0);
    updateChecklist(val);
    if (strengthFill) {
        strengthFill.style.width      = val.length ? strengthWidths[score] : '0%';
        strengthFill.style.background = strengthColors[score];
    }
    if (confirmPwd.value.length > 0) validateConfirm();
});

function validateConfirm() {
    if (confirmPwd.value !== password.value) {
        if (confirmError) confirmError.textContent = '✗ Passwords do not match';
        confirmPwd.classList.add('invalid'); confirmPwd.classList.remove('valid');
        return false;
    }
    if (confirmError) confirmError.textContent = '';
    confirmPwd.classList.remove('invalid'); confirmPwd.classList.add('valid');
    return true;
}
confirmPwd && confirmPwd.addEventListener('input', validateConfirm);

// ── Form submission ───────────────────────────────────────────────
signupForm && signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (successMsg) successMsg.textContent = '';

    let valid = true;
    if (!firstName.value.trim()) { showError(firstName,'✗ First name is required'); valid=false; } else clearError(firstName);
    if (!lastName.value.trim())  { showError(lastName, '✗ Last name is required');  valid=false; } else clearError(lastName);

    const ageVal = parseInt(age.value, 10);
    if (!age.value.trim() || isNaN(ageVal))    { showError(age,'✗ Age is required');        valid=false; }
    else if (ageVal < 13 || ageVal > 120)      { showError(age,'✗ Valid age (13–120)');     valid=false; }
    else clearError(age);

    if (!email.value.trim()) {
        emailMessage.textContent='✗ Email is required'; emailMessage.className='invalid-msg';
        email.classList.add('invalid'); valid=false;
    } else if (!emailRegex.test(email.value.trim())) {
        emailMessage.textContent='✗ Invalid Email Format'; emailMessage.className='invalid-msg';
        email.classList.add('invalid'); valid=false;
    }

    if (calcStrength(password.value) < 5) { password.classList.add('invalid'); valid=false; }
    else { password.classList.remove('invalid'); password.classList.add('valid'); }

    if (!validateConfirm()) valid=false;
    if (!selectedEmoji.value) { if(emojiError) emojiError.textContent='✗ Choose a profile icon'; valid=false; }

    if (!valid) return;

    // Build username from first+last name
    const username = (firstName.value.trim() + lastName.value.trim())
                     .toLowerCase().replace(/\s+/g,'').substring(0, 20);

    if (successMsg) { successMsg.textContent='Creating account…'; successMsg.style.color='#888'; }

    try {
        const user = await Auth.registerAPI({
            username,
            email:    email.value.trim(),
            password: password.value,
            emoji:    selectedEmoji.value
        });
        if (successMsg) {
            successMsg.textContent = `✓ Welcome, ${user.username}. Entering the dark...`;
            successMsg.style.color = '#50c878';
        }
        setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } catch (err) {
        // If backend is down, show friendly error
        if (successMsg) {
            successMsg.textContent = '✗ ' + err.message;
            successMsg.style.color = '#dc5050';
        }
    }
});
