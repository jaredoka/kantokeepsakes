import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Kanto Keepsakes, the peer-to-peer Pokemon TCG marketplace where hobbyists worldwide post their haves and wants, negotiate trades, and build reputation.",
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.heading}>About Kanto Keepsakes</h1>
        <p className={styles.intro}>
          The peer-to-peer marketplace for Pokemon TCG hobbyists around the
          world — a have/want trade board in the spirit of the golden days of
          trading sites, minus the gambling.
        </p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>What we do</h2>
          <p className={styles.text}>
            Kanto Keepsakes connects Pokemon TCG enthusiasts worldwide. Post
            what you have and what you want, get matched with traders whose
            haves fit your wants, and negotiate the deal yourselves — the
            platform never touches your money and hosts no gambling of any
            kind. Started in Brunei, open to everyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>How it works</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>List your cards</strong> — Create a Want to Sell (WTS) or
              Want to Buy (WTB) listing with photos, descriptions, and your asking
              price.
            </li>
            <li className={styles.listItem}>
              <strong>Browse and discover</strong> — Search by card name, set,
              language, or category to find exactly what you need.
            </li>
            <li className={styles.listItem}>
              <strong>Make offers and chat</strong> — Negotiate directly with other
              collectors through our messaging system.
            </li>
            <li className={styles.listItem}>
              <strong>Trade with confidence</strong> — Our reputation system helps
              you identify trusted traders in the community.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Our community</h2>
          <p className={styles.text}>
            We believe in building a safe, friendly, and fair trading community.
            All users are expected to follow our guidelines, and our reporting
            system helps keep the marketplace trustworthy for everyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Get started</h2>
          <p className={styles.text}>
            Ready to join? Create a free account and start browsing listings today.
          </p>
          <div className={styles.actions}>
            <Link href="/signup" className={styles.btnPrimary}>
              Sign up
            </Link>
            <Link href="/marketplace" className={styles.btnSecondary}>
              Browse listings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
