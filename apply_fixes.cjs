const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

const newController = `
// ═══════════════════════════════════════════════
// COMPLETE SCROLL CONTROLLER — SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════

function showSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.visibility = 'visible';
    el.style.opacity = '1';
  }
}

function hideSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = '0';
    el.style.visibility = 'hidden';
  }
}

function setOpacity(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.style.visibility = value > 0 ? 'visible' : 'hidden';
    el.style.opacity = String(Math.max(0, Math.min(1, value)));
  }
}

// ── SECTION 1: HERO (0 → 130vh) ────────────────
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: 'top top',
  end: '130vh top',
  scrub: 1.0,
  onUpdate: self => {
    const p = self.progress;
    
    // Lung particles: stutter as we scroll
    if (lungSystem && lungSystem.mat) {
      lungSystem.mat.uniforms.uStutter.value =
        p > 0.45 ? (p - 0.45) / 0.40 * 0.5 : 0;
      lungSystem.mat.uniforms.uFade.value =
        p > 0.68 ? 1.0 - (p - 0.68) / 0.32 : 1.0;
    }
    
    // Text: fade out after 60%
    setOpacity('s1-text', p < 0.60 ? 1 : 
      1 - (p - 0.60) / 0.25);
    setOpacity('s1-scroll', 1 - p * 5);
    
    // Product name: fade in after 68%
    setOpacity('s1-product', 
      p > 0.68 ? (p - 0.68) / 0.30 : 0);
    
    // Hide all other sections
    hideSection('s2-panel');
    hideSection('s3-cards');
    hideSection('s4-title');
    hideSection('s7-container');
    hideSection('s8-section');
    hideSection('s10-section');
    
    // Hide 3D objects not needed in hero
    if (bronchialTree) bronchialTree.visible = false;
    if (mucusSystem)   mucusSystem.points.visible = false;
    if (bloodSystem)   bloodSystem.visible = false;
    if (co2Gauge)      co2Gauge.mesh.visible = false;
    if (deviceGroup && deviceGroup.scale.x < 0.1) {
      deviceGroup.visible = false;
    }
    glassCards.forEach(c => {
      if (c.mesh) c.mesh.visible = false;
    });
  }
});

// ── SECTION 2: DISEASE (130vh → 430vh) ─────────
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '130vh top',
  end: '430vh top',
  scrub: 1.2,
  onEnter: () => {
    showSection('s2-panel');
    if (bronchialTree) bronchialTree.visible = true;
    if (mucusSystem)   mucusSystem.points.visible = true;
  },
  onLeave: () => {
    hideSection('s2-panel');
    if (bronchialTree) bronchialTree.visible = false;
    if (mucusSystem)   mucusSystem.points.visible = false;
    if (bloodSystem)   bloodSystem.visible = false;
    if (co2Gauge)      co2Gauge.mesh.visible = false;
  },
  onLeaveBack: () => {
    hideSection('s2-panel');
    if (bronchialTree) bronchialTree.visible = false;
    if (mucusSystem)   mucusSystem.points.visible = false;
  },
  onUpdate: self => {
    const p = self.progress;
    
    // Panel always visible
    setOpacity('s2-panel', 1);
    
    // Sub-panels switch
    if (p < 0.33) {
      const ap = p / 0.33;
      setOpacity('s2a', Math.min(ap * 3, 1));
      setOpacity('s2b', 0);
      setOpacity('s2c', 0);
      
      if (bronchialTree) {
        bronchialTree.visible = true;
        bronchialTree.children.forEach(m => {
          if (m.material) m.material.opacity = ap * 0.85;
        });
      }
      if (mucusSystem && mucusSystem.mat)
        mucusSystem.mat.uniforms.uAmount.value = 0;
      if (bloodSystem)  bloodSystem.visible = false;
      if (co2Gauge)     co2Gauge.mesh.visible = false;
    }
    else if (p < 0.66) {
      const bp = (p - 0.33) / 0.33;
      setOpacity('s2a', 1 - bp * 2);
      setOpacity('s2b', Math.min(bp * 2, 1));
      setOpacity('s2c', 0);
      
      if (bronchialTree) {
        bronchialTree.children.forEach(m => {
          if (m.material) {
            m.material.color.setRGB(
              0.10 + bp * 0.45,
              0.29 - bp * 0.15,
              0.48 - bp * 0.28
            );
          }
        });
      }
      if (mucusSystem && mucusSystem.mat)
        mucusSystem.mat.uniforms.uAmount.value = bp;
      if (bloodSystem)  bloodSystem.visible = false;
      if (co2Gauge)     co2Gauge.mesh.visible = false;
    }
    else {
      const cp = (p - 0.66) / 0.34;
      setOpacity('s2b', 1 - cp * 2);
      setOpacity('s2c', Math.min(cp * 2, 1));
      
      if (bronchialTree) bronchialTree.visible = false;
      if (mucusSystem)   mucusSystem.points.visible = false;
      
      if (bloodSystem) {
        bloodSystem.visible = true;
        bloodSystem.children.forEach(m => {
          if (m.material) {
            m.material.opacity = Math.min(cp * 2, 0.75);
            m.material.color.setRGB(
              cp * 0.91,
              0.83 - cp * 0.64,
              0.67 - cp * 0.67
            );
          }
        });
      }
      if (co2Gauge) {
        co2Gauge.mesh.visible = true;
        if (co2Gauge.mat)
          co2Gauge.mat.uniforms.uLevel.value = cp * 0.90;
      }
    }
  }
});

// ── SECTION 3: MONITORING GAP (430vh → 560vh) ──
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '430vh top',
  end: '560vh top',
  scrub: 1.2,
  onEnter: () => {
    showSection('s3-cards');
    if (bloodSystem)  bloodSystem.visible = false;
    if (co2Gauge)     co2Gauge.mesh.visible = false;
    glassCards.forEach(c => {
      if (c.mesh) c.mesh.visible = true;
    });
  },
  onLeave: () => {
    hideSection('s3-cards');
    hideSection('s3-impact');
    glassCards.forEach(c => {
      if (c.mesh) c.mesh.visible = false;
    });
  },
  onLeaveBack: () => {
    hideSection('s3-cards');
    hideSection('s3-impact');
  },
  onUpdate: self => {
    const p = self.progress;
    
    setOpacity('s3-cards', Math.min(p * 5, 1));
    setOpacity('s3-impact', 
      p > 0.70 ? (p - 0.70) / 0.25 : 0);
    
    glassCards.forEach((c, i) => {
      if (!c.mesh || !c.mat) return;
      const delay = i * 0.10;
      const ap = Math.max(0, Math.min(1, 
        (p - delay) / 0.50));
      const eased = ap * ap * (3 - 2 * ap);
      c.mesh.position.y = -2.5 + eased * 2.5;
      c.mesh.rotation.x = (1 - eased) * 0.30;
      c.mat.uniforms.uAppear.value = eased;
    });
  }
});

// ── SECTION 4: DEVICE REVEAL (560vh → 730vh) ───
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '560vh top',
  end: '730vh top',
  scrub: 1.2,
  onEnter: () => {
    if (deviceGroup) {
      deviceGroup.visible = true;
    }
  },
  onLeaveBack: () => {
    if (deviceGroup) {
      deviceGroup.visible = false;
      deviceGroup.scale.setScalar(0);
      deviceGroup.position.set(0, 0, 0);
    }
    hideSection('s4-annotations');
    hideSection('s4-title');
  },
  onUpdate: self => {
    const p = self.progress;
    if (!deviceGroup) return;
    deviceGroup.visible = true;
    
    if (p < 0.40) {
      // Spin in from nothing
      const ap = p / 0.40;
      const e  = 1 - Math.pow(1 - ap, 3);
      deviceGroup.scale.setScalar(e);
      deviceGroup.position.set(0, (1 - e) * -3, 0);
      deviceBaseRotY = (1 - e) * Math.PI * 2.2;
      
      hideSection('s4-annotations');
      hideSection('s4-title');
    }
    else if (p < 0.75) {
      // Centre — show annotations and title
      const bp = (p - 0.40) / 0.35;
      deviceGroup.scale.setScalar(1.0);
      deviceGroup.position.set(0, 0, 0);
      deviceBaseRotY = bp * 0.55;
      
      setOpacity('s4-annotations', 
        Math.min(bp * 3, 1));
      setOpacity('s4-title', 
        Math.min(bp * 3, 1));
      deviceAlertState = 'normal';
    }
    else {
      // Move to corner
      const cp = (p - 0.75) / 0.25;
      const e  = cp * cp * (3 - 2 * cp);
      deviceGroup.scale.setScalar(1.0 - e * 0.70);
      deviceGroup.position.set(e * 3.8, e * 2.4, 0);
      
      setOpacity('s4-annotations', 
        Math.max(0, 1 - cp * 3));
      setOpacity('s4-title', 
        Math.max(0, 1 - cp * 3));
    }
  }
});

// ── SECTION 7: STORY (730vh → 900vh) ────────────
let lastBeatIndex = -1;

ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '730vh top',
  end: '900vh top',
  scrub: 1.2,
  onEnter: () => {
    showSection('s7-container');
    if (storyEnv && storyEnv.group)
      storyEnv.group.visible = true;
  },
  onLeave: () => {
    hideSection('s7-container');
    if (storyEnv && storyEnv.group)
      storyEnv.group.visible = false;
  },
  onLeaveBack: () => {
    hideSection('s7-container');
    if (storyEnv && storyEnv.group)
      storyEnv.group.visible = false;
  },
  onUpdate: self => {
    const p = self.progress;
    setOpacity('s7-container', Math.min(p * 8, 1));
    
    const beatIndex = Math.min(
      Math.floor(p * storyBeats.length),
      storyBeats.length - 1
    );
    
    // Only update DOM on beat change
    if (beatIndex !== lastBeatIndex) {
      lastBeatIndex = beatIndex;
      const beat = storyBeats[beatIndex];
      
      const timeEl   = document.getElementById('s7-time');
      const statusEl = document.getElementById('s7-status');
      const descEl   = document.getElementById('s7-desc');
      const cardEl   = document.getElementById('s7-card');
      
      if (timeEl)   timeEl.textContent   = beat.time;
      if (statusEl) {
        statusEl.textContent = beat.status;
        statusEl.style.color = beat.statusColor;
      }
      if (descEl)   descEl.textContent   = beat.description;
      if (cardEl) {
        cardEl.style.borderColor = beat.statusColor + '44';
        cardEl.style.boxShadow   = 
          '0 0 40px ' + beat.statusColor + '18';
      }
      
      deviceAlertState = beat.alertState;
      
      if (storyEnv && storyEnv.deviceLight) {
        storyEnv.deviceLight.color.setHex(beat.lightColor);
        storyEnv.deviceLight.intensity =
          beat.alertState === 'red'   ? 3.0 :
          beat.alertState === 'amber' ? 2.2 : 1.6;
      }
      
      if (storyEnv && storyEnv.phoneCanvas 
          && storyEnv.phoneTex) {
        updatePhoneScreen(
          storyEnv.phoneCanvas, storyEnv.phoneTex, beat);
      }
    }
    
    const graphEl = document.getElementById('s7-graph');
    if (graphEl) drawCO2Graph(graphEl, beatIndex);
    
    setOpacity('s7-final',
      Math.max(0, (p - 0.87) / 0.13));
  }
});

// ── SECTION 8: SPECS (900vh → 970vh) ────────────
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '900vh top',
  end: '970vh top',
  scrub: 1.0,
  onEnter: () => showSection('s8-section'),
  onLeave: () => hideSection('s8-section'),
  onLeaveBack: () => hideSection('s8-section'),
  onUpdate: self => {
    const p = self.progress;
    setOpacity('s8-section', Math.min(p * 5, 1));
    
    const cards = document.querySelectorAll('.spec-card');
    cards.forEach((card, i) => {
      const delay = i * 0.08;
      const cp = Math.max(0, Math.min(1,
        (p - delay) / 0.50));
      const eased = cp * cp * (3 - 2 * cp);
      card.style.opacity    = String(eased);
      card.style.transform  = 
        'translateY(' + ((1 - eased) * 22) + 'px)';
    });
  }
});

// ── SECTION 10: CLOSING (970vh → 1070vh) ────────
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: '970vh top',
  end: '1070vh top',
  scrub: 1.0,
  onEnter: () => showSection('s10-section'),
  onLeaveBack: () => hideSection('s10-section'),
  onUpdate: self => {
    const p = self.progress;
    setOpacity('s8-section',  Math.max(0, 1 - p * 4));
    setOpacity('s10-section', Math.min(p * 4, 1));
    
    // Healthy lung returns
    if (lungSystem && lungSystem.mat) {
      lungSystem.mat.uniforms.uFade.value    = 
        Math.min(p * 2, 1);
      lungSystem.mat.uniforms.uStutter.value = 0;
    }
  }
});

// ── SCROLL SPACER HEIGHT ─────────────────────────
document.getElementById('scroll-spacer').style.height 
  = '1100vh';

// ── FINAL REFRESH ────────────────────────────────
setTimeout(() => ScrollTrigger.refresh(true), 600);
window.addEventListener('load', () => {
  ScrollTrigger.refresh(true);
});
`;

