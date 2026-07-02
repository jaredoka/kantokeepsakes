import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateListing } from "@/lib/marketplace/validation";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/lib/marketplace/cardData";
import type { HaveImage, WantItem } from "@/lib/marketplace/types";

const CREATE_LIMIT = 10; // max listings per hour per IP
const CREATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success: withinLimit } = rateLimit(
    `create-listing:${ip}`,
    CREATE_LIMIT,
    CREATE_WINDOW_MS
  );

  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many listings created. Please try again later." },
      { status: 429 }
    );
  }

  const { user, supabase, via } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Check ban status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return NextResponse.json(
      { error: "Your account has been banned." },
      { status: 403 }
    );
  }

  let body: {
    havesText?: string;
    wantsText?: string;
    description?: string;
    price?: number | null;
    currency?: string;
    haveImages?: (HaveImage | { url: string })[];
    wantItems?: (WantItem | { url: string })[];
    wantsCash?: boolean;
    wantsOffers?: boolean;
    wantsSingles?: boolean;
    wantsGraded?: boolean;
    wantsSealed?: boolean;
    country?: string;
    state?: string;
    turnstileToken?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const {
    havesText,
    wantsText,
    description,
    price,
    currency,
    haveImages,
    wantItems,
    wantsCash,
    wantsOffers,
    wantsSingles,
    wantsGraded,
    wantsSealed,
    country,
    state,
    turnstileToken,
  } = body;

  // Validate Turnstile — skipped for Bearer-authenticated (mobile) requests,
  // which get a stricter per-user rate limit instead (B2)
  if (via === "bearer") {
    const { success: mobileWithinLimit } = rateLimit(
      `listing-mobile:${user.id}`,
      5,
      60 * 60 * 1000
    );
    if (!mobileWithinLimit) {
      return NextResponse.json(
        { error: "Too many listings. Please try again later." },
        { status: 429 }
      );
    }
  } else {
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "CAPTCHA verification is required." },
        { status: 400 }
      );
    }

    const turnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }
  }

  // Normalise images to HaveImage[] / WantItem[] for validation
  const normHaveImages = (haveImages || []).map((img) => ({
    url: img.url,
    grader: ("grader" in img ? img.grader : "RAW") as "RAW",
    grade: ("grade" in img ? img.grade : "") as string,
  }));
  const normWantItems = (wantItems || []).map((item) => ({
    url: item.url,
    type: ("type" in item ? item.type : "singles") as "singles",
  }));

  // Validate fields
  const validation = validateListing({
    havesText: havesText || "",
    wantsText: wantsText || "",
    description: description || "",
    price: price === null || price === undefined ? "" : String(price),
    currency: currency || "BND",
    haveImages: normHaveImages,
    wantItems: normWantItems,
    wantsCash: !!wantsCash,
    wantsOffers: !!wantsOffers,
    wantsSingles: !!wantsSingles,
    wantsGraded: !!wantsGraded,
    wantsSealed: !!wantsSealed,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Country is required and must be a known country; state (optional) must
  // belong to that country. Country is the trader-location signal on a
  // worldwide marketplace — no more defaulting to Brunei (G6).
  const trimmedCountry = (country || "").trim();
  if (!trimmedCountry || !COUNTRIES.some((c) => c.name === trimmedCountry)) {
    return NextResponse.json(
      { error: "Please select your country." },
      { status: 400 }
    );
  }
  const trimmedState = (state || "").trim();
  const validStates = STATES_BY_COUNTRY[trimmedCountry] || [];
  if (trimmedState && !validStates.includes(trimmedState)) {
    return NextResponse.json(
      { error: "Please select a valid state for your country." },
      { status: 400 }
    );
  }

  // Construct title from [H] and [W] text
  const title = `[H] ${(havesText || "").trim()} [W] ${(wantsText || "").trim()}`;

  // Extract image URLs for the images column
  const imageUrls = normHaveImages.map((img) => img.url);

  // Extract want item URLs for looking_for_images column
  const wantImageUrls = normWantItems.map((item) => item.url);

  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString(); // 30 days

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      type: "WTS" as const, // default for backward compatibility
      title: title.trim(),
      description: (description || "").trim(),
      category: "singles" as const, // default for backward compatibility
      language: "any" as const, // default for backward compatibility
      price: price ?? null,
      currency: (currency as "BND" | "USD" | "MYR" | "SGD") || "BND",
      images: imageUrls,
      looking_for_images: wantImageUrls,
      country: trimmedCountry,
      state: trimmedState || null,
      wants_cash: !!wantsCash,
      wants_offers: !!wantsOffers,
      wants_singles: !!wantsSingles,
      wants_graded: !!wantsGraded,
      wants_sealed: !!wantsSealed,
      status: "active",
      bumped_at: now,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Listing insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
