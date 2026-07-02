import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/* ------------------------------------------------------------------ */
/*  Security headers                                                   */
/* ------------------------------------------------------------------ */

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://*.supabase.co https://assets.tcgdex.net`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://api.tcgdex.net`,
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

/* ------------------------------------------------------------------ */
/*  Site-wide password gate                                            */
/*  Set SITE_PASSWORD env var to enable. Remove it to go public.       */
/* ------------------------------------------------------------------ */

const SITE_PASSWORD = process.env.SITE_PASSWORD;

function makeAuthToken(password: string): string {
  // Simple token — not a substitute for real auth, just a staging gate.
  return btoa("kk-site-auth:" + password);
}

function passwordPageHTML(error: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Kanto Keepsakes — Password Required</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6; color: #1a1a1a; padding: 1rem;
    }
    .card {
      width: 100%; max-width: 400px; background: #fff; border: 1px solid #e5e7eb;
      border-radius: 12px; padding: 2.5rem; box-shadow: 0 4px 6px rgba(0,0,0,.07);
      text-align: center;
    }
    h1 { font-size: 1.5rem; margin-bottom: .25rem; }
    .sub { color: #6b7280; font-size: .875rem; margin-bottom: 1.5rem; }
    .error {
      padding: .5rem .75rem; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; color: #dc2626; font-size: .875rem; margin-bottom: 1rem;
    }
    input[type="password"] {
      width: 100%; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 1rem; margin-bottom: 1rem; font-family: inherit;
    }
    input[type="password"]:focus { outline: none; border-color: #f5c518; box-shadow: 0 0 0 3px rgba(245,197,24,.2); }
    button {
      width: 100%; padding: .5rem; font-size: 1rem; font-weight: 600; border: none;
      border-radius: 8px; cursor: pointer; background: #f5c518; color: #1a1a1a;
      transition: background .15s;
    }
    button:hover { background: #d4a017; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Kanto Keepsakes</h1>
    <p class="sub">This site is not yet public. Enter the password to continue.</p>
    ${error ? '<div class="error">Incorrect password. Please try again.</div>' : ""}
    <form method="POST" action="/_site-auth">
      <input type="password" name="password" placeholder="Password" required autofocus />
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}

function handlePasswordGate(request: NextRequest): NextResponse | null {
  if (!SITE_PASSWORD) return null;

  const { pathname } = request.nextUrl;

  // Let API routes through — they have their own auth (cron secret, user tokens, etc.)
  if (pathname.startsWith("/api/")) return null;

  // Handle password form submission
  if (pathname === "/_site-auth" && request.method === "POST") {
    return null; // Handled separately since we need to await formData
  }

  // Check for valid auth cookie
  const token = request.cookies.get("site-auth")?.value;
  if (token === makeAuthToken(SITE_PASSWORD)) return null;

  // Block — show password page
  return new NextResponse(passwordPageHTML(false), {
    status: 401,
    headers: { "Content-Type": "text/html" },
  });
}

async function handlePasswordSubmit(request: NextRequest): Promise<NextResponse | null> {
  if (!SITE_PASSWORD) return null;
  if (request.nextUrl.pathname !== "/_site-auth" || request.method !== "POST") return null;

  const formData = await request.formData();
  const password = formData.get("password")?.toString() ?? "";

  if (password === SITE_PASSWORD) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("site-auth", makeAuthToken(SITE_PASSWORD), {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  // Wrong password
  return new NextResponse(passwordPageHTML(true), {
    status: 401,
    headers: { "Content-Type": "text/html" },
  });
}

/* ------------------------------------------------------------------ */
/*  Main proxy                                                         */
/* ------------------------------------------------------------------ */

export async function proxy(request: NextRequest) {
  // Password gate — check before anything else
  const submitResponse = await handlePasswordSubmit(request);
  if (submitResponse) return submitResponse;

  const gateResponse = handlePasswordGate(request);
  if (gateResponse) return gateResponse;

  // Forward the current pathname as a request header so server-component
  // layouts can build a ?next= redirect URL without access to the request object.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);
  const modifiedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
    body: request.body,
  });
  const response = await updateSession(modifiedRequest);

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
