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

// --- VIDEO PLAYER ENGINE ---
function embedVideo(url) {
  const wrapper = document.getElementById('video-placeholder-wrapper');
  if (!wrapper) return;
  
  // Detect YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/)?.[1];
    if (videoId) {
      wrapper.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
          style="width:100%;height:100%;border:none"
          allow="autoplay;fullscreen"
          allowfullscreen>
        </iframe>
      `;
    }
    return;
  }
  
  // Direct video file
  wrapper.innerHTML = `
    <video 
      src="${url}" 
      controls autoplay
      style="width:100%;height:100%;object-fit:cover">
    </video>
  `;
}

function playVideo() {
  // Replace this URL with your actual video URL when you have it:
  // embedVideo('https://youtube.com/watch?v=YOUR_ID');
  
  // For now, scroll to interactive simulation
  const sim = document.getElementById('sim-grid');
  if (sim) {
    sim.scrollIntoView({ behavior: 'smooth' });
  }
}

function showVideoModal() {
  const url = prompt("Enter YouTube or direct video URL to embed:");
  if (url) embedVideo(url);
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

})();
