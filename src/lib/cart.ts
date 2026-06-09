const CART_KEY = "kk-cart";
const WHATSAPP_NUMBER = "601136177105";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product: {
  id: string;
  name: string;
  price: number;
  image: string;
}): void {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
}

export function changeQuantity(id: string, delta: number): void {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }

  saveCart(cart);
}

export function removeItem(id: string): void {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
}

export function clearCart(): void {
  saveCart([]);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function checkout(): void {
  const cart = getCart();
  if (cart.length === 0) return;

  let message =
    "Hi! I would like to order the following items from Kanto Keepsakes:\n\n";

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}\n`;
  });

  const total = getCartTotal(cart);
  message += `\nTotal: $${total.toFixed(2)}`;
  message += "\n\nThank you!";

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
}
