const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

code = code.replace(/start:\s*'([0-9.]+)vh top'/g, (m, vh) => {
  return `start: () => window.innerHeight * (${vh} / 100)`;
});

code = code.replace(/end:\s*'([0-9.]+)vh top'/g, (m, vh) => {
  return `end: () => window.innerHeight * (${vh} / 100)`;
});

fs.writeFileSync('src/main.js', code);
console.log('Fixed GSAP triggers');
