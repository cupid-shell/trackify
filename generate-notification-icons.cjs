const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Pure white logo silhouette on a transparent background for Android status bar icons
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" viewBox="0 0 48 46">
  <path fill="#ffffff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
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
