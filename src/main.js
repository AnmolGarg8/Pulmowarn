import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({
  limitCallbacks: false,
  ignoreMobileResize: true
});

// Force ScrollTrigger to use the correct scroll container
ScrollTrigger.defaults({
  scroller: window
});

function hideAllSections() {
  const sections = [
    's1-text', 's1-product', 's1-scroll',
    's2-panel', 's3-cards', 's3-impact',
    's4-annotations', 's4-title',
    's7-container', 's8-section', 's10-section'
  ];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.opacity = '0';
  });
}

// RENDERER
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true, 
  alpha: false 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x060D1A, 1.0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;

// SCENE + CAMERA
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0, 6);

// POST-PROCESSING — THESE VALUES ARE FIXED, DO NOT CHANGE
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.28,    // strength — maximum 0.35, never higher
  0.45,    // radius
  0.62     // threshold — only very bright elements glow
);
composer.addPass(bloomPass);

// MOUSE TRACKING
const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

// SCROLL PROGRESS — global, 0 to 1
let globalScroll = 0;
window.addEventListener('scroll', () => {
  globalScroll = window.scrollY / 
    (document.body.scrollHeight - window.innerHeight);
});

// CLOCK
const clock = new THREE.Clock();

// RESIZE HANDLER
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// SECTION 1 — BUILD LUNG PARTICLES
function buildLungParticles() {
  const COUNT = 6500;
  const targetPositions = [];
  
  // Improved SDF — two clearly separated lobes + trachea
  function inLung(x, y, z) {
    // Left lobe — centred at (-0.55, -0.1, 0)
    const lL = Math.pow((x + 0.55)/0.52, 2) +
               Math.pow((y + 0.1)/1.10, 2) +
               Math.pow(z/0.38, 2);
    // Right lobe — centred at (0.48, -0.1, 0)
    const rL = Math.pow((x - 0.48)/0.46, 2) +
               Math.pow((y + 0.1)/1.02, 2) +
               Math.pow(z/0.34, 2);
    // Trachea — thin vertical stem at top centre
    const tr = Math.pow(x/0.09, 2) +
               Math.pow((y - 1.05)/0.38, 2) +
               Math.pow(z/0.07, 2);
    // IMPORTANT: use < 1.0 not <= 1.0 for hollow shell
    // Mix shell (near-surface) with solid fill
    const minDist = Math.min(lL, rL, tr);
    return minDist < 1.0;
  }
  
  // Only keep points NEAR the surface for hollow lung look
  function nearSurface(x, y, z) {
    function sdf(px, py, pz) {
      const lL = Math.pow((px+0.55)/0.52,2) + 
                 Math.pow((py+0.1)/1.10,2) + 
                 Math.pow(pz/0.38,2);
      const rL = Math.pow((px-0.48)/0.46,2) + 
                 Math.pow((py+0.1)/1.02,2) + 
                 Math.pow(pz/0.34,2);
      const tr = Math.pow(px/0.09,2) + 
                 Math.pow((py-1.05)/0.38,2) + 
                 Math.pow(pz/0.07,2);
      return Math.min(lL, rL, tr);
    }
    const d = sdf(x, y, z);
    // Keep points between 0.85 and 1.0 of the surface
    // This creates a hollow shell effect
    return d >= 0.72 && d < 1.0;
  }
  
  // Sample points
  let attempts = 0;
  while(targetPositions.length < COUNT && attempts < 500000) {
    const x = (Math.random() - 0.5) * 2.8;
    const y = (Math.random() - 0.5) * 3.0;
    const z = (Math.random() - 0.5) * 1.0;
    // 70% shell points, 30% fill points for depth
    if(Math.random() < 0.70 ? nearSurface(x,y,z) : inLung(x,y,z)) {
      targetPositions.push(x, y, z);
    }
    attempts++;
  }
  
  const COUNT_ACTUAL = targetPositions.length / 3;
  const positions = new Float32Array(COUNT_ACTUAL * 3);
  const targets   = new Float32Array(targetPositions);
  const randoms   = new Float32Array(COUNT_ACTUAL);
  
  // Start positions: scattered in a sphere
  for(let i = 0; i < COUNT_ACTUAL; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 6 + Math.random() * 4;
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    randoms[i] = Math.random();
  }
  
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', 
    new THREE.BufferAttribute(positions.slice(), 3));
  geo.setAttribute('aTarget', 
    new THREE.BufferAttribute(targets, 3));
  geo.setAttribute('aRandom', 
    new THREE.BufferAttribute(randoms, 1));
  
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0.0 },
      uTime:     { value: 0.0 },
      uStutter:  { value: 0.0 },
      uFade:     { value: 1.0 },
    },
    vertexShader: `
      attribute vec3 aTarget;
      attribute float aRandom;
      uniform float uProgress;
      uniform float uTime;
      uniform float uStutter;
      
      void main() {
        // Smooth lerp from scattered to lung target
        float ease = uProgress * uProgress * (3.0 - 2.0 * uProgress);
        vec3 pos = mix(position, aTarget, ease);
        
        // Breathing pulse — very subtle
        float breathe = 1.0 + 
          sin(uTime * 0.85 + aRandom * 6.28318) * 0.018;
        pos *= breathe;
        
        // Malfunction stutter displacement
        if(uStutter > 0.01) {
          float nx = sin(aRandom * 127.1 + uTime * 4.5);
          float ny = sin(aRandom * 311.7 + uTime * 3.9);
          float nz = sin(aRandom * 74.3  + uTime * 5.1);
          pos += vec3(nx, ny, nz) * uStutter * 0.14;
        }
        
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        // Point size — small and crisp, never large blobs
        gl_PointSize = clamp(
          (1.8 + aRandom * 1.2) * (8.0 / -mvPos.z),
          0.5, 4.0
        );
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uFade;
      
      void main() {
        // Crisp circular points
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        if(d > 1.0) discard;
        
        // Sharp falloff — not blurry blobs
        float alpha = 1.0 - smoothstep(0.2, 1.0, d);
        
        // Teal core, blue-teal edge — NOT white
        vec3 core  = vec3(0.0,  0.82, 0.65);
        vec3 edge  = vec3(0.15, 0.52, 0.78);
        vec3 col   = mix(edge, core, 1.0 - d * d);
        
        // Cap brightness — no particle should be > 0.85 brightness
        col = min(col, vec3(0.85));
        
        gl_FragColor = vec4(col, alpha * 0.78 * uFade);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return { points, mat };
}

const lungSystem = buildLungParticles();

// SECTION 1 — BUILD STAR FIELD
function buildStarField() {
  const COUNT = 2500;
  const pos = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  for(let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
    sizes[i] = Math.random() * 0.8 + 0.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      uniform float uTime;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (1.0 / -mvPos.z * 8.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if(d > 1.0) discard;
        float a = 1.0 - smoothstep(0.0, 1.0, d);
        gl_FragColor = vec4(0.5, 0.65, 0.85, a * 0.20);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

scene.add(buildStarField());

// SECTION 1 — SCROLL ANIMATIONS

// Hero text entrance — fires on page load
function startHeroEntrance() {
  // Show hero text wrapper first
  const textEl = document.getElementById('s1-text');
  if(textEl) textEl.style.opacity = '1';
  
  const eyebrow = document.getElementById('s1-eyebrow');
  const headline = document.getElementById('s1-headline');
  const scroll = document.getElementById('s1-scroll');
  
  // Stagger in
  if(eyebrow) {
    eyebrow.style.transform = 'translateY(20px)';
    eyebrow.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    setTimeout(() => {
      eyebrow.style.opacity = '1';
      eyebrow.style.transform = 'translateY(0)';
    }, 400);
  }
  
  if(headline) {
    headline.style.transform = 'translateY(30px)';
    headline.style.transition = 'opacity 1.0s ease, transform 1.0s ease';
    setTimeout(() => {
      headline.style.opacity = '1';
      headline.style.transform = 'translateY(0)';
    }, 700);
  }
  
  if(scroll) {
    scroll.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      scroll.style.opacity = '1';
    }, 1400);
  }
}

// Also animate lung particles assembling on page load
// (not wait for scroll — assemble on load, stutter on scroll)
gsap.to(lungSystem.mat.uniforms.uProgress, {
  value: 1.0,
  duration: 2.5,
  delay: 0.2,
  ease: 'power2.out',
  onComplete: () => startHeroEntrance()
});

// ─────────────────────────────────────────────
// MASTER SECTION CONTROLLER
// Called inside every ScrollTrigger onUpdate
// to ensure only the active section is visible
// ─────────────────────────────────────────────

const ALL_SECTION_IDS = [
  's1-text', 's1-product', 's1-scroll',
  's2-panel',
  's3-cards', 's3-impact',
  's4-annotations', 's4-title',
  's7-container',
  's8-section',
  's10-section'
];

function showOnly(activeIds, fadingIds = []) {
  ALL_SECTION_IDS.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    
    if(activeIds.includes(id)) {
      // Active section — let the caller set opacity
      el.style.visibility = 'visible';
    } else if(fadingIds.includes(id)) {
      // Fading section — let caller set opacity
      el.style.visibility = 'visible';
    } else {
      // Inactive — force hide
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    }
  });
}

// Define which scroll ranges own which sections
// So each section knows its "siblings" to hide
const SECTION_RANGES = [
  { start: 0,    end: 130,  active: ['s1-text','s1-product','s1-scroll'] },
  { start: 130,  end: 430,  active: ['s2-panel'] },
  { start: 430,  end: 560,  active: ['s3-cards','s3-impact'] },
  { start: 560,  end: 730,  active: ['s4-annotations','s4-title'] },
  { start: 730,  end: 900,  active: ['s7-container'] },
  { start: 900,  end: 970,  active: ['s8-section'] },
  { start: 970,  end: 1100, active: ['s10-section'] },
];

// Add a single master watcher that hides inactive sections
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0,
  onUpdate: self => {
    // Get current scroll in vh
    const scrollVH = self.progress * 1100;
    
    // Find which section range we're in
    const activeRange = SECTION_RANGES.find(
      r => scrollVH >= r.start && scrollVH < r.end
    );
    
    if(activeRange) {
      showOnly(activeRange.active);
    }
  }
});

// Scroll-driven stutter and fade
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: 'top top',
  end: '130vh top',
  scrub: 1.0,
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;
    
    // Stutter begins at 40% through this section
    if(lungSystem.mat) {
      lungSystem.mat.uniforms.uStutter.value = 
        Math.max(0, (p - 0.40) / 0.35) * 0.55;
      // Fade out at 65%+
      lungSystem.mat.uniforms.uFade.value = 
        p > 0.65 ? 1.0 - (p - 0.65) / 0.35 : 1.0;
    }
    
    // Text fades out at 60%
    const textEl = document.getElementById('s1-text');
    if(textEl) textEl.style.opacity = 
      String(p > 0.60 ? Math.max(0, 1 - (p-0.60)/0.25) : 1);
    
    // Product name fades in at 70%
    const prodEl = document.getElementById('s1-product');
    if(prodEl) {
      prodEl.style.opacity = String(p > 0.70 ? Math.min(1, (p-0.70)/0.25) : 0);
      prodEl.style.display = p > 0.70 ? 'block' : 'none';
    }
    
    // Scroll indicator fades out early
    const scrollEl = document.getElementById('s1-scroll');
    if(scrollEl) scrollEl.style.opacity = 
      String(Math.max(0, 1 - p * 4));
  }
});

// SECTION UPDATE MODULES
function updateSection1(t) {
  if(lungSystem.mat) {
    lungSystem.mat.uniforms.uTime.value = t;
  }
}

// SECTION 2 — BUILD BRONCHIAL TREE
function buildBronchialTree() {
  const group = new THREE.Group();
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a4a7a,
    transparent: true,
    opacity: 0.85,
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const branches = [
    [[0, 0.8, 0], [0, 1.8, 0], 0.13],
    [[0, 0.8, 0], [-0.65, 0.2, 0.1], 0.10],
    [[0, 0.8, 0], [0.55, 0.2, 0.1], 0.09],
    [[-0.65, 0.2, 0.1], [-1.0, -0.5, 0.0], 0.07],
    [[-0.65, 0.2, 0.1], [-0.4, -0.6, 0.15], 0.06],
    [[0.55, 0.2, 0.1], [0.95, -0.4, 0.0], 0.065],
    [[0.55, 0.2, 0.1], [0.35, -0.55, 0.15], 0.06],
    [[-1.0,-0.5,0.0], [-1.2,-1.1,0.0], 0.045],
    [[-0.4,-0.6,0.15], [-0.5,-1.2,0.1], 0.045],
    [[0.95,-0.4,0.0], [1.15,-1.0,0.0], 0.042],
    [[0.35,-0.55,0.15], [0.45,-1.15,0.1], 0.042],
  ];

  branches.forEach(([start, end, r]) => {
    const sv = new THREE.Vector3(...start);
    const ev = new THREE.Vector3(...end);
    const dir = ev.clone().sub(sv);
    const len = dir.length();
    const mid = sv.clone().lerp(ev, 0.5);
    const cyl = new THREE.CylinderGeometry(r, r*1.1, len, 8, 1);
    const mesh = new THREE.Mesh(cyl, tubeMat.clone());
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(mesh);
  });

  group.position.set(-1.8, -0.3, 0);
  group.scale.setScalar(1.2);
  group.visible = false;
  scene.add(group);
  return group;
}

const bronchialTree = buildBronchialTree();

// SECTION 2 — MUCUS ACCUMULATION PARTICLES
function buildMucusSystem() {
  const COUNT = 300;
  const positions = new Float32Array(COUNT * 3);
  const poolPoints = [
    [0, 0.8, 0], [-0.65, 0.2, 0.1], [0.55, 0.2, 0.1],
    [-1.0, -0.5, 0], [-0.4, -0.6, 0.15],
    [0.95, -0.4, 0], [0.35, -0.55, 0.15],
  ];

  for(let i = 0; i < COUNT; i++) {
    const pool = poolPoints[i % poolPoints.length];
    positions[i * 3]     = pool[0] + (Math.random() - 0.5) * 0.25;
    positions[i * 3 + 1] = pool[1] + (Math.random() - 0.5) * 0.25;
    positions[i * 3 + 2] = pool[2] + (Math.random() - 0.5) * 0.1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAmount: { value: 0.0 }, uTime: { value: 0.0 } },
    vertexShader: `
      uniform float uAmount;
      uniform float uTime;
      void main() {
        vec3 pos = position;
        pos.y += sin(uTime * 1.5 + position.x * 4.0) * 0.03;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (6.0 + sin(uTime + position.x * 10.0) * 2.0)
                       * uAmount * (1.0 / -mvPos.z * 8.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uAmount;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        if(d > 1.0) discard;
        float a = 1.0 - smoothstep(0.2, 1.0, d);
        vec3 col = mix(vec3(0.85, 0.60, 0.0), vec3(0.95, 0.75, 0.2), d);
        gl_FragColor = vec4(col, a * 0.9 * uAmount);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.position.copy(bronchialTree.position);
  points.scale.copy(bronchialTree.scale);
  points.visible = false;
  scene.add(points);
  return { points, mat };
}

const mucusSystem = buildMucusSystem();

// SECTION 2 — CO2 BLOOD FLOW VISUALISATION
function buildBloodCO2System() {
  const group = new THREE.Group();
  const vesselPaths = [
    [[0,0,0],[0.8,0.5,0],[1.5,0.2,0]],
    [[0,0,0],[-0.8,0.5,0],[-1.5,0.2,0]],
    [[0,0,0],[0.5,-0.8,0],[0.9,-1.5,0]],
    [[0,0,0],[-0.5,-0.8,0],[-0.9,-1.5,0]],
    [[0,0,0],[0,0.9,0],[0,1.8,0]],
    [[0,0,0],[0,-0.9,0],[0,-1.8,0]],
  ];

  vesselPaths.forEach(pts => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...pts[0]),
      new THREE.Vector3(...pts[1]),
      new THREE.Vector3(...pts[2])
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.025, 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00D4AA,
      transparent: true,
      opacity: 0.0,
    });
    group.add(new THREE.Mesh(tubeGeo, mat));
  });

  group.position.set(0, 0, 0);
  group.scale.setScalar(1.5);
  group.visible = false;
  scene.add(group);
  return group;
}

