import type { Metadata } from "next";
import Link from "next/link";
import styles from "../about/page.module.css";

export const metadata: Metadata = {
  title: "Delete Account",
  description:
    "How to permanently delete your Kanto Keepsakes account and all associated data, from the mobile app or the website.",
};

export default function DeleteAccountPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.heading}>How to delete your account</h1>
        <p className={styles.intro}>
          Deleting your Kanto Keepsakes account is permanent and available
          in-app and on the website. No email or support ticket required.
        </p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>In the mobile app</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>1.</strong> Open the <strong>Profile</strong> tab.
            </li>
            <li className={styles.listItem}>
              <strong>2.</strong> Scroll to the <strong>Danger Zone</strong>{" "}
              at the bottom.
            </li>
            <li className={styles.listItem}>
              <strong>3.</strong> Type <strong>DELETE</strong> in the
              confirmation box and tap <strong>Delete Account</strong>.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>On the website</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>1.</strong> <Link href="/login">Log in</Link>, then open
              your profile via the avatar button in the header.
            </li>
            <li className={styles.listItem}>
              <strong>2.</strong> Click <strong>Edit Profile</strong> and
              scroll to the <strong>Danger Zone</strong>.
            </li>
            <li className={styles.listItem}>
              <strong>3.</strong> Type <strong>DELETE</strong> to confirm and
              click <strong>Delete Account</strong>.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>What gets deleted</h2>
          <p className={styles.text}>
            Deletion is immediate and permanent: your login, profile,
            listings, offers, conversations and messages, comments, saved
            listings, blocks, push notification tokens, and uploaded images
            are all removed. Ratings you left for other traders remain part of
            their trade history but are no longer linked to an active account.
            Deleted data cannot be recovered — you can always create a new
            account later, but your reputation starts fresh.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Need help?</h2>
          <p className={styles.text}>
            If you cannot access your account, email{" "}
            <a href="mailto:kantokeepsakes@gmail.com">
              kantokeepsakes@gmail.com
            </a>{" "}
            from the address you registered with and we will delete the
            account for you. See our <Link href="/privacy">Privacy
            Policy</Link> for details on data handling.
          </p>
        </section>
      </div>
    </main>
  );
}
