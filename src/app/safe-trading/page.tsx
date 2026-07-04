import type { Metadata } from "next";
import Link from "next/link";
import styles from "../about/page.module.css";

export const metadata: Metadata = {
  title: "Safe Trading",
  description:
    "How to trade Pokemon TCG cards safely on Kanto Keepsakes — checking reputation, verifying cards, shipping tips, and spotting red flags.",
};

export default function SafeTradingPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Safe Trading Guide</h1>
        <p className={styles.intro}>
          Kanto Keepsakes connects traders — the trade itself is between you
          and the other person. These habits keep it safe.
        </p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Before you trade</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>Check their reputation</strong> — open the other
              trader&apos;s profile and look at their completed trade count,
              star rating, written reviews, and how long the account has
              existed. A brand-new account asking for a high-value trade
              deserves extra caution.
            </li>
            <li className={styles.listItem}>
              <strong>Read the listing comments</strong> — comments are public
              so the community can vouch for or warn about a listing. If
              something looks off, say so in the comments; the listing owner
              cannot delete other people&apos;s comments.
            </li>
            <li className={styles.listItem}>
              <strong>Ask for proof</strong> — request timestamped photos or a
              short video of the actual card, front and back, with the
              trader&apos;s username on paper next to it. For graded cards,
              verify the certification number on the grader&apos;s website
              (PSA, CGC, or BGS).
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>During the trade</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>Keep the negotiation in the chat</strong> — agree on
              every detail (cards, condition, payment, who ships first) inside
              Kanto Keepsakes messages so there is a record if a dispute is
              reported. Be wary of anyone pushing to move the conversation
              off-platform immediately.
            </li>
            <li className={styles.listItem}>
              <strong>Choose payment carefully</strong> — the platform never
              handles money. If cash is part of the deal, prefer payment
              methods with buyer/seller protection, and understand that
              friends-and-family style transfers have none.
            </li>
            <li className={styles.listItem}>
              <strong>Ship smart</strong> — use tracked shipping for
              everything and add insurance and signature-on-delivery for
              valuable cards. Card savers or top loaders inside a bubble
              mailer, never a bare envelope. Share tracking numbers in chat.
            </li>
            <li className={styles.listItem}>
              <strong>Meeting in person?</strong> — pick a busy public place
              (a card shop is ideal), bring a friend for high-value trades,
              and inspect cards before anything changes hands.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Red flags</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>Too good to be true</strong> — a chase card offered well
              under its going rate is bait more often than luck.
            </li>
            <li className={styles.listItem}>
              <strong>Pressure and urgency</strong> — &quot;pay now or I give
              it to someone else&quot; is a classic scam pattern.
            </li>
            <li className={styles.listItem}>
              <strong>Refusing verification</strong> — won&apos;t send new
              photos, a video, or the slab certification number.
            </li>
            <li className={styles.listItem}>
              <strong>Stock photos only</strong> — insists on using card
              database images instead of photographing the real card they
              claim to hold.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>After the trade</h2>
          <p className={styles.text}>
            When both sides have received their end, both of you confirm
            completion on the listing, then rate each other. Completions and
            ratings build the reputation the whole community relies on — do
            them every time. If a trade goes wrong, use the dispute option on
            the trade card and report the user; our moderation team reviews
            every report.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Report anything suspicious</h2>
          <p className={styles.text}>
            Every listing and profile has a Report button, and you can block
            any user to stop them contacting you. For urgent moderation
            issues, email{" "}
            <a href="mailto:kantokeepsakes@gmail.com">
              kantokeepsakes@gmail.com
            </a>
            . See also our <Link href="/terms">Terms of Service</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
