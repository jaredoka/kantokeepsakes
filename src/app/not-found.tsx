import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Not Found",
};

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.heading}>Page not found</h2>
        <p className={styles.text}>
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.btnPrimary}>
            Go home
          </Link>
          <Link href="/marketplace/wts" className={styles.btnSecondary}>
            Browse marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
