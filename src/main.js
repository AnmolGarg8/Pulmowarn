import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- CONSTANTS & DATA ---
const COLORS = {
    bg: 0x07101E,
    accent: 0x00C896,
    warning: 0xF59E0B,
    critical: 0xEF4444,
    safe: 0x22C55E,
    text: 0xF1F5F9,
    secondary: 0x94A3B8
};

const BEATS = [
  {
    time: '2:00 AM',
    title: 'Baseline — all stable',
    status: 'NORMAL',
    statusColor: '#22C55E',
    deviceState: 'normal',
    co2: 42,
    description: 'Rajan is asleep. PulmoCare monitors continuously. CO₂ at personal baseline of 42 mmHg. Airways completely clear.',
    notification: null,
    co2Points: [42, 42, 42, 41, 42]
  },
  {
    time: '2:11 AM',
    title: 'Mucus accumulating — rhonchi detected',
    status: 'ACOUSTIC DETECTING',
    statusColor: '#F59E0B',
    deviceState: 'detecting',
    co2: 43,
    description: 'The MEMS microphone detects turbulent low-frequency sound in the 100–300 Hz range. Mucus is pooling in the bronchial airways. Classifier confidence score: rising.',
    notification: null,
    co2Points: [42, 42, 42, 41, 42, 43, 43]
  },
  {
    time: '2:14 AM',
    title: 'Layer 0 alert fires',
    status: 'SPUTUM ALERT',
    statusColor: '#F59E0B',
    deviceState: 'amber',
    co2: 44,
    description: '3 consecutive minutes of confirmed rhonchi signal. Layer 0 fires — earliest possible intervention. CO₂ has not yet risen above baseline.',
    notification: {
      app: 'PulmoCare',
      title: 'Airways sound congested.',
      body: 'Try airway clearance now — sit upright, slow deep breath, huff coughing.',
      color: '#F59E0B'
    },
    co2Points: [42, 42, 42, 41, 42, 43, 43, 44, 44]
  },
  {
    time: '2:26 AM',
    title: 'CO₂ rising — Layer 1',
    status: 'CO₂ RISING',
    statusColor: '#EAB308',
    deviceState: 'yellow',
    co2: 50,
    description: 'Rajan did not respond to the Layer 0 alert. Blockage remains. CO₂ now 16% above personal baseline and sustained for 10+ minutes. Caregiver Priya notified via push notification.',
    notification: {
      app: 'PulmoCare',
      title: 'Airways congested + CO₂ rising.',
      body: 'Airway clearance has not resolved the problem. Contact your medical provider now.',
      color: '#EAB308'
    },
    co2Points: [42,42,42,41,42,43,43,44,44,45,46,48,50,50]
  },
  {
    time: '2:47 AM',
    title: 'Critical — Layer 2',
    status: '!! CRITICAL !!',
    statusColor: '#EF4444',
    deviceState: 'red',
    co2: 60,
    description: 'CO₂ now 30% above baseline. Layer 2 fires. Continuous buzzer active. Urgent SMS sent to ALL registered caregivers. Priya enters the room immediately.',
    notification: {
      app: 'PulmoCare — URGENT',
      title: 'CRITICAL ALERT',
      body: 'CO₂ at critical level. Immediate medical evaluation required. Do not leave patient.',
      color: '#EF4444'
    },
    co2Points: [42,42,42,41,42,43,43,44,44,45,46,48,50,50,52,55,58,60]
  },
  {
    time: '2:55 AM',
    title: 'Recovering — crisis averted',
    status: 'RECOVERING',
    statusColor: '#22C55E',
    deviceState: 'normal',
    co2: 44,
    description: 'Priya helps Rajan sit upright and perform chest physiotherapy. Airways clearing. CO₂ returning to baseline. Device transitions back to green. No ambulance. No hospital.',
    notification: {
      app: 'PulmoCare',
      title: 'Patient recovering.',
      body: 'CO₂ returning to baseline. Airways clearing. Continue monitoring.',
      color: '#22C55E'
    },
    co2Points: [42,42,42,41,42,43,43,44,44,45,46,48,50,50,52,55,58,60,56,52,47,44]
  }
];

