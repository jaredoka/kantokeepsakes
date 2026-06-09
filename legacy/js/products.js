/* ============================================
   Kanto Keepsakes — Product Engine
   ============================================ */

/* --- State --- */
let allProducts = [];
let currentSort = 'default';

/* --- Determine base path for data/images (pages/ is one level deep) --- */
function getBasePath() {
  const path = window.location.pathname;
  return path.includes('/pages/') ? '../' : '';
}

/* --- Fetch Products --- */
async function fetchProducts() {
  if (allProducts.length > 0) return allProducts;

  const base = getBasePath();
  const response = await fetch(`${base}data/products.json`);
  allProducts = await response.json();
  return allProducts;
}

/* --- Filter Products --- */
function filterProducts(products, { category, type, preorder } = {}) {
  return products.filter((p) => {
    if (preorder === true) return p.preorder === true;
    if (category && p.category !== category) return false;
    if (type && p.type !== type) return false;
    if (!preorder && p.preorder) return false;
    return true;
  });
}

/* --- Sort Products --- */
function sortProducts(products, order) {
  const sorted = [...products];
  if (order === 'price-asc') {
    sorted.sort((a, b) => a.price - b.price);
  } else if (order === 'price-desc') {
    sorted.sort((a, b) => b.price - a.price);
  }
  return sorted;
}

/* --- Render a Single Product Card --- */
function createProductCard(product) {
  const base = getBasePath();
  const card = document.createElement('div');
  card.className = 'product-card';

  const imageSrc = `${base}${product.image}`;

  card.innerHTML = `
    <div class="product-card-image-wrapper">
      <img
        src="${imageSrc}"
        alt="${product.name}"
        class="product-card-image"
        loading="lazy"
        onerror="this.parentElement.classList.add('has-placeholder')"
      >
      <div class="image-placeholder" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>No image</span>
      </div>
    </div>
    <div class="product-card-body">
      <h3 class="product-card-name">${product.name}</h3>
      <p class="product-card-desc">${product.description}</p>
      <p class="product-card-price">$${product.price.toFixed(2)}</p>
      ${product.preorder ? '<span class="badge badge--preorder">Preorder</span>' : ''}
      ${!product.inStock && !product.preorder ? '<span class="badge badge--oos">Out of Stock</span>' : ''}
      <button class="btn btn-primary btn-full btn-add-cart" data-id="${product.id}">
        Add to Cart
      </button>
    </div>
  `;

  const addBtn = card.querySelector('.btn-add-cart');
  addBtn.addEventListener('click', () => addToCart(product));

  return card;
}

/* --- Render Products into a Grid Container --- */
function renderProducts(container, products) {
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = '<p class="no-products">No products found.</p>';
    return;
  }

  products.forEach((product) => {
    container.appendChild(createProductCard(product));
  });
}

/* --- Initialize a Product Page --- */
async function initProductPage({ category, type, preorder } = {}) {
  const grid = document.querySelector('.product-grid');
  const sortSelect = document.querySelector('.sort-select');

  if (!grid) return;

  const products = await fetchProducts();
  let filtered = filterProducts(products, { category, type, preorder });
  filtered = sortProducts(filtered, currentSort);
  renderProducts(grid, filtered);

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      let updated = filterProducts(products, { category, type, preorder });
      updated = sortProducts(updated, currentSort);
      renderProducts(grid, updated);
    });
  }
}

/* --- Sub-Navigation Tabs (for category pages) --- */
function initSubNav() {
  const tabs = document.querySelectorAll('.subnav-tab');
  const grid = document.querySelector('.product-grid');
  const sortSelect = document.querySelector('.sort-select');

  if (tabs.length === 0 || !grid) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', async (e) => {
      e.preventDefault();

      tabs.forEach((t) => t.classList.remove('subnav-tab--active'));
      tab.classList.add('subnav-tab--active');

      const category = tab.dataset.category;
      const type = tab.dataset.type || null;

      const products = await fetchProducts();
      let filtered = filterProducts(products, { category, type });
      if (sortSelect) {
        filtered = sortProducts(filtered, sortSelect.value);
      } else {
        filtered = sortProducts(filtered, currentSort);
      }
      renderProducts(grid, filtered);
    });
  });
}

/* --- Add to Cart --- */
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('kk-cart') || '[]');
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  localStorage.setItem('kk-cart', JSON.stringify(cart));
  updateCartCount();
  showCartFeedback();
}

/* --- Cart Feedback Toast --- */
function showCartFeedback() {
  let toast = document.querySelector('.cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = 'Added to cart!';
    document.body.appendChild(toast);
  }

  toast.classList.add('cart-toast--visible');
  setTimeout(() => toast.classList.remove('cart-toast--visible'), 1500);
}
