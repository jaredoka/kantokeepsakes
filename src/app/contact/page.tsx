import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Kanto Keepsakes. Reach out for support, feedback, or general enquiries.",
};

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Contact Us</h1>
        <p className={styles.intro}>
          Have a question, issue, or suggestion? We&apos;d love to hear from you.
        </p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Get in touch</h2>
          <div className={styles.contactMethods}>
            <a
              href="mailto:kantokeepsakes@gmail.com"
              className={styles.contactCard}
            >
              <div className={styles.contactIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 className={styles.contactLabel}>Email</h3>
              <span className={styles.contactValue}>
                kantokeepsakes@gmail.com
              </span>
            </a>

            <a
              href="https://www.instagram.com/kantokeepsakes"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactCard}
            >
              <div className={styles.contactIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3 className={styles.contactLabel}>Instagram</h3>
              <span className={styles.contactValue}>@kantokeepsakes</span>
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Common questions</h2>
          <div className={styles.faq}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                How do I report a suspicious listing or user?
              </h3>
              <p className={styles.faqAnswer}>
                Use the &ldquo;Report&rdquo; button on any listing or user profile.
                Our team reviews all reports promptly.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                I forgot my password. How do I reset it?
              </h3>
              <p className={styles.faqAnswer}>
                Visit the{" "}
                <Link href="/forgot-password" className={styles.link}>
                  forgot password page
                </Link>{" "}
                and enter your email. You&apos;ll receive a link to set a new
                password.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                How do I stay safe when trading?
              </h3>
              <p className={styles.faqAnswer}>
                Read our{" "}
                <Link href="/safe-trading" className={styles.link}>
                  Safe Trading Guide
                </Link>{" "}
                for tips on meeting up and completing transactions securely.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Location</h2>
          <p className={styles.text}>
            Kanto Keepsakes is based in Brunei Darussalam. We operate as an
            online-only marketplace connecting local Pokemon TCG collectors.
          </p>
        </section>
      </div>
    </main>
  );
}
