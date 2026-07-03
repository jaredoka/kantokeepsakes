"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/page.module.css";

/**
 * Landing page for Supabase password-recovery links (from the website's
 * /forgot-password or the mobile app's forgot-password screen). The browser
 * client's detectSessionInUrl consumes the token in the URL and establishes
 * a session; we then let the user set a new password via updateUser().
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Surface errors Supabase appends to the redirect (expired link etc.)
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, "")
    );
    const urlError =
      hashParams.get("error_description") ||
      new URLSearchParams(window.location.search).get("error_description");
    if (urlError) {
      setLinkError(urlError.replace(/\+/g, " "));
      return;
    }

    let cancelled = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setReady(true);
      } else {
        // Give detectSessionInUrl a moment to consume the token in the URL
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: retry }) => {
            if (!cancelled && !retry.session) {
              setLinkError("This reset link is invalid or has expired.");
            }
          });
        }, 2500);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/marketplace"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image
            src="/images/logo-wordmark-trimmed.png"
            alt="Kanto Keepsakes"
            width={85}
            height={36}
            className={styles.logo}
          />
        </div>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>Choose a new password</p>

        {done ? (
          <p className={styles.footer}>
            Password updated. Taking you to the marketplace...
          </p>
        ) : linkError ? (
          <>
            <div className={styles.error}>{linkError}</div>
            <p className={styles.footer}>
              <Link href="/forgot-password" className={styles.link}>
                Request a new reset link
              </Link>
            </p>
          </>
        ) : !ready ? (
          <p className={styles.footer}>Verifying your reset link...</p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirm" className={styles.label}>
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={styles.input}
                placeholder="Repeat the new password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
