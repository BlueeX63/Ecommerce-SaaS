const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const templates = [
  { url: 'http://localhost:3000/preview/starter/canvas', name: 'starter_canvas.png' },
  { url: 'http://localhost:3000/preview/starter/essence', name: 'starter_essence.png' },
  { url: 'http://localhost:3000/preview/starter/minimalist', name: 'starter_minimalist.png' },
  { url: 'http://localhost:3000/preview/starter/origin', name: 'starter_origin.png' },
  { url: 'http://localhost:3000/preview/growth/nexus-pro', name: 'growth_nexus_pro.png' },
  { url: 'http://localhost:3000/preview/growth/velocity', name: 'growth_velocity.png' }
];

const screenshotsDir = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  for (const template of templates) {
    console.log(`Taking screenshot for ${template.name}...`);
    try {
      await page.goto(template.url, { waitUntil: 'networkidle2' });
      // Wait a bit for animations
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(screenshotsDir, template.name), fullPage: true });
      console.log(`Saved ${template.name}`);
    } catch (e) {
      console.error(`Error taking screenshot for ${template.name}:`, e);
    }
  }

  await browser.close();
  console.log('Done!');
})();
