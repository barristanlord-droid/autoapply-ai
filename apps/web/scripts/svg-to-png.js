const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function convert() {
  const files = [
    { input: 'icon-192.svg', output: 'icon-192.png', size: 192 },
    { input: 'icon-512.svg', output: 'icon-512.png', size: 512 },
    { input: 'apple-touch-icon.svg', output: 'apple-touch-icon.png', size: 180 },
    { input: 'favicon.svg', output: 'favicon.ico', size: 32 },
  ];

  for (const { input, output, size } of files) {
    await sharp(path.join(publicDir, input))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, output));
    console.log(`Converted ${input} -> ${output}`);
  }
}

convert().catch(console.error);
