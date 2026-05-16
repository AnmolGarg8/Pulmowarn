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
    // initCounters(); // Replaced by initHeroCounters IIFE
    initThreeJS();
    initStickyScroll();
    // initDemoSection(); // Moved to self-contained script in index.html
    initRevealAnimations();
    initParticles('hero-particles');
    initParticles('cta-particles');
});

// Wait for complete DOM + scripts before demo init
// Demo logic and data moved to index.html to ensure reliability.
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

  // Scroll effect (background blur on scroll)
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // 1. Fixed IntersectionObserver for active link highlighting
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active from all links
        document.querySelectorAll('.nav-link')
          .forEach(l => l.classList.remove('active'));
        
        // Find matching link using href attribute
        const sectionId = entry.target.id;
        const matchingLink = document.querySelector(
          `.nav-link[href="#${sectionId}"]`
        );
        if (matchingLink) {
          matchingLink.classList.add('active');
        }
      }
    });
  }, { 
    threshold: 0.5,
    rootMargin: '-64px 0px 0px 0px'
  });

  // Observe ONLY content sections, NOT the hero
  const navTargets = [
    'problem-section', 'solution-section',
    'demo-section', 'research-section', 'team-section'
  ];
  navTargets.forEach(id => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });

  // 2. Universal Smooth Scroll (including Nav CTA)
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

  // 3. Scroll Progress Bar
  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    var bar = document.getElementById('scroll-progress-bar');
    if (bar) bar.style.width = Math.min(progress, 100) + '%';
  }, { passive: true });

  // Add top padding to body for fixed nav
  document.body.style.paddingTop = '64px';
}


// initCounters and runCounterAnimation replaced by initHeroCounters at bottom of file.

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

// Interactive demo functions removed. Logic is now in index.html for zero-dependency execution.



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

