const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const templates = [
  { url: 'http://localhost:3000/preview/growth/horizon', name: 'growth_horizon.png' }
];

const screenshotsDir = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1440, height: 1080 }
  });

  for (const template of templates) {
    console.log(`Taking screenshot for ${template.name}...`);
    try {
      const page = await browser.newPage();
      await page.goto(template.url, { waitUntil: 'networkidle0', timeout: 60000 });
      
      // Ensure we are at the top of the page
      await page.evaluate(() => window.scrollTo(0, 0));
      
      // Wait a generous amount of time for all framer-motion animations and images to load
      await new Promise(r => setTimeout(r, 6000));
      
      // Not fullPage, just the viewport which is 1440x1080 to capture the hero properly
      await page.screenshot({ path: path.join(screenshotsDir, template.name), fullPage: false });
      console.log(`Saved ${template.name}`);
      await page.close();
    } catch (e) {
      console.error(`Error taking screenshot for ${template.name}:`, e);
    }
  }

  await browser.close();
  console.log('Done!');
})();
