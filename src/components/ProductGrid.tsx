"use client";

import { useState } from "react";
import { Product, filterProducts, sortProducts } from "@/lib/products";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

interface Props {
  products: Product[];
  category?: string;
  type?: string;
  preorder?: boolean;
  showSubnav?: boolean;
  subnavCategory?: string;
}

export default function ProductGrid({
  products,
  category,
  type,
  preorder,
  showSubnav,
  subnavCategory,
}: Props) {
  const [activeType, setActiveType] = useState(type || "");
  const [sortOrder, setSortOrder] = useState("default");

  let filtered = filterProducts(products, {
    category,
    type: activeType || undefined,
    preorder,
  });
  filtered = sortProducts(filtered, sortOrder);

  return (
    <>
      {showSubnav && (
        <div className={styles.subnav} role="tablist" aria-label="Filter by type">
          {["", "sealed", "singles", "graded"].map((t) => (
            <button
              key={t}
              className={`${styles.subnavTab} ${activeType === t ? styles.subnavTabActive : ""}`}
              data-category={subnavCategory}
              role="tab"
              aria-selected={activeType === t}
              onClick={() => setActiveType(t)}
            >
              {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className={styles.filterBar}>
        <span className={styles.filterBarLabel}>Sort by</span>
        <select
          className={styles.sortSelect}
          aria-label="Sort products by price"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <p className={styles.noProducts}>No products found.</p>
        ) : (
          filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </>
  );
}