let result = '';
let i = 0;
while (i < code.length) {
  let idx = code.indexOf('ScrollTrigger.create({', i);
  if (idx === -1) {
    result += code.slice(i);
    break;
  }
  result += code.slice(i, idx);
  let open = 0;
  let j = idx + 'ScrollTrigger.create('.length;
  while (j < code.length) {
    if (code[j] === '{') open++;
    else if (code[j] === '}') open--;
    
    if (open === 0 && code.substring(j, j+2) === '});') {
      j += 3;
      break;
    }
    j++;
  }
  i = j;
}
code = result;

code = code.replace(/\/\/\s+─────────────────────────────────────────────\s*\n\/\/\s+MASTER SECTION CONTROLLER[\s\S]*?showOnly\([\s\S]*?\}\n/g, '');
code = code.replace(/const SECTION_RANGES = \[[\s\S]*?\];/g, '');
code = code.replace(/function hideAllSections\(\)\s*\{[\s\S]*?\}\n/g, '');
code = code.replace(/setTimeout\(\(\) => \{\n  ScrollTrigger\.refresh\(true\);\n\}, \d+\);\n/g, '');
code = code.replace(/window\.addEventListener\('load', \(\) => \{\n  ScrollTrigger\.refresh\(true\);\n\}\);/g, '');
code = code.replace(/window\.addEventListener\('load', \(\) => \{\n  setTimeout\(\(\) => \{\n    ScrollTrigger\.refresh\(true\);\n    console\.log\('PulmoCare: ScrollTrigger refreshed'\);\n    console\.log\('Total scroll height:', \n      document\.body\.scrollHeight, 'px'\);\n    console\.log\('Expected: ~', 1100 \* window\.innerHeight \/ 100, 'px'\);\n  \}, 800\);\n\}\);/g, '');