const bloodSystem = buildBloodCO2System();

// SECTION 2 — CO2 GAUGE
function buildCO2Gauge() {
  const geo = new THREE.PlaneGeometry(0.15, 3.0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uLevel: { value: 0.0 }, uTime: { value: 0.0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float uLevel;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float filled = step(vUv.y, uLevel);
        vec3 colNormal = vec3(0.13, 0.78, 0.55);
        vec3 colAmber  = vec3(0.95, 0.65, 0.05);
        vec3 colRed    = vec3(0.91, 0.25, 0.25);
        vec3 col = colNormal;
        if(vUv.y > 0.35) col = colAmber;
        if(vUv.y > 0.70) col = colRed;
        float alpha = filled * 0.9;
        float edge = smoothstep(0.0, 0.04, abs(vUv.x-0.5)*2.0);
        alpha = max(alpha, (1.0-edge) * 0.3);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(2.8, 0, 0);
  mesh.visible = false;
  scene.add(mesh);
  return { mesh, mat };
}

const co2Gauge = buildCO2Gauge();

// SECTION 2 — SCROLLTRIGGER
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '130vh top',
  end: '430vh top',
  scrub: 1.2,
  pin: false,
  onEnter: () => {
    // Make objects visible when entering section
    if(bronchialTree) bronchialTree.visible = true;
    if(mucusSystem) mucusSystem.points.visible = true;
    // Show text panel wrapper
    const panel = document.getElementById('s2-panel');
    if(panel) {
      panel.style.opacity = '1';
      panel.style.visibility = 'visible';
    }
  },
  onLeaveBack: () => {
    // Hide when scrolling back above this section
    if(bronchialTree) bronchialTree.visible = false;
    if(mucusSystem) mucusSystem.points.visible = false;
    if(bloodSystem) bloodSystem.visible = false;
    if(co2Gauge) co2Gauge.mesh.visible = false;
    const panel = document.getElementById('s2-panel');
    if(panel) {
      panel.style.opacity = '0';
      panel.style.visibility = 'hidden';
    }
  },
  onLeave: () => {
    // Hide when leaving to next section
    if(bronchialTree) bronchialTree.visible = false;
    if(mucusSystem) mucusSystem.points.visible = false;
    if(bloodSystem) bloodSystem.visible = false;
    if(co2Gauge) co2Gauge.mesh.visible = false;
  },
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;

    // Maintain s2 panel visibility against hideAllSections
    const panel = document.getElementById('s2-panel');
    if(panel) {
      panel.style.opacity = '1';
      panel.style.visibility = 'visible';
    }

    // Fade out s1-product smoothly
    const s1Opacity = Math.max(0, 1 - p * 8);
    const s1Prod = document.getElementById('s1-product');
    if(s1Prod) {
      s1Prod.style.opacity = String(s1Opacity);
      s1Prod.style.display = s1Opacity > 0 ? 'block' : 'none';
    }
    
    // ── ACT A (0 → 0.33): Healthy airways ──
    if(p <= 0.33) {
      const ap = p / 0.33;
      
      // Fade in bronchial tree
      if(bronchialTree) {
        bronchialTree.visible = true;
        bronchialTree.children.forEach(mesh => {
          if(mesh.material) mesh.material.opacity = ap * 0.85;
        });
        // Gentle rotation
        bronchialTree.rotation.y = ap * 0.2;
      }
      
      // Hide mucus and blood
      if(mucusSystem) mucusSystem.points.visible = false;
      if(bloodSystem) bloodSystem.visible = false;
      if(co2Gauge) co2Gauge.mesh.visible = false;
      
      // Text panels
      const a = document.getElementById('s2a');
      const b = document.getElementById('s2b');
      const c = document.getElementById('s2c');
      if(a) a.style.opacity = String(Math.min(ap * 3, 1));
      if(b) b.style.opacity = '0';
      if(c) c.style.opacity = '0';
    }
    
    // ── ACT B (0.33 → 0.66): Infection, mucus ──
    else if(p <= 0.66) {
      const bp = (p - 0.33) / 0.33;
      
      if(bronchialTree) {
        bronchialTree.visible = true;
        // Shift tube color toward inflamed red
        bronchialTree.children.forEach(mesh => {
          if(mesh.material && mesh.material.color) {
            mesh.material.color.setRGB(
              0.10 + bp * 0.45,
              0.29 - bp * 0.15,
              0.48 - bp * 0.28
            );
          }
        });
      }
      
      // Show mucus building up
      if(mucusSystem) {
        mucusSystem.points.visible = true;
        if(mucusSystem.mat) {
          mucusSystem.mat.uniforms.uAmount.value = bp;
        }
      }
      
      // Text panels
      const a = document.getElementById('s2a');
      const b = document.getElementById('s2b');
      const c = document.getElementById('s2c');
      if(a) a.style.opacity = String(Math.max(0, 1 - bp * 2));
      if(b) b.style.opacity = String(Math.min(bp * 2, 1));
      if(c) c.style.opacity = '0';
    }
    
    // ── ACT C (0.66 → 1.0): CO2 builds ──
    else {
      const cp = (p - 0.66) / 0.34;
      
      // Hide airways, show blood system
      if(bronchialTree) bronchialTree.visible = false;
      if(mucusSystem) mucusSystem.points.visible = false;
      
      if(bloodSystem) {
        bloodSystem.visible = true;
        bloodSystem.children.forEach(mesh => {
          if(mesh.material) {
            mesh.material.opacity = Math.min(cp * 2, 0.75);
            // Shift from teal to amber/red with CO2
            mesh.material.color.setRGB(
              cp * 0.92,
              0.84 - cp * 0.65,
              0.67 - cp * 0.67
            );
          }
        });
      }
      
      // CO2 gauge rises
      if(co2Gauge) {
        co2Gauge.mesh.visible = true;
        if(co2Gauge.mat) {
          co2Gauge.mat.uniforms.uLevel.value = cp * 0.92;
        }
      }
      
      // Text panels
      const b = document.getElementById('s2b');
      const c = document.getElementById('s2c');
      if(b) b.style.opacity = String(Math.max(0, 1 - cp * 2));
      if(c) c.style.opacity = String(Math.min(cp * 2, 1));
    }
  }
});

