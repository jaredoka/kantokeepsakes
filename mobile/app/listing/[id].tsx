import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../context/session";
import { formatTimeAgo } from "../../lib/format";
import { colors } from "../../lib/theme";

interface ListingDetail {
  id: string;
  user_id: string;
  type: "WTS" | "WTB";
  title: string;
  description: string;
  images: string[];
  looking_for_images: string[] | null;
  country: string | null;
  state: string | null;
  status: string;
  created_at: string;
  price: number | null;
  currency: string;
  wants_cash: boolean;
  wants_singles: boolean;
  wants_graded: boolean;
  wants_sealed: boolean;
  wants_offers: boolean;
  profiles: {
    username: string;
    reputation_score: number;
    completed_trades: number;
  } | null;
}

interface OfferRow {
  id: string;
  offerer_id: string;
  author_id: string | null;
  parent_offer_id: string | null;
  message: string;
  status: "pending" | "accepted" | "declined" | "countered";
  front_image: string | null;
  back_image: string | null;
  created_at: string;
  profiles: { username: string; completed_trades: number } | null;
}

interface Thread {
  root: OfferRow;
  turns: OfferRow[]; // chronological
  latest: OfferRow;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: { username: string; completed_trades: number } | null;
}

interface CompletionRow {
  id: string;
  user_id: string;
  status: "completed" | "disputed" | "auto_completed";
  created_at: string;
}

interface ConfirmationRow {
  id: string;
  confirmer_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  revealed: boolean;
  confirmer: { username: string } | null;
}

const MAX_COMMENT_LENGTH = 500;

/** Tappable (or read-only) 1–5 star row. */
function StarRow({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          testID={onChange ? `star-${n}` : undefined}
        >
          <Text
            style={{
              fontSize: size,
              color: n <= value ? colors.yellowDark : colors.gray300,
            }}
          >
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Mirrors REPORT_REASONS in src/lib/marketplace/types.ts
const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "scam", label: "Scam" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "trade_dispute", label: "Trade dispute" },
  { value: "other", label: "Other" },
];

/** A turn is owner-authored iff author_id is set and differs from the
 *  offerer (offerer_id stays the non-owner party on every turn). */
function authoredByOwner(o: OfferRow): boolean {
  return !!o.author_id && o.author_id !== o.offerer_id;
}

/** Group offer rows into negotiation threads via parent_offer_id chains. */
function buildThreads(offers: OfferRow[]): Thread[] {
  const byId = new Map(offers.map((o) => [o.id, o]));
  const childOf = new Map<string, OfferRow>();
  const roots: OfferRow[] = [];
  for (const o of offers) {
    if (o.parent_offer_id && byId.has(o.parent_offer_id)) {
      childOf.set(o.parent_offer_id, o);
    } else {
      roots.push(o);
    }
  }
  return roots.map((root) => {
    const turns = [root];
    let cur = root;
    while (childOf.has(cur.id)) {
      cur = childOf.get(cur.id)!;
      turns.push(cur);
    }
    return { root, turns, latest: turns[turns.length - 1] };
  });
}

