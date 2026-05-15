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
    initStatsCount();
    initThreeJS();
    initStickyScroll();
    initSimulation();
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
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
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

// --- STATS COUNTING ---
function initStatsCount() {
    const items = document.querySelectorAll('.impact-item h3');
    items.forEach(item => {
        const target = parseFloat(item.getAttribute('data-target'));
        
        gsap.to(item, {
            innerText: target,
            duration: 2,
            snap: { innerText: 1 },
            scrollTrigger: {
                trigger: item,
                start: "top 90%"
            }
        });
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

        // Premium Device Body (Metallic Finish)
        const geometry = new THREE.BoxGeometry(2.8, 1.6, 0.6);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x444444,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transmission: 0,
            thickness: 1
        });
        const device = new THREE.Mesh(geometry, material);
        scene.add(device);

        // Medical-Grade Screen
        const screenGeo = new THREE.PlaneGeometry(2.2, 1.2);
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0x0A0A0A,
            emissive: 0x00C896,
            emissiveIntensity: 0.2,
            roughness: 0.1,
            metalness: 0.5
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.31;
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

// --- INTERACTIVE SIMULATION (SECTION 4) ---
function initSimulation() {
  buildTimeline();
  updateSimulation(0);
  animateDemo();
}

function buildTimeline() {
  const container = document.getElementById('beat-timeline');
  if (!container) return;
  container.innerHTML = '';
  
  BEATS.forEach((beat, i) => {
    const item = document.createElement('div');
    item.className = 'beat-item' + (i === selectedBeat ? ' beat-active' : '');
    item.innerHTML = `
      <div class="beat-dot" style="background:${beat.statusColor}"></div>
      <div class="beat-content">
        <span class="beat-time">${beat.time}</span>
        <span class="beat-title">${beat.title}</span>
      </div>
      <div class="beat-status-pill" style="color:${beat.statusColor}; border-color:${beat.statusColor}44">
        ${beat.status}
      </div>
    `;
    item.addEventListener('click', () => {
      selectedBeat = i;
      updateSimulation(i);
      buildTimeline();
    });
    container.appendChild(item);
  });
}

function updateDeviceCanvas(beat, t) {
  const canvas = document.getElementById('device-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  
  ctx.fillStyle = '#0A0F1A';
  ctx.fillRect(0, 0, W, H);
  
  ctx.fillStyle = '#F0F0EE';
  roundRect(ctx, 20, 15, W-40, H-30, 12);
  ctx.fill();
  
  ctx.strokeStyle = '#00C896';
  ctx.lineWidth = 3;
  roundRect(ctx, 20, 15, W-40, H-30, 12);
  ctx.stroke();
  
  ctx.fillStyle = '#050A10';
  roundRect(ctx, 50, 35, W-100, H-70, 6);
  ctx.fill();
  
  drawOLEDContent(ctx, 50, 35, W-100, H-70, beat, t);
}

function drawOLEDContent(ctx, x, y, w, h, beat, t) {
  const cx = x + w/2, cy = y + h/2;
  for (let sy = y; sy < y+h; sy += 3) {
    ctx.fillStyle = 'rgba(0,200,150,0.02)';
    ctx.fillRect(x, sy, w, 1);
  }
  
  if (beat.deviceState === 'normal' || beat.deviceState === 'detecting') {
    const pulse = t ? 0.6 + Math.sin(t*2) * 0.4 : 1;
    const grad = ctx.createRadialGradient(x+30, cy, 0, x+30, cy, 18);
    grad.addColorStop(0, `rgba(34,197,94,${pulse})`);
    grad.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x+30, cy, 18, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(beat.deviceState === 'normal' ? 'NORMAL' : 'DETECTING', x+55, cy-8);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#166534';
    ctx.fillText(`CO₂: ${beat.co2} mmHg`, x+55, cy+8);
    ctx.fillText('AIRWAYS: ' + (beat.deviceState === 'normal' ? 'CLEAR' : 'PATTERN?'), x+55, cy+22);
  } else if (beat.deviceState === 'amber' || beat.deviceState === 'yellow') {
    const col = beat.deviceState === 'amber' ? '#F59E0B' : '#EAB308';
    const blink = t ? Math.sin(t*4) > 0 : true;
    ctx.fillStyle = blink ? col : '#7A5010';
    ctx.beginPath(); ctx.arc(x+28, cy, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(beat.status, x+52, cy-10);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#92611A';
    ctx.fillText(`CO₂: ${beat.co2} mmHg`, x+52, cy+6);
    ctx.fillText('TAKE ACTION', x+52, cy+20);
  } else if (beat.deviceState === 'red') {
    const blink = t ? Math.sin(t*6) > 0 : true;
    if (blink) { ctx.fillStyle = 'rgba(239,68,68,0.15)'; ctx.fillRect(x, y, w, h); }
    ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
    ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('!! CRITICAL !!', cx, cy-12);
    ctx.font = '10px monospace';
    ctx.fillStyle = blink ? '#FCA5A5' : '#EF4444';
    ctx.fillText(`CO₂: ${beat.co2} mmHg`, cx, cy+6);
    ctx.fillText('CALL EMERGENCY', cx, cy+22);
    ctx.textAlign = 'left';
  }
}

function updatePhoneCanvas(beat) {
  const canvas = document.getElementById('phone-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0F172A'; roundRect(ctx, 0, 0, W, H, 20); ctx.fill();
  ctx.fillStyle = '#1E293B'; roundRect(ctx, 6, 30, W-12, H-60, 14); ctx.fill();
  ctx.fillStyle = '#0F172A'; ctx.fillRect(6, 30, W-12, 24);
  ctx.fillStyle = '#64748B'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(beat.time, W-14, 46); ctx.textAlign = 'left';
  
  if (!beat.notification) {
    ctx.fillStyle = '#334155'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No alerts', W/2, H/2 - 10); ctx.fillText('Patient stable', W/2, H/2 + 10);
    ctx.fillStyle = '#00C896'; ctx.fillText('PulmoCare ●', W/2, H/2 + 35); ctx.textAlign = 'left';
    return;
  }
  
  const n = beat.notification;
  ctx.fillStyle = '#0F172A'; ctx.strokeStyle = n.color + '44'; ctx.lineWidth = 1;
  roundRect(ctx, 14, 62, W-28, 130, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(24, 80, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = n.color; ctx.font = 'bold 10px sans-serif'; ctx.fillText(n.app, 34, 84);
  ctx.fillStyle = '#F1F5F9'; ctx.font = 'bold 12px sans-serif';
  wrapText(ctx, n.title, W-36).forEach((line, i) => ctx.fillText(line, 18, 102 + i*16));
  ctx.fillStyle = '#94A3B8'; ctx.font = '10px sans-serif';
  wrapText(ctx, n.body, W-36).forEach((line, i) => ctx.fillText(line, 18, 130 + i*14));
}

function drawCO2Graph(beatIndex) {
  const canvas = document.getElementById('co2-graph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const PAD = { top:16, right:16, bottom:28, left:40 }, gW = W - PAD.left - PAD.right, gH = H - PAD.top - PAD.bottom, minY = 35, maxY = 70;
  
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  [35,42,50,60,70].forEach(v => {
    const y = PAD.top + gH - (v-minY)/(maxY-minY)*gH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + gW, y); ctx.stroke();
    ctx.fillStyle = '#475569'; ctx.font = '9px monospace'; ctx.fillText(v, 2, y+3);
  });
  
  const bY = PAD.top+gH-(42-minY)/(maxY-minY)*gH, aY = PAD.top+gH-(50-minY)/(maxY-minY)*gH, rY = PAD.top+gH-(55-minY)/(maxY-minY)*gH;
  ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(34,197,94,0.4)'; ctx.beginPath(); ctx.moveTo(PAD.left, bY); ctx.lineTo(PAD.left+gW, bY); ctx.stroke();
  ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.beginPath(); ctx.moveTo(PAD.left, aY); ctx.lineTo(PAD.left+gW, aY); ctx.stroke();
  ctx.strokeStyle = 'rgba(239,68,68,0.4)'; ctx.beginPath(); ctx.moveTo(PAD.left, rY); ctx.lineTo(PAD.left+gW, rY); ctx.stroke(); ctx.setLineDash([]);
  
  const points = []; for (let b = 0; b <= beatIndex; b++) BEATS[b].co2Points.forEach(v => points.push(v));
  if (points.length < 2) return;
  ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
  points.forEach((v, i) => {
    const x = PAD.left + (i/(points.length-1)) * gW, y = PAD.top + gH - (v-minY)/(maxY-minY)*gH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = BEATS[beatIndex].statusColor; ctx.stroke();
  const lastV = points[points.length-1], lastX = PAD.left + gW, lastY = PAD.top + gH - (lastV-minY)/(maxY-minY)*gH;
  ctx.fillStyle = BEATS[beatIndex].statusColor; ctx.beginPath(); ctx.arc(lastX, lastY, 5, 0, Math.PI*2); ctx.fill();
  ctx.font = 'bold 10px monospace'; ctx.fillText(lastV + ' mmHg', lastX - 50, lastY - 8);
  ctx.fillStyle = '#475569'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ['2:00','2:11','2:14','2:26','2:47','2:55'].forEach((l, i) => ctx.fillText(l, PAD.left + (i/5)*gW, H-4));
}

function updateSimulation(beatIndex) {
  const beat = BEATS[beatIndex];
  const outEl = document.getElementById('outcome-label');
  if (outEl) outEl.innerHTML = `<div style="color:${beat.statusColor};font-size:11px;font-weight:600;letter-spacing:0.12em;margin-bottom:8px">${beat.status}</div><p style="font-size:14px;line-height:1.7;color:#94A3B8">${beat.description}</p>`;
  updateDeviceCanvas(beat, null); updatePhoneCanvas(beat); drawCO2Graph(beatIndex);
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