// SECTION UPDATE MODULES
function updateSection2(t) {
  if(mucusSystem.mat) mucusSystem.mat.uniforms.uTime.value = t;
  if(co2Gauge.mat) co2Gauge.mat.uniforms.uTime.value = t;
}

// SECTION 3 — THE MONITORING GAP
function buildGlassCards() {
  const cards = [];
  const positions = [
    [-2.2, 0, 0],
    [0, 0, 0.3],
    [2.2, 0, 0],
  ];
  positions.forEach((pos, i) => {
    const geo = new THREE.PlaneGeometry(1.5, 2.2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uIndex: { value: i },
        uHover: { value: 0.0 },
        uAppear: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIndex;
        uniform float uHover;
        uniform float uAppear;
        varying vec2 vUv;
        void main() {
          // Glass base
          vec3 base = vec3(0.04, 0.09, 0.18);
          
          // Edge glow
          float ex = smoothstep(0.0, 0.025, vUv.x) 
                   * smoothstep(1.0, 0.975, vUv.x);
          float ey = smoothstep(0.0, 0.025, vUv.y) 
                   * smoothstep(1.0, 0.975, vUv.y);
          float edge = 1.0 - min(ex, ey);
          
          // Colour by card type
          vec3 teal   = vec3(0.0, 0.83, 0.67);
          vec3 amber  = vec3(0.96, 0.65, 0.04);
          vec3 red    = vec3(0.91, 0.25, 0.25);
          vec3 accent = uIndex < 0.5 ? red : (uIndex < 1.5 ? amber : red);
          
          float glowPulse = 0.5 + sin(uTime * 1.8 + uIndex * 2.1) * 0.5;
          float alpha = 0.08 + edge * glowPulse * 0.6 * uAppear;
          alpha = max(alpha, 0.06 * uAppear);
          
          gl_FragColor = vec4(mix(base, accent, edge * 0.4), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.position.y = -5; // start below screen
    mesh.visible = false;
    scene.add(mesh);
    cards.push({ mesh, mat });
  });
  return cards;
}

const glassCards = buildGlassCards();

// SECTION 3 — SCROLLTRIGGER
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '430vh top',
  end: '560vh top',
  scrub: 1.2,
  onEnter: () => {
    const el = document.getElementById('s3-cards');
    if(el) { el.style.visibility = 'visible'; }
    glassCards.forEach(c => { if(c.mesh) c.mesh.visible = true; });
  },
  onLeaveBack: () => {
    const el = document.getElementById('s3-cards');
    if(el) { el.style.opacity = '0'; el.style.visibility = 'hidden'; }
    glassCards.forEach(c => { if(c.mesh) c.mesh.visible = false; });
  },
  onLeave: () => {
    const el = document.getElementById('s3-cards');
    if(el) { el.style.opacity = '0'; el.style.visibility = 'hidden'; }
    glassCards.forEach(c => { if(c.mesh) c.mesh.visible = false; });
  },
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;

    const s2Opacity = Math.max(0, 1 - p * 6);
    const s2Panel = document.getElementById('s2-panel');
    if(s2Panel) {
      s2Panel.style.opacity = String(s2Opacity);
      if(s2Opacity > 0) s2Panel.style.visibility = 'visible';
    }
    
    // Show cards HTML
    const cardsEl = document.getElementById('s3-cards');
    if(cardsEl) {
      cardsEl.style.opacity = String(Math.min(p * 4, 1));
      cardsEl.style.visibility = 'visible';
    }
    
    // Animate each 3D card up from below
    glassCards.forEach((c, i) => {
      if(!c.mesh || !c.mat) return;
      const delay = i * 0.12;
      const ap = Math.max(0, Math.min(1, (p - delay) / 0.5));
      // Smoothstep easing
      const eased = ap * ap * (3 - 2 * ap);
      
      c.mesh.position.y = -2.5 + eased * 2.5;
      c.mesh.rotation.x = (1 - eased) * 0.35;
      c.mat.uniforms.uAppear.value = eased;
    });
    
    // Impact statement at 72%+
    const impact = document.getElementById('s3-impact');
    if(impact) {
      impact.style.opacity = 
        String(Math.max(0, Math.min(1, (p - 0.72) / 0.20)));
    }
  }
});

