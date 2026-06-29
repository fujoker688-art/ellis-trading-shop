/**
 * sitemap-generator.js
 * 
 * Generates a dynamic sitemap.xml from all_products.json
 * Usage: node sitemap-generator.js
 * 
 * This script reads product data and generates:
 * 1. sitemap.xml — all product URLs + category URLs
 * 2. Updates the static sitemap with all 217 products
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://ellis-trading.shop';
const DATA_FILE = path.join(__dirname, 'data', 'all_products.json');
const OUTPUT_FILE = path.join(__dirname, 'sitemap.xml');

// Load products
let products;
try {
    products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (e) {
    console.error('Error loading products:', e.message);
    process.exit(1);
}

// Deduplicate by dpId
const seen = new Set();
const uniqueProducts = products.filter(p => {
    if (seen.has(p.dpId)) return false;
    seen.add(p.dpId);
    return true;
});

console.log(`Found ${uniqueProducts.length} unique products`);

// Category mapping for URLs
const categoryMap = {
    7: { path: '/category.html?cId=7', name: 'Wines & Spirits', priority: 0.9 },
    2: { path: '/category.html?cId=2', name: 'Beauty', priority: 0.9 },
    1: { path: '/category.html?cId=1', name: 'Wellness', priority: 0.8 },
};

// Subcategory mapping
const subCategoryMap = {
    '7_14': { path: '/category.html?cId=7&csubId=14', name: 'Red Wines', priority: 0.9 },
    '7_15': { path: '/category.html?cId=7&csubId=15', name: 'White Wines', priority: 0.9 },
    '2_1': { path: '/category.html?cId=2&csubId=1', name: 'Fragrances', priority: 0.8 },
    '2_2': { path: '/category.html?cId=2&csubId=2', name: 'Skincare', priority: 0.8 },
    '2_3': { path: '/category.html?cId=2&csubId=3', name: 'Bodycare', priority: 0.8 },
    '2_4': { path: '/category.html?cId=2&csubId=4', name: 'Haircare', priority: 0.8 },
    '2_5': { path: '/category.html?cId=2&csubId=5', name: 'Makeup', priority: 0.8 },
};

// Generate sitemap XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Static category pages -->
  <url>
    <loc>${DOMAIN}/category.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

// Add category pages
Object.entries(categoryMap).forEach(([key, val]) => {
    xml += `
  <url>
    <loc>${DOMAIN}${val.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${val.priority}</priority>
  </url>`;
});

// Add subcategory pages
Object.entries(subCategoryMap).forEach(([key, val]) => {
    xml += `
  <url>
    <loc>${DOMAIN}${val.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${val.priority}</priority>
  </url>`;
});

// Add product pages
uniqueProducts.forEach(p => {
    const url = `${DOMAIN}/product.html?dpId=${p.dpId}`;
    const lastmod = p.updatedAt || new Date().toISOString().split('T')[0];
    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    ${p.image ? `<image:image>
      <image:loc>${p.image}</image:loc>
      <image:title>${p.name || 'Product'}</image:title>
    </image:image>` : ''}
  </url>`;
});

xml += `
</urlset>`;

// Write sitemap
fs.writeFileSync(OUTPUT_FILE, xml, 'utf-8');
console.log(`✓ sitemap.xml generated with ${uniqueProducts.length} products + ${Object.keys(categoryMap).length + Object.keys(subCategoryMap).length} category pages`);
console.log(`  Output: ${OUTPUT_FILE}`);
