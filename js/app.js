/* ============================================
   Kanto Keepsakes - header menu and cart count
   ============================================ */

import { updateCartCount } from './cart.js';

export { updateCartCount };

export function initMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navOverlay = document.querySelector('.nav-overlay');
  const navBackdrop = document.querySelector('.nav-backdrop');

  if (!hamburger || !navOverlay) return;

  const openMenu = () => {
    navOverlay.classList.add('is-open');
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    if (navBackdrop) navBackdrop.classList.add('is-visible');
  };

  const closeMenu = () => {
    navOverlay.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (navBackdrop) navBackdrop.classList.remove('is-visible');
  };

  hamburger.addEventListener('click', () => {
    navOverlay.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  if (navBackdrop) navBackdrop.addEventListener('click', closeMenu);

  navOverlay.addEventListener('click', (event) => {
    if (event.target.classList.contains('nav-link')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navOverlay.classList.contains('is-open')) closeMenu();
  });
}
