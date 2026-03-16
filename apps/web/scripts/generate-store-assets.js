const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'store-assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// Generate Play Store feature graphic (1024x500)
async function generateFeatureGraphic() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f172a"/>
        <stop offset="100%" style="stop-color:#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    <text x="512" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="72" fill="#3b82f6">Careerly</text>
    <text x="512" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="36" fill="white">Land your dream job 10x faster</text>
    <text x="512" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#94a3b8">AI-powered CV matching &amp; auto-apply</text>
    <text x="512" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Serving the UK &amp; EU</text>
    <rect x="380" y="420" width="264" height="44" rx="22" fill="#2563eb"/>
    <text x="512" y="448" text-anchor="middle" font-family="Arial, sans-serif" font-weight="600" font-size="16" fill="white">Get Started Free</text>
  </svg>`;

  await sharp(Buffer.from(svg)).resize(1024, 500).png().toFile(path.join(assetsDir, 'feature-graphic-1024x500.png'));
  console.log('Generated: feature-graphic-1024x500.png');
}

// Generate App Store promotional text image (1284x2778 for iPhone 15 Pro Max)
async function generatePhoneScreenshot(name, width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0f172a"/>
        <stop offset="100%" style="stop-color:#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <text x="${width/2}" y="${height*0.15}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="${width*0.08}" fill="#3b82f6">Careerly</text>
    <text x="${width/2}" y="${height*0.25}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${width*0.045}" fill="white">AI-Powered Job Search</text>
    <text x="${width/2}" y="${height*0.32}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${width*0.032}" fill="#94a3b8">Upload your CV. We do the rest.</text>
    <rect x="${width*0.1}" y="${height*0.38}" width="${width*0.8}" height="${height*0.5}" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="${width/2}" y="${height*0.48}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${width*0.04}" fill="white">Good evening, User</text>
    <text x="${width/2}" y="${height*0.53}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${width*0.028}" fill="#64748b">Your job search at a glance</text>
    <rect x="${width*0.15}" y="${height*0.57}" width="${width*0.7}" height="${height*0.08}" rx="12" fill="#7c3aed"/>
    <text x="${width/2}" y="${height*0.62}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="600" font-size="${width*0.025}" fill="white">Complete your profile — 20%</text>
    <rect x="${width*0.15}" y="${height*0.68}" width="${width*0.32}" height="${height*0.1}" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="${width*0.31}" y="${height*0.72}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${width*0.05}" fill="#3b82f6">12</text>
    <text x="${width*0.31}" y="${height*0.76}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${width*0.02}" fill="#64748b">Job Matches</text>
    <rect x="${width*0.53}" y="${height*0.68}" width="${width*0.32}" height="${height*0.1}" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="${width*0.69}" y="${height*0.72}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${width*0.05}" fill="#10b981">5</text>
    <text x="${width*0.69}" y="${height*0.76}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${width*0.02}" fill="#64748b">Applied</text>
    <text x="${width/2}" y="${height*0.95}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${width*0.022}" fill="#475569">UK &amp; EU Job Market</text>
  </svg>`;

  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(path.join(assetsDir, `${name}.png`));
  console.log(`Generated: ${name}.png`);
}

// Generate app icon for stores (1024x1024)
async function generateStoreIcon() {
  const iconSvg = fs.readFileSync(path.join(__dirname, '..', 'public', 'icon-512.svg'), 'utf-8');
  await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'app-icon-1024x1024.png'));
  console.log('Generated: app-icon-1024x1024.png');
}

async function main() {
  await generateFeatureGraphic();
  // iPhone 6.7" (iPhone 15 Pro Max)
  await generatePhoneScreenshot('screenshot-iphone-6.7', 1290, 2796);
  // iPhone 6.5" (iPhone 14 Plus)
  await generatePhoneScreenshot('screenshot-iphone-6.5', 1284, 2778);
  // iPhone 5.5" (iPhone 8 Plus)
  await generatePhoneScreenshot('screenshot-iphone-5.5', 1242, 2208);
  // Android phone
  await generatePhoneScreenshot('screenshot-android-phone', 1080, 1920);
  // Android 7" tablet
  await generatePhoneScreenshot('screenshot-android-7inch', 1200, 1920);
  // Android 10" tablet
  await generatePhoneScreenshot('screenshot-android-10inch', 1920, 1200);
  await generateStoreIcon();

  console.log('\nAll store assets generated in apps/web/store-assets/');
  console.log('\nNote: These are placeholder screenshots. For the actual store submission,');
  console.log('take real screenshots of the running app on each device size.');
}

main().catch(console.error);
