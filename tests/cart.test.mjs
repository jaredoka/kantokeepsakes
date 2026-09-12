import { beforeEach, describe, expect, it, vi } from 'vitest';

// The cart reads and writes localStorage. Node has none, so provide one.
// vi.stubGlobal is used rather than a plain assignment because it also works if
// Node ever exposes localStorage as a read-only global.
const store = new Map();
vi.stubGlobal('localStorage', {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
});

const {
  addToCart,
  buildOrderMessage,
  cartCount,
  cartTotal,
  changeQuantity,
  checkoutUrl,
  clearCart,
  getCart,
  maxQuantity,
  removeItem,
} = await import('../public/js/cart.js');

const slab = {
  id: 'jp-sealed-001',
  name: 'Pokemon 151 Booster Box',
  price: 65,
  image: 'images/products/jp-sealed-001.jpg',
  inStock: true,
  stock: 1,
};

const box = {
  id: 'en-sealed-002',
  name: 'Surging Sparks Booster Box',
  price: 250,
  image: 'images/products/en-sealed-002.jpg',
  inStock: true,
  stock: 3,
};

describe('cart storage', () => {
  beforeEach(() => localStorage.clear());

  it('reads an empty cart when storage is empty', () => {
    expect(getCart()).toEqual([]);
  });

  it('reads an empty cart when storage is corrupt', () => {
    localStorage.setItem('kk-cart', 'not json');
    expect(getCart()).toEqual([]);
  });

  it('ignores stored cart data that is not an array', () => {
    localStorage.setItem('kk-cart', '{"a":1}');
    expect(getCart()).toEqual([]);
  });
});

describe('maxQuantity', () => {
  it('defaults to one when a product does not declare stock', () => {
    expect(maxQuantity({ id: 'x' })).toBe(1);
  });

  it('uses the declared stock', () => {
    expect(maxQuantity(box)).toBe(3);
  });

  it('is zero when the product is out of stock', () => {
    expect(maxQuantity({ id: 'x', inStock: false })).toBe(0);
  });
});

describe('cart mutations', () => {
  beforeEach(() => localStorage.clear());

  it('adds a product once', () => {
    addToCart(slab);
    expect(getCart()).toEqual([
      { id: slab.id, name: slab.name, price: 65, image: slab.image, quantity: 1 },
    ]);
  });

  it('bumps a repeated add up to the stock limit', () => {
    addToCart(box);
    addToCart(box);
    addToCart(box);
    addToCart(box);
    expect(cartCount()).toBe(3);
  });

  it('refuses to add a second one-of-one slab', () => {
    addToCart(slab);
    addToCart(slab);
    expect(cartCount()).toBe(1);
  });

  it('refuses to add an out-of-stock product', () => {
    addToCart({ id: 'gone', name: 'Sold out box', price: 10, image: 'x.jpg', inStock: false });
    expect(getCart()).toEqual([]);
  });

  it('drops the row when quantity falls to zero', () => {
    addToCart(slab);
    changeQuantity(slab.id, -1);
    expect(getCart()).toEqual([]);
  });

  it('removes by id', () => {
    addToCart(slab);
    addToCart(box);
    removeItem(slab.id);
    expect(getCart().map((i) => i.id)).toEqual([box.id]);
  });

  it('clears everything', () => {
    addToCart(slab);
    clearCart();
    expect(getCart()).toEqual([]);
  });
});

describe('totals and checkout', () => {
  beforeEach(() => localStorage.clear());

  it('totals and counts', () => {
    addToCart(box);
    addToCart(box);
    addToCart(slab);
    expect(cartTotal()).toBe(565);
    expect(cartCount()).toBe(3);
  });

  it('builds a numbered order message in BND', () => {
    addToCart(box);
    addToCart(box);
    const message = buildOrderMessage();
    expect(message).toContain('1. Surging Sparks Booster Box');
    expect(message).toContain('Qty: 2 \u00d7 BND 250.00 = BND 500.00');
    expect(message).toContain('Total: BND 500.00');
  });

  it('points checkout at the company number', () => {
    const url = checkoutUrl('hello there');
    expect(url.startsWith('https://wa.me/601136177105?text=')).toBe(true);
    expect(url).toContain('hello%20there');
  });
});
