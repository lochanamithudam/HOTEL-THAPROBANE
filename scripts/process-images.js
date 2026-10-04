const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'images');
const destDir = path.join(__dirname, '..', 'assets', 'images', 'heritage');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const images = [
  { file: 'pasikuda_pool_view.jpg', key: 'resort-pool' },
  { file: 'hotel_spa_wellness.jpg', key: 'spa-wellness' },
  { file: 'hotel_dining_view.jpg', key: 'beachfront-dining' },
  { file: 'hotel_luxury_room.jpg', key: 'luxury-villa' }
];

const widths = [480, 800, 1376];

async function processImages() {
  console.log('Processing images...');
  for (const item of images) {
    const srcPath = path.join(srcDir, item.file);
    const meta = await sharp(srcPath).metadata();
    console.log(`Source: ${item.file} (${meta.width}x${meta.height}, format: ${meta.format})`);

    // Copy original to dest
    fs.copyFileSync(srcPath, path.join(destDir, item.file));

    // Generate responsive WebP and JPEG variants
    for (const w of widths) {
      const targetW = Math.min(w, meta.width);

      // WebP
      const webpName = `${path.parse(item.file).name}-${targetW}w.webp`;
      await sharp(srcPath)
        .resize(targetW)
        .webp({ quality: 82, effort: 6 })
        .toFile(path.join(destDir, webpName));

      // JPEG
      const jpgName = `${path.parse(item.file).name}-${targetW}w.jpg`;
      await sharp(srcPath)
        .resize(targetW)
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(destDir, jpgName));

      console.log(`  Generated: ${webpName} and ${jpgName}`);
    }
  }
  console.log('All responsive assets generated successfully.');
}

processImages().catch(err => {
  console.error('Error processing images:', err);
  process.exit(1);
});
