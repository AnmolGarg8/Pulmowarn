import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// RENDERER
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true, 
  alpha: false 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x060D1A, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

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
  0.30,   // strength — DO NOT increase above 0.45
  0.50,   // radius
  0.60    // threshold — only brightest elements glow
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
  const COUNT = 7000;
  const positions = new Float32Array(COUNT * 3);
  const targetPos = new Float32Array(COUNT * 3);
  const randoms = new Float32Array(COUNT);

  function inLung(x, y, z) {
    const leftLobe =
      Math.pow((x + 0.55) / 0.55, 2) +
      Math.pow(y / 1.15, 2) +
      Math.pow(z / 0.42, 2) < 1.0;
    const rightLobe =
      Math.pow((x - 0.45) / 0.48, 2) +
      Math.pow(y / 1.05, 2) +
      Math.pow(z / 0.38, 2) < 1.0;
    const trachea =
      Math.pow(x / 0.12, 2) +
      Math.pow((y - 1.2) / 0.35, 2) +
      Math.pow(z / 0.10, 2) < 1.0;
    return leftLobe || rightLobe || trachea;
  }

  let filled = 0;
  while (filled < COUNT) {
    const x = (Math.random() - 0.5) * 3.0;
    const y = (Math.random() - 0.5) * 3.0;
    const z = (Math.random() - 0.5) * 1.2;
    if (inLung(x, y, z)) {
      targetPos[filled * 3]     = x;
      targetPos[filled * 3 + 1] = y;
      targetPos[filled * 3 + 2] = z;
      positions[filled * 3]     = (Math.random() - 0.5) * 12;
      positions[filled * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[filled * 3 + 2] = (Math.random() - 0.5) * 6;
      randoms[filled] = Math.random();
      filled++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(targetPos, 3));
  geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uStutter: { value: 0.0 },
      uFade: { value: 1.0 },
    },
    vertexShader: `
      attribute vec3 aTarget;
      attribute float aRandom;
      uniform float uProgress;
      uniform float uTime;
      uniform float uStutter;
      void main() {
        vec3 pos = mix(position, aTarget, uProgress);
        float breathe = 1.0 + sin(uTime * 0.9 + aRandom * 6.28) * 0.025;
        pos *= breathe;
        if(uStutter > 0.0) {
          float stutX = sin(aRandom * 100.0 + uTime * 5.0) * uStutter * 0.18;
          float stutY = cos(aRandom * 87.0 + uTime * 4.3) * uStutter * 0.12;
          pos += vec3(stutX, stutY, 0.0);
        }
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (2.0 + aRandom * 1.5) * (1.0 / -mvPos.z * 10.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uFade;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv) * 2.0;
        if(d > 1.0) discard;
        float alpha = 1.0 - smoothstep(0.3, 1.0, d);
        vec3 innerCol = vec3(0.0, 0.95, 0.78);
        vec3 outerCol = vec3(0.2, 0.6, 0.9);
        vec3 col = mix(outerCol, innerCol, 1.0 - d);
        gl_FragColor = vec4(col, alpha * 0.82 * uFade);
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
const s1tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroll-spacer',
    start: 'top top',
    end: '130vh top',
    scrub: 1.0,
    pin: false,
  }
});

// Phase A (0–40%): particles assemble into lung shape
s1tl.to(lungSystem.mat.uniforms.uProgress, {
  value: 1.0, ease: 'power2.out'
}, 0);

// Phase B (30–60%): stutter begins — lung dysfunction
s1tl.to(lungSystem.mat.uniforms.uStutter, {
  value: 0.6, ease: 'power1.in'
}, 0.3);

// Phase C (60–80%): text fades out, lung fades
s1tl.to(lungSystem.mat.uniforms.uFade, {
  value: 0.0, ease: 'power1.in'
}, 0.65);

// Entrance animation (plays on load, not scroll)
gsap.timeline({ delay: 0.3 })
  .to('#s1-text', { opacity: 1, duration: 0.1 })
  .to('#s1-eyebrow', {
    opacity: 1, y: 0,
    startAt: { opacity: 0, y: 20 },
    duration: 0.8, ease: 'power2.out'
  })
  .to('#s1-headline', {
    opacity: 1, y: 0,
    startAt: { opacity: 0, y: 30 },
    duration: 1.0, ease: 'power2.out'
  }, '-=0.4')
  .to('#s1-scroll', { opacity: 1, duration: 0.6 }, '+=0.3');

// Product name appears as lung fades (on scroll)
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '80vh top',
  end: '130vh top',
  scrub: true,
  onUpdate: self => {
    gsap.set('#s1-product', { opacity: self.progress, display: self.progress > 0 ? 'block' : 'none' });
    gsap.set('#s1-text', { opacity: 1 - self.progress * 2 });
    gsap.set('#s1-scroll', { opacity: 1 - self.progress * 3 });
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
  onUpdate: self => {
    const p = self.progress;
    
    // Hide ALL Section 1 HTML the moment we enter Section 2
    gsap.set('#s1-text',    { opacity: 0, display: 'none' });
    gsap.set('#s1-scroll',  { opacity: 0, display: 'none' });
    const s1Opacity = Math.max(0, 1 - p * 8);
    gsap.set('#s1-product', { opacity: s1Opacity, display: s1Opacity > 0 ? 'block' : 'none' });
    
    bronchialTree.visible = p > 0.01 && p < 0.66;
    mucusSystem.points.visible = p > 0 && p < 0.66;
    bloodSystem.visible = p >= 0.66;
    co2Gauge.mesh.visible = p >= 0.66;

    if(p < 0.33) {
      const ap = p / 0.33;
      bronchialTree.children.forEach(m => { m.material.opacity = ap * 0.85; });
      bronchialTree.rotation.y = Math.sin(ap * Math.PI * 0.5) * 0.15;
      gsap.set('#s2a', { opacity: Math.min(ap * 3, 1) });
      gsap.set('#s2b', { opacity: 0 });
      gsap.set('#s2c', { opacity: 0 });
      gsap.set('#s2-panel', { opacity: 1 });
      mucusSystem.mat.uniforms.uAmount.value = 0;
    } else if(p < 0.66) {
      const bp = (p - 0.33) / 0.33;
      mucusSystem.mat.uniforms.uAmount.value = bp;
      bronchialTree.children.forEach(m => {
        m.material.color.setRGB(0.35 + bp * 0.35, 0.20 - bp * 0.10, 0.25 - bp * 0.15);
      });
      gsap.set('#s2a', { opacity: Math.max(0, 1 - bp * 4) });
      gsap.set('#s2b', { opacity: Math.min(bp * 4, 1) });
      gsap.set('#s2c', { opacity: 0 });
    } else {
      const cp = (p - 0.66) / 0.34;
      bloodSystem.children.forEach((m) => {
        m.material.opacity = Math.min(cp * 2, 0.7);
        m.material.color.setRGB(0.0 + cp * 0.91, 0.83 - cp * 0.58, 0.67 - cp * 0.67);
      });
      co2Gauge.mat.uniforms.uLevel.value = cp * 0.9;
      gsap.set('#s2a', { opacity: 0 }); // Ensure Act A is hidden
      gsap.set('#s2b', { opacity: Math.max(0, 1 - cp * 4) });
      gsap.set('#s2c', { opacity: Math.min(cp * 4, 1) });
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
  onUpdate: self => {
    const p = self.progress;
    
    // Hide ALL Section 1 + Section 2 HTML when in Section 3
    gsap.set('#s1-text',    { opacity: 0, display: 'none' });
    gsap.set('#s1-scroll',  { opacity: 0, display: 'none' });
    gsap.set('#s1-product', { opacity: 0, display: 'none' });
    const s2Opacity = Math.max(0, 1 - p * 6);
    gsap.set('#s2-panel', { opacity: s2Opacity, display: s2Opacity > 0 ? 'block' : 'none' });
    bloodSystem.visible = p < 0.15;
    co2Gauge.mesh.visible = p < 0.15;

    // Cards appear
    glassCards.forEach((c, i) => {
      c.mesh.visible = p > 0 && p < 1;
      const delay = i * 0.12;
      const ap = Math.max(0, Math.min(1, (p - delay) / 0.4));
      c.mat.uniforms.uAppear.value = ap;
      c.mesh.position.y = -2.0 + ap * 2.0;
      c.mesh.rotation.x = (1 - ap) * 0.3;
    });

    gsap.set('#s3-cards', { opacity: Math.min(p * 3, 1), display: p > 0 ? 'flex' : 'none' });
    gsap.set('#s3-impact', { opacity: Math.max(0, (p - 0.7) / 0.3), display: p > 0.7 ? 'block' : 'none' });
  }
});

// SECTION UPDATE MODULES
function updateSection3(t) {
  glassCards.forEach((c, i) => {
    if(c.mat) {
      c.mat.uniforms.uTime.value = t;
      c.mesh.position.y += Math.sin(t * 0.7 + i * 2.1) * 0.0005;
      c.mesh.rotation.y = mouse.x * 0.08 + (i - 1) * 0.05;
      c.mesh.rotation.x = mouse.y * 0.05;
    }
  });
}

const updateSection4 = (t) => {};
const updateSection5 = (t) => {};
const updateSection6 = (t) => {};
const updateSection7 = (t) => {};

// RENDER LOOP — single RAF, all sections plug into this
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  
  // Subtle mouse parallax on camera always active
  camera.position.x += (mouse.x * 0.15 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 0.10 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);
  
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
