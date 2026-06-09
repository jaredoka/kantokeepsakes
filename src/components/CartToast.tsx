"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./CartToast.module.css";

export default function CartToast() {
  const [visible, setVisible] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    function onCartUpdate() {
      const cart = JSON.parse(localStorage.getItem("kk-cart") || "[]");
      const count = cart.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0
      );
      if (count > prevCount.current) {
        setVisible(true);
        setTimeout(() => setVisible(false), 1500);
      }
      prevCount.current = count;
    }
    window.addEventListener("cart-updated", onCartUpdate);
    return () => window.removeEventListener("cart-updated", onCartUpdate);
  }, []);

  return (
    <div className={`${styles.toast} ${visible ? styles.visible : ""}`}>
      Added to cart!
    </div>
  );
}
