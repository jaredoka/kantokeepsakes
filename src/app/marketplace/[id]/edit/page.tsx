"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CardSearch from "@/components/CardSearch";
import { validateListing } from "@/lib/marketplace/validation";
import {
  CURRENCIES,
  type ListingFormData,
  type Listing,
} from "@/lib/marketplace/types";
import styles from "./page.module.css";

/** Parse a title string into havesText and wantsText */
function parseTitle(title: string): { havesText: string; wantsText: string } {
  // Try to split on [H] ... [W] ...
  const match = title.match(/^\[H\]\s*(.*?)\s*\[W\]\s*(.*?)$/i);
  if (match) {
    return { havesText: match[1].trim(), wantsText: match[2].trim() };
  }
  // Legacy title format — put entire title as havesText
  // Strip old condition tags like [RAW], [PSA10], etc.
  const stripped = title.replace(/^\[[A-Z0-9.]+\]\s*/, "").trim();
  return { havesText: stripped || title, wantsText: "" };
}

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

      const { havesText, wantsText } = parseTitle(listing.title);

      // Convert existing images (URL strings) to HaveImage[] with RAW defaults
      const haveImages = (listing.images || []).map((url) => ({
        url,
        grader: "RAW" as const,
        grade: "",
      }));

      // Convert looking_for_images to WantItem[] with singles defaults
      const wantItems = (listing.looking_for_images || []).map((url) => ({
        url,
        type: "singles" as const,
      }));

      setForm({
        havesText,
        wantsText,
        description: listing.description,
        price: listing.price !== null ? String(listing.price) : "",
        currency: listing.currency,
        haveImages,
        wantItems,
        wantsCash: listing.wants_cash ?? listing.price !== null,
        wantsOffers: listing.wants_offers ?? false,
        wantsSingles: listing.wants_singles ?? false,
        wantsGraded: listing.wants_graded ?? false,
        wantsSealed: listing.wants_sealed ?? false,
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

  const titlePreview = `[H] ${form.havesText || "..."} [W] ${form.wantsText || "..."}`;

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit Listing</h1>

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
                (click card to set type)
              </span>
            </label>
            <CardSearch
              mode="want"
              wantItems={form.wantItems}
              onWantItemsChange={(items) => updateField("wantItems", items)}
            />
          </div>

          {/* Trading Preferences */}
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
