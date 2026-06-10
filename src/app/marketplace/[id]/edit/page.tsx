"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
  type Listing,
} from "@/lib/marketplace/types";
import styles from "./page.module.css";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

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
    async function loadListing() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const listing: Listing = await res.json();

      if (listing.user_id !== user.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (listing.status === "removed") {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setForm({
        type: listing.type,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        language: listing.language,
        price: listing.price !== null ? String(listing.price) : "",
        currency: listing.currency,
        images: listing.images,
      });
      setLoading(false);
    }

    loadListing();
  }, [id]);

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

    setSaving(true);

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price.trim() ? Number(form.price) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update listing.");
        setSaving(false);
        return;
      }

      router.push(`/marketplace/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete listing.");
        setDeleting(false);
        return;
      }
      router.push("/marketplace/my-listings");
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.loadingText}>Loading...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Listing Not Found</h1>
          <p className={styles.subtitle}>
            This listing doesn&apos;t exist or has been removed.
          </p>
          <Link href="/marketplace" className={styles.backLink}>
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Unauthorized</h1>
          <p className={styles.subtitle}>
            You can only edit your own listings.
          </p>
          <Link href="/marketplace" className={styles.backLink}>
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit Listing</h1>

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

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={saving || deleting}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? "Deleting..." : "Delete Listing"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
