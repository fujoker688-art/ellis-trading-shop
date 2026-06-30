const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('https://ellis-trading.shop/category.html?cId=2', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  const imgs = await page.$$('.product-card__image');
  console.log('Product cards:', imgs.length);
  
  let loaded = 0, failed = 0;
  for (const img of imgs) {
    const src = await img.getAttribute('src');
    const nw = await img.evaluate(el => el.naturalWidth);
    const nh = await img.evaluate(el => el.naturalHeight);
    if (nw > 0 && nh > 0) loaded++;
    else { failed++; console.log('BAD IMG:', src ? src.slice(0,120) : 'NO SRC', 'w:', nw, 'h:', nh); }
  }
  console.log('Images loaded:', loaded, 'failed:', failed);
  
  // Also check if any product cards have no image at all
  const noImgCards = await page.$$('.product-card:not(:has(img))');
  console.log('Cards without img element:', noImgCards.length);
  
  await browser.close();
})();
