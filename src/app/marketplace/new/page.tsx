"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";
import ImageUploader from "@/components/ImageUploader";
import { validateListing } from "@/lib/marketplace/validation";
import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_LANGUAGES,
  CURRENCIES,
  LISTING_TYPE_LABELS,
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
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
    type: "WTS",
    title: "",
    description: "",
    category: "singles",
    language: "japanese",
    price: "",
    currency: "BND",
    images: [],
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

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create a Listing</h1>
        <p className={styles.subtitle}>
          Post a WTB or WTS listing for Pokemon TCG items
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Listing Type */}
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <div className={styles.toggleGroup}>
              {LISTING_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.toggleBtn} ${form.type === t ? styles.toggleBtnActive : ""}`}
                  onClick={() => updateField("type", t)}
                >
                  {LISTING_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Title
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={styles.input}
              placeholder='e.g. "WTS Charizard VMAX Alt Art NM"'
              maxLength={120}
            />
            <span className={styles.charCount}>
              {form.title.length}/120
            </span>
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
              placeholder="Condition, details, shipping info..."
              rows={5}
              maxLength={2000}
            />
            <span className={styles.charCount}>
              {form.description.length}/2000
            </span>
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label htmlFor="category" className={styles.label}>
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) =>
                updateField(
                  "category",
                  e.target.value as ListingFormData["category"]
                )
              }
              className={styles.select}
            >
              {LISTING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className={styles.field}>
            <label htmlFor="language" className={styles.label}>
              Language
            </label>
            <select
              id="language"
              value={form.language}
              onChange={(e) =>
                updateField(
                  "language",
                  e.target.value as ListingFormData["language"]
                )
              }
              className={styles.select}
            >
              {LISTING_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </select>
          </div>

          {/* Price + Currency */}
          <div className={styles.priceRow}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label htmlFor="price" className={styles.label}>
                Price <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                className={styles.input}
                placeholder="Leave blank for &quot;Make Offer&quot;"
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

          {/* Images */}
          <div className={styles.field}>
            <label className={styles.label}>Images</label>
            <ImageUploader
              images={form.images}
              onImagesChange={(imgs) => updateField("images", imgs)}
            />
          </div>

          {/* Turnstile */}
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