code += '\n' + newController;

if (!code.includes('function initAllSectionsHidden()')) {
  code = code.replace('ScrollTrigger.defaults({\r\n  scroller: window\r\n});', 
  'ScrollTrigger.defaults({\n  scroller: window\n});\n\nfunction initAllSectionsHidden() {\n  const hideList = [\n    \'s1-text\', \'s1-product\', \'s1-scroll\',\n    \'s2-panel\', \'s2a\', \'s2b\', \'s2c\',\n    \'s3-cards\', \'s3-impact\',\n    \'s4-annotations\', \'s4-title\',\n    \'s7-container\', \'s7-final\',\n    \'s8-section\', \'s10-section\'\n  ];\n  \n  hideList.forEach(id => {\n    const el = document.getElementById(id);\n    if (el) {\n      el.style.opacity = \'0\';\n      el.style.visibility = \'hidden\';\n    }\n  });\n  \n  for (let i = 0; i < 6; i++) {\n    const anno = document.getElementById(\'anno-\' + i);\n    if (anno) anno.style.opacity = \'0\';\n  }\n  \n  document.querySelectorAll(\'.spec-card\').forEach(card => {\n    card.style.opacity = \'0\';\n    card.style.transform = \'translateY(24px)\';\n  });\n}');
  
  code = code.replace('ScrollTrigger.defaults({\n  scroller: window\n});', '');
  
  code = code.replace('composer.addPass(bloomPass);', 
  'composer.addPass(bloomPass);\n\nif (document.readyState === \'loading\') {\n  document.addEventListener(\'DOMContentLoaded\', () => {\n    initAllSectionsHidden();\n  });\n} else {\n  initAllSectionsHidden();\n}');
}