// Update function for Section 3 — add to animate() loop
function updateSection3(t) {
  glassCards.forEach((c, i) => {
    if(!c.mat || !c.mesh.visible) return;
    c.mat.uniforms.uTime.value = t;
    // Float animation
    const baseY = c.mesh.position.y;
    // Only apply float if card is in its settled position
    if(baseY > -0.5) {
      c.mesh.position.y = baseY + 
        Math.sin(t * 0.6 + i * 2.094) * 0.0003;
    }
    // Mouse tilt
    c.mesh.rotation.y = mouse.x * 0.06 + (i - 1) * 0.04;
    c.mesh.rotation.x += (mouse.y * 0.04 - c.mesh.rotation.x) * 0.05;
  });
}

// SECTION 4 — DEVICE REVEAL
function buildDevice() {
  const group = new THREE.Group();

  // Main body with soft corner rounding
  const bodyGeo = new THREE.BoxGeometry(2.2, 1.4, 0.28, 4, 4, 2);
  const posAttr = bodyGeo.attributes.position;
  for(let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    const cornerRadius = 0.12;
    const ax = Math.abs(x), ay = Math.abs(y);
    if(ax > 1.1 - cornerRadius && ay > 0.7 - cornerRadius) {
      const nx = Math.sign(x) * (1.1 - cornerRadius);
      const ny = Math.sign(y) * (0.7 - cornerRadius);
      const dx = x - nx, dy = y - ny;
      const len = Math.sqrt(dx*dx + dy*dy);
      x = nx + dx/len * cornerRadius;
      y = ny + dy/len * cornerRadius;
    }
    posAttr.setXYZ(i, x, y, posAttr.getZ(i));
  }
  bodyGeo.computeVertexNormals();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xF2F2F0,
    roughness: 0.10,
    metalness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.2,
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Teal accent trim
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x00D4AA,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x00D4AA,
    emissiveIntensity: 0.25,
  });
  const trimGeo = new THREE.BoxGeometry(2.2, 0.04, 0.32);
  const trimPositions = [[0, 0.72, 0], [0, -0.72, 0], [1.12, 0, 0], [-1.12, 0, 0]];
  const trimRotations = [0, 0, Math.PI/2, Math.PI/2];
  trimPositions.forEach((pos, i) => {
    const t = new THREE.Mesh(trimGeo, trimMat);
    t.position.set(...pos);
    t.rotation.z = trimRotations[i];
    group.add(t);
  });

  // OLED screen
  const oledCanvas = document.createElement('canvas');
  oledCanvas.width = 512; oledCanvas.height = 256;
  const oledCtx = oledCanvas.getContext('2d');
  const oledTex = new THREE.CanvasTexture(oledCanvas);
  const oledMat = new THREE.MeshBasicMaterial({ map: oledTex });
  const oledScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), oledMat);
  oledScreen.position.set(0.25, 0.05, 0.145);
  group.add(oledScreen);

  // Sensor dot
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 16),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  dot.position.set(-0.75, 0.05, 0.145);
  group.add(dot);

  // Three-point lighting
  const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3.0);
  keyLight.position.set(4, 4, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x4488CC, 1.2);
  fillLight.position.set(-4, 2, 3);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0x00D4AA, 1.8);
  rimLight.position.set(-2, -3, -3);
  scene.add(rimLight);

  // Halo glow
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.8;
        float glow = 1.0 - smoothstep(0.0, 1.0, d);
        glow = pow(glow, 2.5);
        float pulse = 0.7 + sin(uTime * 1.2) * 0.3;
        gl_FragColor = vec4(0.0, 0.83, 0.67, glow * 0.18 * pulse);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), haloMat);
  halo.position.z = -0.5;
  group.add(halo);

  group.userData = { oledCtx, oledTex, oledCanvas, haloMat };
  group.visible = false;
  group.scale.setScalar(0);
  scene.add(group);
  return group;
}

