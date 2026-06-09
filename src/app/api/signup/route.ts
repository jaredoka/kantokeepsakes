import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SIGNUP_LIMIT = 3;
const SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const { success: withinLimit } = rateLimit(
    `signup:${ip}`,
    SIGNUP_LIMIT,
    SIGNUP_WINDOW_MS
  );

  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string; username?: string; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password, username, turnstileToken } = body;

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Email, password, and username are required." },
      { status: 400 }
    );
  }

  if (username.length < 3 || username.length > 20) {
    return NextResponse.json(
      { error: "Username must be between 3 and 20 characters." },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain letters, numbers, hyphens, and underscores." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

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

  const { data: existingUser } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .single();

  if (existingUser) {
    return NextResponse.json(
      { error: "Username is already taken." },
      { status: 409 }
    );
  }

  const { error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password,
    user_metadata: { username: username.trim() },
    email_confirm: true,
  });

  if (signUpError) {
    return NextResponse.json(
      { error: signUpError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
