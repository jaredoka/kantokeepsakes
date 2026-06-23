import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateListing } from "@/lib/marketplace/validation";
import {
  type ListingType,
  type ListingCategory,
  type ListingLanguage,
  type Currency,
} from "@/lib/marketplace/types";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    type?: string;
    title?: string;
    description?: string;
    category?: string;
    language?: string;
    price?: number | null;
    currency?: string;
    images?: string[];
    wantsCash?: boolean;
    wantsCards?: boolean;
    wantsOffers?: boolean;
    lookingForDescription?: string;
    lookingForImages?: string[];
    turnstileToken?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const {
    type,
    title,
    description,
    category,
    language,
    price,
    currency,
    images,
    wantsCash,
    wantsCards,
    wantsOffers,
    lookingForDescription,
    lookingForImages,
    turnstileToken,
  } = body;

  // Validate Turnstile
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

  // Validate fields
  const validation = validateListing({
    type: type || "",
    title: title || "",
    description: description || "",
    category: category || "",
    language: language || "",
    price: price === null || price === undefined ? "" : String(price),
    currency: currency || "",
    images: images || [],
    wantsCash: !!wantsCash,
    wantsCards: !!wantsCards,
    wantsOffers: !!wantsOffers,
    lookingForDescription: lookingForDescription || "",
    lookingForImages: lookingForImages || [],
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString(); // 30 days

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      type: type as ListingType,
      title: (title as string).trim(),
      description: (description as string).trim(),
      category: category as ListingCategory,
      language: language as ListingLanguage,
      price: wantsCash ? (price ?? null) : null,
      currency: (currency as Currency) || "BND",
      images: images || [],
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