const deviceGroup = buildDevice();

// OLED animation
let deviceAlertState = 'normal';
function updateOLED(ctx, tex, state, t) {
  const W = 512, H = 256;
  ctx.fillStyle = '#050A0F';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,212,170,0.03)';
  for(let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

  if(state === 'normal') {
    const pulse = 0.6 + Math.sin(t * 2.0) * 0.4;
    const r = 28 + pulse * 8;
    const grd = ctx.createRadialGradient(100, H/2, 0, 100, H/2, r+10);
    grd.addColorStop(0, `rgba(0,212,170,${0.9 + pulse*0.1})`);
    grd.addColorStop(1, 'rgba(0,212,170,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(100, H/2, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#00D4AA';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('NORMAL', 165, H/2 - 12);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#226644';
    ctx.fillText('CO\u2082 INDEX: 42', 165, H/2 + 20);
    ctx.fillStyle = '#113322';
    ctx.font = '16px monospace';
    ctx.fillText('AIRWAYS: CLEAR', 165, H/2 + 48);
  }
  if(state === 'amber') {
    const blink = Math.sin(t * 4.0) > 0;
    ctx.fillStyle = blink ? '#F5A623' : '#8B5E00';
    ctx.beginPath(); ctx.arc(90, H/2, 30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#F5A623';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('SPUTUM ALERT', 145, H/2 - 15);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#CC8820';
    ctx.fillText('AIRWAY CONGESTED', 145, H/2 + 15);
    ctx.fillText('CLEAR AIRWAY NOW', 145, H/2 + 42);
  }
  if(state === 'red') {
    const blink = Math.sin(t * 6.0) > 0;
    if(blink) { ctx.fillStyle = 'rgba(232,64,64,0.15)'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = blink ? '#FF4444' : '#990000';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!! CRITICAL !!', W/2, H/2 - 20);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = blink ? '#FFAAAA' : '#CC4444';
    ctx.fillText('IMMEDIATE ACTION REQUIRED', W/2, H/2 + 16);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#AA3333';
    ctx.fillText('CO\u2082 AT CRITICAL LEVEL', W/2, H/2 + 44);
    ctx.textAlign = 'left';
  }
  tex.needsUpdate = true;
}

function updateAnnotationLines(opacity) {
  const overlay = document.getElementById('annotation-lines');
  if(!overlay) return;
  
  // Always resize to full viewport
  overlay.width  = window.innerWidth;
  overlay.height = window.innerHeight;
  
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  
  if(!deviceGroup || !deviceGroup.visible || opacity < 0.02) return;
  
  // These are the 6 points in device LOCAL space
  // corresponding to each component location
  const attachPoints = [
    new THREE.Vector3(-0.78,  0.08, 0.15),  // sensor dot
    new THREE.Vector3( 0.22,  0.08, 0.15),  // oled screen
    new THREE.Vector3( 1.10, -0.28, 0.10),  // co2 sensor
    new THREE.Vector3( 0.0,  -0.65, 0.15),  // MCU
    new THREE.Vector3(-1.12,  0.32, 0.10),  // BLE
    new THREE.Vector3( 0.92, -0.10, 0.15),  // battery
  ];
  
  // Label offset directions (pixels from attach point)
  const offsets = [
    { dx: -160, dy: -70,  side: 'left'  },
    { dx:  140, dy: -80,  side: 'right' },
    { dx:  140, dy:  50,  side: 'right' },
    { dx:    0, dy:  90,  side: 'centre'},
    { dx: -160, dy:  60,  side: 'left'  },
    { dx:  140, dy: -50,  side: 'right' },
  ];
  
  attachPoints.forEach((localPt, i) => {
    // Convert local → world space
    const worldPt = localPt.clone()
      .applyMatrix4(deviceGroup.matrixWorld);
    
    // World → NDC → screen pixels
    const ndc = worldPt.clone().project(camera);
    const sx = ( ndc.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-ndc.y * 0.5 + 0.5) * window.innerHeight;
    
    // Skip if behind camera
    if(ndc.z > 1.0) return;
    
    // Label target screen position
    const lx = sx + offsets[i].dx;
    const ly = sy + offsets[i].dy;
    
    // Draw line from device surface to label
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    ctx.strokeStyle = '#00D4AA';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dot at device surface point
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#00D4AA';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Position HTML annotation label
    const el = document.getElementById('anno-' + i);
    if(el) {
      el.style.position = 'fixed';
      el.style.opacity  = String(opacity);
      el.style.zIndex   = '200';
      
      // Compute left position based on which side
      let labelLeft = lx;
      if(offsets[i].side === 'left') {
        labelLeft = lx - el.offsetWidth;
      } else if(offsets[i].side === 'centre') {
        labelLeft = lx - el.offsetWidth / 2;
      }
      
      el.style.left = Math.max(0, 
        Math.min(labelLeft, window.innerWidth - el.offsetWidth - 10)
      ) + 'px';
      el.style.top  = Math.max(0, ly - 14) + 'px';
    }
  });
}

let deviceBaseRotY = 0;

// SECTION 4 — SCROLLTRIGGER
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '560vh top',
  end: '730vh top',
  scrub: 1.2,
  onEnter: () => {
    if(deviceGroup) deviceGroup.visible = true;
  },
  onLeaveBack: () => {
    if(deviceGroup) deviceGroup.visible = false;
    const annEl = document.getElementById('s4-annotations');
    const titEl = document.getElementById('s4-title');
    if(annEl) { annEl.style.opacity='0'; annEl.style.visibility='hidden'; }
    if(titEl) titEl.style.opacity = '0';
  },
  onLeave: () => {
    // Keep device visible after — it persists small in corner
  },
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;
    if(!deviceGroup) return;
    deviceGroup.visible = true;
    
    // Phase A: spin in (0 → 0.40)
    if(p < 0.40) {
      const ap = p / 0.40;
      const e  = 1 - Math.pow(1 - ap, 3); // cubic ease out
      deviceGroup.scale.setScalar(e);
      deviceGroup.position.set(0, (1-e) * -3, 0);
      deviceBaseRotY = (1-e) * Math.PI * 2.5;
      
      const annEl = document.getElementById('s4-annotations');
      const titEl = document.getElementById('s4-title');
      if(annEl) { annEl.style.opacity='0'; annEl.style.visibility='hidden'; }
      if(titEl) titEl.style.opacity = '0';
    }
    // Phase B: centred with annotations (0.40 → 0.75)
    else if(p < 0.75) {
      const bp = (p - 0.40) / 0.35;
      deviceGroup.scale.setScalar(1.0);
      deviceGroup.position.set(0, 0, 0);
      deviceBaseRotY = bp * 0.6;
      
      const annEl = document.getElementById('s4-annotations');
      const titEl = document.getElementById('s4-title');
      if(annEl) {
        annEl.style.opacity = String(Math.min(bp * 3, 1));
        annEl.style.visibility = 'visible';
      }
      if(titEl) titEl.style.opacity = String(Math.min(bp * 3, 1));
      
      deviceAlertState = 'normal';
    }
    // Phase C: moves to top-right corner (0.75 → 1.0)
    else {
      const cp = (p - 0.75) / 0.25;
      const e  = cp * cp * (3 - 2 * cp);
      deviceGroup.scale.setScalar(1.0 - e * 0.70);
      deviceGroup.position.set(e * 3.8, e * 2.4, 0);
      
      const annEl = document.getElementById('s4-annotations');
      const titEl = document.getElementById('s4-title');
      if(annEl) annEl.style.opacity = String(Math.max(0, 1 - cp * 2));
      if(titEl) titEl.style.opacity = String(Math.max(0, 1 - cp * 2));
    }
  }
});

