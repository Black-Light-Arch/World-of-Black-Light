// ============================================================
//  CONTACT PAGE JS — Form validation, DB save, Leaflet map
// ============================================================
const API = window.location.origin;

// ── FORM VALIDATION ──────────────────────────────────────────
const form    = document.getElementById('contactForm');
const nameI   = document.getElementById('cName');
const emailI  = document.getElementById('cEmail');
const subjectI= document.getElementById('cSubject');
const msgI    = document.getElementById('cMessage');
const charCount = document.getElementById('charCount');
const response  = document.getElementById('contactResponse');

// Character counter
msgI.addEventListener('input', () => {
  const len = msgI.value.length;
  charCount.textContent = len;
  if (len > 1000) {
    msgI.value = msgI.value.substring(0, 1000);
    charCount.textContent = 1000;
  }
});

function clearErrors() {
  ['cNameErr','cEmailErr','cSubjectErr','cMessageErr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function validateForm() {
  clearErrors();
  let valid = true;
  const name    = nameI.value.trim();
  const email   = emailI.value.trim();
  const subject = subjectI.value.trim();
  const message = msgI.value.trim();

  if (!name || name.length < 2) {
    document.getElementById('cNameErr').textContent = 'Name must be at least 2 characters.';
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('cEmailErr').textContent = 'Please enter a valid email address.';
    valid = false;
  }
  if (!subject || subject.length < 3) {
    document.getElementById('cSubjectErr').textContent = 'Subject must be at least 3 characters.';
    valid = false;
  }
  if (!message || message.length < 10) {
    document.getElementById('cMessageErr').textContent = 'Message must be at least 10 characters.';
    valid = false;
  }
  return valid;
}

// Real-time validation hints
[nameI, emailI, subjectI, msgI].forEach(input => {
  input.addEventListener('blur', validateForm);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const btn = document.getElementById('contactSubmitBtn');
  btn.textContent = '⏳ Sending...';
  btn.disabled = true;
  response.className = 'contact-response';
  response.style.display = 'none';

  try {
    const res = await fetch(`${API}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    nameI.value.trim(),
        email:   emailI.value.trim(),
        subject: subjectI.value.trim(),
        message: msgI.value.trim()
      })
    });
    const data = await res.json();

    if (!res.ok) {
      response.textContent = '❌ ' + (data.error || 'Failed to send message.');
      response.className   = 'contact-response error-resp';
    } else {
      response.textContent = '✅ Message sent! We\'ll get back to you shortly.';
      response.className   = 'contact-response success';
      form.reset();
      charCount.textContent = '0';
    }
  } catch {
    response.textContent = '❌ Server error. Please try again later.';
    response.className   = 'contact-response error-resp';
  } finally {
    btn.textContent = 'Send Message';
    btn.disabled    = false;
  }
});

// ── LEAFLET MAP ──────────────────────────────────────────────
// Karachi coordinates (BlackLight HQ fictional location)
const LAT = 24.8607;
const LNG = 67.0011;

const map = L.map('contactMap').setView([LAT, LNG], 13);

// Dark themed tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

// Custom marker
const customIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: linear-gradient(135deg, #5E17EB, #9F73FF);
    width: 36px; height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex; align-items: center; justify-content: center;
    border: 2px solid rgba(159,115,255,0.5);
    box-shadow: 0 0 15px rgba(94,23,235,0.6);
  "><span style="transform:rotate(45deg);font-size:16px;">👁️</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40]
});

L.marker([LAT, LNG], { icon: customIcon })
  .addTo(map)
  .bindPopup(`
    <div style="font-family:serif;color:#111;">
      <strong>BlackLight Studios</strong><br>
      Karachi, Pakistan<br>
      <small>support@blacklight.gg</small>
    </div>
  `)
  .openPopup();