if (!code.includes('setTimeout(startHeroEntrance, 1000)')) {
  code = code.replace(/gsap\.to\(lungSystem\.mat\.uniforms\.uProgress, \{[\s\S]*?\}\);/,
  'gsap.to(lungSystem.mat.uniforms.uProgress, {\n  value: 1.0,\n  duration: 2.2,\n  delay: 0.3,\n  ease: \'power2.out\',\n  onComplete: startHeroEntrance\n});\nsetTimeout(startHeroEntrance, 1000);');
}

if (!code.includes('textWrapper.style.visibility = \'visible\';')) {
  code = code.replace(/function startHeroEntrance\(\) \{[\s\S]*?\}\n/,
  'function startHeroEntrance() {\n  const textWrapper = document.getElementById(\'s1-text\');\n  const eyebrow = document.getElementById(\'s1-eyebrow\');\n  const headline = document.getElementById(\'s1-headline\');\n  const scrollInd = document.getElementById(\'s1-scroll\');\n  \n  if (textWrapper) {\n    textWrapper.style.opacity = \'1\';\n    textWrapper.style.visibility = \'visible\';\n  }\n  \n  if (eyebrow) {\n    eyebrow.style.opacity = \'0\';\n    eyebrow.style.transform = \'translateY(18px)\';\n    eyebrow.style.transition = \'opacity 0.9s ease, transform 0.9s ease\';\n    setTimeout(() => {\n      eyebrow.style.opacity = \'1\';\n      eyebrow.style.transform = \'translateY(0)\';\n    }, 400);\n  }\n  \n  if (headline) {\n    headline.style.opacity = \'0\';\n    headline.style.transform = \'translateY(28px)\';\n    headline.style.transition = \'opacity 1.1s ease, transform 1.1s ease\';\n    setTimeout(() => {\n      headline.style.opacity = \'1\';\n      headline.style.transform = \'translateY(0)\';\n    }, 700);\n  }\n  \n  if (scrollInd) {\n    scrollInd.style.opacity = \'0\';\n    scrollInd.style.visibility = \'visible\';\n    scrollInd.style.transition = \'opacity 0.7s ease\';\n    setTimeout(() => {\n      scrollInd.style.opacity = \'1\';\n    }, 1500);\n  }\n}\n');
}

