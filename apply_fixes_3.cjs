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
  // Find matching });
  let open = 0;
  let j = idx + 'ScrollTrigger.create('.length;
  while (j < code.length) {
    if (code[j] === '{') open++;
    else if (code[j] === '}') open--;
    
    // FIX IS HERE: j+3
    if (open === 0 && code.substring(j, j+3) === '});') {
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

code = code.replace(/document\.getElementById\('scroll-spacer'\)\.style\.height[\s\S]*?1100vh';/g, '');
code = code.replace(/setTimeout\(\(\) => ScrollTrigger\.refresh\(true\), \d+\);\n?/g, '');
code = code.replace(/window\.addEventListener\('load', \(\) => \{\n  ScrollTrigger\.refresh\(true\);\n\}\);/g, '');
code = code.replace(/window\.addEventListener\('load', \(\) => \{\n  setTimeout\(\(\) => \{\n    ScrollTrigger\.refresh\(true\);\n    console\.log\('PulmoCare: ScrollTrigger refreshed'\);[\s\S]*?\}\);/g, '');
code = code.replace(/\/\/ Give browser one frame to layout before refreshing\s*requestAnimationFrame\(\(\) => \{\s*ScrollTrigger.refresh\(true\);\s*\}\);/g, '');

// Don't forget updateOLED and updateSection4!
code = code.replace(/function updateOLED\(ctx, tex, state, t\) \{[\s\S]*?tex\.needsUpdate = true;\n\}/g,
`function updateOLED(ctx, tex, state, t) {
  const W = 512, H = 256;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#04090F';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0, 255, 180, 0.025)';
    ctx.fillRect(0, y, W, 1);
  }
  if (state === 'normal') {
    const pulse = 0.65 + Math.sin(t * 2.1) * 0.35;
    const grad = ctx.createRadialGradient(96, 128, 0, 96, 128, 38);
    grad.addColorStop(0, 'rgba(0,212,170,' + (0.9 + pulse * 0.1) + ')');
    grad.addColorStop(1, 'rgba(0,212,170,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(96, 128, 34 + pulse * 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00D4AA';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NORMAL', 155, 110);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#007755';
    ctx.fillText('CO\\u2082 INDEX: 42', 155, 146);
    ctx.fillText('AIRWAYS: CLEAR', 155, 172);
  } else if (state === 'amber') {
    const blink = Math.sin(t * 4.0) > 0;
    ctx.fillStyle = blink ? '#F5A623' : '#7A5010';
    ctx.beginPath(); ctx.arc(90, 100, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F5A623';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPUTUM ALERT', 145, 90);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#CC8820';
    ctx.fillText('CONGESTED', 145, 120);
    ctx.fillText('CLEAR AIRWAY', 145, 148);
    ctx.fillText('NOW', 145, 174);
  } else if (state === 'red') {
    const blink = Math.sin(t * 7.0) > 0;
    if (blink) { ctx.fillStyle = 'rgba(232,64,64,0.18)'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = blink ? '#FF5555' : '#991111';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!! CRITICAL !!', W / 2, 90);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = blink ? '#FFAAAA' : '#CC4444';
    ctx.fillText('IMMEDIATE ACTION', W / 2, 130);
    ctx.fillText('CO\\u2082 CRITICAL', W / 2, 160);
    ctx.fillText('LEVEL', W / 2, 192);
    ctx.textAlign = 'left';
  }
  tex.needsUpdate = true;
}`);

code = code.replace(/function updateSection4\(t\) \{[\s\S]*?\}\n/g,
`function updateSection4(t) {
  if (!deviceGroup || !deviceGroup.visible) return;
  const ud = deviceGroup.userData;
  if (ud && ud.oledCtx && ud.oledTex) {
    updateOLED(ud.oledCtx, ud.oledTex, deviceAlertState, t);
  }
  if (ud && ud.haloMat) {
    ud.haloMat.uniforms.uTime.value = t;
  }
  if (deviceGroup.scale.x > 0.55) {
    deviceGroup.rotation.y += (deviceBaseRotY + mouse.x * 0.45 - deviceGroup.rotation.y) * 0.05;
    deviceGroup.rotation.x += (mouse.y * 0.25 - deviceGroup.rotation.x) * 0.05;
  } else {
    deviceGroup.rotation.y += 0.008;
  }
  const annoEl = document.getElementById('s4-annotations');
  const opacity = annoEl ? parseFloat(annoEl.style.opacity || '0') : 0;
  if (opacity > 0.05) {
    updateAnnotationLines(opacity);
  }
}
`);

// Apply matrix update fix if not already there
if (!code.includes('scene.updateMatrixWorld(true);\n  updateSection4(t);')) {
  code = code.replace('  updateSection4(t);', '  scene.updateMatrixWorld(true);\n  updateSection4(t);');
}

code += '\n' + newController;

fs.writeFileSync('src/main.js', code);
