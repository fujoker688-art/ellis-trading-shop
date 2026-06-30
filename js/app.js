/* =============================================
   Vino & Beauté — Application Script
   ============================================= */

// =============================================
// Data Store — populated from scraped data
// =============================================
const Store = {
    products: [],
    cart: [],
    currentCategory: null,
    searchResults: [],

    init(products) {
        // Flatten: products is {wines: [...], beauty: [...], wellness: [...], all: [...]}
        this.products = Array.isArray(products) ? products : Object.values(products).flat();
        this.renderAll();
    },

    getByCategory(categoryId) {
        return this.products.filter(p => p.categoryId == categoryId);
    },

    getByBrand(brand) {
        return this.products.filter(p =>
            p.brand && p.brand.toLowerCase() === brand.toLowerCase()
        );
    },

    search(query) {
        const q = query.toLowerCase();
        return this.products.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
    },

    addToCart(product) {
        const existing = this.cart.find(c => c.dpId === product.dpId);
        if (existing) {
            existing.qty += 1;
        } else {
            this.cart.push({ ...product, qty: 1 });
        }
        this.updateCartUI();
    },

    removeFromCart(dpId) {
        this.cart = this.cart.filter(c => c.dpId !== dpId);
        this.updateCartUI();
    },

    updateQty(dpId, delta) {
        const item = this.cart.find(c => c.dpId === dpId);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) this.removeFromCart(dpId);
        }
        this.updateCartUI();
    },

    getCartTotal() {
        return this.cart.reduce((sum, c) => sum + (c.price || 0) * c.qty, 0);
    },

    updateCartUI() {
        const count = this.cart.reduce((s, c) => s + c.qty, 0);
        document.getElementById('cartCount').textContent = count;
        // Persist to localStorage
        try { localStorage.setItem('vb_cart', JSON.stringify(this.cart)); } catch(e) {}

        const container = document.getElementById('cartItems');
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
        } else {
            container.innerHTML = this.cart.map(c => `
                <div class="cart-item">
                    <div class="cart-item__info">
                        <p class="cart-item__name">${c.name}</p>
                        <p class="cart-item__price">HK$${c.price}</p>
                    </div>
                    <div class="cart-item__qty">
                        <button onclick="Store.updateQty(${c.dpId}, -1)">−</button>
                        <span>${c.qty}</span>
                        <button onclick="Store.updateQty(${c.dpId}, 1)">+</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('cartTotal').textContent = `HK$${this.getCartTotal().toLocaleString()}`;
    },

    renderAll() {
        this.renderFeatured();
        this.renderBrands();
        this.renderCategoryPage();
    },

    renderFeatured() {
        const container = document.getElementById('featuredProducts');
        if (!container) return;
        const featured = this.products.slice(0, 8);
        container.innerHTML = featured.map(p => createProductCard(p)).join('');
    },

    renderBrands() {
        const container = document.getElementById('brandsGrid');
        if (!container) return;
        const brands = [...new Set(this.products.filter(p => p.brand).map(p => p.brand))].slice(0, 12);
        container.innerHTML = brands.map(b => `<span class="brand-chip">${b}</span>`).join('');
    },

    renderCategoryPage() {
        const container = document.getElementById('categoryProducts');
        if (!container) return;
        // Get from URL params
        const params = new URLSearchParams(window.location.search);
        const cId = params.get('cId');
        const subId = params.get('csubId');
        let products = this.products;

        if (cId) {
            products = products.filter(p => p.categoryId == cId);
        }
        if (subId) {
            products = products.filter(p => p.subCategoryId == subId);
        }

        const countEl = document.getElementById('productCount');
        if (countEl) countEl.textContent = `${products.length} product(s)`;

        container.innerHTML = products.length
            ? products.map(p => createProductCard(p)).join('')
            : '<p style="grid-column:1/-1;text-align:center;color:var(--color-text-muted);padding:60px 0;">No products found</p>';
    }
};

// =============================================
// Product Card Template — SEO enhanced
// =============================================
function createProductCard(p) {
    const altText = (p.name || 'Product') + (p.brand ? ' by ' + p.brand : '');
    return `
        <article class="product-card" onclick="openProductDetail(${p.dpId})" role="listitem">
            <img class="product-card__image"
                 src="${p.image || 'https://via.placeholder.com/300x400/1a1423/9a93b0?text=No+Image'}"
                 alt="${altText}"
                 width="300" height="400"
                 loading="lazy"
                 decoding="async"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22><rect fill=%22%231a1423%22 width=%22300%22 height=%22400%22/><text fill=%22%239a93b0%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>No Image</text></svg>'">
            <div class="product-card__body">
                ${p.brand ? `<div class="product-card__brand">${p.brand}</div>` : ''}
                <h3 class="product-card__name">${p.name || 'Product'}</h3>
                <div class="product-card__price">HK$${(p.price || 0).toLocaleString()}</div>
            </div>
        </article>
    `;
}

// =============================================
// FAQ Toggle
// =============================================
function toggleFaq(button) {
    const item = button.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    // Close all others
    document.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
        item.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
    }
}

// =============================================
// Navigation
// =============================================
function toggleSearch() {
    document.getElementById('searchOverlay').classList.toggle('active');
    if (document.getElementById('searchOverlay').classList.contains('active')) {
        setTimeout(() => document.getElementById('searchInput').focus(), 100);
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
}

function openProductDetail(dpId) {
    const product = Store.products.find(p => p.dpId == dpId);
    if (!product) return;
    window.location.href = `/product.html?dpId=${dpId}`;
}

// Search results dropdown
let searchTimeout;
function filterProducts(query) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    if (!query || query.length < 2) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const results = Store.search(query);
        if (results.length === 0) {
            container.innerHTML = '<p class="search-no-results">No products found</p>';
        } else {
            container.innerHTML = results.slice(0, 8).map(p =>
                `<a href="${p.url}" class="search-result-item" onclick="toggleSearch()">
                    <img src="${p.image || ''}" alt="" width="40" height="40" onerror="this.style.display='none'">
                    <span class="search-result-info">
                        <span class="search-result-name">${p.name}</span>
                        <span class="search-result-price">HK$${(p.price || 0).toLocaleString()}</span>
                    </span>
                </a>`
            ).join('');
        }
        container.style.display = 'block';
    }, 300);
}

// =============================================
// Hero Slider
// =============================================
let currentSlide = 0;
let slideInterval;

function initSlider() {
    const slides = document.querySelectorAll('.hero__slide');
    const dots = document.getElementById('heroDots');
    if (!slides.length || !dots) return;

    slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.addEventListener('click', () => goToSlide(i));
        if (i === 0) btn.classList.add('active');
        dots.appendChild(btn);
    });

    slideInterval = setInterval(nextSlide, 5000);
}

function goToSlide(n) {
    const slides = document.querySelectorAll('.hero__slide');
    const dots = document.querySelectorAll('#heroDots button');
    if (!slides.length) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    currentSlide = ((n % slides.length) + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

// Pause on hover
document.querySelector('.hero')?.addEventListener('mouseenter', () => clearInterval(slideInterval));
document.querySelector('.hero')?.addEventListener('mouseleave', () => {
    slideInterval = setInterval(nextSlide, 5000);
});

// =============================================
// Init
// =============================================

function handleCheckout() {
    if (Store.cart.length === 0) {
        alert('Your cart is empty. Add some products first!');
        return;
    }
    const total = Store.getCartTotal();
    alert(`Thank you for your order totaling HK$${total.toLocaleString()}!\n\nFor now, please email us at hello@ellis-trading.shop or call +852 6493 9319 to complete your purchase.\n\nWe'll confirm availability and arrange delivery.`);
    toggleCart();
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

// Lazy image handler — add .loaded class when image loads
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => img.classList.add('loaded'));
            img.addEventListener('error', () => img.classList.add('loaded'));
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    initSlider();

    // Load cart from localStorage
    try {
        const saved = localStorage.getItem('vb_cart');
        if (saved) {
            Store.cart = JSON.parse(saved);
            Store.updateCartUI();
        }
    } catch(e) {}

    // Load products from global data
    if (typeof PRODUCTS !== 'undefined') {
        Store.init(PRODUCTS);
    } else {
        // Fallback: fetch from JSON
        fetch('data/products.json')
            .then(r => r.json())
            .then(products => Store.init(products))
            .catch(() => console.log('Products not loaded yet'));
    }
});
