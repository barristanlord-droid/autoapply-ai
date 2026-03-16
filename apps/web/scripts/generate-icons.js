// Generate PNG icons from inline SVG for PWA
const fs = require('fs');
const path = require('path');

const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="900" font-size="${size * 0.45}"
        fill="white" letter-spacing="-${size * 0.02}">A</text>
  <circle cx="${size * 0.72}" cy="${size * 0.28}" r="${size * 0.12}" fill="#60a5fa" opacity="0.8"/>
  <path d="M${size * 0.68} ${size * 0.22} L${size * 0.76} ${size * 0.28} L${size * 0.68} ${size * 0.34}"
        stroke="white" stroke-width="${size * 0.025}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

// Write SVG files that can be used directly
const sizes = { 'icon-192': 192, 'icon-512': 512, 'apple-touch-icon': 180, 'favicon': 32 };

Object.entries(sizes).forEach(([name, size]) => {
  const svg = svgTemplate(size);
  fs.writeFileSync(path.join(publicDir, `${name}.svg`), svg);
  console.log(`Generated ${name}.svg (${size}x${size})`);
});

console.log('\nSVG icons generated. For production, convert to PNG using:');
console.log('npx sharp-cli icon-512.svg -o icon-512.png --width 512 --height 512');
