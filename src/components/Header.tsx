"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCart } from "@/lib/cart";
import styles from "./Header.module.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const updateCount = useCallback(() => {
    const cart = getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  useEffect(() => {
    updateCount();
    window.addEventListener("cart-updated", updateCount);
    return () => window.removeEventListener("cart-updated", updateCount);
  }, [updateCount]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/images/Kanto-Keepsakes-logo.webp"
            alt="Kanto Keepsakes"
            width={140}
            height={44}
            className={styles.logo}
            priority
          />
        </Link>
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ""}`}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>

      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        className={`${styles.navOverlay} ${menuOpen ? styles.navOpen : ""}`}
        aria-label="Main navigation"
      >
        <ul className={styles.navList}>
          <li>
            <Link href="/" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/japanese" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              Japanese
            </Link>
          </li>
          <li>
            <Link href="/english" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              English
            </Link>
          </li>
          <li>
            <Link href="/accessories" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              TCG Accessories
            </Link>
          </li>
          <li>
            <Link href="/preorder" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              Preorder
            </Link>
          </li>
          <li>
            <Link href="/cart" className={`${styles.navLink} ${styles.navCart}`} onClick={() => setMenuOpen(false)}>
              Cart <span className={styles.cartCount}>{cartCount}</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
