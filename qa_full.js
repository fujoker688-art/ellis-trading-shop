const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE:', msg.text()); });
  
  console.log('=== FULL QA REPORT ===\n');
  
  // Test all categories
  const cats = [
    { id: 7, name: 'Wines & Spirits', expected: 10 },
    { id: 2, name: 'Beauty', expected: 158 },
    { id: 3, name: 'Wellness', expected: 48 }
  ];
  
  for (const cat of cats) {
    await page.goto(`https://ellis-trading.shop/category.html?cId=${cat.id}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 2000)); });
    await page.waitForTimeout(1000);
    
    const cards = await page.$$('.product-card');
    const imgs = await page.$$('.product-card__image');
    let loadedImgs = 0;
    for (const img of imgs) {
      const nw = await img.evaluate(el => el.naturalWidth);
      if (nw > 0) loadedImgs++;
    }
    console.log(`${cat.name}: ${cards.length} products, ${loadedImgs}/${imgs.length} images loaded`);
  }
  
  // Test product detail pages
  const products = [1157, 315, 1252];
  for (const dpId of products) {
    await page.goto(`https://ellis-trading.shop/product.html?dpId=${dpId}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const name = await page.$eval('.product-detail__name', el => el.textContent).catch(() => null);
    const imgW = await page.$eval('.product-detail__image', el => el.naturalWidth).catch(() => 0);
    const btn = await page.$('button:has-text("Add to Cart")').catch(() => null);
    console.log(`Product dpId=${dpId}: "${name}" | img: ${imgW}px | AddToCart: ${!!btn}`);
  }
  
  // Test homepage
  await page.goto('https://ellis-trading.shop/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const featured = await page.$$('.product-card');
  const heroSlides = await page.$$('.hero__slide');
  console.log(`Homepage: ${featured.length} featured products, ${heroSlides.length} hero slides`);
  
  // Test cart flow
  await page.goto('https://ellis-trading.shop/product.html?dpId=1157', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.click('button:has-text("Add to Cart")');
  await page.waitForTimeout(500);
  const cartCount = await page.textContent('#cartCount');
  console.log(`Cart: ${cartCount} item(s) after adding`);
  
  console.log('\n=== QA COMPLETE ===');
  await browser.close();
})();