function updateSection4(t) {
  if(!deviceGroup || !deviceGroup.visible) return;
  
  const ud = deviceGroup.userData;
  
  // OLED update — called every frame
  if(ud && ud.oledCtx && ud.oledTex) {
    updateOLED(ud.oledCtx, ud.oledTex, deviceAlertState, t);
  }
  
  // Halo pulse
  if(ud && ud.haloMat) {
    ud.haloMat.uniforms.uTime.value = t;
  }
  
  // Mouse-driven orbit rotation
  const targetRotY = deviceBaseRotY + mouse.x * 0.45;
  const targetRotX = mouse.y * 0.28;
  deviceGroup.rotation.y += (targetRotY - deviceGroup.rotation.y) * 0.06;
  deviceGroup.rotation.x += (targetRotX - deviceGroup.rotation.x) * 0.06;
  
  // Update annotation lines every frame device is visible
  const annoEl = document.getElementById('s4-annotations');
  const annoOpacity = annoEl ? 
    parseFloat(annoEl.style.opacity || '0') : 0;
  if(annoOpacity > 0.05) {
    updateAnnotationLines(annoOpacity);
  }
}

const updateSection5 = (t) => {};
const updateSection6 = (t) => {};

// ─────────────────────────────────────────────
// SECTION 7 — RAJAN'S STORY
// ─────────────────────────────────────────────

function buildStoryEnvironment() {
  const group = new THREE.Group();

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x0A1420, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.5;
  group.add(floor);

  // Bed
  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.3, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1E3050, roughness: 0.9 })
  );
  bed.position.set(-0.5, -2.3, 0);
  group.add(bed);

  // Pillow
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xD4C8B0, roughness: 0.95 })
  );
  pillow.position.set(-1.1, -2.1, 0);
  group.add(pillow);

  // Patient silhouette
  const patient = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 1.1, 8, 12),
    new THREE.MeshStandardMaterial({ 
      color: 0xD4A882, 
      roughness: 0.85,
      emissive: 0x3A2010,
      emissiveIntensity: 0.3 
    })
  );
  patient.rotation.z = Math.PI / 2;
  patient.position.set(-0.3, -1.88, 0);
  group.add(patient);

  // Bedside table
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x2A1F14, roughness: 0.9 })
  );
  table.position.set(1.0, -2.1, 0);
  group.add(table);

  // Phone on table
  const phoneCanvas = document.createElement('canvas');
  phoneCanvas.width = 200; phoneCanvas.height = 350;
  const phoneTex = new THREE.CanvasTexture(phoneCanvas);
  const phone = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.38),
    new THREE.MeshBasicMaterial({ map: phoneTex })
  );
  phone.position.set(1.0, -1.68, 0.26);
  group.add(phone);

  // Lights
  const roomLight = new THREE.PointLight(0xFFAA55, 2.5, 10);
  roomLight.position.set(1.5, 1.0, 1.5);
  group.add(roomLight);

  const deviceLight = new THREE.PointLight(0x00D4AA, 3.0, 6);
  deviceLight.position.set(-0.3, 0.5, 1.5);
  group.add(deviceLight);

  const fillLight = new THREE.PointLight(0x224488, 1.2, 15);
  fillLight.position.set(-3, 2, 2);
  group.add(fillLight);

  group.visible = false;
  group.userData.initialized = true;
  scene.add(group);
  return { group, phoneCanvas, phoneTex, deviceLight, roomLight };
}

