import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Account Banned",
};

export default function BannedPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Account Suspended</h1>
        <p className={styles.message}>
          Your account has been suspended due to a violation of our community
          guidelines. You are unable to create listings, send messages, or
          participate in trades.
        </p>
        <p className={styles.contact}>
          If you believe this was a mistake, please contact us for assistance.
        </p>
        <Link href="/marketplace" className={styles.backLink}>
          &larr; Back to Marketplace
        </Link>
      </div>
    </main>
  );
}
