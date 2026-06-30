const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });

  // Collect console messages
  const errors = [];
  context.on('page', page => {
    page.on('console', msg => errors.push({ type: msg.type(), text: msg.text(), url: msg.location().url }));
    page.on('pageerror', err => errors.push({ type: 'pageerror', text: err.message }));
    page.on('response', response => {
      if (response.status() >= 400) {
        errors.push({ type: 'http', text: `${response.status()} ${response.url()}` });
      }
    });
  });

  const BASE = 'https://ellis-trading.shop';
  const tests = [];

  // Test 1: Homepage
  tests.push({ name: 'Homepage loads', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const title = await page.title();
    const products = await page.$$('.product-card');
    return { title, productCount: products.length, url: page.url() };
  }});

  // Test 2: Category page
  tests.push({ name: 'Category - Wines', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/category.html?cId=7', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const products = await page.$$('.product-card');
    const heading = await page.textContent('h1');
    return { heading, productCount: products.length };
  }});

  // Test 3: Category - Beauty
  tests.push({ name: 'Category - Beauty', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/category.html?cId=2', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const products = await page.$$('.product-card');
    const heading = await page.textContent('h1');
    return { heading, productCount: products.length };
  }});

  // Test 4: Product detail page
  tests.push({ name: 'Product detail - LA CUVEE HENRI', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/product.html?dpId=1157', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const loadingEl = await page.$('.product-detail__name');
    const name = loadingEl ? await loadingEl.textContent() : null;
    const addToCart = await page.$('button:has-text("Add to Cart")');
    return { name, hasAddToCart: !!addToCart };
  }});

  // Test 5: Product detail - Beauty product
  tests.push({ name: 'Product detail - Beauty', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/product.html?dpId=315', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const el = await page.$('.product-detail__name');
    const name = el ? await el.textContent() : null;
    return { name };
  }});

  // Test 6: Contact page
  tests.push({ name: 'Contact page', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/contact.html', { waitUntil: 'networkidle', timeout: 30000 });
    const heading = await page.textContent('h1');
    const header = await page.$('header.header');
    return { heading, hasProperHeader: !!header };
  }});

  // Test 7: Delivery page
  tests.push({ name: 'Delivery page', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/delivery.html', { waitUntil: 'networkidle', timeout: 30000 });
    const heading = await page.textContent('h1');
    const header = await page.$('header.header');
    return { heading, hasProperHeader: !!header };
  }});

  // Test 8: 404 page
  tests.push({ name: '404 page', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/nonexistent', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    const title = await page.title();
    return { title, url: page.url() };
  }});

  // Test 9: Cart functionality
  tests.push({ name: 'Cart add and checkout', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/product.html?dpId=1157', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const btn = await page.$('button:has-text("Add to Cart")');
    if (!btn) return { added: false, reason: 'no add to cart button' };
    await btn.click();
    await page.waitForTimeout(500);
    const cartCount = await page.textContent('#cartCount');
    return { added: true, cartCount };
  }});

  // Test 10: Product photos
  tests.push({ name: 'Product images load', fn: async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/category.html?cId=7', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const imgs = await page.$$('.product-card__image');
    let loaded = 0, failed = 0;
    for (const img of imgs) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        try {
          const resp = await page.evaluate(async (url) => {
            const r = await fetch(url, { mode: 'no-cors' });
            return r.type;
          }, src);
          loaded++;
        } catch(e) { failed++; }
      }
    }
    return { total: imgs.length, loaded, failed };
  }});

  // Run all tests
  for (const test of tests) {
    try {
      const result = await test.fn();
      console.log(`✅ ${test.name}:`, JSON.stringify(result));
    } catch (e) {
      console.log(`❌ ${test.name}: ERROR -`, e.message.slice(0, 200));
    }
  }

  // Report errors
  const jsErrors = errors.filter(e => e.type === 'pageerror');
  const httpErrors = errors.filter(e => e.type === 'http');
  const faviconErrors = httpErrors.filter(e => e.text.includes('favicon'));
  const other404s = httpErrors.filter(e => !e.text.includes('favicon') && e.text.startsWith('404'));

  console.log('\n=== ERROR REPORT ===');
  if (jsErrors.length) console.log(`JS Errors: ${jsErrors.length}`, jsErrors.slice(0,5).map(e => e.text));
  if (faviconErrors.length) console.log(`Favicon 404: ${faviconErrors.length}`);
  if (other404s.length) console.log(`Other 404s:`, other404s.map(e => e.text));
  if (!jsErrors.length && !other404s.length) console.log('✅ No JavaScript errors or broken links!');

  await browser.close();
})();
