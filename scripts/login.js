const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  const context = await browser.newContext({
    viewport: null
  });
  const page = await context.newPage();

  // Go to login page
  console.log('Navigating to http://localhost:3000/login ...');
  await page.goto('http://localhost:3000/login');

  // Wait for page to stabilize
  await page.waitForTimeout(2000);

  console.log('Looking for inputs...');

  // Get all input elements
  const inputs = await page.locator('input').all();
  console.log('Found', inputs.length, 'input elements');

  // Fill first input (email) and second input (password)
  if (inputs.length >= 2) {
    await inputs[0].fill('admin@realestate-crm.com');
    await page.waitForTimeout(500);
    await inputs[1].fill('admin123');
  }

  console.log('Clicking login button...');
  await page.getByRole('button', { name: 'Masuk' }).click();

  await page.waitForTimeout(3000);

  console.log('✅ Done! Browser is open at dashboard.');
  console.log('URL:', page.url());

  // Keep browser open
})();