function CardImageRow({ urls }: { urls: string[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.imageRow}>
        {urls.map((url) => (
          <Image key={url} source={{ uri: url }} style={styles.cardImg} />
        ))}
      </View>
    </ScrollView>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentsAvailable, setCommentsAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [confirmations, setConfirmations] = useState<ConfirmationRow[]>([]);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingDone, setRatingDone] = useState(false);

  // null = unknown or table missing (pre-migration 00025) — button hidden
  const [saved, setSaved] = useState<boolean | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportDone, setReportDone] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [blockedDone, setBlockedDone] = useState(false);

  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerText, setOfferText] = useState("");
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [counterText, setCounterText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: row }, offersRes, commentsRes, { data: savedRow, error: savedErr }] =
      await Promise.all([
        supabase
          .from("listings")
          .select(
            "id, user_id, type, title, description, images, looking_for_images, country, state, status, created_at, price, currency, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, profiles!listings_user_id_fkey(username, reputation_score, completed_trades)"
          )
          .eq("id", id)
          .single(),
        apiFetch<OfferRow[]>(`/api/offers?listingId=${id}`),
        apiFetch<CommentRow[]>(`/api/listings/${id}/comments`),
        // RLS scopes saved_listings to own rows; errors mean the table is
        // missing (pre-migration 00025) and the save button stays hidden
        supabase
          .from("saved_listings")
          .select("listing_id")
          .eq("listing_id", id)
          .maybeSingle(),
      ]);
    if (!row || (row as unknown as ListingDetail).status === "removed") {
      setNotFound(true);
    } else {
      setListing(row as unknown as ListingDetail);
    }
    const offerRows = offersRes.ok && offersRes.data ? offersRes.data : [];
    setOffers(offerRows);
    // 503 until migration 00020 — the comments card just stays hidden
    setComments(commentsRes.ok && commentsRes.data ? commentsRes.data : []);
    setCommentsAvailable(commentsRes.ok);
    setSaved(savedErr ? null : !!savedRow);

    // Trade status + ratings only matter once an offer is accepted
    if (offerRows.some((o) => o.status === "accepted")) {
      const [complRes, confRes] = await Promise.all([
        apiFetch<CompletionRow[]>(`/api/trade-completions?listingId=${id}`),
        apiFetch<ConfirmationRow[]>(`/api/trade-confirmations?listingId=${id}`),
      ]);
      setCompletions(complRes.ok && complRes.data ? complRes.data : []);
      setConfirmations(confRes.ok && confRes.data ? confRes.data : []);
    } else {
      setCompletions([]);
      setConfirmations([]);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  if (notFound) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Listing not found.</Text>
      </View>
    );
  }
  if (!listing) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Loading...</Text>
      </View>
    );
  }

  const isOwner = session?.user.id === listing.user_id;
  const isActive = listing.status === "active";
  const threads = buildThreads(offers);
  const hasAccepted = offers.some((o) => o.status === "accepted");

  // Trade completion / rating state (mirrors website TradeCompletion +
  // TradeConfirmation). offerer_id stays the non-owner party on every turn.
  const myUserId = session?.user.id;
  const acceptedOffer = offers.find((o) => o.status === "accepted") || null;
  const isParty =
    isOwner || (!!acceptedOffer && acceptedOffer.offerer_id === myUserId);
  const myCompletion = completions.find((c) => c.user_id === myUserId);
  const otherCompletion = completions.find((c) => c.user_id !== myUserId);
  const bothCompleted =
    completions.filter(
      (c) => c.status === "completed" || c.status === "auto_completed"
    ).length >= 2;
  const hasDispute = completions.some((c) => c.status === "disputed");
  const myConfirmation = confirmations.find(
    (c) => c.confirmer_id === myUserId
  );

  const wantPills: string[] = [];
  if (listing.wants_cash || listing.price !== null) wantPills.push("Cash");
  if (listing.wants_offers) wantPills.push("Any Offers");
  if (listing.wants_singles) wantPills.push("Any Singles");
  if (listing.wants_graded) wantPills.push("Any Graded");
  if (listing.wants_sealed) wantPills.push("Any Sealed");

  async function submitOffer() {
    if (!listing) return;
    setBusy(true);
    setError("");
    const res = await apiFetch<{ id: string }>("/api/offers", {
      method: "POST",
      body: { listingId: listing.id, message: offerText.trim() },
    });
    if (res.ok) {
      setOfferFormOpen(false);
      setOfferText("");
      await load();
    } else {
      setError(res.error || "Failed to send offer.");
    }
    setBusy(false);
  }

  async function respond(
    offerId: string,
    status: "accepted" | "declined" | "countered",
    message?: string
  ) {
    setBusy(true);
    setError("");
    const res = await apiFetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      body: message ? { status, message } : { status },
    });
    if (res.ok) {
      setCounteringId(null);
      setCounterText("");
      await load();
    } else {
      setError(res.error || "Failed to respond.");
    }
    setBusy(false);
  }

  async function submitReport() {
    if (!listing || !reportReason) return;
    setBusy(true);
    setError("");
    const res = await apiFetch("/api/reports", {
      method: "POST",
      body: {
        reportedUserId: listing.user_id,
        listingId: listing.id,
        reason: reportReason,
        description: reportText.trim() || undefined,
      },
    });
    if (res.ok) {
      setReportOpen(false);
      setReportReason(null);
      setReportText("");
      setReportDone(true);
    } else {
      setError(res.error || "Failed to submit report.");
    }
    setBusy(false);
  }

  async function blockUser() {
    if (!listing) return;
    setBusy(true);
    setError("");
    const res = await apiFetch("/api/blocks", {
      method: "POST",
      body: { userId: listing.user_id },
    });
    if (res.ok) {
      setBlockConfirm(false);
      setBlockedDone(true);
    } else {
      setError(res.error || "Failed to block user.");
    }
    setBusy(false);
  }

  async function toggleSave() {
    if (!listing || !myUserId || saved === null) return;
    setSaveBusy(true);
    if (saved) {
      const { error: err } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", myUserId)
        .eq("listing_id", listing.id);
      if (!err) setSaved(false);
    } else {
      const { error: err } = await supabase
        .from("saved_listings")
        .insert({ user_id: myUserId, listing_id: listing.id });
      if (!err) setSaved(true);
    }
    setSaveBusy(false);
  }

  async function postComment() {
    if (!listing) return;
    const body = commentText.trim();
    if (!body) return;
    setCommentBusy(true);
    setError("");
    const res = await apiFetch<CommentRow>(`/api/listings/${listing.id}/comments`, {
      method: "POST",
      body: { body },
    });
    if (res.ok && res.data) {
      setComments((prev) => [...prev, res.data as CommentRow]);
      setCommentText("");
    } else {
      setError(res.error || "Failed to post comment.");
    }
    setCommentBusy(false);
  }

  async function deleteComment(commentId: string) {
    setCommentBusy(true);
    setError("");
    const res = await apiFetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      setError(res.error || "Failed to delete comment.");
    }
    setDeletingCommentId(null);
    setCommentBusy(false);
  }

  async function tradeAction(action: "complete" | "dispute") {
    if (!listing) return;
    setBusy(true);
    setError("");
    const res = await apiFetch("/api/trade-completions", {
      method: "POST",
      body: {
        listingId: listing.id,
        action,
        description:
          action === "dispute" ? disputeText.trim() || undefined : undefined,
      },
    });
    if (res.ok) {
      setDisputeOpen(false);
      setDisputeText("");
      await load();
    } else {
      setError(res.error || "Failed to submit.");
    }
    setBusy(false);
  }

  async function submitRating() {
    if (!listing || ratingValue === 0) return;
    setBusy(true);
    setError("");
    const res = await apiFetch("/api/trade-confirmations", {
      method: "POST",
      body: {
        listingId: listing.id,
        rating: ratingValue,
        comment: ratingComment.trim() || undefined,
      },
    });
    if (res.ok || res.status === 409) {
      setRatingDone(true);
      await load();
    } else {
      setError(res.error || "Failed to submit rating.");
    }
    setBusy(false);
  }

  function openProfile(username: string | undefined) {
    if (!username) return;
    router.push({ pathname: "/user/[username]", params: { username } });
  }

  async function openConversation() {
    if (!listing) return;
    setBusy(true);
    setError("");
    const res = await apiFetch<{ id: string }>("/api/conversations", {
      method: "POST",
      body: { listingId: listing.id },
    });
    if (res.ok && res.data) {
      router.push({ pathname: "/chat/[id]", params: { id: res.data.id } });
    } else {
      setError(res.error || "Failed to open conversation.");
    }
    setBusy(false);
  }

  const authorLabel = (turn: OfferRow, thread: Thread) => {
    if (authoredByOwner(turn)) return isOwner ? "You" : "Listing owner";
    return isOwner ? thread.root.profiles?.username || "Trader" : "You";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {!isActive && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            This listing has been marked as {listing.status}.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  listing.type === "WTS" ? colors.wtsGold : colors.wtbBlue,
              },
            ]}
          >
            <Text style={styles.typeBadgeText}>{listing.type}</Text>
          </View>
          <Text style={styles.meta}>{formatTimeAgo(listing.created_at)}</Text>
          {listing.country && (
            <Text style={styles.meta} numberOfLines={1}>
              📍 {listing.state ? `${listing.state}, ` : ""}
              {listing.country}
            </Text>
          )}
        </View>
        <Text style={styles.title}>{listing.title}</Text>
        <Pressable
          onPress={() => openProfile(listing.profiles?.username)}
          testID="seller-profile"
        >
          <Text style={styles.seller}>
            {listing.profiles?.username || "Unknown"}
            <Text style={styles.sellerTrades}>
              {" "}· {listing.profiles?.completed_trades ?? 0} trades
              {/* reputation_score is stored x10 (see SellerCard.tsx) */}
              {listing.profiles && listing.profiles.reputation_score > 0
                ? ` · ★ ${(listing.profiles.reputation_score / 10).toFixed(1)}`
                : ""}
            </Text>
          </Text>
        </Pressable>

        {!isOwner && (
          <View style={styles.modRow}>
            {saved !== null && (
              <Pressable
                onPress={toggleSave}
                disabled={saveBusy}
                testID="save-listing"
              >
                <Text style={[styles.modLink, saved && styles.savedLink]}>
                  {saved ? "★ Saved" : "☆ Save"}
                </Text>
              </Pressable>
            )}
            {reportDone ? (
              <Text style={styles.modDone}>Report submitted. Thank you.</Text>
            ) : (
              <Pressable
                onPress={() => {
                  setReportOpen((v) => !v);
                  setBlockConfirm(false);
                  setError("");
                }}
                testID="report-listing"
              >
                <Text style={styles.modLink}>Report</Text>
              </Pressable>
            )}
            {blockedDone ? (
              <Text style={styles.modDone}>
                User blocked. Manage in Profile → Blocked Users.
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  setBlockConfirm((v) => !v);
                  setReportOpen(false);
                  setError("");
                }}
                testID="block-user"
              >
                <Text style={styles.modLink}>Block user</Text>
              </Pressable>
            )}
          </View>
        )}

        {reportOpen && (
          <View style={styles.modPanel}>
            <Text style={styles.modPanelTitle}>Why are you reporting this?</Text>
            <View style={styles.reasonRow}>
              {REPORT_REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  style={[
                    styles.reasonChip,
                    reportReason === r.value && styles.reasonChipActive,
                  ]}
                  onPress={() => setReportReason(r.value)}
                  testID={`reason-${r.value}`}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      reportReason === r.value && styles.reasonChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.textArea}
              value={reportText}
              onChangeText={setReportText}
              placeholder="Details (optional)"
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={1000}
            />
            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.primaryBtn,
                  (busy || !reportReason) && styles.btnDisabled,
                ]}
                onPress={submitReport}
                disabled={busy || !reportReason}
                testID="report-submit"
              >
                <Text style={styles.primaryBtnText}>
                  {busy ? "..." : "Submit report"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setReportOpen(false)}
                disabled={busy}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {blockConfirm && (
          <View style={styles.modPanel}>
            <Text style={styles.modPanelTitle}>
              Block {listing.profiles?.username || "this user"}?
            </Text>
            <Text style={styles.modPanelText}>
              They won&apos;t be able to message you, make offers, or comment
              on your listings. You can unblock them from your profile.
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.primaryBtn, busy && styles.btnDisabled]}
                onPress={blockUser}
                disabled={busy}
                testID="block-confirm"
              >
                <Text style={styles.primaryBtnText}>
                  {busy ? "..." : "Block"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setBlockConfirm(false)}
                disabled={busy}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {listing.images.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>HAVES</Text>
          <CardImageRow urls={listing.images} />
        </View>
      )}

      {((listing.looking_for_images || []).length > 0 ||
        wantPills.length > 0) && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>WANTS</Text>
          {(listing.looking_for_images || []).length > 0 && (
            <CardImageRow urls={listing.looking_for_images || []} />
          )}
          {wantPills.length > 0 && (
            <View style={styles.pillRow}>
              {wantPills.map((p) => (
                <View key={p} style={styles.pill}>
                  <Text style={styles.pillText}>{p}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {!!listing.description.trim() && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {isActive && !isOwner && (
        <View style={styles.card}>
          {offerFormOpen ? (
            <>
              <Text style={styles.sectionLabel}>YOUR OFFER</Text>
              <TextInput
                style={styles.textArea}
                value={offerText}
                onChangeText={setOfferText}
                placeholder="What are you offering? Cards, cash, or both..."
                placeholderTextColor={colors.gray400}
                multiline
                maxLength={1000}
                testID="offer-input"
              />
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.primaryBtn, busy && styles.btnDisabled]}
                  onPress={submitOffer}
                  disabled={busy || !offerText.trim()}
                  testID="offer-submit"
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? "..." : "Send Offer"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setOfferFormOpen(false)}
                  disabled={busy}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.actionRow}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  setOfferFormOpen(true);
                  setError("");
                }}
                testID="make-offer"
              >
                <Text style={styles.primaryBtnText}>
                  {listing.type === "WTS" ? "Make Offer" : "Offer to Sell"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={openConversation}
                disabled={busy}
                testID="message-owner"
              >
                <Text style={styles.secondaryBtnText}>
                  {listing.type === "WTS" ? "Message Seller" : "Message Buyer"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>OFFERS ({threads.length})</Text>
        {threads.length === 0 ? (
          <Text style={styles.emptyText}>No offers yet.</Text>
        ) : (
          threads.map((thread) => {
            const { root, turns, latest } = thread;
            const myTurn =
              latest.status === "pending" &&
              !hasAccepted &&
              (isOwner ? !authoredByOwner(latest) : authoredByOwner(latest));
            const waiting =
              latest.status === "pending" && !hasAccepted && !myTurn;

            return (
              <View key={root.id} style={styles.thread}>
                <View style={styles.threadHeader}>
                  <Text style={styles.threadUser} numberOfLines={1}>
                    {root.profiles?.username || "Unknown"}
                    <Text style={styles.sellerTrades}>
                      {" "}· {root.profiles?.completed_trades ?? 0} trades
                    </Text>
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      latest.status === "accepted"
                        ? styles.statusAccepted
                        : latest.status === "declined"
                          ? styles.statusDeclined
                          : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{latest.status}</Text>
                  </View>
                </View>

                {turns.map((turn, i) => (
                  <View
                    key={turn.id}
                    style={[
                      styles.turn,
                      authoredByOwner(turn) && styles.turnOwner,
                    ]}
                  >
                    {turns.length > 1 && (
                      <Text style={styles.turnMeta}>
                        {i === 0 ? "Offer" : "Counter"} ·{" "}
                        {authorLabel(turn, thread)} ·{" "}
                        {formatTimeAgo(turn.created_at)}
                      </Text>
                    )}
                    <Text style={styles.turnMessage}>{turn.message}</Text>
                  </View>
                ))}

                {waiting && (
                  <Text style={styles.waitingHint}>
                    Waiting for{" "}
                    {isOwner
                      ? root.profiles?.username || "the trader"
                      : "the listing owner"}{" "}
                    to respond.
                  </Text>
                )}

                {myTurn && counteringId !== latest.id && (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.primaryBtn, busy && styles.btnDisabled]}
                      onPress={() => respond(latest.id, "accepted")}
                      disabled={busy}
                    >
                      <Text style={styles.primaryBtnText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => respond(latest.id, "declined")}
                      disabled={busy}
                    >
                      <Text style={styles.secondaryBtnText}>Decline</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => {
                        setCounteringId(latest.id);
                        setCounterText("");
                        setError("");
                      }}
                      disabled={busy}
                    >
                      <Text style={styles.secondaryBtnText}>Counter</Text>
                    </Pressable>
                  </View>
                )}

                {myTurn && counteringId === latest.id && (
                  <>
                    <TextInput
                      style={styles.textArea}
                      value={counterText}
                      onChangeText={setCounterText}
                      placeholder="Your counteroffer — e.g. add a card, adjust the cash amount..."
                      placeholderTextColor={colors.gray400}
                      multiline
                      maxLength={1000}
                    />
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.primaryBtn, busy && styles.btnDisabled]}
                        onPress={() =>
                          respond(latest.id, "countered", counterText.trim())
                        }
                        disabled={busy || !counterText.trim()}
                      >
                        <Text style={styles.primaryBtnText}>
                          {busy ? "..." : "Send counter"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryBtn}
                        onPress={() => setCounteringId(null)}
                        disabled={busy}
                      >
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Trade status — mirrors website TradeCompletion (parties only) */}
      {acceptedOffer && isParty && (
        <View style={styles.card} testID="trade-status">
          <Text style={styles.sectionLabel}>TRADE STATUS</Text>
          {hasDispute ? (
            <View style={styles.disputeBanner}>
              <Text style={styles.disputeBannerText}>
                A trade dispute has been filed and is under admin review.
              </Text>
            </View>
          ) : bothCompleted ? (
            <View style={styles.completeBanner}>
              <Text style={styles.completeBannerText}>
                Both parties confirmed this trade. You can now rate each other
                below.
              </Text>
            </View>
          ) : myCompletion ? (
            <Text style={styles.tradeHint}>
              You have completed this trade. Waiting for the other party to
              confirm (auto-completes in ~3 days).
            </Text>
          ) : (
            <>
              <Text style={styles.tradeHint}>
                {otherCompletion
                  ? "The other party has completed this trade. Please confirm or dispute."
                  : "An offer has been accepted. Once the trade is done, confirm below."}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.primaryBtn, busy && styles.btnDisabled]}
                  onPress={() => tradeAction("complete")}
                  disabled={busy}
                  testID="complete-trade"
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? "..." : "Complete Trade"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setDisputeOpen((v) => !v)}
                  disabled={busy}
                  testID="dispute-trade"
                >
                  <Text style={styles.secondaryBtnText}>Dispute</Text>
                </Pressable>
              </View>
              {disputeOpen && (
                <>
                  <TextInput
                    style={[styles.textArea, { marginTop: 8 }]}
                    value={disputeText}
                    onChangeText={setDisputeText}
                    placeholder="Explain why you are disputing this trade (optional)"
                    placeholderTextColor={colors.gray400}
                    multiline
                    maxLength={1000}
                  />
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.dangerBtn, busy && styles.btnDisabled]}
                      onPress={() => tradeAction("dispute")}
                      disabled={busy}
                      testID="dispute-submit"
                    >
                      <Text style={styles.dangerBtnText}>
                        {busy ? "..." : "Submit Dispute"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => {
                        setDisputeOpen(false);
                        setDisputeText("");
                      }}
                      disabled={busy}
                    >
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* Ratings — mirrors website TradeConfirmation (double-blind) */}
      {acceptedOffer && (bothCompleted || confirmations.length > 0) && (
        <View style={styles.card} testID="trade-ratings">
          <Text style={styles.sectionLabel}>
            {bothCompleted ? "RATE THIS TRADE" : "TRADE RATINGS"}
          </Text>

          {isParty &&
            bothCompleted &&
            !hasDispute &&
            !myConfirmation &&
            !ratingDone && (
              <>
                <Text style={styles.tradeHint}>
                  {isOwner ? "Rate the buyer:" : "Rate the seller:"}
                </Text>
                <StarRow value={ratingValue} onChange={setRatingValue} />
                <TextInput
                  style={[styles.textArea, { marginTop: 8 }]}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  placeholder="Optional comment (max 500 characters)"
                  placeholderTextColor={colors.gray400}
                  multiline
                  maxLength={500}
                  testID="rating-comment"
                />
                <Pressable
                  style={[
                    styles.primaryBtn,
                    (busy || ratingValue === 0) && styles.btnDisabled,
                  ]}
                  onPress={submitRating}
                  disabled={busy || ratingValue === 0}
                  testID="rating-submit"
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? "..." : "Submit Rating"}
                  </Text>
                </Pressable>
              </>
            )}

          {ratingDone && !myConfirmation && (
            <Text style={styles.modDone}>
              Rating submitted! It will be visible once both parties have
              rated (or after 14 days).
            </Text>
          )}

          {confirmations.length === 0 && !bothCompleted && (
            <Text style={styles.emptyText}>
              Ratings will be available after both parties complete the trade.
            </Text>
          )}

          {confirmations.map((c) => (
            <View key={c.id} style={styles.review}>
              {c.revealed ? (
                <>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.commentMeta}>
                      {c.confirmer?.username || "Unknown"}
                    </Text>
                    <StarRow value={c.rating || 0} size={14} />
                    <Text style={styles.sellerTrades}>
                      {formatTimeAgo(c.created_at)}
                    </Text>
                  </View>
                  {!!c.comment && (
                    <Text style={styles.commentBody}>{c.comment}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>
                  Rating hidden — visible once both parties rate or after 14
                  days.
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Comments — hidden entirely pre-migration 00020 (GET returns 503) */}
      {commentsAvailable && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>COMMENTS ({comments.length})</Text>
          {comments.length === 0 && (
            <Text style={styles.emptyText}>
              No comments yet. Ask a question or vouch for the trader.
            </Text>
          )}
          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.commentHeader}>
                <Pressable
                  onPress={() => openProfile(c.profiles?.username)}
                  style={styles.commentAuthor}
                >
                  <Text style={styles.commentMeta} numberOfLines={1}>
                    {c.profiles?.username || "Unknown"}
                    <Text style={styles.sellerTrades}>
                      {" "}· {c.profiles?.completed_trades ?? 0} trades ·{" "}
                      {formatTimeAgo(c.created_at)}
                    </Text>
                  </Text>
                </Pressable>
                {c.user_id === myUserId &&
                  (deletingCommentId === c.id ? (
                    <View style={styles.commentDeleteRow}>
                      <Pressable
                        onPress={() => deleteComment(c.id)}
                        disabled={commentBusy}
                        testID={`comment-delete-confirm-${c.id}`}
                      >
                        <Text style={styles.commentDeleteConfirm}>Delete?</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setDeletingCommentId(null)}
                        disabled={commentBusy}
                      >
                        <Text style={styles.modLink}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setDeletingCommentId(c.id)}
                      testID={`comment-delete-${c.id}`}
                    >
                      <Text style={styles.commentDelete}>×</Text>
                    </Pressable>
                  ))}
              </View>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}

          <TextInput
            style={[styles.textArea, { marginTop: 8 }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a public comment..."
            placeholderTextColor={colors.gray400}
            multiline
            maxLength={MAX_COMMENT_LENGTH}
            testID="comment-input"
          />
          <View style={styles.commentFooter}>
            <Text style={styles.charCount}>
              {commentText.length}/{MAX_COMMENT_LENGTH}
            </Text>
            <Pressable
              style={[
                styles.primaryBtn,
                styles.commentPostBtn,
                (commentBusy || !commentText.trim()) && styles.btnDisabled,
              ]}
              onPress={postComment}
              disabled={commentBusy || !commentText.trim()}
              testID="comment-submit"
            >
              <Text style={styles.primaryBtnText}>
                {commentBusy ? "..." : "Post"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  content: { padding: 12, paddingBottom: 32, gap: 12 },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  banner: {
    backgroundColor: colors.yellowLight,
    borderRadius: 8,
    padding: 10,
  },
  bannerText: { color: colors.gray700, fontSize: 13, fontWeight: "600" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  typeBadgeText: { color: colors.white, fontWeight: "800", fontSize: 11 },
  meta: { fontSize: 12, color: colors.gray500, flexShrink: 1 },
  title: { fontSize: 16, fontWeight: "800", color: colors.black },
  seller: { marginTop: 6, fontSize: 13, fontWeight: "700", color: colors.black },
  sellerTrades: { fontWeight: "400", color: colors.gray500, fontSize: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.gray400,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  imageRow: { flexDirection: "row", gap: 6 },
  cardImg: {
    width: 90,
    height: 125,
    borderRadius: 6,
    backgroundColor: colors.gray100,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, color: colors.gray600, fontWeight: "600" },
  description: { fontSize: 14, color: colors.gray700, lineHeight: 20 },
  error: { color: colors.red, fontSize: 13, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  primaryBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    flexGrow: 1,
  },
  primaryBtnText: { fontWeight: "800", fontSize: 13, color: colors.black },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    flexGrow: 1,
  },
  secondaryBtnText: { fontWeight: "700", fontSize: 13, color: colors.gray700 },
  btnDisabled: { opacity: 0.6 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 10,
    minHeight: 72,
    fontSize: 14,
    color: colors.black,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  emptyText: { fontSize: 13, color: colors.gray500 },
  thread: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  threadUser: { fontWeight: "700", fontSize: 13, color: colors.black, flex: 1 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusPending: { backgroundColor: colors.yellowLight },
  statusAccepted: { backgroundColor: "#dcfce7" },
  statusDeclined: { backgroundColor: colors.gray200 },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: colors.gray700 },
  turn: {
    borderLeftWidth: 2,
    borderLeftColor: colors.gray200,
    paddingLeft: 8,
    marginBottom: 6,
  },
  turnOwner: { borderLeftColor: colors.yellowDark },
  turnMeta: { fontSize: 11, color: colors.gray500, marginBottom: 2 },
  turnMessage: { fontSize: 13, color: colors.gray700, lineHeight: 18 },
  waitingHint: { fontSize: 12, color: colors.gray500, fontStyle: "italic" },
  modRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    flexWrap: "wrap",
  },
  modLink: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray500,
    textDecorationLine: "underline",
  },
  modDone: { fontSize: 12, color: colors.green, fontWeight: "600" },
  modPanel: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 10,
  },
  modPanelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 6,
  },
  modPanelText: {
    fontSize: 12,
    color: colors.gray600,
    lineHeight: 17,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonChipActive: {
    borderColor: colors.yellowDark,
    backgroundColor: colors.yellowLight,
  },
  reasonChipText: { fontSize: 12, fontWeight: "600", color: colors.gray600 },
  reasonChipTextActive: { color: colors.black },
  comment: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingVertical: 8,
  },
  commentMeta: { fontSize: 12, fontWeight: "700", color: colors.black },
  commentBody: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 18,
    marginTop: 2,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  commentAuthor: { flex: 1 },
  commentDelete: {
    fontSize: 18,
    color: colors.gray400,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  commentDeleteRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  commentDeleteConfirm: { fontSize: 12, fontWeight: "700", color: colors.red },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentPostBtn: { flexGrow: 0, paddingHorizontal: 20 },
  charCount: { fontSize: 11, color: colors.gray400 },
  savedLink: { color: colors.yellowDark },
  starRow: { flexDirection: "row", gap: 2, marginVertical: 4 },
  tradeHint: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 18,
    marginBottom: 8,
  },
  completeBanner: {
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    padding: 10,
  },
  completeBannerText: { color: "#166534", fontSize: 13, fontWeight: "600" },
  disputeBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
  },
  disputeBannerText: { color: colors.red, fontSize: 13, fontWeight: "600" },
  dangerBtn: {
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    flexGrow: 1,
  },
  dangerBtnText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  review: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingVertical: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
});