if (!code.includes('deviceGroup.scale.setScalar(0);')) {
  code = code.replace('const deviceGroup = buildDevice();', 
  'const deviceGroup = buildDevice();\ndeviceGroup.visible = false;\ndeviceGroup.scale.setScalar(0);\ndeviceGroup.position.set(0, 0, 0);\ndeviceGroup.rotation.set(0, 0, 0);');
}

if (!code.includes('if (deviceGroup.scale.x > 0.5) {')) {
  code = code.replace(/function updateSection4\(t\) \{[\s\S]*?\}\n/g,
  'function updateSection4(t) {\n  if (!deviceGroup || !deviceGroup.visible) return;\n  \n  const ud = deviceGroup.userData;\n  if (ud && ud.oledCtx && ud.oledTex) {\n    updateOLED(ud.oledCtx, ud.oledTex, deviceAlertState, t);\n  }\n  if (ud && ud.haloMat) {\n    ud.haloMat.uniforms.uTime.value = t;\n  }\n  \n  if (deviceGroup.scale.x > 0.5) {\n    const targetRotY = deviceBaseRotY + mouse.x * 0.45;\n    const targetRotX = mouse.y * 0.25;\n    deviceGroup.rotation.y += (targetRotY - deviceGroup.rotation.y) * 0.06;\n    deviceGroup.rotation.x += (targetRotX - deviceGroup.rotation.x) * 0.06;\n  }\n  \n  const annoEl = document.getElementById(\'s4-annotations\');\n  const annoOpacity = annoEl ? parseFloat(annoEl.style.opacity || \'0\') : 0;\n  if (annoOpacity > 0.05) {\n    updateAnnotationLines(annoOpacity);\n  }\n}\n');
}

if (!code.includes('1.2, 5.5')) {
  code = code.replace(/gl_PointSize = clamp\([\s\S]*?\);/,
  'gl_PointSize = clamp(\n          (2.5 + aRandom * 1.8) * (10.0 / -mvPos.z),\n          1.2, 5.5\n        );');
}

if (!code.includes('coreColor = vec3(0.05, 0.85, 0.70)')) {
  code = code.replace(/fragmentShader: \`[\s\S]*?\`,/m,
  'fragmentShader: `\n      uniform float uFade;\n      \n      void main() {\n        vec2 coord = gl_PointCoord - 0.5;\n        float dist = length(coord) * 2.0;\n        if (dist > 1.0) discard;\n        \n        float alpha = 1.0 - smoothstep(0.15, 1.0, dist);\n        \n        vec3 coreColor = vec3(0.05, 0.85, 0.70);\n        vec3 edgeColor = vec3(0.10, 0.45, 0.72);\n        vec3 col = mix(edgeColor, coreColor, 1.0 - dist);\n        \n        col = max(col, vec3(0.08, 0.30, 0.45));\n        col = min(col, vec3(0.88, 0.92, 0.85));\n        \n        gl_FragColor = vec4(col, alpha * 0.82 * uFade);\n      }\n    `,');
}

fs.writeFileSync('src/main.js', code);
