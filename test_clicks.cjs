const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await page.evaluate(el => el.textContent, buttons[i]);
    console.log(`Clicking button: ${text}`);
    try {
        await buttons[i].click();
        await page.waitForTimeout(500);
    } catch (e) {
        console.log(`Error clicking: ${e.message}`);
    }
  }
  
  await browser.close();
})();
