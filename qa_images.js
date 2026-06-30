const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://ellis-trading.shop/category.html?cId=2', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for lazy images to load - scroll down to trigger lazy loading
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 2000));
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 2000));
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 3000));
  });
  
  const results = await page.evaluate(() => {
    const imgs = document.querySelectorAll('.product-card__image');
    let loaded = 0, failed = 0, total = imgs.length;
    const failures = [];
    imgs.forEach((img) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) loaded++;
      else {
        failed++;
        if (failures.length < 5) failures.push({ src: (img.src || '').substring(0, 100), w, h, complete: img.complete });
      }
    });
    return { total, loaded, failed, failures };
  });
  
  console.log('Category Beauty cId=2');
  console.log('Product cards:', results.total);
  console.log('Images loaded:', results.loaded, 'failed:', results.failed);
  if (results.failures.length) console.log('Sample failures:', JSON.stringify(results.failures, null, 2));
  
  // Also check product detail page images
  await page.goto('https://ellis-trading.shop/product.html?dpId=315', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const detailResult = await page.evaluate(() => {
    const img = document.querySelector('.product-detail__image');
    if (!img) return { found: false };
    return {
      found: true,
      src: (img.src || '').substring(0, 100),
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
      nameEl: document.querySelector('.product-detail__name')?.textContent
    };
  });
  console.log('\nProduct detail image:', JSON.stringify(detailResult, null, 2));
  
  await browser.close();
})();