const storyEnv = buildStoryEnvironment();

// Phone screen canvas renderer
function updatePhoneScreen(canvas, tex, beat) {
  const ctx = canvas.getContext('2d');
  const W = 200, H = 350;
  ctx.fillStyle = '#0A0A0F';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, W, 28);
  ctx.fillStyle = '#AAA';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(beat.time, 10, 19);

  if(beat.alert === 'none') {
    ctx.fillStyle = '#334';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No alerts', W/2, H/2);
    ctx.fillText('Patient stable ●', W/2, H/2 + 22);
    ctx.fillStyle = '#00D4AA';
    ctx.fillText('PulmoCare', W/2, H/2 + 50);
  } else {
    const colours = {
      amber: { bg:'#2A1A00', border:'#F5A623', text:'#F5A623' },
      yellow: { bg:'#2A2000', border:'#EAB308', text:'#EAB308' },
      red:   { bg:'#2A0000', border:'#E84040', text:'#FF4444' },
    };
    const c = colours[beat.alert] || colours.amber;
    ctx.fillStyle = c.bg;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, 40, W-20, 160, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PulmoCare', 20, 62);
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.fillText(beat.time, W-55, 62);
    ctx.fillStyle = '#F0F4FF';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(beat.notifTitle, 20, 85);
    ctx.fillStyle = '#8899BB';
    ctx.font = '11px sans-serif';
    const words = beat.notifBody.split(' ');
    let line = '', lineY = 108;
    words.forEach(w => {
      const test = line + w + ' ';
      if(ctx.measureText(test).width > W-40 && line) {
        ctx.fillText(line, 20, lineY);
        line = w + ' '; lineY += 16;
      } else line = test;
    });
    ctx.fillText(line, 20, lineY);
  }
  tex.needsUpdate = true;
}

// CO2 graph renderer
function drawCO2Graph(canvas, currentBeat) {
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth * window.devicePixelRatio;
  const H = canvas.offsetHeight * window.devicePixelRatio;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0, 0, W, H);
  const co2Values = [0.2, 0.25, 0.28, 0.55, 0.82, 0.35];
  const alertColors = ['#22C55E','#F5A623','#F5A623','#EAB308','#E84040','#22C55E'];
  ctx.strokeStyle = 'rgba(0,212,170,0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  ctx.moveTo(0, H * 0.7);
  ctx.lineTo(W, H * 0.7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  for(let i = 0; i <= currentBeat && i < co2Values.length; i++) {
    const x = (i / (co2Values.length-1)) * W;
    const y = H * (1 - co2Values[i] * 0.85);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#00D4AA';
  ctx.lineWidth = 2 * window.devicePixelRatio;
  ctx.stroke();
  for(let i = 0; i <= currentBeat && i < co2Values.length; i++) {
    const x = (i / (co2Values.length-1)) * W;
    const y = H * (1 - co2Values[i] * 0.85);
    ctx.beginPath();
    ctx.arc(x, y, 4 * window.devicePixelRatio, 0, Math.PI*2);
    ctx.fillStyle = alertColors[i];
    ctx.fill();
  }
}

// Story beats data
const storyBeats = [
  { time:'2:00 AM', status:'NORMAL', statusColor:'#22C55E', lightColor:0x22C55E, alertState:'normal', description:'All readings stable. Rajan sleeps. PulmoCare monitors continuously.', alert:'none', notifTitle:'', notifBody:'' },
  { time:'2:11 AM', status:'ACOUSTIC: DETECTING', statusColor:'#F5A623', lightColor:0xF5A623, alertState:'amber', description:'Rhonchi signal detected. Mucus pooling in bronchial airways. Classifier confidence rising.', alert:'amber', notifTitle:'Airways sound congested.', notifBody:'Try airway clearance now — sit upright, slow deep breath, huff coughing.' },
  { time:'2:14 AM', status:'LAYER 0 FIRED', statusColor:'#F5A623', lightColor:0xF5A623, alertState:'amber', description:'Sputum alert sent. Earliest possible intervention — before any CO₂ has risen.', alert:'amber', notifTitle:'Airway clearance needed.', notifBody:'Airways sound congested for 3+ minutes. Please clear your airway now.' },
  { time:'2:26 AM', status:'CO₂ RISING — LAYER 1', statusColor:'#EAB308', lightColor:0xEAB308, alertState:'amber', description:'CO₂ 16% above baseline. Caregiver Priya notified via push notification.', alert:'yellow', notifTitle:'Airways congested + CO₂ rising.', notifBody:'Contact your medical provider now. Airway clearance has not resolved the problem.' },
  { time:'2:47 AM', status:'!! CRITICAL — LAYER 2 !!', statusColor:'#E84040', lightColor:0xE84040, alertState:'red', description:'CO₂ critical. SMS to all caregivers. Continuous buzzer. Priya responds.', alert:'red', notifTitle:'URGENT — CRITICAL ALERT', notifBody:'CO₂ at critical level. Do not leave patient unsupervised. Immediate evaluation required.' },
  { time:'2:55 AM', status:'RECOVERING', statusColor:'#22C55E', lightColor:0x00D4AA, alertState:'normal', description:'Airways clearing. CO₂ returning to baseline. Device returns to green.', alert:'none', notifTitle:'', notifBody:'' },
];

function setEl(id, prop, val) {
  const el = document.getElementById(id);
  if(el) el.style[prop] = String(val);
  return el;
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if(el) el.textContent = text;
  return el;
}

let lastBeatIndex = -1;

// Section 7 ScrollTrigger
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '730vh top',
  end: '900vh top',
  scrub: 1.2,
  onEnter: () => {
    setEl('s7-container', 'visibility', 'visible');
    if(storyEnv && storyEnv.group) storyEnv.group.visible = true;
    if(deviceGroup) deviceGroup.visible = true;
  },
  onLeaveBack: () => {
    setEl('s7-container', 'opacity', '0');
    setEl('s7-container', 'visibility', 'hidden');
    if(storyEnv && storyEnv.group) storyEnv.group.visible = false;
  },
  onLeave: () => {
    setEl('s7-container', 'opacity', '0');
    setEl('s7-container', 'visibility', 'hidden');
  },
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;
    
    // Maintain visibility for container against hideAllSections
    setEl('s7-container', 'visibility', 'visible');
    
    // Fade in container
    setEl('s7-container', 'opacity', 
      String(Math.min(p * 6, 1)));
    
    // Beat index — which of the 6 beats are we in?
    const rawIndex = p * storyBeats.length;
    const beatIndex = Math.min(
      Math.floor(rawIndex),
      storyBeats.length - 1
    );
    
    // Only update DOM when beat changes
    if(beatIndex !== lastBeatIndex) {
      lastBeatIndex = beatIndex;
      const beat = storyBeats[beatIndex];
      
      // Update card text — all with null guards
      setElText('s7-time', beat.time);
      setElText('s7-desc', beat.description);
      setElText('s7-status', beat.status);
      setEl('s7-status', 'color', beat.statusColor);
      setEl('s7-card', 'borderColor', beat.statusColor + '44');
      setEl('s7-card', 'boxShadow', 
        '0 0 40px ' + beat.statusColor + '20');
      
      // Device OLED state
      deviceAlertState = beat.alertState;
      
      // Device light
      if(storyEnv && storyEnv.deviceLight) {
        storyEnv.deviceLight.color.setHex(beat.lightColor);
        storyEnv.deviceLight.intensity =
          beat.alertState === 'red'   ? 3.2 :
          beat.alertState === 'amber' ? 2.2 : 1.6;
      }
      
      // Update phone notification
      if(storyEnv && storyEnv.phoneCanvas && storyEnv.phoneTex) {
        updatePhoneScreen(
          storyEnv.phoneCanvas, storyEnv.phoneTex, beat
        );
      }
    }
    
    // CO2 graph — update every frame (not just on beat change)
    const graphEl = document.getElementById('s7-graph');
    if(graphEl) drawCO2Graph(graphEl, beatIndex);
    
    // Final impact text
    setEl('s7-final', 'opacity',
      String(Math.max(0, Math.min(1, (p - 0.88) / 0.12))));
    
    // Camera pull back as story progresses
    camera.position.z = 5.0 + p * 1.5;
  }
});

