const fs = require('fs');
const path = require('path');

// Simple SVG icon generator
function generateIcon(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#4f46e5" rx="${size * 0.2}"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="${size * 0.5}" fill="white">🚀</text>
  </svg>`;
  return svg;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svg = generateIcon(size);
  fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.png`), svg);
  console.log(`Generated icon-${size}x${size}.png`);
});

console.log('\n✅ All PWA icons generated!');
