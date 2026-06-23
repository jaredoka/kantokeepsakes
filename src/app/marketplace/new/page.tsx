"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";
import ImageUploader from "@/components/ImageUploader";
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
  type GradingCompany,
} from "@/lib/marketplace/types";
import styles from "./page.module.css";

function getConditionTag(grader: GradingCompany, grade: string): string {
  if (grader === "RAW") return "[RAW]";
  if (grader === "SEALED") return "[SEALED]";
  return `[${grader}${grade}]`;
}

function stripExistingTag(title: string): string {
  return title.replace(/^\[[A-Z0-9.]+\]\s*/, "");
}

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [form, setForm] = useState<ListingFormData>({
    type: "WTS",
    title: "[RAW] ",
    description: "",
    category: "singles",
    language: "japanese",
    price: "",
    currency: "BND",
    images: [],
    wantsCash: false,
    wantsCards: false,
    wantsOffers: false,
    lookingForDescription: "",
    lookingForImages: [],
    grader: "RAW",
    grade: "10",
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
    setForm((prev) => {
      // Clear images when switching categories (different image sources)
      if (key === "category" && value !== prev.category) {
        return { ...prev, [key]: value, images: [] };
      }
      return { ...prev, [key]: value };
    });
  }

  function handleGraderChange(newGrader: GradingCompany) {
    setForm((prev) => {
      const body = stripExistingTag(prev.title);
      const newGrade =
        newGrader === "PSA"
          ? "10"
          : newGrader === "CGC" || newGrader === "BGS"
            ? "9.5"
            : "";
      const tag = getConditionTag(newGrader, newGrade);
      return {
        ...prev,
        grader: newGrader,
        grade: newGrade,
        title: body ? `${tag} ${body}` : `${tag} `,
      };
    });
  }

  function handleGradeChange(newGrade: string) {
    setForm((prev) => {
      const body = stripExistingTag(prev.title);
      const tag = getConditionTag(prev.grader, newGrade);
      return {
        ...prev,
        grade: newGrade,
        title: body ? `${tag} ${body}` : `${tag} `,
      };
    });
  }

  function handleTitleChange(raw: string) {
    const tag = getConditionTag(form.grader, form.grade);
    const prefix = tag + " ";
    if (!raw.startsWith(prefix)) {
      const body = stripExistingTag(raw);
      updateField("title", prefix + body);
    } else {
      updateField("title", raw);
    }
  }

  const gradeOptions =
    form.grader === "PSA"
      ? PSA_GRADES
      : form.grader === "CGC"
        ? CGC_GRADES
        : form.grader === "BGS"
          ? BGS_GRADES
          : null;

  const currentTag = getConditionTag(form.grader, form.grade);

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

          {/* Condition / Grading — before Title */}
          <div className={styles.field}>
            <label className={styles.label}>Condition</label>
            <div className={styles.gradingRow}>
              <div className={styles.gradingPills}>
                {GRADING_COMPANIES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${styles.gradingPill} ${form.grader === g ? styles.gradingPillActive : ""}`}
                    onClick={() => handleGraderChange(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {gradeOptions && (
              <div className={styles.gradePickerWrap}>
                <span className={styles.gradePickerLabel}>Grade</span>
                <div className={styles.gradePicker}>
                  {gradeOptions.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`${styles.gradeBtn} ${form.grade === g ? styles.gradeBtnActive : ""}`}
                      onClick={() => handleGradeChange(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.gradePreview}>{currentTag}</div>
          </div>

          {/* Title — auto-prefixed with condition tag */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Title
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={styles.input}
              placeholder={`${currentTag} e.g. Charizard ex`}
              maxLength={120}
            />
            <span className={styles.charCount}>{form.title.length}/120</span>
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

          {/* Category + Language — inline on desktop, stacked on mobile */}
          <div className={styles.categoryLanguageRow}>
            <div className={`${styles.field} ${styles.fieldFlex}`}>
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

            <div className={`${styles.field} ${styles.fieldFlex}`}>
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
          </div>

          {/* My Items — Images (category-specific picker) */}
          <div className={styles.field}>
            <label className={styles.label}>
              {form.category === "accessories"
                ? "My Items — Photos"
                : form.category === "sealed"
                  ? "Select Set"
                  : "Select Card"}
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
            {form.category === "accessories" && (
              <ImageUploader
                images={form.images}
                onImagesChange={(imgs) => updateField("images", imgs)}
              />
            )}
          </div>

          {/* What do you want? */}
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
                Cash{" "}
                <span className={styles.checkboxHint}>— set your price</span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsCards}
                onChange={(e) => updateField("wantsCards", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Cards{" "}
                <span className={styles.checkboxHint}>
                  — trade for specific cards
                </span>
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.wantsOffers}
                onChange={(e) => updateField("wantsOffers", e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                Offers{" "}
                <span className={styles.checkboxHint}>
                  — open to any offer
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

          {form.wantsCards && (
            <>
              <div className={styles.field}>
                <label htmlFor="lookingForDescription" className={styles.label}>
                  Cards you want
                </label>
                <textarea
                  id="lookingForDescription"
                  value={form.lookingForDescription}
                  onChange={(e) =>
                    updateField("lookingForDescription", e.target.value)
                  }
                  className={styles.textarea}
                  placeholder="e.g. Pikachu VMAX Alt Art, any Charizard card..."
                  rows={3}
                  maxLength={1000}
                />
                <span className={styles.charCount}>
                  {form.lookingForDescription.length}/1000
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Reference Photos{" "}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <ImageUploader
                  images={form.lookingForImages}
                  onImagesChange={(imgs) =>
                    updateField("lookingForImages", imgs)
                  }
                />
              </div>
            </>
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
