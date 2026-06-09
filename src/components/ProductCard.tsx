"use client";

import { Product } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  function handleAdd() {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={`/${product.image}`}
          alt={product.name}
          className={styles.image}
          loading="lazy"
          onError={(e) => {
            const wrapper = (e.target as HTMLElement).parentElement;
            if (wrapper) wrapper.classList.add(styles.hasPlaceholder);
          }}
        />
        <div className={styles.placeholder} aria-hidden="true">
          <svg
            width="48"
            height="48"
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
          <span>No image</span>
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.desc}>{product.description}</p>
        <p className={styles.price}>${product.price.toFixed(2)}</p>
        {product.preorder && (
          <span className={`${styles.badge} ${styles.badgePreorder}`}>
            Preorder
          </span>
        )}
        {!product.inStock && !product.preorder && (
          <span className={`${styles.badge} ${styles.badgeOos}`}>
            Out of Stock
          </span>
        )}
        <button className={styles.addBtn} onClick={handleAdd}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
