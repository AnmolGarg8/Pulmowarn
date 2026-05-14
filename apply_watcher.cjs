const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

const target = /\/\/ Define which scroll ranges own which sections[\s\S]*?\/\/ Add a single master watcher that hides inactive sections/;

const replacement = `// Define which scroll ranges own which sections
const SECTION_RANGES = [
  { start: 0,    end: 130,  active: ['s1-text','s1-product','s1-scroll'] },
  { start: 130,  end: 430,  active: ['s2-panel'] },
  { start: 430,  end: 560,  active: ['s3-cards','s3-impact'] },
  { start: 560,  end: 730,  active: ['s4-annotations','s4-title'] },
  { start: 730,  end: 900,  active: ['s7-container'] },
  { start: 900,  end: 970,  active: ['s8-section'] },
  { start: 970,  end: 1100, active: ['s10-section', 's8-section'] },
];

// Add a single master watcher that hides inactive sections
ScrollTrigger.create({
  trigger: '#scroll-spacer',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0,
  onUpdate: self => {
    const scrollVH = self.progress * 1100;
    const activeRange = SECTION_RANGES.find(
      r => scrollVH >= r.start && scrollVH < r.end
    );
    if(activeRange) {
      showOnly(activeRange.active);
    }
  }
});`;

const newCode = code.replace(target, replacement);
fs.writeFileSync('src/main.js', newCode);
console.log('Fixed master watcher');
