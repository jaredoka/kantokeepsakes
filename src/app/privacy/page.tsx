import type { Metadata } from "next";
import Link from "next/link";
import styles from "../about/page.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Privacy Policy for Kanto Keepsakes — what data we collect, how we use it, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Privacy Policy</h1>
        <p className={styles.intro}>Last updated: July 4, 2026</p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>What we collect</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>Account data</strong> — your email address, username,
              password (stored as a hash by our authentication provider), and
              optional profile bio.
            </li>
            <li className={styles.listItem}>
              <strong>Content you post</strong> — listings (including card
              selections, country/state, and descriptions), offers and
              counteroffers, comments, chat messages, trade completions, and
              ratings.
            </li>
            <li className={styles.listItem}>
              <strong>Activity data</strong> — saved listings, blocked users,
              reports you submit, and notification preferences.
            </li>
            <li className={styles.listItem}>
              <strong>Device data</strong> — if you enable push notifications
              in the mobile app, a push notification token identifying your
              device. We also process IP addresses transiently for rate
              limiting and abuse prevention.
            </li>
          </ul>
          <p className={styles.text}>
            We do <strong>not</strong> collect payment information (the
            platform never touches payments), precise location, contacts, or
            browsing history. We show no ads, use no third-party advertising
            or analytics trackers, and never sell your data.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>How we use it</h2>
          <p className={styles.text}>
            Your data is used solely to operate the marketplace: displaying
            your listings and profile to other traders, delivering offers and
            messages, computing your trade reputation, sending the email and
            push notifications you have enabled (each can be turned off in
            your profile settings), and keeping the community safe through
            rate limiting, report handling, and moderation.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>What other users can see</h2>
          <p className={styles.text}>
            Your username, bio, reputation, join date, active and sold
            listings, and comments are publicly visible. Your email address is
            never shown to other users. Chat messages and offers are visible
            only to the two parties involved. Your country and state/province
            are shown on listings you post.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Service providers</h2>
          <p className={styles.text}>
            We use a small set of infrastructure providers to run the Service:
            Supabase (database, authentication, file storage, hosted in the
            cloud), Vercel (website hosting), Cloudflare (DNS and signup
            CAPTCHA via Turnstile), Resend (transactional email), and Expo
            (mobile push notification delivery). Card images are loaded from
            the public TCGdex and pokemontcg.io card databases. These
            providers process data only to provide their service to us.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Retention and deletion</h2>
          <p className={styles.text}>
            Your data is kept while your account exists. Deleting your account
            — available in the mobile app&apos;s Profile tab or on your
            website profile — permanently removes your account, profile,
            listings, offers, conversations, saved listings, push tokens, and
            uploaded images. See{" "}
            <Link href="/delete-account">How to delete your account</Link> for
            step-by-step instructions. Push tokens are also removed whenever
            you log out of the app.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Children</h2>
          <p className={styles.text}>
            The Service is not directed at children under 13, and we do not
            knowingly collect data from them. If you believe a child under 13
            has an account, contact us and we will delete it.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Changes and contact</h2>
          <p className={styles.text}>
            We will update this policy if our data practices change, and note
            the date at the top. Questions or data requests:{" "}
            <a href="mailto:kantokeepsakes@gmail.com">
              kantokeepsakes@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
