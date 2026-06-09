"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getCart,
  changeQuantity,
  removeItem,
  clearCart,
  getCartTotal,
  checkout,
  CartItem,
} from "@/lib/cart";
import styles from "./page.module.css";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const refreshCart = useCallback(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);

  const total = getCartTotal(cart);

  return (
    <main className={`${styles.mainContent} container`}>
      <div className={styles.pageHeader}>
        <h1>Shopping Cart</h1>
      </div>

      <div className={styles.cartContainer}>
        {cart.length === 0 ? (
          <div className={styles.cartEmpty}>
            <p>Your cart is empty.</p>
            <Link href="/" className={styles.btnPrimary}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.cartItemImageWrapper}>
                    <img
                      src={`/${item.image}`}
                      alt={item.name}
                      className={styles.cartItemImage}
                      loading="lazy"
                      onError={(e) => {
                        const wrapper = (e.target as HTMLElement).parentElement;
                        if (wrapper) wrapper.classList.add(styles.hasPlaceholder);
                      }}
                    />
                    <div className={styles.placeholder} aria-hidden="true">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.cartItemDetails}>
                    <h3 className={styles.cartItemName}>{item.name}</h3>
                    <p className={styles.cartItemPrice}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className={styles.cartItemControls}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        aria-label="Decrease quantity"
                        onClick={() => changeQuantity(item.id, -1)}
                      >
                        &minus;
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        aria-label="Increase quantity"
                        onClick={() => changeQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className={styles.cartItemSubtotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      className={styles.btnRemove}
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cartSummary}>
              <div className={styles.cartSummaryRow}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                className={`${styles.btnPrimary} ${styles.btnFull} ${styles.btnCheckout}`}
                onClick={checkout}
              >
                Checkout via WhatsApp
              </button>
              <button
                className={`${styles.btnSecondary} ${styles.btnFull}`}
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
