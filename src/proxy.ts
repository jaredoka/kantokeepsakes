import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Forward the current pathname as a request header so server-component
  // layouts can build a ?next= redirect URL without access to the request object.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);
  const modifiedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
    body: request.body,
  });
  return await updateSession(modifiedRequest);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
