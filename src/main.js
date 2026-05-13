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
    // Fade out lung particles as we move to disease section
    if(lungSystem.mat) {
      lungSystem.mat.uniforms.uFade.value = 1 - self.progress;
    }
    lungSystem.points.visible = self.progress < 0.99;
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
    
    // Hide ALL Section 1 HTML & 3D the moment we enter Section 2
    gsap.set('#s1-text',    { opacity: 0, display: 'none' });
    gsap.set('#s1-scroll',  { opacity: 0, display: 'none' });
    lungSystem.points.visible = false;
    
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
    
    // Hide ALL Section 1 + Section 2 HTML & 3D when in Section 3
    gsap.set('#s1-text',    { opacity: 0, display: 'none' });
    gsap.set('#s1-scroll',  { opacity: 0, display: 'none' });
    gsap.set('#s1-product', { opacity: 0, display: 'none' });
    lungSystem.points.visible = false;
    bronchialTree.visible = false;
    mucusSystem.points.visible = false;
    
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

// Annotation attachment & offset data
const annoAttachPoints = [
  new THREE.Vector3(-0.75,  0.05,  0.14),
  new THREE.Vector3( 0.25,  0.05,  0.14),
  new THREE.Vector3( 0.80, -0.30,  0.10),
  new THREE.Vector3( 0.0,  -0.50,  0.14),
  new THREE.Vector3(-1.0,   0.30,  0.10),
  new THREE.Vector3( 1.0,  -0.10,  0.14),
];
const annoOffsets = [
  [-180, -80], [120, -100],
  [130, 40],   [0, 100],
  [-200, 60],  [130, -60],
];

function updateAnnotationLines(annoVis) {
  const linesCanvas = document.getElementById('annotation-lines');
  if(!linesCanvas) return;
  linesCanvas.width  = window.innerWidth;
  linesCanvas.height = window.innerHeight;
  const ctx = linesCanvas.getContext('2d');
  ctx.clearRect(0, 0, linesCanvas.width, linesCanvas.height);
  if(annoVis <= 0) return;

  annoAttachPoints.forEach((localPt, i) => {
    const worldPt = localPt.clone().applyMatrix4(deviceGroup.matrixWorld);
    const screenPt = worldPt.clone().project(camera);
    const sx = (screenPt.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-screenPt.y * 0.5 + 0.5) * window.innerHeight;
    const lx = sx + annoOffsets[i][0];
    const ly = sy + annoOffsets[i][1];

    const el = document.getElementById(`anno-${i}`);
    if(el) {
      el.style.left = (lx + (annoOffsets[i][0] > 0 ? 0 : -el.offsetWidth)) + 'px';
      el.style.top  = (ly - el.offsetHeight / 2) + 'px';
      el.style.opacity = annoVis;
    }

    ctx.globalAlpha = annoVis * 0.6;
    ctx.strokeStyle = '#00D4AA';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = annoVis;
    ctx.fillStyle = '#00D4AA';
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI*2); ctx.fill();
  });
}

let deviceBaseRotY = 0;

// SECTION 4 — SCROLLTRIGGER
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '560vh top',
  end: '730vh top',
  scrub: 1.2,
  onUpdate: self => {
    const p = self.progress;

    // Clean up Section 3 elements
    gsap.set('#s3-cards',  { opacity: Math.max(0, 1 - p * 6), display: p < 0.15 ? 'flex' : 'none' });
    gsap.set('#s3-impact', { opacity: Math.max(0, 1 - p * 6), display: p < 0.15 ? 'block' : 'none' });
    glassCards.forEach(c => { c.mesh.visible = p < 0.15; });
    
    // Ensure previous sections are hidden
    lungSystem.points.visible = false;
    bronchialTree.visible = false;
    mucusSystem.points.visible = false;
    bloodSystem.visible = false;
    co2Gauge.mesh.visible = false;

    deviceGroup.visible = p > 0;

    if(p < 0.4) {
      const ap = p / 0.4;
      const eased = 1 - Math.pow(1 - ap, 3);
      deviceGroup.scale.setScalar(eased);
      deviceGroup.rotation.y = (1 - eased) * Math.PI * 2.5;
      deviceGroup.position.y = (1 - eased) * -2;
      deviceGroup.position.x = 0;
      gsap.set('#s4-title',       { opacity: 0 });
      gsap.set('#s4-annotations', { opacity: 0 });
    } else if(p < 0.75) {
      deviceGroup.scale.setScalar(1.0);
      deviceGroup.position.set(0, 0, 0);
      const bp = (p - 0.4) / 0.35;
      gsap.set('#s4-annotations', { opacity: Math.min(bp * 2, 1) });
      gsap.set('#s4-title',       { opacity: Math.min(bp * 2, 1) });
      deviceBaseRotY = bp * 0.8;
      deviceAlertState = 'normal';
    } else {
      const cp = (p - 0.75) / 0.25;
      deviceGroup.position.set(cp * 3.5, cp * 2.2, 0);
      deviceGroup.scale.setScalar(1.0 - cp * 0.65);
      gsap.set('#s4-annotations', { opacity: Math.max(0, 1 - cp * 3) });
      gsap.set('#s4-title',       { opacity: Math.max(0, 1 - cp * 3) });
    }
  }
});

