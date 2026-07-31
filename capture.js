const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  console.log('Navigating to page...');
  await page.goto('http://localhost:3000/preview/empire/aero', { waitUntil: 'networkidle0', timeout: 60000 });
  console.log('Waiting for animations to settle (3s)...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'public/aero-ss.png' });
  await browser.close();
  console.log('Screenshot saved to public/aero-ss.png');
})();
