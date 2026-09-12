/* ============================================
   Kanto Keepsakes - cart state, cart page, checkout
   ============================================ */

import { CART_KEY, DEFAULT_STOCK, ORDER_INTRO, WHATSAPP_NUMBER, basePath } from './config.js';
import { formatPrice } from './money.js';

/* --- State ------------------------------------------------------------- */

/** Never throws: a missing or corrupt cart reads as an empty one. */
export function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/** How many of this product a customer may put in the cart. */
export function maxQuantity(product) {
  const declared = Number(product && product.stock);
  if (Number.isFinite(declared) && declared >= 0) return Math.trunc(declared);
  return product && product.inStock === false ? 0 : DEFAULT_STOCK;
}

/* --- Mutations --------------------------------------------------------- */

export function addToCart(product) {
  const limit = maxQuantity(product);
  const cart = getCart();
  if (limit < 1) return cart;

  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, limit);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart(cart);
  return cart;
}

export function changeQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return cart;

  const next = item.quantity + delta;
  if (next <= 0) return removeItem(id);

  item.quantity = next;
  saveCart(cart);
  return cart;
}

export function removeItem(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
  return [];
}

/* --- Derived ----------------------------------------------------------- */

export function cartCount(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/* --- Checkout ---------------------------------------------------------- */

export function buildOrderMessage(cart = getCart()) {
  const lines = cart.map(
    (item, index) =>
      `${index + 1}. ${item.name}\n` +
      `   Qty: ${item.quantity} \u00d7 ${formatPrice(item.price)} = ` +
      `${formatPrice(item.price * item.quantity)}`
  );

  return [
    ORDER_INTRO,
    '',
    ...lines,
    '',
    `Total: ${formatPrice(cartTotal(cart))}`,
    '',
    'Thank you!',
  ].join('\n');
}

export function checkoutUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;
  window.open(checkoutUrl(buildOrderMessage(cart)), '_blank');
}

/* --- DOM (cart page and header badge) ---------------------------------- */

export function updateCartCount() {
  const count = cartCount();
  document.querySelectorAll('.cart-count').forEach((el) => {
    el.textContent = String(count);
    el.setAttribute('aria-label', `${count} items in cart`);
  });
}

export function renderCart() {
  const cart = getCart();
  const items = document.querySelector('.cart-items');
  const empty = document.querySelector('.cart-empty');
  const summary = document.querySelector('.cart-summary');

  if (!items) return;

  items.innerHTML = '';
  if (empty) empty.style.display = cart.length === 0 ? 'block' : 'none';
  if (summary) summary.style.display = cart.length === 0 ? 'none' : 'block';
  if (cart.length === 0) return;

  const base = basePath();

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="cart-item-image-wrapper">
        <img
          src="${base}${item.image}"
          alt="${item.name}"
          class="cart-item-image"
          loading="lazy"
          onerror="this.parentElement.classList.add('has-placeholder')"
        >
        <div class="image-placeholder image-placeholder--small" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>
      <div class="cart-item-details">
        <h3 class="cart-item-name">${item.name}</h3>
        <p class="cart-item-price">${formatPrice(item.price)}</p>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn qty-decrease" aria-label="Decrease quantity">\u2212</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-increase" aria-label="Increase quantity">+</button>
        </div>
        <p class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</p>
        <button class="btn-remove" aria-label="Remove ${item.name} from cart">Remove</button>
      </div>
    `;
    items.appendChild(row);
  });

  const totalEl = document.querySelector('.cart-total-price');
  if (totalEl) totalEl.textContent = formatPrice(cartTotal());
}

export function initCartPage() {
  renderCart();

  const items = document.querySelector('.cart-items');
  if (items) {
    items.addEventListener('click', (event) => {
      const row = event.target.closest('.cart-item');
      if (!row) return;
      const id = row.dataset.id;

      if (event.target.closest('.qty-increase')) changeQuantity(id, 1);
      else if (event.target.closest('.qty-decrease')) changeQuantity(id, -1);
      else if (event.target.closest('.btn-remove')) removeItem(id);
      else return;

      renderCart();
    });
  }

  const checkoutBtn = document.querySelector('.btn-checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

  const clearBtn = document.querySelector('.btn-clear-cart');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearCart();
      renderCart();
    });
  }
}
