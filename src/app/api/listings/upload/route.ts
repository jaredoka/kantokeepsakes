import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/marketplace/types";

const UPLOAD_LIMIT = 30; // max uploads per hour per IP
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success: withinLimit } = rateLimit(
    `upload:${ip}`,
    UPLOAD_LIMIT,
    UPLOAD_WINDOW_MS
  );

  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  const { user, supabase } = await getAuthUser(request);

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (
    !ACCEPTED_IMAGE_TYPES.includes(
      file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are accepted." },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5MB." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-images").getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
