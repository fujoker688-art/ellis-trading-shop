const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Check if SpeedMalls images actually load in a real img element
  const testUrl = 'https://www.speedmalls.com/back/images/product/95_0.jpeg';
  
  // Navigate to a blank page first
  await page.goto('about:blank');
  
  // Create an img element and wait for it to load
  const result = await page.evaluate(async (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ loaded: true, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ loaded: false, error: 'onerror' });
      img.src = url;
      // Also set a timeout
      setTimeout(() => {
        if (!img.complete) resolve({ loaded: false, error: 'timeout' });
        else resolve({ loaded: img.naturalWidth > 0, width: img.naturalWidth, height: img.naturalHeight });
      }, 10000);
    });
  }, testUrl);
  console.log('Image test result:', result);
  
  // Now test with the full page
  await page.goto('https://ellis-trading.shop/category.html?cId=2', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Wait for all images to settle
  await page.evaluate(() => new Promise(r => setTimeout(r, 3000)));
  
  const results = await page.evaluate(() => {
    const imgs = document.querySelectorAll('.product-card__image');
    const res = [];
    imgs.forEach((img, i) => {
      if (i < 5) { // just check first 5
        res.push({
          src: img.src ? img.src.substring(0, 80) : 'no-src',
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          complete: img.complete,
          readyState: img.loading,
          currentSrc: img.currentSrc ? img.currentSrc.substring(0, 80) : 'none'
        });
      }
    });
    return res;
  });
  console.log('First 5 images:', JSON.stringify(results, null, 2));
  
  await browser.close();
})();
