const fs = require('fs');
const path = require('path');

const url = process.env.VITE_API_URL || process.env.REACT_APP_API_URL || '';
const file = path.join(__dirname, '..', 'public', 'js', 'config.js');
if (!url) {
  console.log('VITE_API_URL is not set; public/js/config.js keeps its local fallback.');
  process.exit(0);
}

const source = fs.readFileSync(file, 'utf8');
const next = source.replace(
  /window\.VITE_API_URL\s*=\s*window\.VITE_API_URL\s*\|\|\s*'';/,
  `window.VITE_API_URL = window.VITE_API_URL || ${JSON.stringify(url.replace(/\/$/, ''))};`
);
fs.writeFileSync(file, next);
console.log('Wrote storefront API URL into public/js/config.js');
