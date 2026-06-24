"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CardSearch from "@/components/CardSearch";
import SetSearch from "@/components/SetSearch";
import { validateListing } from "@/lib/marketplace/validation";
import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_LANGUAGES,
  CURRENCIES,
  LISTING_TYPE_LABELS,
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
  GRADING_COMPANIES,
  PSA_GRADES,
  CGC_GRADES,
  BGS_GRADES,
  type ListingFormData,
  type Listing,
  type GradingCompany,
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
    wantsCash: false,
    wantsOffers: false,
    wantsSingles: false,
    wantsGraded: false,
    wantsSealed: false,
    grader: "RAW",
    grade: "10",
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
        wantsCash: listing.wants_cash ?? listing.price !== null,
        wantsOffers: listing.wants_offers ?? false,
        wantsSingles: listing.wants_singles ?? false,
        wantsGraded: listing.wants_graded ?? false,
        wantsSealed: listing.wants_sealed ?? false,
        grader: "RAW",
        grade: "10",
      });
      setLoading(false);
    }

    loadListing();
  }, [id]);

  function updateField<K extends keyof ListingFormData>(
    key: K,
    value: ListingFormData[K]
  ) {
    setForm((prev) => {
      // Clear images when switching categories (different image sources)
      if (key === "category" && value !== prev.category) {
        return { ...prev, [key]: value, images: [] };
      }
      return { ...prev, [key]: value };
    });
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

          {/* Grading */}
          <div className={styles.field}>
            <label className={styles.label}>Condition</label>
            <div className={styles.gradingRow}>
              <div className={styles.gradingPills}>
                {GRADING_COMPANIES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${styles.gradingPill} ${form.grader === g ? styles.gradingPillActive : ""}`}
                    onClick={() => updateField("grader", g as GradingCompany)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {(form.grader === "PSA" || form.grader === "CGC" || form.grader === "BGS") && (
              <div className={styles.gradePickerWrap}>
                <span className={styles.gradePickerLabel}>Grade</span>
                <div className={styles.gradePicker}>
                  {(form.grader === "PSA" ? PSA_GRADES : form.grader === "CGC" ? CGC_GRADES : BGS_GRADES).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`${styles.gradeBtn} ${form.grade === g ? styles.gradeBtnActive : ""}`}
                      onClick={() => updateField("grade", g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* My Items — Images (category-specific picker) */}
          <div className={styles.field}>
            <label className={styles.label}>
              {form.category === "sealed" ? "Select Set" : "Select Card"}
            </label>
            {(form.category === "singles" || form.category === "graded") && (
              <CardSearch
                images={form.images}
                onImagesChange={(imgs) => updateField("images", imgs)}
              />
            )}
            {form.category === "sealed" && (
              <SetSearch
                images={form.images}
                onImagesChange={(imgs) => updateField("images", imgs)}
              />
            )}
          </div>

          {/* What do you want? Section */}
          <div className={styles.sectionDivider}>
            <h2 className={styles.sectionTitle}>What do you want?</h2>
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
                Cash <span className={styles.checkboxHint}>— set your price</span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsOffers}
                onChange={(e) => updateField("wantsOffers", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Offers <span className={styles.checkboxHint}>— open to any offer</span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsSingles}
                onChange={(e) => updateField("wantsSingles", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Singles <span className={styles.checkboxHint}>— trade for singles</span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsGraded}
                onChange={(e) => updateField("wantsGraded", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Graded <span className={styles.checkboxHint}>— trade for graded cards</span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsSealed}
                onChange={(e) => updateField("wantsSealed", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Any Sealed <span className={styles.checkboxHint}>— trade for sealed products</span>
              </span>
            </label>
          </div>

          {/* Cash fields */}
          {form.wantsCash && (
            <div className={styles.priceRow}>
              <div className={styles.field} style={{ flex: 1 }}>
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
