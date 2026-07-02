"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";
import CardPicker from "@/components/CardPicker";
import { validateListing } from "@/lib/marketplace/validation";
import { COUNTRIES, STATES_BY_COUNTRY, type CardItem, type Country } from "@/lib/marketplace/cardData";
import styles from "./page.module.css";

// ── SVG icon helpers ────────────────────────────────────────────────────────
function IconSingles({ active }: { active: boolean }) {
  const c = active ? "#92400e" : "#9ca3af";
  return (
    <svg width={20} height={28} viewBox="0 0 20 28" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="17" height="25" rx="2.5" />
      <rect x="3.5" y="3.5" width="13" height="11" rx="1.5" strokeWidth="1.25" />
    </svg>
  );
}

function IconGraded({ active }: { active: boolean }) {
  const c = active ? "#92400e" : "#9ca3af";
  const labelFill = active ? "#b45309" : "#d1d5db";
  return (
    <svg width={20} height={28} viewBox="0 0 20 28" overflow="visible" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-2" y="-9.5" width="24" height="39" rx="1.5" stroke={c} strokeWidth="1.75" />
      <rect x="1.5" y="-8.5" width="17" height="8" rx="1" fill={labelFill} />
      <rect x="2.75" y="-7.5" width="14.5" height="5.5" rx="0.5" fill="#ffffff" />
      <rect x="1.5" y="1.5" width="17" height="25" rx="2.5" stroke={c} strokeWidth="1.5" />
      <rect x="3.5" y="3.5" width="13" height="11" rx="1.5" stroke={c} strokeWidth="1.25" />
    </svg>
  );
}

function IconSealed({ active }: { active: boolean }) {
  const c = active ? "#92400e" : "#9ca3af";
  return (
    <svg width={28} height={22} viewBox="0 0 28 22" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="5.5" width="18" height="15" rx="1.5" />
      <path d="M1.5 5.5 L5.5 1.5 L25 1.5 L25 6.5 L19.5 6.5 L19.5 5.5 Z" />
      <path d="M19.5 5.5 L25 1.5 L25 16.5 L19.5 20.5 Z" />
      <line x1="1.5" y1="10" x2="19.5" y2="10" strokeWidth="1" />
      <circle cx="10.5" cy="15" r="2.8" strokeWidth="1.25" />
      <line x1="7.7" y1="15" x2="13.3" y2="15" strokeWidth="1" />
      <circle cx="10.5" cy="15" r="1" fill={c} stroke="none" />
    </svg>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHead({ n, title, flag, note }: { n: string; title: string; flag?: string | null; note?: string | null }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionBadge}>{n}</span>
      <span className={styles.sectionTitle}>{title}</span>
      {flag && <span className={styles.sectionFlag}>{flag}</span>}
      {note && <span className={styles.sectionNote}>{note}</span>}
    </div>
  );
}

function CharCount({ val, max }: { val: number; max: number }) {
  return (
    <div className={`${styles.charCount} ${val >= max ? styles.charCountOver : ""}`}>
      {val}/{max}
    </div>
  );
}

function ThumbContainer({ images, onRemove, emptyMsg }: { images: CardItem[]; onRemove: (i: number) => void; emptyMsg: string }) {
  return (
    <div className={`${styles.thumbContainer} ${images.length ? styles.thumbContainerFilled : styles.thumbContainerEmpty}`}>
      {images.length ? (
        images.map((card, i) => (
          <div key={`${card.localId || ""}${i}`} className={styles.thumbCard}>
            <img
              src={card.img}
              alt={card.name || ""}
              className={styles.thumbImg}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <button type="button" className={styles.thumbRemove} onClick={() => onRemove(i)}>
              &times;
            </button>
          </div>
        ))
      ) : (
        <span className={styles.thumbEmptyMsg}>{emptyMsg}</span>
      )}
    </div>
  );
}

function PrefCard({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`${styles.prefCard} ${active ? styles.prefCardActive : ""}`} onClick={onClick}>
      <span className={`${styles.prefCardIcon} ${active ? styles.prefCardIconActive : ""}`}>{icon}</span>
      <span className={`${styles.prefCardLabel} ${active ? styles.prefCardLabelActive : ""}`}>{label}</span>
    </button>
  );
}

