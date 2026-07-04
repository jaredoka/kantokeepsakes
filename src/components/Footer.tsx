import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links}>
        <Link href="/about">About</Link>
        <Link href="/safe-trading">Safe Trading</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <p>&copy; 2026 Kanto Keepsakes. All rights reserved.</p>
    </footer>
  );
}