function updateSection7(t) {
  if(!storyEnv.group.visible) return;
  storyEnv.group.rotation.y = mouse.x * 0.05;
}

// ─────────────────────────────────────────────
// SECTION 8 — TECH SPECS  +  SECTION 10 — CLOSING
// ─────────────────────────────────────────────
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '900vh top',
  end: '970vh top',
  scrub: 1.2,
  onEnter: () => {
    const el = document.getElementById('s8-section');
    if(el) el.style.visibility = 'visible';
  },
  onLeaveBack: () => {
    const el = document.getElementById('s8-section');
    if(el) {
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    }
  },
  onLeave: () => {
    const el = document.getElementById('s8-section');
    if(el) el.style.opacity = '0';
  },
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;
    
    if(storyEnv && storyEnv.group) {
      storyEnv.group.visible = p < 0.2;
    }

    const s7Container = document.getElementById('s7-container');
    if(s7Container) {
      s7Container.style.opacity = String(Math.max(0, 1 - p * 5));
      if (p < 0.2) s7Container.style.visibility = 'visible';
    }
    
    const section = document.getElementById('s8-section');
    if(!section) return;
    
    // Fade section in
    section.style.opacity = String(Math.min(p * 5, 1));
    section.style.visibility = 'visible';
    
    // Animate each spec card individually
    const cards = section.querySelectorAll('.spec-card');
    cards.forEach((card, i) => {
      const delay = i * 0.08;
      const cp = Math.max(0, Math.min(1, (p - delay) / 0.5));
      const eased = cp * cp * (3 - 2 * cp);
      
      card.style.opacity = String(eased);
      card.style.transform = 
        'translateY(' + (1-eased) * 24 + 'px)';
      card.style.transition = 'none'; // GSAP/scroll controls this
    });
  }
});

ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '970vh top',
  end: '1050vh top',
  scrub: 1.0,
  onEnter: () => {
    const el = document.getElementById('s10-section');
    if(el) el.style.visibility = 'visible';
    // Restore healthy lung particles
    if(lungSystem && lungSystem.mat) {
      lungSystem.points.visible = true;
      lungSystem.mat.uniforms.uStutter.value = 0.0;
      lungSystem.mat.uniforms.uProgress.value = 1.0;
    }
  },
  onLeaveBack: () => {
    const el = document.getElementById('s10-section');
    if(el) { el.style.opacity='0'; el.style.visibility='hidden'; }
    if(lungSystem) lungSystem.points.visible = false;
  },
  onUpdate: self => {
    hideAllSections();
    const p = self.progress;
    
    const s8 = document.getElementById('s8-section');
    const s10 = document.getElementById('s10-section');
    
    // Cross-fade specs out, closing in
    if(s8) {
      s8.style.opacity = String(Math.max(0, 1 - p * 4));
      if (1 - p * 4 > 0) s8.style.visibility = 'visible';
    }
    if(s10) {
      s10.style.opacity = String(Math.min(p * 3, 1));
      s10.style.visibility = 'visible';
    }
    
    // Bring lung particles back for closing
    if(lungSystem && lungSystem.mat) {
      lungSystem.points.visible = true;
      lungSystem.mat.uniforms.uFade.value = 
        Math.min(p * 2, 1);
      lungSystem.mat.uniforms.uStutter.value = 0.0;
    }
  }
});

// Give browser one frame to layout before refreshing
requestAnimationFrame(() => {
  ScrollTrigger.refresh(true);
});

function initializeSceneState() {
  if(typeof bronchialTree !== 'undefined') 
    bronchialTree.visible = false;
  if(typeof mucusSystem !== 'undefined') {
    mucusSystem.points.visible = false;
  }
  if(typeof bloodSystem !== 'undefined') 
    bloodSystem.visible = false;
  if(typeof co2Gauge !== 'undefined') 
    co2Gauge.mesh.visible = false;
  if(typeof glassCards !== 'undefined') {
    glassCards.forEach(c => c.mesh.visible = false);
  }
  if(typeof storyEnv !== 'undefined') 
    storyEnv.group.visible = false;
  if(typeof deviceGroup !== 'undefined') {
    deviceGroup.visible = false;
    deviceGroup.scale.setScalar(0);
  }
}

initializeSceneState();

// RENDER LOOP — single RAF, all sections plug into this
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  
  // Subtle mouse parallax on camera always active
  camera.position.x += (mouse.x * 0.15 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 0.10 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);
  
  // Force matrix world update every frame
  // Required for device annotation projection
  scene.updateMatrixWorld(true);

  if(typeof deviceGroup !== 'undefined' && deviceGroup.visible) {
    const annoContainer = document.getElementById('s4-annotations');
    const annoOpacity = annoContainer ? 
      parseFloat(annoContainer.style.opacity || '0') : 0;
    if(annoOpacity > 0) {
      updateAnnotationLines(annoOpacity);
    }
  }

  // Each section's update function is called here
  updateSection1(t);
  updateSection2(t);
  updateSection3(t);
  updateSection4(t);
  updateSection5(t);
  updateSection6(t);
  updateSection7(t);
  
  composer.render();
}

animate();

// Final ScrollTrigger refresh
window.addEventListener('load', () => {
  setTimeout(() => {
    ScrollTrigger.refresh(true);
    console.log('PulmoCare: ScrollTrigger refreshed');
    console.log('Total scroll height:', 
      document.body.scrollHeight, 'px');
    console.log('Expected: ~', 1100 * window.innerHeight / 100, 'px');
  }, 800);
});