// ── Main page component ─────────────────────────────────────────────────────

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Country
  const [country, setCountry] = useState<Country | null>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);

  // State / Province
  const [state, setState] = useState<string | null>(null);

  // Title
  const [havesText, setHavesText] = useState("");
  const [wantsText, setWantsText] = useState("");

  // Haves
  const [haveImages, setHaveImages] = useState<CardItem[]>([]);
  const [havesCash, setHavesCash] = useState(false);

  // Wants
  const [wantImages, setWantImages] = useState<CardItem[]>([]);
  const [wPrefs, setWPrefs] = useState({ cash: false, singles: false, graded: false, sealed: false });

  // Description
  const [description, setDescription] = useState("");

  // Responsive
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const TITLE_LIMIT = 40;
  const DESC_LIMIT = 300;

  const toggleW = (k: keyof typeof wPrefs) => setWPrefs((p) => ({ ...p, [k]: !p[k] }));

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, []);

  const onVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  // Filtered countries
  const filteredCountries = useMemo(() => {
    const q = countryQuery.toLowerCase().trim();
    return q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)) : COUNTRIES;
  }, [countryQuery]);

  // States for selected country
  const countryStates = country ? (STATES_BY_COUNTRY[country.name] ?? []) : [];

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!country) {
      setError("Please select your country.");
      return;
    }

    // Transform to API body shape
    const apiBody = {
      havesText,
      wantsText,
      description,
      price: null as number | null,
      currency: "BND",
      haveImages: haveImages.map((c) => ({ url: c.img })),
      wantItems: wantImages.map((c) => ({ url: c.img })),
      wantsCash: wPrefs.cash,
      wantsOffers: false,
      wantsSingles: wPrefs.singles,
      wantsGraded: wPrefs.graded,
      wantsSealed: wPrefs.sealed,
      country: country?.name ?? null,
      state: state ?? null,
      turnstileToken,
    };

    const validation = validateListing({
      havesText: apiBody.havesText,
      wantsText: apiBody.wantsText,
      description: apiBody.description,
      price: "",
      currency: apiBody.currency,
      haveImages: apiBody.haveImages.map((img) => ({ url: img.url, grader: "RAW" as const, grade: "" })),
      wantItems: apiBody.wantItems.map((item) => ({ url: item.url, type: "singles" as const })),
      wantsCash: apiBody.wantsCash,
      wantsOffers: false,
      wantsSingles: apiBody.wantsSingles,
      wantsGraded: apiBody.wantsGraded,
      wantsSealed: apiBody.wantsSealed,
    });

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
        body: JSON.stringify(apiBody),
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

  // ── Auth states ───────────────────────────────────────────────────────────
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
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Create a Listing</h1>
          <p className={styles.authSubtitle}>You need to be logged in to create a listing.</p>
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.authLinkPrimary}>Log in</Link>
            <Link href="/signup" className={styles.authLink}>Sign up</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/marketplace" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </Link>
        <h1 className={styles.pageTitle}>Post a listing</h1>
        <p className={styles.pageSubtitle}>Post a trade listing for Pok&eacute;mon TCG items</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* ── SECTION 1: COUNTRY ──────────────────────────────────────── */}
          <div className={styles.sectionCard}>
            <SectionHead n="1" title="Country" flag={country ? country.flag : null} />
            <div className={styles.sectionBody}>
              <div className={styles.countryInputWrap}>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={countryQuery}
                  onFocus={() => setCountryOpen(true)}
                  onChange={(e) => { setCountryQuery(e.target.value); setCountryOpen(true); setCountry(null); setState(null); }}
                  className={`${styles.countryInput} ${country && !countryOpen ? styles.countryInputWithFlag : ""}`}
                />
                {country && !countryOpen && (
                  <span className={styles.countryFlag}>{country.flag}</span>
                )}
              </div>
              {countryOpen && (
                <div className={styles.countryDropdown}>
                  {filteredCountries.length === 0 ? (
                    <div className={styles.countryEmpty}>No countries found</div>
                  ) : (
                    filteredCountries.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        className={`${styles.countryOption} ${country?.name === c.name ? styles.countryOptionActive : ""}`}
                        onClick={() => { setCountry(c); setCountryQuery(c.name); setCountryOpen(false); setState(null); }}
                      >
                        <span className={styles.countryOptionFlag}>{c.flag}</span>
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              )}
              {!country && !countryOpen && (
                <p className={styles.countryRequired}>Required</p>
              )}
              {country && countryStates.length > 0 && (
                <div className={styles.stateWrap}>
                  <label className={styles.stateLabel}>State / Province / District <span className={styles.stateOptional}>(optional)</span></label>
                  <select
                    value={state ?? ""}
                    onChange={(e) => setState(e.target.value || null)}
                    className={styles.stateSelect}
                  >
                    <option value="">Select state...</option>
                    {countryStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 2: TITLE ────────────────────────────────────────── */}
          <div className={styles.sectionCard}>
            <SectionHead n="2" title="Title" />
            <div className={styles.sectionBody}>
              {/* Live preview */}
              <div className={`${styles.titlePreview} ${isMobile ? styles.titlePreviewMobile : ""}`}>
                {isMobile ? (
                  <>
                    <span>[H] {havesText || "..."}</span>
                    <span>[W] {wantsText || "..."}</span>
                  </>
                ) : (
                  `[H] ${havesText || "..."} [W] ${wantsText || "..."}`
                )}
              </div>

              <div className={styles.titleInputs}>
                {/* [H] input */}
                <div>
                  <div className={styles.titleInputRow}>
                    <span className={styles.titleBadge}>[H]</span>
                    <input
                      type="text"
                      value={havesText}
                      maxLength={TITLE_LIMIT}
                      onChange={(e) => setHavesText(e.target.value)}
                      placeholder="What you have &#x2014; e.g. Charizard ex PSA 10"
                      className={styles.titleInputField}
                    />
                  </div>
                  <CharCount val={havesText.length} max={TITLE_LIMIT} />
                </div>
                {/* [W] input */}
                <div>
                  <div className={styles.titleInputRow}>
                    <span className={styles.titleBadge}>[W]</span>
                    <input
                      type="text"
                      value={wantsText}
                      maxLength={TITLE_LIMIT}
                      onChange={(e) => setWantsText(e.target.value)}
                      placeholder="What you want &#x2014; e.g. Cash or Mewtwo GX"
                      className={styles.titleInputField}
                    />
                  </div>
                  <CharCount val={wantsText.length} max={TITLE_LIMIT} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: HAVES ────────────────────────────────────────── */}
          <div className={styles.sectionCard}>
            <SectionHead n="3" title="Haves" note="What you're offering" />
            <div className={styles.sectionBody}>
              <div className={styles.havesRow}>
                <ThumbContainer
                  images={haveImages}
                  onRemove={(i) => setHaveImages((imgs) => imgs.filter((_, j) => j !== i))}
                  emptyMsg="Browse cards below to add images"
                />
                {isMobile ? (
                  <div className={styles.prefCards}>
                    <PrefCard label="Cash" icon="$" active={havesCash} onClick={() => setHavesCash(!havesCash)} />
                  </div>
                ) : (
                  <PrefCard label="Cash" icon="$" active={havesCash} onClick={() => setHavesCash(!havesCash)} />
                )}
              </div>
              <CardPicker onSelectCard={(card) => setHaveImages((imgs) => [...imgs, card])} />
            </div>
          </div>

          {/* ── SECTION 4: WANTS ────────────────────────────────────────── */}
          <div className={styles.sectionCard}>
            <SectionHead n="4" title="Wants" note="What you're looking for" />
            <div className={styles.sectionBody}>
              <div className={styles.havesRow}>
                <ThumbContainer
                  images={wantImages}
                  onRemove={(i) => setWantImages((imgs) => imgs.filter((_, j) => j !== i))}
                  emptyMsg="Browse cards below to add images"
                />
                <div className={styles.prefCards}>
                  <PrefCard label="Cash" icon="$" active={wPrefs.cash} onClick={() => toggleW("cash")} />
                  <PrefCard label="Singles" icon={<IconSingles active={wPrefs.singles} />} active={wPrefs.singles} onClick={() => toggleW("singles")} />
                  <PrefCard label="Graded" icon={<IconGraded active={wPrefs.graded} />} active={wPrefs.graded} onClick={() => toggleW("graded")} />
                  <PrefCard label="Sealed" icon={<IconSealed active={wPrefs.sealed} />} active={wPrefs.sealed} onClick={() => toggleW("sealed")} />
                </div>
              </div>
              <CardPicker onSelectCard={(card) => setWantImages((imgs) => [...imgs, card])} />
            </div>
          </div>

          {/* ── SECTION 5: DESCRIPTION ──────────────────────────────────── */}
          <div className={styles.sectionCard}>
            <SectionHead n="5" title="Description" note="optional" />
            <div className={styles.sectionBody}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition details, card language, shipping info..."
                rows={4}
                maxLength={DESC_LIMIT}
                className={styles.descTextarea}
              />
              <CharCount val={description.length} max={DESC_LIMIT} />
            </div>
          </div>

          {/* ── CAPTCHA + Submit ─────────────────────────────────────────── */}
          <div className={styles.turnstile}>
            <Turnstile onVerify={onVerify} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