let selectedBeat = 0;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHeroTypewriter();
    initImpactCounters();
    initThreeJS();
    initStickyScroll();
    initDemoSimulation();
    initRevealAnimations();
    initParticles('hero-particles');
    initParticles('cta-particles');
});

// --- PARTICLES (LUNG BREATHING) ---
function initParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    const count = 100;

    const resize = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.life = Math.random() * 0.5 + 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Breathing effect: move toward/away from center
            const dx = this.x - canvas.width / 2;
            const dy = this.y - canvas.height / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = Math.sin(Date.now() * 0.001) * 0.01;
            
            this.x += (dx / dist) * force;
            this.y += (dy / dist) * force;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.fillStyle = `rgba(0, 200, 150, ${this.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    };
    animate();
}

// --- NAVIGATION ---
function initNavigation() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Active link highlighting
  const navSections = [
    { id: 'problem-section',  link: 'Problem'  },
    { id: 'solution-section', link: 'Solution' },
    { id: 'demo-section',     link: 'Demo'     },
    { id: 'research-section', link: 'Research' },
    { id: 'team-section',     link: 'Team'     },
  ];

  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = Array.from(document.querySelectorAll('.nav-link')).find(l => 
          l.textContent.trim() === navSections.find(s => s.id === entry.target.id)?.link
        );
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  navSections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });

  // Smooth scroll for nav links
  document.querySelectorAll('.nav-link, #nav-cta').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Add top padding to body for fixed nav
  document.body.style.paddingTop = '64px';
}

// --- HERO TYPEWRITER ---
function initHeroTypewriter() {
    const text = "What if a wearable patch could save your father's life at 2 AM — before anyone knew something was wrong?";
    const container = document.getElementById('hero-typewriter');
    
    if (!container) return;
    const words = text.split(' ');
    container.innerHTML = words.map(word => `<span style="opacity: 0; display: inline-block;">${word}&nbsp;</span>`).join('');
    
    gsap.to('#hero-typewriter span', {
        opacity: 1,
        duration: 0.1,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
            trigger: '#hero',
            start: "top center"
        }
    });
}

// --- IMPACT COUNTERS ---
function initImpactCounters() {
  const stripEl = document.getElementById('impact-strip');
  if (!stripEl) return;

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(animateCounters, 600);
        heroObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });

  heroObserver.observe(stripEl);
}

function animateCounters() {
  const counters = document.querySelectorAll('.impact-number');
  
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const prefix = counter.dataset.prefix || '';
    const suffix = counter.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();
    
    // Special case formatting based on clinical targets
    function formatValue(n, tgt) {
      if (tgt === 18000) return '$' + n.toLocaleString();
      if (tgt === 380)   return n + 'M';
      if (tgt === 0)     return '0';
      if (tgt === 44)    return n + 'min';
      return String(n);
    }
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for medical precision feel
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      
      counter.textContent = formatValue(current, target);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = formatValue(target, target);
      }
    }
    
    requestAnimationFrame(update);
  });
}

// --- THREE.JS DEVICE RENDER ---
function initThreeJS() {
    const createDevice = (canvasId) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(window.devicePixelRatio);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
        camera.position.z = 6;

        // Premium Device Body (Brushed Metallic)
        const geometry = new THREE.BoxGeometry(2.8, 1.6, 0.6);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x777777,
            roughness: 0.4,
            metalness: 0.8,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        const device = new THREE.Mesh(geometry, material);
        scene.add(device);

        // Medical-Grade Screen (OLED style)
        const screenGeo = new THREE.PlaneGeometry(2.2, 1.2);
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            emissive: 0x00C896,
            emissiveIntensity: 0.05,
            roughness: 0.1,
            metalness: 0.2
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.301;
        device.add(screen);

        // Screen Inner Glow
        const innerGlow = new THREE.PointLight(0x00C896, 1, 3);
        innerGlow.position.set(0, 0, 0.4);
        device.add(innerGlow);

        // Lighting System
        const mainLight = new THREE.DirectionalLight(0xffffff, 5);
        mainLight.position.set(5, 5, 10);
        scene.add(mainLight);

        // Top/Bottom High-Intensity Lights
        const topLight = new THREE.PointLight(0xffffff, 3);
        topLight.position.set(0, 10, 0);
        scene.add(topLight);

        const bottomLight = new THREE.PointLight(0x00C896, 2);
        bottomLight.position.set(0, -10, 0);
        scene.add(bottomLight);

        // Camera Positioning
        camera.position.z = 5;
        camera.position.y = 0.5;
        camera.lookAt(0, 0, 0);

        // Animation
        let targetRotationX = -0.2; // Initial tilt
        let targetRotationY = 0.5;  // Initial angle

        const animate = () => {
            requestAnimationFrame(animate);
            device.position.y = Math.sin(Date.now() * 0.001) * 0.1;
            device.rotation.x += (targetRotationX - device.rotation.x) * 0.05;
            device.rotation.y += (targetRotationY - device.rotation.y) * 0.05;
            if (Math.abs(targetRotationY) < 0.01) {
                device.rotation.y += 0.005;
            }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;
            targetRotationY = x * 0.8;
            targetRotationX = y * 0.4;
        });

        window.addEventListener('resize', () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        });
    };

    createDevice('device-canvas-hero');
    createDevice('solution-device-canvas');
}

// --- STICKY SCROLL & OLED ---
function initStickyScroll() {
    ScrollTrigger.create({
        trigger: "#block-b",
        start: "top center",
        onEnter: () => updateSolutionOLED('warning', 'RHONCHI DETECTED'),
        onLeaveBack: () => updateSolutionOLED('safe', 'SYSTEM NORMAL')
    });

    ScrollTrigger.create({
        trigger: "#block-c",
        start: "top center",
        onEnter: () => updateSolutionOLED('warning', 'CO2 TREND RISING'),
        onLeaveBack: () => updateSolutionOLED('warning', 'RHONCHI DETECTED')
    });
}

function updateSolutionOLED(state, text) {
    const dot = document.getElementById('oled-dot');
    const label = document.getElementById('oled-text');
    if (!dot || !label) return;
    
    if (state === 'safe') {
        dot.style.background = 'var(--safe)';
        label.innerText = text;
    } else if (state === 'warning') {
        dot.style.background = 'var(--warning)';
        label.innerText = text;
    } else {
        dot.style.background = 'var(--critical)';
        label.innerText = text;
    }
}

// --- INTERACTIVE PROTOTYPE SIMULATION ---

const DEMO_BEATS = [
  {
    time: '2:00 AM',
    title: 'All readings stable',
    status: 'NORMAL',
    statusColor: '#22C55E',
    oledState: 'normal',
    co2: 42,
    desc: 'Rajan is asleep. PulmoCare monitors continuously at his personal CO₂ baseline of 42 mmHg. No acoustic signal detected. Airways completely clear.',
    notif: null,
    graphPoints: [42,42,41,42,42]
  },
  {
    time: '2:11 AM',
    title: 'Rhonchi signal detected',
    status: 'ACOUSTIC DETECTING',
    statusColor: '#F59E0B',
    oledState: 'detecting',
    co2: 43,
    desc: 'The MEMS microphone detects turbulent low-frequency sound (100–300 Hz range). Mucus is pooling in bronchial airways. Acoustic classifier confidence rising.',
    notif: null,
    graphPoints: [42,42,41,42,42,43,43,43]
  },
  {
    time: '2:14 AM',
    title: 'Layer 0 — Sputum alert fires',
    status: 'SPUTUM ALERT',
    statusColor: '#F59E0B',
    oledState: 'amber',
    co2: 44,
    desc: '3 consecutive minutes of confirmed rhonchi signal. Layer 0 fires — the EARLIEST possible intervention. CO₂ has NOT yet risen. Patient prompted to clear airway.',
    notif: {
      title: 'Airways sound congested.',
      body: 'Try airway clearance now — sit upright and perform huff coughing.',
      color: '#F59E0B',
      icon: '🫁'
    },
    graphPoints: [42,42,41,42,42,43,43,43,44,44]
  },
  {
    time: '2:26 AM',
    title: 'Layer 1 — CO₂ rising',
    status: 'CO₂ RISING',
    statusColor: '#EAB308',
    oledState: 'yellow',
    co2: 50,
    desc: 'Patient did not respond to Layer 0. Blockage continues. CO₂ now 16% above personal baseline, sustained for 10+ minutes. Caregiver Priya notified via push notification.',
    notif: {
      title: 'Airways congested + CO₂ rising.',
      body: 'Contact your medical provider now. Airway clearance has not resolved the problem.',
      color: '#EAB308',
      icon: '⚠️'
    },
    graphPoints: [42,42,41,42,42,43,43,43,44,44, 45,46,47,48,50,50]
  },
  {
    time: '2:47 AM',
    title: 'Layer 2 — Critical alert',
    status: '!! CRITICAL !!',
    statusColor: '#EF4444',
    oledState: 'red',
    co2: 60,
    desc: 'CO₂ 30% above baseline. Layer 2 fires. Continuous buzzer active. Urgent SMS sent to ALL registered caregivers. Priya enters the room immediately.',
    notif: {
      title: 'URGENT — CRITICAL ALERT',
      body: 'CO₂ at critical level. Do not leave patient unsupervised. Call for help immediately.',
      color: '#EF4444',
      icon: '🆘'
    },
    graphPoints: [42,42,41,42,42,43,43,43,44,44, 45,46,47,48,50,50,52,54,57,60]
  },
  {
    time: '2:55 AM',
    title: 'Recovering — crisis averted',
    status: 'RECOVERING',
    statusColor: '#22C55E',
    oledState: 'normal',
    co2: 44,
    desc: 'Priya performs chest physiotherapy. Airways clearing. CO₂ returning to baseline. Device transitions back to green. No ambulance. No ICU. No hospital visit.',
    notif: {
      title: 'Patient recovering.',
      body: 'CO₂ returning to baseline. Airways clearing. Continue monitoring.',
      color: '#22C55E',
      icon: '✅'
    },
    graphPoints: [42,42,41,42,42,43,43,43,44,44, 45,46,47,48,50,50,52,54,57,60, 56,52,49,46,44]
  }
];

let demoBeat = 0;
let demoAnimT = 0;
let demoAnimFrame = null;

function initDemoSimulation() {
  buildDemoTimeline();
  updateDemoSimulation();
  demoAnimate();
  setupDemoObserver();
}

function buildDemoTimeline() {
  const container = document.getElementById('demo-timeline');
  if (!container) return;
  container.innerHTML = '';
  
  DEMO_BEATS.forEach((beat, i) => {
    const isActive = i === demoBeat;
    const div = document.createElement('div');
    div.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid ${isActive ? beat.statusColor + '33' : 'rgba(255,255,255,0.05)'};
      background: ${isActive ? beat.statusColor + '0D' : 'rgba(255,255,255,0.02)'};
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    div.innerHTML = `
      <div style="width:10px;height:10px;border-radius:50%;background:${beat.statusColor};flex-shrink:0;box-shadow:${isActive ? '0 0 8px ' + beat.statusColor : 'none'};"></div>
      <div style="flex:1">
        <div style="font-family:monospace;font-size:11px;color:${beat.statusColor};margin-bottom:2px;">${beat.time}</div>
        <div style="font-family:'Inter',sans-serif;font-size:13px;color:${isActive ? '#F1F5F9' : '#64748B'};">${beat.title}</div>
      </div>
      <div style="font-family:monospace;font-size:9px;padding:3px 7px;border-radius:4px;border:1px solid ${beat.statusColor}33;color:${beat.statusColor};white-space:nowrap;">${beat.status}</div>
    `;
    
    div.addEventListener('click', () => {
      demoBeat = i;
      updateDemoSimulation();
      buildDemoTimeline();
    });
    
    container.appendChild(div);
  });
}

function updateStatusCard(beat) {
  const badge = document.getElementById('demo-status-badge');
  const desc  = document.getElementById('demo-status-desc');
  const card  = document.getElementById('demo-status-card');
  
  if (badge) {
    badge.textContent = beat.status;
    badge.style.color = beat.statusColor;
  }
  if (desc)  desc.textContent = beat.desc;
  if (card)  card.style.borderColor = beat.statusColor + '22';
}

function drawDemoDevice(t) {
  const canvas = document.getElementById('demo-device-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const beat = DEMO_BEATS[demoBeat];
  
  ctx.fillStyle = '#08101E';
  ctx.fillRect(0, 0, W, H);
  
  ctx.fillStyle = '#EDEDEB';
  demoRoundRect(ctx, 30, 20, W-60, H-40, 14);
  ctx.fill();
  
  ctx.strokeStyle = '#00C896';
  ctx.lineWidth = 2.5;
  demoRoundRect(ctx, 30, 20, W-60, H-40, 14);
  ctx.stroke();
  
  ctx.fillStyle = '#060D18';
  demoRoundRect(ctx, 55, 38, W-110, H-76, 7);
  ctx.fill();
  
  demoDrawOLED(ctx, 55, 38, W-110, H-76, beat, t);
}

function demoDrawOLED(ctx, x, y, w, h, beat, t) {
  const cx = x + w/2, cy = y + h/2;
  
  for (let sy = y+1; sy < y+h; sy += 3) {
    ctx.fillStyle = 'rgba(0,200,150,0.018)';
    ctx.fillRect(x, sy, w, 1);
  }
  
  if (beat.oledState === 'normal' || beat.oledState === 'detecting') {
    const pulse = 0.55 + Math.sin(t * 1.8) * 0.45;
    const dotR  = 14 + pulse * 5;
    const g = ctx.createRadialGradient(x+22, cy, 0, x+22, cy, dotR+8);
    g.addColorStop(0, `rgba(34,197,94,${pulse * 0.9})`);
    g.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x+22, cy, dotR+8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgba(34,197,94,${0.7 + pulse*0.3})`;
    ctx.beginPath(); ctx.arc(x+22, cy, dotR, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(beat.oledState === 'normal' ? 'NORMAL' : 'DETECTING', x+44, cy - 10);
    ctx.font = '10px monospace'; ctx.fillStyle = '#166534';
    ctx.fillText('CO2: ' + beat.co2 + ' mmHg', x+44, cy+6);
    ctx.fillText(beat.oledState === 'normal' ? 'AIRWAYS: CLEAR' : 'PATTERN FOUND', x+44, cy+20);
  } else if (beat.oledState === 'amber' || beat.oledState === 'yellow') {
    const col = beat.oledState === 'amber' ? '#F59E0B' : '#EAB308';
    const blink = Math.sin(t * 4.2) > 0;
    ctx.fillStyle = blink ? col : '#78420A';
    ctx.beginPath(); ctx.arc(x+20, cy, 13, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText(beat.status, x+42, cy-10);
    ctx.font = '9px monospace'; ctx.fillStyle = '#92600A';
    ctx.fillText('CO2: ' + beat.co2 + ' mmHg', x+42, cy+5);
    ctx.fillText('CLEAR AIRWAY', x+42, cy+19);
  } else if (beat.oledState === 'red') {
    const blink = Math.sin(t * 6.5) > 0;
    if (blink) { ctx.fillStyle = 'rgba(239,68,68,0.14)'; ctx.fillRect(x, y, w, h); }
    ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('!! CRITICAL !!', cx, cy - 14);
    ctx.font = '10px monospace'; ctx.fillStyle = blink ? '#FCA5A5' : '#DC2626';
    ctx.fillText('CO2: ' + beat.co2 + ' mmHg', cx, cy + 4);
    ctx.fillText('CALL FOR HELP', cx, cy + 19);
    ctx.textAlign = 'left';
  }
}

