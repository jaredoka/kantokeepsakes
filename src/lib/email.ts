/**
 * Email notifications (G1) — sent via the Resend REST API.
 *
 * Fails soft everywhere: without RESEND_API_KEY sends are logged and skipped,
 * and notifyUser() never throws — callers fire-and-forget from route handlers
 * (wrapped in next/server `after()` so sends never delay the response).
 */
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kantokeepsakes.com";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Kanto Keepsakes <notifications@kantokeepsakes.com>";

export type NotificationKind =
  | "offer_received"
  | "offer_accepted"
  | "offer_declined"
  | "new_message"
  | "trade_partner_completed"
  | "trade_ready_to_rate"
  | "rating_received";

// Which profile preference column gates each notification kind
const PREF_COLUMN: Record<
  NotificationKind,
  "notify_offers" | "notify_messages" | "notify_trades"
> = {
  offer_received: "notify_offers",
  offer_accepted: "notify_offers",
  offer_declined: "notify_offers",
  new_message: "notify_messages",
  trade_partner_completed: "notify_trades",
  trade_ready_to_rate: "notify_trades",
  rating_received: "notify_trades",
};

export interface NotificationData {
  /** Username of the person who triggered the notification */
  fromUsername?: string;
  listingTitle?: string;
  listingId?: string;
  conversationId?: string;
  rating?: number;
  /** Filled in by notifyUser from the recipient's profile */
  recipientUsername?: string;
}

interface EmailContent {
  subject: string;
  heading: string;
  lines: string[];
  ctaLabel: string;
  ctaUrl: string;
}

function buildContent(
  kind: NotificationKind,
  d: NotificationData
): EmailContent {
  const listing = d.listingTitle ? `"${d.listingTitle}"` : "your listing";
  const listingUrl = `${SITE_URL}/marketplace/${d.listingId ?? ""}`;
  const from = d.fromUsername || "A trader";
  switch (kind) {
    case "offer_received":
      return {
        subject: `New offer on ${listing}`,
        heading: "You have a new offer",
        lines: [`${from} made an offer on ${listing}.`],
        ctaLabel: "View offer",
        ctaUrl: listingUrl,
      };
    case "offer_accepted":
      return {
        subject: `Your offer on ${listing} was accepted!`,
        heading: "Offer accepted",
        lines: [
          `${from} accepted your offer on ${listing}.`,
          "Message them to arrange the trade.",
        ],
        ctaLabel: "View listing",
        ctaUrl: listingUrl,
      };
    case "offer_declined":
      return {
        subject: `Your offer on ${listing} was declined`,
        heading: "Offer declined",
        lines: [
          `${from} declined your offer on ${listing}.`,
          "Plenty more trades out there — keep browsing.",
        ],
        ctaLabel: "Browse the marketplace",
        ctaUrl: `${SITE_URL}/marketplace/wts`,
      };
    case "new_message":
      return {
        subject: `New message from ${from}`,
        heading: "You have a new message",
        lines: [`${from} sent you a message while you were away.`],
        ctaLabel: "Open chat",
        ctaUrl: `${SITE_URL}/marketplace/inbox/${d.conversationId ?? ""}`,
      };
    case "trade_partner_completed":
      return {
        subject: `${from} marked your trade as complete`,
        heading: "Your trade partner marked the trade complete",
        lines: [
          `${from} marked the trade for ${listing} as complete.`,
          "Confirm on your side to finish the trade — then you can rate each other.",
        ],
        ctaLabel: "Confirm trade",
        ctaUrl: listingUrl,
      };
    case "trade_ready_to_rate":
      return {
        subject: `Trade complete — rate your partner`,
        heading: "Trade complete!",
        lines: [
          `Both sides confirmed the trade for ${listing}.`,
          "Leave a rating to help your partner build their reputation.",
        ],
        ctaLabel: "Rate your partner",
        ctaUrl: listingUrl,
      };
    case "rating_received":
      return {
        subject: `You received a ${d.rating ?? ""}-star rating`,
        heading: "New rating received",
        lines: [
          `${from} rated their trade with you ${d.rating ?? "?"} out of 5 stars.`,
        ],
        ctaLabel: "View your profile",
        ctaUrl: d.recipientUsername
          ? `${SITE_URL}/marketplace/user/${encodeURIComponent(d.recipientUsername)}`
          : `${SITE_URL}/marketplace`,
      };
  }
}

function renderHtml(c: EmailContent, recipientUsername: string): string {
  const paragraphs = c.lines
    .map(
      (l) =>
        `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.5;">${l}</p>`
    )
    .join("");
  const profileUrl = `${SITE_URL}/marketplace/user/${encodeURIComponent(recipientUsername)}`;
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#fafafa;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
      <div style="font-size:20px;font-weight:800;color:#111;padding-bottom:12px;">
        Kanto <span style="color:#c49010;">Keepsakes</span>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;">
        <h1 style="margin:0 0 16px;font-size:18px;color:#111;">${c.heading}</h1>
        ${paragraphs}
        <a href="${c.ctaUrl}"
           style="display:inline-block;margin-top:8px;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          ${c.ctaLabel}
        </a>
      </div>
      <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
        You're receiving this because email notifications are enabled for your
        Kanto Keepsakes account. Manage them from
        <a href="${profileUrl}" style="color:#9ca3af;">your profile</a>.
      </p>
    </div>
  </body>
</html>`;
}

/** Low-level send. Skips (with a log) when RESEND_API_KEY is not configured. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[email] RESEND_API_KEY not set — skipped "${opts.subject}" to ${opts.to}`
    );
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    console.error(`[email] send failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Send a notification email to a user, honoring their notification
 * preferences. Never throws — route handlers fire-and-forget this.
 */
export async function notifyUser(
  userId: string,
  kind: NotificationKind,
  data: NotificationData
): Promise<void> {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!profile || profile.is_banned) return;
    // Missing columns (migration 00018 not yet applied) default to enabled
    if (profile[PREF_COLUMN[kind]] === false) return;

    const { data: userRes } = await admin.auth.admin.getUserById(userId);
    const email = userRes?.user?.email;
    if (!email) return;

    const content = buildContent(kind, {
      ...data,
      recipientUsername: profile.username || undefined,
    });
    await sendEmail({
      to: email,
      subject: content.subject,
      html: renderHtml(content, profile.username || ""),
    });
  } catch (e) {
    console.error("[email] notifyUser failed:", e);
  }
}
