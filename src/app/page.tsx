import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.mainContent}>
      <section className={styles.hero}>
        <h1>Welcome to Kanto Keepsakes</h1>
        <p>Your source for Pokemon TCG products in Brunei</p>
      </section>

      <section className={`${styles.categories} container`}>
        <div className={styles.categoryGroup}>
          <Link href="/japanese" className={`${styles.categoryCard} ${styles.categoryCardLarge} ${styles.categoryJapanese}`}>
            <div>
              <h2 className={styles.categoryCardTitleLarge}>Japanese</h2>
              <p className={styles.categoryCardSubtitleLarge}>Browse all Japanese products</p>
            </div>
          </Link>
          <div className={styles.subcategoryGrid}>
            <Link href="/japanese-sealed" className={`${styles.categoryCard} ${styles.categoryCardSmall}`}>
              <div className={styles.categoryCardSmallContent}>
                <h3 className={styles.categoryCardTitleSmall}>Sealed</h3>
                <p className={styles.categoryCardSubtitleSmall}>Booster boxes, ETBs &amp; more</p>
              </div>
            </Link>
            <Link href="/japanese-singles" className={`${styles.categoryCard} ${styles.categoryCardSmall}`}>
              <div className={styles.categoryCardSmallContent}>
                <h3 className={styles.categoryCardTitleSmall}>Singles</h3>
                <p className={styles.categoryCardSubtitleSmall}>Individual cards</p>
              </div>
            </Link>
            <Link href="/japanese-graded" className={`${styles.categoryCard} ${styles.categoryCardSmall}`}>
              <div className={styles.categoryCardSmallContent}>
                <h3 className={styles.categoryCardTitleSmall}>Graded</h3>
                <p className={styles.categoryCardSubtitleSmall}>PSA, CGC &amp; more</p>
              </div>
            </Link>
          </div>
        </div>

        <div className={styles.categoryGroup}>
          <Link href="/english" className={`${styles.categoryCard} ${styles.categoryCardLarge} ${styles.categoryEnglish}`}>
            <div>
              <h2 className={styles.categoryCardTitleLarge}>English</h2>
              <p className={styles.categoryCardSubtitleLarge}>Browse all English products</p>
            </div>
          </Link>
          <div className={styles.subcategoryGrid}>
            <Link href="/english-sealed" className={`${styles.categoryCard} ${styles.categoryCardSmall}`}>
              <div className={styles.categoryCardSmallContent}>
                <h3 className={styles.categoryCardTitleSmall}>Sealed</h3>
                <p className={styles.categoryCardSubtitleSmall}>Booster boxes, ETBs &amp; more</p>
              </div>
            </Link>
            <Link href="/english-singles" className={`${styles.categoryCard} ${styles.categoryCardSmall}`}>
              <div className={styles.categoryCardSmallContent}>
                <h3 className={styles.categoryCardTitleSmall}>Singles</h3>
                <p className={styles.categoryCardSubtitleSmall}>Individual cards</p>
              </div>
            </Link>
            <Link href="/english-graded" className={`${styles.categoryCard} ${styles.categoryCardSmall}`}>
              <div className={styles.categoryCardSmallContent}>
                <h3 className={styles.categoryCardTitleSmall}>Graded</h3>
                <p className={styles.categoryCardSubtitleSmall}>PSA, CGC &amp; more</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.ctaSection}>
        <Link href="/marketplace" className={styles.ctaButton}>
          Browse Marketplace
        </Link>
      </div>
    </main>
  );
}
