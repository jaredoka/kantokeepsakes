/* ============================================
   Kanto Keepsakes - catalogue and product cards
   ============================================ */

import { EMPTY_SHOP_INTRO, basePath, checkoutUrl } from './config.js';
import { formatPrice } from './money.js';
import { addToCart, updateCartCount } from './cart.js';
import { PRODUCTS } from '../data/products.js';

export function filterProducts(products, { category, type, preorder } = {}) {
  return products.filter((p) => {
    if (preorder === true) return p.preorder === true;
    if (category && p.category !== category) return false;
    if (type && p.type !== type) return false;
    if (!preorder && p.preorder) return false;
    return true;
  });
}

const PLACEHOLDER_SVG = `
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`;

/** Shown when a page has nothing listed - the only useful action is a question. */
export function emptyShopMarkup() {
  return `
    <div class="no-products">
      <p>Nothing is listed yet.</p>
      <p class="no-products-note">
        Stock is still being photographed and priced. Message me and I will tell you what I have.
      </p>
      <a class="btn btn-primary" href="${checkoutUrl(EMPTY_SHOP_INTRO)}" target="_blank" rel="noopener">
        Ask on WhatsApp
      </a>
    </div>
  `;
}

export function createProductCard(product, base = basePath()) {
  const card = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <div class="product-card-image-wrapper">
      <img
        src="${base}${product.image}"
        alt="${product.name}"
        class="product-card-image"
        loading="lazy"
        onerror="this.parentElement.classList.add('has-placeholder')"
      >
      <div class="image-placeholder" aria-hidden="true">
        ${PLACEHOLDER_SVG}
        <span>No image</span>
      </div>
    </div>
    <div class="product-card-body">
      <h3 class="product-card-name">${product.name}</h3>
      <p class="product-card-desc">${product.description}</p>
      <p class="product-card-price">${formatPrice(product.price)}</p>
      ${product.preorder ? '<span class="badge badge--preorder">Preorder</span>' : ''}
      ${product.inStock === false && !product.preorder ? '<span class="badge badge--oos">Out of Stock</span>' : ''}
      <button class="btn btn-primary btn-full btn-add-cart" data-id="${product.id}">Add to Cart</button>
    </div>
  `;

  const addBtn = card.querySelector('.btn-add-cart');
  addBtn.addEventListener('click', () => {
    addToCart(product);
    updateCartCount();
  });

  return card;
}

export function renderProducts(container, products) {
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = emptyShopMarkup();
    return;
  }

  const base = basePath();
  products.forEach((product) => container.appendChild(createProductCard(product, base)));
}

/** Page entry point: paint the grid on this page, if it has one. */
export function showProducts({ category, type, preorder } = {}) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  renderProducts(grid, filterProducts(PRODUCTS, { category, type, preorder }));
}
