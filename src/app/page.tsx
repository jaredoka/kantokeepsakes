import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Trade Pok&eacute;mon cards with hobbyists{" "}
          <span className={styles.heroAccent}>around the world</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Post what you <strong>have</strong> and what you <strong>want</strong>.
          Find your trade match, negotiate offers in real time, and build your
          reputation — the golden days of trade listings, minus the gambling.
        </p>
        <div className={styles.heroActions}>
          <Link href="/marketplace/wts" className={styles.primaryBtn}>
            Browse the marketplace
          </Link>
          <Link href="/marketplace/new" className={styles.secondaryBtn}>
            Post a listing
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>&#128451;</div>
          <h2 className={styles.featureTitle}>Have / Want listings</h2>
          <p className={styles.featureText}>
            Build your listing from real card data — English and Japanese sets,
            promos, graded slabs — and flag whether you want cash, singles,
            graded, or sealed in return.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>&#8646;</div>
          <h2 className={styles.featureTitle}>Matches &amp; offers</h2>
          <p className={styles.featureText}>
            The Matches page finds traders who have what you want — and want
            what you have. Negotiate with offers, counteroffers, and real-time
            chat.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>&#11088;</div>
          <h2 className={styles.featureTitle}>Community trust</h2>
          <p className={styles.featureText}>
            Two-step trade confirmations, star ratings, and trader reputation.
            Public comments let the community vouch for traders and vet trades.
          </p>
        </div>
      </section>

      {/* Principles strip */}
      <section className={styles.principles}>
        <p className={styles.principlesText}>
          No fees. No gambling. No middleman — payment and the exchange are
          arranged between traders, the way trading should be.
        </p>
        <Link href="/safe-trading" className={styles.principlesLink}>
          Read the safe trading guide
        </Link>
      </section>
    </main>
  );
}
