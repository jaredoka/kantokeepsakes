/* ============================================
   Kanto Keepsakes - shared constants
   ============================================ */

/**
 * Company WhatsApp number. Digits only, country code first.
 * This is the company line (a Malaysian number) and it is deliberate -
 * do not "correct" it to a Brunei number.
 */
export const WHATSAPP_NUMBER = '601136177105';

/** Opening line of the order message. */
export const ORDER_INTRO =
  'Hi! I would like to order the following items from Kanto Keepsakes:';

/** Sent when a customer taps WhatsApp on a page with nothing listed. */
export const EMPTY_SHOP_INTRO =
  'Hi! I am looking at the Kanto Keepsakes website - what do you have in stock right now?';

/** Kanto Keepsakes sells in Brunei dollars. */
export const CURRENCY = 'BND';

/** localStorage key holding the cart. Changing it abandons existing carts. */
export const CART_KEY = 'kk-cart';

/** Used when a product does not say how many are in stock. */
export const DEFAULT_STOCK = 1;

/** Prefix for links and images on pages one directory deep (pages/). */
export function basePath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}