function updateSection4(t) {
  if(!deviceGroup.visible) return;
  const ud = deviceGroup.userData;
  if(ud.oledCtx) updateOLED(ud.oledCtx, ud.oledTex, deviceAlertState, t);
  if(ud.haloMat) ud.haloMat.uniforms.uTime.value = t;
  deviceGroup.rotation.y = deviceBaseRotY + mouse.x * 0.4;
  deviceGroup.rotation.x = mouse.y * 0.25;
  const annoEl = document.getElementById('s4-annotations');
  const annoVis = annoEl ? parseFloat(annoEl.style.opacity || '0') : 0;
  updateAnnotationLines(annoVis);
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
    new THREE.MeshStandardMaterial({ color: 0x060C18, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.5;
  group.add(floor);

  // Bed
  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.3, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1A2840, roughness: 0.9 })
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
    new THREE.MeshStandardMaterial({ color: 0xC8A882, roughness: 0.85 })
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
  const roomLight = new THREE.PointLight(0xFFAA55, 0.5, 8);
  roomLight.position.set(1.5, 0, 1);
  group.add(roomLight);

  const deviceLight = new THREE.PointLight(0x00D4AA, 1.5, 4);
  deviceLight.position.set(-0.3, -1.5, 1);
  group.add(deviceLight);

  group.visible = false;
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

// Section 7 ScrollTrigger
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '730vh top',
  end: '900vh top',
  scrub: 1.2,
  onUpdate: self => {
    const p = self.progress;
    storyEnv.group.visible = true;

    // Clean up Section 4 elements
    gsap.set('#s4-annotations', { opacity: Math.max(0, 1 - p * 6), display: p < 0.15 ? 'block' : 'none' });
    gsap.set('#s4-title',       { opacity: Math.max(0, 1 - p * 6), display: p < 0.15 ? 'block' : 'none' });

    gsap.set('#s7-container', { opacity: Math.min(p * 5, 1) });

    const beatIndex = Math.min(Math.floor(p * storyBeats.length), storyBeats.length - 1);
    const beat = storyBeats[beatIndex];

    deviceAlertState = beat.alertState;
    storyEnv.deviceLight.color.setHex(beat.lightColor);
    storyEnv.deviceLight.intensity = beat.alertState === 'red' ? 3.0 : beat.alertState === 'amber' ? 2.0 : 1.5;

    const timeEl   = document.getElementById('s7-time');
    const statusEl = document.getElementById('s7-status');
    const descEl   = document.getElementById('s7-desc');
    const cardEl   = document.getElementById('s7-card');
    if(timeEl)   timeEl.textContent    = beat.time;
    if(statusEl) { statusEl.textContent = beat.status; statusEl.style.color = beat.statusColor; }
    if(descEl)   descEl.textContent    = beat.description;
    if(cardEl)   cardEl.style.borderColor = beat.statusColor + '33';

    updatePhoneScreen(storyEnv.phoneCanvas, storyEnv.phoneTex, beat);

    const graphEl = document.getElementById('s7-graph');
    if(graphEl && graphEl.offsetWidth > 0) drawCO2Graph(graphEl, beatIndex);

    gsap.set('#s7-final', { opacity: Math.max(0, (p - 0.88) / 0.12) });

    camera.position.z = 5 + Math.sin(p * Math.PI) * 1.5;
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
  end: '960vh top',
  scrub: 1.0,
  onUpdate: self => {
    const p = self.progress;
    storyEnv.group.visible = p < 0.2;
    gsap.set('#s7-container', { opacity: Math.max(0, 1 - p * 5) });
    gsap.set('#s8-section',   { opacity: Math.min(p * 3, 1) });
    gsap.set('#s10-section',  { opacity: 0 });
  }
});

ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '960vh top',
  end: '1040vh top',
  scrub: 1.0,
  onUpdate: self => {
    const p = self.progress;
    gsap.set('#s8-section',  { opacity: Math.max(0, 1 - p * 2) });
    gsap.set('#s10-section', { opacity: Math.min(p * 2, 1) });
    // Restore healthy lung in closing
    if(p > 0.3 && lungSystem.mat) {
      lungSystem.points.visible = true;
      lungSystem.mat.uniforms.uFade.value    = (p - 0.3) / 0.7;
      lungSystem.mat.uniforms.uStutter.value = 0;
      lungSystem.mat.uniforms.uProgress.value = 1.0;
    } else {
      lungSystem.points.visible = false;
    }
  }
});

// Extend page height and refresh triggers
document.getElementById('scroll-spacer').style.height = '1050vh';
ScrollTrigger.refresh();

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
