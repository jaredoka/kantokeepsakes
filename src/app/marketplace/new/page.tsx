"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";
import CardSearch from "@/components/CardSearch";
import { validateListing } from "@/lib/marketplace/validation";
import {
  CURRENCIES,
  type ListingFormData,
} from "@/lib/marketplace/types";
import styles from "./page.module.css";

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [form, setForm] = useState<ListingFormData>({
    havesText: "",
    wantsText: "",
    description: "",
    price: "",
    currency: "BND",
    haveImages: [],
    wantItems: [],
    wantsCash: false,
    wantsOffers: false,
    wantsSingles: false,
    wantsGraded: false,
    wantsSealed: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, []);

  const onVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  function updateField<K extends keyof ListingFormData>(
    key: K,
    value: ListingFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateListing(form);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price.trim() ? Number(form.price) : null,
          turnstileToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create listing.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/marketplace/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (authed === null) {
    return (
      <main className={styles.main}>
        <p className={styles.loadingText}>Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Create a Listing</h1>
          <p className={styles.subtitle}>
            You need to be logged in to create a listing.
          </p>
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.authLinkPrimary}>
              Log in
            </Link>
            <Link href="/signup" className={styles.authLink}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Build title preview
  const titlePreview = `[H] ${form.havesText || "..."} [W] ${form.wantsText || "..."}`;

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <Link href="/marketplace" className={styles.backLink}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </Link>
        <h1 className={styles.title}>Post a listing</h1>
        <p className={styles.subtitle}>
          Post a trade listing for Pokemon TCG items
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Title — [H] and [W] inputs */}
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <div className={styles.titlePreview}>{titlePreview}</div>
            <div className={styles.titleRow}>
              <div className={styles.titleInputGroup}>
                <span className={styles.titlePrefix}>[H]</span>
                <input
                  type="text"
                  value={form.havesText}
                  onChange={(e) => updateField("havesText", e.target.value)}
                  className={styles.titleInput}
                  placeholder="e.g. Charizard ex PSA 10, Sealed ETB"
                  maxLength={100}
                />
              </div>
              <span className={styles.charCount}>
                {form.havesText.length}/100
              </span>
            </div>
            <div className={styles.titleRow}>
              <div className={styles.titleInputGroup}>
                <span className={styles.titlePrefix}>[W]</span>
                <input
                  type="text"
                  value={form.wantsText}
                  onChange={(e) => updateField("wantsText", e.target.value)}
                  className={styles.titleInput}
                  placeholder="e.g. Mewtwo GX, Any offers, PayPal"
                  maxLength={100}
                />
              </div>
              <span className={styles.charCount}>
                {form.wantsText.length}/100
              </span>
            </div>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={styles.textarea}
              placeholder="Condition details, card language, shipping info..."
              rows={5}
              maxLength={2000}
            />
            <span className={styles.charCount}>
              {form.description.length}/2000
            </span>
          </div>

          {/* Haves — Card picker with per-card grading */}
          <div className={styles.field}>
            <label className={styles.label}>
              Have Cards{" "}
              <span className={styles.optional}>(click card to set grade)</span>
            </label>
            <CardSearch
              mode="have"
              haveImages={form.haveImages}
              onHaveImagesChange={(imgs) => updateField("haveImages", imgs)}
            />
          </div>

          {/* Wants — Card picker with type tags */}
          <div className={styles.field}>
            <label className={styles.label}>
              Want Cards{" "}
              <span className={styles.optional}>
                (click card to set type: Singles/Graded/Sealed)
              </span>
            </label>
            <CardSearch
              mode="want"
              wantItems={form.wantItems}
              onWantItemsChange={(items) => updateField("wantItems", items)}
            />
          </div>

          {/* What do you want? — Preferences */}
          <div className={styles.sectionDivider}>
            <h2 className={styles.sectionTitle}>Trading Preferences</h2>
            <p className={styles.sectionSubtitle}>
              Select at least one. You can combine multiple options.
            </p>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsCash}
                onChange={(e) => updateField("wantsCash", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Cash{" "}
                <span className={styles.checkboxHint}>— set your price</span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsOffers}
                onChange={(e) => updateField("wantsOffers", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Offers{" "}
                <span className={styles.checkboxHint}>
                  — open to any offer
                </span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsSingles}
                onChange={(e) => updateField("wantsSingles", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Singles{" "}
                <span className={styles.checkboxHint}>
                  — trade for singles
                </span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsGraded}
                onChange={(e) => updateField("wantsGraded", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Graded{" "}
                <span className={styles.checkboxHint}>
                  — trade for graded cards
                </span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsSealed}
                onChange={(e) => updateField("wantsSealed", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Sealed{" "}
                <span className={styles.checkboxHint}>
                  — trade for sealed products
                </span>
              </span>
            </label>
          </div>

          {form.wantsCash && (
            <div className={styles.priceRow}>
              <div className={`${styles.field} ${styles.fieldFlex}`}>
                <label htmlFor="price" className={styles.label}>
                  Price
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  className={styles.input}
                  placeholder="Enter amount"
                />
              </div>
              <div className={styles.field} style={{ width: 100 }}>
                <label htmlFor="currency" className={styles.label}>
                  Currency
                </label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) =>
                    updateField(
                      "currency",
                      e.target.value as ListingFormData["currency"]
                    )
                  }
                  className={styles.select}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className={styles.turnstile}>
            <Turnstile onVerify={onVerify} />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
