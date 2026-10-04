const path = require('path');
const fs = require('fs');

async function run() {
  const puppeteer = require('puppeteer-core');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const htmlPath = 'file:///' + path.resolve(__dirname, '..', 'home-sanctuary.html').replace(/\\/g, '/');
  const artifactDir = 'C:\\Users\\MITHUU\\.gemini\\antigravity-ide\\brain\\71af7a6d-869c-48f0-93d5-2d38e888bb04';

  console.log('Launching Edge from:', edgePath);
  console.log('Target URL:', htmlPath);

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const viewports = [
    { width: 1366, height: 900, name: 'heritage_1366px.png' },
    { width: 1920, height: 1080, name: 'heritage_1920px.png' },
    { width: 3840, height: 2160, name: 'heritage_3840px.png' },
    { width: 390, height: 844, name: 'heritage_mobile_390px.png' }
  ];

  for (const vp of viewports) {
    console.log(`Capturing at ${vp.width}x${vp.height}...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto(htmlPath, { waitUntil: 'networkidle2' });

    await page.evaluate(async () => {
      const header = document.querySelector('.luxury-top-nav, .site-header');
      if (header) header.style.display = 'none';
      const el = document.getElementById('brand-story');
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
      const collage = document.getElementById('heritageCollage');
      if (collage) {
        collage.querySelectorAll('.collage-item').forEach(item => item.classList.add('is-revealed'));
      }
      const imgs = Array.from(document.querySelectorAll('#heritageCollage img'));
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = img.onerror = resolve;
          // Trigger load
          img.loading = 'eager';
        });
      }));
    });

    await new Promise(r => setTimeout(r, 800));

    const section = await page.$('#brand-story');
    const outLocal = path.join(__dirname, '..', vp.name);
    const outArtifact = path.join(artifactDir, vp.name);

    if (section) {
      await section.screenshot({ path: outLocal });
      fs.copyFileSync(outLocal, outArtifact);
      console.log(`Saved screenshot: ${outLocal} & ${outArtifact}`);
    } else {
      await page.screenshot({ path: outLocal });
      fs.copyFileSync(outLocal, outArtifact);
      console.log(`Saved full page screenshot: ${outLocal}`);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

run().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
