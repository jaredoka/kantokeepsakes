"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
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
        <h1 className={styles.title}>Forgot password</h1>
        <p className={styles.subtitle}>
          We&apos;ll email you a link to reset it
        </p>

        {sent ? (
          <p className={styles.footer}>
            If an account exists for <strong>{email.trim()}</strong>, a reset
            link is on its way. Check your inbox (and spam folder).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          Remembered it?{" "}
          <Link href="/login" className={styles.link}>
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