function drawDemoPhone() {
  const canvas = document.getElementById('demo-phone-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const beat = DEMO_BEATS[demoBeat];
  
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0A1220';
  demoRoundRect(ctx, 0, 0, W, H, 10);
  ctx.fill();
  
  if (!beat.notif) {
    ctx.fillStyle = '#334155'; ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No notifications', W/2, H/2 + 4); ctx.textAlign = 'left';
    return;
  }
  
  const n = beat.notif;
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = n.color + '30';
  demoRoundRect(ctx, 10, 8, W-20, H-16, 8); ctx.fill(); ctx.stroke();
  ctx.font = '14px sans-serif'; ctx.fillText(n.icon, 18, 30);
  ctx.fillStyle = n.color; ctx.font = 'bold 10px monospace'; ctx.fillText('PulmoCare', 38, 30);
  ctx.fillStyle = '#475569'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(beat.time, W-14, 30); ctx.textAlign = 'left';
  ctx.fillStyle = '#F1F5F9'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.fillText(n.title, 18, 50);
  ctx.fillStyle = '#64748B'; ctx.font = '10px Inter, sans-serif';
  wrapText(ctx, n.body, W-36).forEach((line, i) => ctx.fillText(line, 18, 66 + i*13));
}

function drawDemoCO2() {
  const canvas = document.getElementById('demo-co2-graph');
  if (!canvas) return;
  const W = canvas.width, H = canvas.height;
  canvas.width = W;
  const ctx = canvas.getContext('2d');
  const P = { t:12, r:12, b:24, l:36 }, gW = W-P.l-P.r, gH = H-P.t-P.b;
  const minV = 36, maxV = 68;
  const toX = i => P.l + (i / 24) * gW;
  const toY = v => P.t + gH - ((v-minV)/(maxV-minV))*gH;
  
  ctx.fillStyle = 'rgba(239,68,68,0.06)'; ctx.fillRect(P.l, toY(55), gW, toY(maxV)-toY(55));
  ctx.fillStyle = 'rgba(245,158,11,0.06)'; ctx.fillRect(P.l, toY(50), gW, toY(55)-toY(50));
  
  [[42,'#22C55E','baseline'],[50,'#EAB308','L1'],[55,'#EF4444','L2']].forEach(([v, col, lbl]) => {
    ctx.strokeStyle = col + '50'; ctx.setLineDash([3,5]); ctx.beginPath();
    ctx.moveTo(P.l, toY(v)); ctx.lineTo(P.l+gW, toY(v)); ctx.stroke();
    ctx.fillStyle = col + '80'; ctx.font = '8px monospace'; ctx.fillText(lbl, P.l+gW-18, toY(v)-3);
  });
  ctx.setLineDash([]);
  
  const allPts = [];
  for (let b = 0; b <= demoBeat; b++) DEMO_BEATS[b].graphPoints.forEach(v => allPts.push(v));
  
  for (let i = 1; i < allPts.length; i++) {
    const v = allPts[i];
    ctx.strokeStyle = v >= 55 ? '#EF4444' : v >= 50 ? '#EAB308' : v >= 46 ? '#F59E0B' : '#22C55E';
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(toX(i-1), toY(allPts[i-1])); ctx.lineTo(toX(i), toY(allPts[i])); ctx.stroke();
  }
  
  const last = allPts[allPts.length-1], lx = toX(allPts.length-1), ly = toY(last);
  ctx.fillStyle = DEMO_BEATS[demoBeat].statusColor; ctx.beginPath(); ctx.arc(lx, ly, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.font = 'bold 9px monospace'; ctx.fillText(last + ' mmHg', lx-30, ly-7);
}

function demoRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
}

function updateDemoSimulation() {
  const beat = DEMO_BEATS[demoBeat];
  updateStatusCard(beat);
  drawDemoPhone();
  drawDemoCO2();
}

function demoAnimate() {
  demoAnimT += 0.04;
  drawDemoDevice(demoAnimT);
  demoAnimFrame = requestAnimationFrame(demoAnimate);
}

let autoPlayInterval = null;
function setupDemoObserver() {
  const demoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!autoPlayInterval) {
          autoPlayInterval = setInterval(() => {
            demoBeat = (demoBeat + 1) % DEMO_BEATS.length;
            updateDemoSimulation();
            buildDemoTimeline();
          }, 3000);
        }
      } else {
        if (autoPlayInterval) { clearInterval(autoPlayInterval); autoPlayInterval = null; }
      }
    });
  }, { threshold: 0.3 });
  const demoSection = document.getElementById('demo-section');
  if (demoSection) demoObserver.observe(demoSection);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' '), lines = []; let current = '';
  words.forEach(word => {
    const test = current + word + ' ';
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current.trim()); current = word + ' '; } else current = test;
  });
  if (current) lines.push(current.trim()); return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
}

let animT = 0;
function animateDemo() { requestAnimationFrame(animateDemo); animT += 0.05; updateDeviceCanvas(BEATS[selectedBeat], animT); }

// --- REVEAL ANIMATIONS ---
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('section > .container > div, .glass-card');
    revealElements.forEach(el => {
        gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%"
            }
        });
    });

    gsap.from('.chain-item', {
        scale: 0.8,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        scrollTrigger: {
            trigger: '.chain-sequence',
            start: "top 70%"
        }
    });
}
