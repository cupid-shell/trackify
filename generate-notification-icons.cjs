const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Pure white logo silhouette on a transparent background for Android status bar icons
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect x="12" y="24" width="6" height="12" rx="2.5" fill="#ffffff" />
  <rect x="21" y="16" width="6" height="20" rx="2.5" fill="#ffffff" />
  <rect x="30" y="8" width="6" height="28" rx="2.5" fill="#ffffff" />
  <path d="M8 30 C 16 26, 24 16, 38 12" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="38" cy="12" r="3" fill="#ffffff" />
</svg>`;

const sizes = [
  { dir: 'drawable-mdpi', size: 24 },
  { dir: 'drawable-hdpi', size: 36 },
  { dir: 'drawable-xhdpi', size: 48 },
  { dir: 'drawable-xxhdpi', size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 },
  { dir: 'drawable', size: 96 } // default fallback
];

async function generate() {
  const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
  const buffer = Buffer.from(svgContent);

  for (const s of sizes) {
    const targetDir = path.join(resDir, s.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, 'ic_stat_ic_notification.png');
    await sharp(buffer)
      .resize(s.size, s.size)
      .png()
      .toFile(targetFile);
    console.log(`Generated: ${targetFile}`);
  }
}

generate().catch(console.error);