(function initHeroCounters() {
  // Hardcoded counter definitions — no data attributes needed
  const COUNTER_DEFS = [
    {
      selector: '.impact-number:nth-child(1)',
      target: 380,
      format: function(v) { return v + 'M'; }
    },
    {
      selector: '.impact-number:nth-child(2)', 
      target: 18000,
      format: function(v) { 
        return '$' + v.toLocaleString('en-US'); 
      }
    },
    {
      selector: '.impact-number:nth-child(3)',
      target: 0,
      format: function(v) { return '0'; }
    },
    {
      selector: '.impact-number:nth-child(4)',
      target: 44,
      format: function(v) { return v + ' min'; }
    }
  ];

  // Also try by index on all .impact-number elements
  function runCounters() {
    const allCounters = document.querySelectorAll(
      '.impact-number'
    );
    
    if (allCounters.length === 0) {
      console.warn('No .impact-number elements found');
      return;
    }

    const DURATION = 2000; // 2 seconds

    allCounters.forEach(function(el, index) {
      var def = COUNTER_DEFS[index];
      if (!def) return;
      
      var target = def.target;
      var format = def.format;
      
      // Show zero first
      el.textContent = format(0);
      
      if (target === 0) return; // stays at 0
      
      var startTime = null;
      
      function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var rawProgress = Math.min(elapsed / DURATION, 1);
        
        // Ease out cubic
        var progress = 1 - Math.pow(1 - rawProgress, 3);
        var current = Math.round(progress * target);
        
        el.textContent = format(current);
        
        if (rawProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = format(target);
        }
      }
      
      requestAnimationFrame(animate);
    });
  }

  // Method 1: IntersectionObserver
  var strip = document.getElementById('impact-strip');
  
  if (strip && 'IntersectionObserver' in window) {
    var hasRun = false;
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && !hasRun) {
        hasRun = true;
        setTimeout(runCounters, 150);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(strip);
  }
  
  // Method 2: Fallback timer — always runs after 1.2s
  setTimeout(function() {
    var allCounters = document.querySelectorAll(
      '.impact-number'
    );
    // Check if any still show zero
    var anyZero = false;
    allCounters.forEach(function(el) {
      if (el.textContent === '0M' || 
          el.textContent === '$0' || 
          el.textContent === '0min') {
        anyZero = true;
      }
    });
    if (anyZero) runCounters();
  }, 1200);
  
  // Method 3: On scroll — if user scrolls before timer
  var scrollRan = false;
  window.addEventListener('scroll', function() {
    if (scrollRan) return;
    scrollRan = true;
    setTimeout(runCounters, 100);
  }, { once: true, passive: true });


// --- HERO DEVICE RENDERING ---
function drawHeroDevice(t) {
  var canvas = document.getElementById('hero-device-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  
  ctx.clearRect(0, 0, W, H);
  
  // Device dimensions — centred
  var dW = 280, dH = 160;
  var dX = (W - dW) / 2;
  var dY = (H - dH) / 2;
  var r  = 18; // corner radius
  
  // Shadow / depth layer
  ctx.shadowColor = 'rgba(0,200,150,0.25)';
  ctx.shadowBlur  = 40;
  ctx.shadowOffsetY = 8;
  
  // Device body — off-white medical plastic
  var bodyGrad = ctx.createLinearGradient(dX, dY, dX, dY+dH);
  bodyGrad.addColorStop(0,   '#F5F5F3');
  bodyGrad.addColorStop(0.5, '#EDEDEB');
  bodyGrad.addColorStop(1,   '#D8D8D6');
  ctx.fillStyle = bodyGrad;
  rrectHero(ctx, dX, dY, dW, dH, r);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetY = 0;
  
  // Teal edge highlight (top)
  ctx.strokeStyle = '#00C896';
  ctx.lineWidth   = 3;
  rrectHero(ctx, dX, dY, dW, dH, r);
  ctx.stroke();
  
  // Side depth (3D bevel effect)
  ctx.fillStyle = '#BFBFBD';
  rrectHero(ctx, dX+2, dY+dH-6, dW-4, 6, 3);
  ctx.fill();
  
  // Surface texture line (subtle)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(dX+20, dY+dH*0.42);
  ctx.lineTo(dX+dW-20, dY+dH*0.42);
  ctx.stroke();
  
  // OLED screen area
  var sX = dX+55, sY = dY+22;
  var sW = dW-90, sH = dH-44;
  
  // Screen bezel (dark inset)
  ctx.fillStyle = '#0A0F18';
  rrectHero(ctx, sX-2, sY-2, sW+4, sH+4, 6);
  ctx.fill();
  
  // Screen surface
  ctx.fillStyle = '#050B15';
  rrectHero(ctx, sX, sY, sW, sH, 5);
  ctx.fill();
  
  // Screen content — animated based on time
  drawDeviceScreen(ctx, sX, sY, sW, sH, t);
  
  // Sensor dot (left of screen)
  var dotX = dX + 30, dotY = dY + dH/2;
  
  // Sensor housing
  ctx.fillStyle = '#2A3040';
  ctx.beginPath();
  ctx.arc(dotX, dotY, 11, 0, Math.PI*2);
  ctx.fill();
  
  // Sensor inner
  var pulse = 0.5 + Math.sin(t*2.2)*0.5;
  var sg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 9);
  sg.addColorStop(0, 'rgba(0,200,150,' + (0.7+pulse*0.3) + ')');
  sg.addColorStop(1, 'rgba(0,100,80,0.3)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 9, 0, Math.PI*2);
  ctx.fill();
  
  // USB-C port (bottom centre)
  ctx.fillStyle = '#CCCCCA';
  rrectHero(ctx, dX+dW/2-12, dY+dH-8, 24, 5, 2);
  ctx.fill();
  ctx.fillStyle = '#AAAAAA';
  rrectHero(ctx, dX+dW/2-8, dY+dH-7, 16, 3, 1);
  ctx.fill();
  
  // Annotation dots — floating labels
  var annots = [
    { x: dX+55,     y: dY+10, label: 'MEMS Mic',   side:'above' },
    { x: dX+dW-20,  y: dY+40, label: 'CO₂ Sensor', side:'right' },
    { x: dX+dW-10,  y: dY+dH-20, label: 'BLE 5.0', side:'right'},
  ];
  
  annots.forEach(function(ann) {
    var ao = 0.5 + Math.sin(t*1.3 + ann.x)*0.5;
    
    // Dot
    ctx.fillStyle = 'rgba(0,200,150,' + (0.7+ao*0.3) + ')';
    ctx.beginPath();
    ctx.arc(ann.x, ann.y, 4, 0, Math.PI*2);
    ctx.fill();
    
    // Line + label
    ctx.strokeStyle = 'rgba(0,200,150,' + (0.4+ao*0.2) + ')';
    ctx.lineWidth = 1;
    ctx.setLineDash([3,4]);
    ctx.beginPath();
    if (ann.side === 'above') {
      ctx.moveTo(ann.x, ann.y);
      ctx.lineTo(ann.x, ann.y - 28);
    } else {
      ctx.moveTo(ann.x, ann.y);
      ctx.lineTo(ann.x + 30, ann.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'rgba(0,200,150,' + (0.7+ao*0.3) + ')';
    ctx.font = '9px monospace';
    ctx.textAlign = ann.side === 'right' ? 'left' : 'center';
    if (ann.side === 'above') {
      ctx.fillText(ann.label, ann.x, ann.y - 32);
    } else {
      ctx.fillText(ann.label, ann.x + 34, ann.y + 3);
    }
    ctx.textAlign = 'left';
  });
}

function drawDeviceScreen(ctx, x, y, w, h, t) {
  var cx = x + w/2;
  var cy = y + h/2;
  
  // Scanline effect
  for (var sy = y; sy < y+h; sy += 3) {
    ctx.fillStyle = 'rgba(0,200,150,0.012)';
    ctx.fillRect(x, sy, w, 1);
  }
  
  // Status dot — green pulse
  var pulse = 0.5 + Math.sin(t*2.1)*0.5;
  var dotGlow = ctx.createRadialGradient(x+22, cy, 0, x+22, cy, 14+pulse*4);
  dotGlow.addColorStop(0, 'rgba(34,197,94,' + (0.85+pulse*0.15) + ')');
  dotGlow.addColorStop(1, 'rgba(34,197,94,0)');
  ctx.fillStyle = dotGlow;
  ctx.beginPath();
  ctx.arc(x+22, cy, 16+pulse*4, 0, Math.PI*2);
  ctx.fill();
  
  // Text content
  ctx.fillStyle = '#22C55E';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('NORMAL', x+44, cy-9);
  
  ctx.font = '9px monospace';
  ctx.fillStyle = '#166534';
  ctx.fillText('CO\u2082: 42 mmHg', x+44, cy+5);
  ctx.fillText('AIRWAYS: CLEAR', x+44, cy+18);
  ctx.fillText('LAYER 0: SILENT', x+44, cy+31);
  ctx.textAlign = 'left';
}

function rrectHero(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// Start the hero device animation loop
var heroT = 0;
function heroDeviceLoop() {
  heroT += 0.035;
  drawHeroDevice(heroT);
  requestAnimationFrame(heroDeviceLoop);
}
heroDeviceLoop();

})();
