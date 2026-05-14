// ═══════════════════════════════════════════════════
// PulmoCare — Competition-Grade Interactive Website
// Zero Three.js / Zero GSAP — Pure JS + CSS + Canvas
// ═══════════════════════════════════════════════════

// ── SCROLL REVEAL ──────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── STAT COUNTERS ──────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const decimal = parseInt(el.dataset.decimal || '0');
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * ease).toFixed(decimal);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
const heroObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { animateCounters(); heroObs.disconnect(); }
}, { threshold: 0.3 });
const heroEl = document.getElementById('hero');
if (heroEl) heroObs.observe(heroEl);

// ── NAV SCROLL EFFECT ──────────────────────────────
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  if (nav) nav.style.background = window.scrollY > 50
    ? 'rgba(6,9,15,.92)' : 'rgba(6,9,15,.7)';
});

// ── SMOOTH SCROLL FOR NAV LINKS ────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── DEVICE OLED ANIMATION (Solution Section) ───────
const oledCanvas = document.getElementById('oled-canvas');
if (oledCanvas) {
  const ctx = oledCanvas.getContext('2d');
  const W = oledCanvas.width, H = oledCanvas.height;
  function drawOLED(t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Scanlines
    ctx.strokeStyle = 'rgba(0,212,170,0.03)';
    for (let y = 0; y < H; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // Status text
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00d4aa';
    ctx.textAlign = 'center';
    ctx.fillText('PULMOCARE v1.0', W/2, 18);
    // Waveform
    ctx.beginPath(); ctx.strokeStyle = '#00d4aa'; ctx.lineWidth = 1.5;
    for (let x = 0; x < W; x++) {
      const y = H/2 + Math.sin(x * 0.08 + t * 2) * 12 + Math.sin(x * 0.03 + t) * 6;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Bottom text
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0,212,170,0.5)';
    ctx.fillText('ALL SYSTEMS NORMAL', W/2, H - 8);
    requestAnimationFrame(() => drawOLED(performance.now() / 1000));
  }
  drawOLED(0);
}

// ═══════════════════════════════════════════════════
// ⭐ INTERACTIVE DEMO — THE COMPETITION WINNER ⭐
// ═══════════════════════════════════════════════════

const BEATS = [
  {
    time: '2:00 AM', label: 'Normal', state: 'normal',
    color: '#00d4aa', statusColor: '#22c55e',
    status: 'ALL SYSTEMS NORMAL',
    desc: 'Rajan sleeps peacefully. PulmoCare monitors continuously. All vitals within safe range.',
    spo2: 97, co2: 38, rr: 14, sputum: 10, sputumLabel: 'LOW',
    notif: null
  },
  {
    time: '2:11 AM', label: 'Detecting', state: 'amber',
    color: '#f5a623', statusColor: '#f5a623',
    status: 'ACOUSTIC: DETECTING RHONCHI',
    desc: 'MEMS sensor detects rhonchi signal. Mucus pooling in bronchial airways. ML classifier confidence rising.',
    spo2: 96, co2: 41, rr: 16, sputum: 45, sputumLabel: 'MODERATE',
    notif: { type: 'warn', title: '⚠️ Sputum Buildup Detected', body: 'Airways sound congested. Try airway clearance — sit upright, slow deep breath, huff coughing.', time: '2:11 AM' }
  },
  {
    time: '2:14 AM', label: 'Layer 0', state: 'amber',
    color: '#f5a623', statusColor: '#eab308',
    status: 'LAYER 0 FIRED — PATIENT ALERT',
    desc: 'Sputum alert sent to device. Earliest possible intervention — before any CO₂ has risen significantly.',
    spo2: 95, co2: 44, rr: 18, sputum: 62, sputumLabel: 'HIGH',
    notif: { type: 'warn', title: '🔔 Airway Clearance Needed', body: 'Airways congested for 3+ minutes. Device buzzer activated. Please clear your airway now.', time: '2:14 AM' }
  },
  {
    time: '2:26 AM', label: 'Layer 1', state: 'amber',
    color: '#eab308', statusColor: '#eab308',
    status: 'CO₂ RISING — CAREGIVER NOTIFIED',
    desc: 'CO₂ 16% above baseline. Caregiver Priya receives push notification on her phone.',
    spo2: 93, co2: 52, rr: 22, sputum: 78, sputumLabel: 'CRITICAL',
    notif: { type: 'warn', title: '📱 Caregiver Alert Sent', body: 'Push notification sent to Priya: "CO₂ rising + airways congested. Contact medical provider now."', time: '2:26 AM' }
  },
  {
    time: '2:47 AM', label: 'Layer 2', state: 'red',
    color: '#e84040', statusColor: '#e84040',
    status: '!! CRITICAL — EMERGENCY SMS !!',
    desc: 'CO₂ at dangerous level. SMS sent to all caregivers. Continuous buzzer. Priya responds and intervenes.',
    spo2: 89, co2: 68, rr: 28, sputum: 95, sputumLabel: 'CRITICAL',
    notif: { type: 'danger', title: '🚨 CRITICAL — EMERGENCY SMS SENT', body: 'CO₂ at critical level. Do not leave patient unsupervised. SMS sent to all registered caregivers.', time: '2:47 AM' }
  },
  {
    time: '2:55 AM', label: 'Recovery', state: 'normal',
    color: '#00d4aa', statusColor: '#22c55e',
    status: 'RECOVERING — CRISIS AVERTED',
    desc: 'Airways clearing after intervention. CO₂ returning to baseline. No ambulance. No ICU. PulmoCare intervened before Rajan lost the ability to ask for help.',
    spo2: 96, co2: 40, rr: 15, sputum: 18, sputumLabel: 'LOW',
    notif: { type: '', title: '✅ Crisis Averted', body: 'Vitals returning to normal. Airway clearance successful. Device returns to monitoring mode.', time: '2:55 AM' }
  }
];

let currentBeat = 0;
let isPlaying = false;
let playTimer = null;
const co2History = [38];

// DOM refs
const demoTime = document.getElementById('demo-time');
const demoOled = document.getElementById('demo-oled');
const demoDot = document.getElementById('demo-device-dot');
const alertDot = document.getElementById('alert-dot');
const alertLabel = document.getElementById('alert-label');
const alertDesc = document.getElementById('alert-desc');
const alertCard = document.getElementById('alert-status-card');
const notifFeed = document.getElementById('notif-feed');
const playBtn = document.getElementById('demo-play-btn');
const playIcon = document.getElementById('play-icon');
const timelineProgress = document.getElementById('timeline-progress');
const co2Graph = document.getElementById('co2-graph');

// Build timeline beat markers
const timelineEl = document.getElementById('demo-timeline');
const beatLabelsEl = document.getElementById('beat-labels');
if (timelineEl && beatLabelsEl) {
  BEATS.forEach((b, i) => {
    const pct = (i / (BEATS.length - 1)) * 100;
    const marker = document.createElement('div');
    marker.className = 'beat-marker';
    marker.style.left = `calc(${pct}% - 6px)`;
    marker.title = b.time;
    marker.addEventListener('click', () => jumpToBeat(i));
    timelineEl.appendChild(marker);

    const label = document.createElement('span');
    label.textContent = b.time;
    label.style.flex = '1';
    label.style.textAlign = i === 0 ? 'left' : i === BEATS.length - 1 ? 'right' : 'center';
    beatLabelsEl.appendChild(label);
  });
}

function updateBeatMarkers() {
  document.querySelectorAll('.beat-marker').forEach((m, i) => {
    m.classList.toggle('active', i <= currentBeat);
  });
}

function setVital(id, value, fillId, fillPct, color) {
  const el = document.getElementById(id);
  const fill = document.getElementById(fillId);
  if (el) el.textContent = value;
  if (fill) {
    fill.style.width = fillPct + '%';
    if (color) fill.style.background = color;
  }
}

function addNotification(notif) {
  if (!notif || !notifFeed) return;
  // Clear placeholder
  const ph = notifFeed.querySelector('.notif-placeholder');
  if (ph) ph.remove();

  const div = document.createElement('div');
  div.className = `notif-item ${notif.type}`;
  div.innerHTML = `<div class="notif-title">${notif.title}</div>
    <div class="notif-body">${notif.body}</div>
    <div class="notif-time">${notif.time}</div>`;
  notifFeed.prepend(div);
}

function applyBeat(index) {
  const b = BEATS[index];
  currentBeat = index;

  // Time
  if (demoTime) demoTime.textContent = b.time;

  // Alert card
  if (alertLabel) { alertLabel.textContent = b.status; alertLabel.style.color = b.statusColor; }
  if (alertDesc) alertDesc.textContent = b.desc;
  if (alertDot) { alertDot.style.background = b.statusColor; alertDot.style.boxShadow = `0 0 12px ${b.statusColor}`; }
  if (alertCard) {
    alertCard.style.borderColor = b.statusColor + '22';
    alertCard.style.background = b.statusColor + '08';
  }

  // Device dot
  if (demoDot) { demoDot.style.background = b.statusColor; demoDot.style.boxShadow = `0 0 8px ${b.statusColor}`; }

  // Vitals
  const co2Color = b.co2 > 55 ? '#e84040' : b.co2 > 45 ? '#f5a623' : '#00d4aa';
  const spo2Color = b.spo2 < 92 ? '#e84040' : b.spo2 < 95 ? '#f5a623' : '#00d4aa';
  setVital('v-spo2', b.spo2 + '%', 'vf-spo2', b.spo2, spo2Color);
  setVital('v-co2', b.co2 + ' mmHg', 'vf-co2', Math.min(b.co2, 100), co2Color);
  setVital('v-rr', b.rr + ' /min', 'vf-rr', Math.min(b.rr * 2.5, 100), b.rr > 24 ? '#e84040' : b.rr > 20 ? '#f5a623' : '#00d4aa');
  setVital('v-sputum', b.sputumLabel, 'vf-sputum', b.sputum, b.sputum > 60 ? '#e84040' : b.sputum > 30 ? '#f5a623' : '#00d4aa');

  // Vital card borders
  const cards = ['vital-spo2', 'vital-co2', 'vital-rr', 'vital-sputum'];
  const vals = [spo2Color, co2Color, b.rr > 24 ? '#e84040' : '#00d4aa', b.sputum > 60 ? '#e84040' : '#00d4aa'];
  cards.forEach((cid, ci) => {
    const cel = document.getElementById(cid);
    if (cel) cel.style.borderColor = vals[ci] + '33';
  });

  // Vital value colors
  const vEls = ['v-spo2', 'v-co2', 'v-rr', 'v-sputum'];
  [spo2Color, co2Color, b.rr > 24 ? '#e84040' : '#00d4aa', b.sputum > 60 ? '#e84040' : '#00d4aa'].forEach((c, i) => {
    const ve = document.getElementById(vEls[i]);
    if (ve) ve.style.color = c;
  });

  // CO2 history
  co2History.push(b.co2);
  if (co2History.length > 30) co2History.shift();
  drawCO2Graph();

  // Timeline
  const pct = (index / (BEATS.length - 1)) * 100;
  if (timelineProgress) timelineProgress.style.width = pct + '%';
  updateBeatMarkers();

  // Notification
  if (b.notif) addNotification(b.notif);

  // Demo OLED
  drawDemoOLED(b);
}

function drawCO2Graph() {
  if (!co2Graph) return;
  const ctx = co2Graph.getContext('2d');
  const W = co2Graph.width, H = co2Graph.height;
  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  [35, 45, 55, 65].forEach(v => {
    const y = H - ((v - 30) / 50) * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillText(v.toString(), 4, y - 3);
  });

  // Danger zone
  const dangerY = H - ((55 - 30) / 50) * H;
  ctx.fillStyle = 'rgba(232,64,64,0.06)';
  ctx.fillRect(0, 0, W, dangerY);

  // Line
  if (co2History.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = '#00d4aa';
  ctx.lineWidth = 2;
  co2History.forEach((v, i) => {
    const x = (i / (co2History.length - 1)) * W;
    const y = H - ((v - 30) / 50) * H;
    const c = v > 55 ? '#e84040' : v > 45 ? '#f5a623' : '#00d4aa';
    if (i === 0) { ctx.moveTo(x, y); }
    else {
      ctx.strokeStyle = c;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = c;
      ctx.moveTo(x, y);
    }
  });

  // Current point
  const last = co2History[co2History.length - 1];
  const lx = W;
  const ly = H - ((last - 30) / 50) * H;
  const lc = last > 55 ? '#e84040' : last > 45 ? '#f5a623' : '#00d4aa';
  ctx.fillStyle = lc;
  ctx.beginPath();
  ctx.arc(lx - 2, ly, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawDemoOLED(beat) {
  if (!demoOled) return;
  const ctx = demoOled.getContext('2d');
  const W = demoOled.width, H = demoOled.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  ctx.strokeStyle = beat.color + '08';
  for (let y = 0; y < H; y += 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.textAlign = 'center';
  ctx.fillStyle = beat.color;

  if (beat.state === 'normal') {
    ctx.font = '600 14px "JetBrains Mono"';
    ctx.fillText('PULMOCARE', W / 2, 28);
    ctx.font = '500 11px "JetBrains Mono"';
    ctx.fillStyle = beat.color + 'aa';
    ctx.fillText(beat.time, W / 2, 48);
    ctx.font = '600 12px "JetBrains Mono"';
    ctx.fillStyle = beat.statusColor;
    ctx.fillText('● NORMAL', W / 2, 70);
    // Waveform
    ctx.beginPath(); ctx.strokeStyle = beat.color + '55'; ctx.lineWidth = 1;
    const t = performance.now() / 1000;
    for (let x = 20; x < W - 20; x++) {
      const y = 85 + Math.sin(x * 0.06 + t * 2) * 5;
      x === 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (beat.state === 'amber') {
    ctx.font = '700 13px "JetBrains Mono"';
    ctx.fillText('⚠ ALERT', W / 2, 26);
    ctx.font = '500 10px "JetBrains Mono"';
    ctx.fillText(beat.time, W / 2, 42);
    ctx.font = '600 11px "JetBrains Mono"';
    ctx.fillStyle = '#eab308';
    ctx.fillText('SPUTUM DETECTED', W / 2, 60);
    ctx.font = '500 10px "JetBrains Mono"';
    ctx.fillStyle = '#f5a623aa';
    ctx.fillText('CO₂: ' + beat.co2 + ' mmHg', W / 2, 78);
    ctx.fillText('CHECK AIRWAY', W / 2, 93);
  } else {
    // Critical - flashing
    const flash = Math.sin(performance.now() / 200) > 0;
    ctx.font = '700 14px "JetBrains Mono"';
    ctx.fillStyle = flash ? '#e84040' : '#e8404066';
    ctx.fillText('!! CRITICAL !!', W / 2, 28);
    ctx.font = '700 18px "JetBrains Mono"';
    ctx.fillStyle = '#e84040';
    ctx.fillText('CO₂: ' + beat.co2, W / 2, 55);
    ctx.font = '500 10px "JetBrains Mono"';
    ctx.fillStyle = '#e84040aa';
    ctx.fillText('EMERGENCY SMS SENT', W / 2, 75);
    ctx.fillText('DO NOT LEAVE PATIENT', W / 2, 90);
  }
}

// Continuously redraw OLED for animation
let oledFrame;
function oledLoop() {
  if (BEATS[currentBeat]) drawDemoOLED(BEATS[currentBeat]);
  oledFrame = requestAnimationFrame(oledLoop);
}

function jumpToBeat(index) {
  applyBeat(index);
}

function startPlayback() {
  if (isPlaying) return;
  isPlaying = true;
  if (playIcon) playIcon.textContent = '⏸';
  if (playBtn) playBtn.childNodes[1].textContent = ' Pause';

  // Reset if at end
  if (currentBeat >= BEATS.length - 1) {
    currentBeat = -1;
    co2History.length = 0;
    co2History.push(38);
    if (notifFeed) notifFeed.innerHTML = '<div class="notif-placeholder">Notifications will appear here during the simulation…</div>';
  }

  function nextBeat() {
    if (!isPlaying) return;
    const next = currentBeat + 1;
    if (next >= BEATS.length) {
      stopPlayback();
      return;
    }
    applyBeat(next);
    playTimer = setTimeout(nextBeat, 3000);
  }
  nextBeat();
}

function stopPlayback() {
  isPlaying = false;
  if (playTimer) clearTimeout(playTimer);
  if (playIcon) playIcon.textContent = '▶';
  if (playBtn) playBtn.childNodes[1].textContent = ' Play Simulation';
}

if (playBtn) {
  playBtn.addEventListener('click', () => {
    isPlaying ? stopPlayback() : startPlayback();
  });
}

// Initialize demo
applyBeat(0);
drawCO2Graph();
oledLoop();

// Auto-play when demo section scrolls into view
const demoSection = document.getElementById('demo');
if (demoSection) {
  const demoObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isPlaying && currentBeat === 0) {
      setTimeout(startPlayback, 800);
    }
  }, { threshold: 0.4 });
  demoObs.observe(demoSection);
}
