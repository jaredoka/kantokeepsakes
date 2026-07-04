import type { Metadata } from "next";
import Link from "next/link";
import styles from "../about/page.module.css";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of Service for Kanto Keepsakes, the peer-to-peer Pokemon TCG trading marketplace.",
};

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Terms of Service</h1>
        <p className={styles.intro}>Last updated: July 4, 2026</p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>1. Acceptance of these terms</h2>
          <p className={styles.text}>
            By creating an account or using Kanto Keepsakes (the
            &quot;Service&quot;) — on the website or in the mobile app — you
            agree to these Terms of Service and our{" "}
            <Link href="/privacy">Privacy Policy</Link>. If you do not agree,
            do not use the Service. You must be at least 13 years old to use
            the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>2. What the Service is (and is not)</h2>
          <p className={styles.text}>
            Kanto Keepsakes is a peer-to-peer listing board where Pokemon TCG
            hobbyists post what they have and what they want, discover each
            other, and negotiate trades directly. The Service provides
            discovery, negotiation tools, and community trust features only.
            It is <strong>not</strong> a party to any trade. We do not process
            payments, hold funds in escrow, set prices, arrange shipping,
            verify card authenticity or condition, or guarantee that any trade
            completes. All trades are made directly between users, at their
            own risk. The Service hosts no gambling, raffles, or betting of
            any kind.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>3. Your account</h2>
          <p className={styles.text}>
            You are responsible for your account credentials and everything
            done under your account. Provide accurate information and keep it
            current. One account per person. You may delete your account at
            any time — see{" "}
            <Link href="/delete-account">How to delete your account</Link>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>4. User content and conduct</h2>
          <p className={styles.text}>
            Listings, offers, comments, messages, and profile details you post
            are your content. By posting, you grant us a non-exclusive,
            worldwide license to host and display that content for the purpose
            of operating the Service. We have <strong>zero tolerance for
            objectionable content and abusive behavior</strong>. You agree not
            to:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>Scam or defraud</strong> — misrepresenting cards or
              condition, taking payment or cards without delivering your side
              of a trade, or impersonating other users.
            </li>
            <li className={styles.listItem}>
              <strong>List counterfeit or stolen goods</strong> — including
              fake, proxy, or unauthorized reproduction cards presented as
              genuine.
            </li>
            <li className={styles.listItem}>
              <strong>Post objectionable content</strong> — harassment, hate
              speech, threats, sexual content, spam, or content that is
              illegal where you or the recipient live.
            </li>
            <li className={styles.listItem}>
              <strong>Run gambling or games of chance</strong> — raffles,
              mystery-pack drawings, or any wager dressed up as a trade.
            </li>
            <li className={styles.listItem}>
              <strong>Abuse the platform</strong> — automated scraping,
              circumventing rate limits or bans, manipulating reputation, or
              interfering with other users&apos; use of the Service.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>5. Moderation and enforcement</h2>
          <p className={styles.text}>
            Every listing, comment, and user profile can be reported in-app,
            and you can block any user to stop them contacting you. We review
            reports and act on violations — typically within 24 hours —
            including removing content, restricting features, and banning
            accounts, at our sole discretion. Users who post objectionable
            content or behave abusively will be ejected from the Service. To
            reach the moderation team directly, email{" "}
            <a href="mailto:kantokeepsakes@gmail.com">
              kantokeepsakes@gmail.com
            </a>
            .
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>6. Disclaimers and limitation of liability</h2>
          <p className={styles.text}>
            The Service is provided &quot;as is&quot; without warranties of
            any kind. To the maximum extent permitted by law, Kanto Keepsakes
            and its operator are not liable for any losses arising from trades
            between users — including lost, damaged, misrepresented, or
            undelivered cards or payments — or for indirect, incidental, or
            consequential damages arising from your use of the Service. Trade
            carefully: read our <Link href="/safe-trading">Safe Trading
            Guide</Link>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>7. Intellectual property</h2>
          <p className={styles.text}>
            Pokemon and Pokemon TCG names, card images, and related marks are
            the property of their respective owners (Nintendo, Creatures Inc.,
            GAME FREAK inc., and The Pokemon Company). Kanto Keepsakes is a
            fan-community trading board and is not affiliated with, endorsed
            by, or sponsored by those companies.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>8. Changes and termination</h2>
          <p className={styles.text}>
            We may update these terms as the Service evolves; material changes
            will be announced on the site or in the app, and continued use
            after a change means you accept the updated terms. We may suspend
            or terminate accounts that violate these terms. You may stop using
            the Service and delete your account at any time.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>9. Contact</h2>
          <p className={styles.text}>
            Questions about these terms? Email{" "}
            <a href="mailto:kantokeepsakes@gmail.com">
              kantokeepsakes@gmail.com
            </a>{" "}
            or see the <Link href="/contact">Contact page</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
