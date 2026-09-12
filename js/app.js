/* ============================================
   Kanto Keepsakes — Main Entry Point
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHamburgerMenu();
  updateCartCount();
});

/* --- Hamburger Menu --- */
function initHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navOverlay = document.querySelector('.nav-overlay');
  const navBackdrop = document.querySelector('.nav-backdrop');

  if (!hamburger || !navOverlay) return;

  function openMenu() {
    navOverlay.classList.add('is-open');
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    if (navBackdrop) navBackdrop.classList.add('is-visible');
  }

  function closeMenu() {
    navOverlay.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (navBackdrop) navBackdrop.classList.remove('is-visible');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = navOverlay.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close menu when clicking the backdrop
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMenu);
  }

  // Close menu when clicking a nav link
  navOverlay.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
      closeMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) {
      closeMenu();
    }
  });
}

/* --- Cart Count --- */
function updateCartCount() {
  const cartCountElements = document.querySelectorAll('.cart-count');
  const cart = JSON.parse(localStorage.getItem('kk-cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCountElements.forEach((el) => {
    el.textContent = count;
    el.setAttribute('aria-label', `${count} items in cart`);
  });
}
