/* ============================================
   Kanto Keepsakes — Cart Page Logic
   ============================================ */

const CART_KEY = 'kk-cart';
const WHATSAPP_NUMBER = '601136177105';

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  bindCartEvents();
});

/* --- Get Cart from localStorage --- */
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

/* --- Save Cart to localStorage --- */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

/* --- Render Cart Items --- */
function renderCart() {
  const cart = getCart();
  const itemsContainer = document.querySelector('.cart-items');
  const emptyMessage = document.querySelector('.cart-empty');
  const summary = document.querySelector('.cart-summary');

  if (!itemsContainer) return;

  itemsContainer.innerHTML = '';

  if (cart.length === 0) {
    emptyMessage.style.display = 'block';
    summary.style.display = 'none';
    return;
  }

  emptyMessage.style.display = 'none';
  summary.style.display = 'block';

  const basePath = '../';

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = item.id;

    row.innerHTML = `
      <div class="cart-item-image-wrapper">
        <img
          src="${basePath}${item.image}"
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
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn qty-decrease" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-increase" aria-label="Increase quantity">+</button>
        </div>
        <p class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</p>
        <button class="btn-remove" aria-label="Remove ${item.name} from cart">Remove</button>
      </div>
    `;

    itemsContainer.appendChild(row);
  });

  updateTotal();
}

/* --- Bind Cart Events (delegation) --- */
function bindCartEvents() {
  const itemsContainer = document.querySelector('.cart-items');
  const checkoutBtn = document.querySelector('.btn-checkout');
  const clearBtn = document.querySelector('.btn-clear-cart');

  if (!itemsContainer) return;

  itemsContainer.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.closest('.qty-increase')) {
      changeQuantity(id, 1);
    } else if (e.target.closest('.qty-decrease')) {
      changeQuantity(id, -1);
    } else if (e.target.closest('.btn-remove')) {
      removeItem(id);
    }
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearCart);
  }
}

/* --- Change Item Quantity --- */
function changeQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }

  saveCart(cart);
  renderCart();
}

/* --- Remove Item --- */
function removeItem(id) {
  let cart = getCart();
  cart = cart.filter((i) => i.id !== id);
  saveCart(cart);
  renderCart();
}

/* --- Clear Cart --- */
function clearCart() {
  saveCart([]);
  renderCart();
}

/* --- Update Total Price --- */
function updateTotal() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalEl = document.querySelector('.cart-total-price');
  if (totalEl) {
    totalEl.textContent = `$${total.toFixed(2)}`;
  }
}

/* --- Checkout via WhatsApp --- */
function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;

  let message = 'Hi! I would like to order the following items from Kanto Keepsakes:\n\n';

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}\n`;
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  message += `\nTotal: $${total.toFixed(2)}`;
  message += '\n\nThank you!';

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
}
