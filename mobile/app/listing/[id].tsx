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
  const [refreshing, setRefreshing] = useState(false);

  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerText, setOfferText] = useState("");
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [counterText, setCounterText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: row }, offersRes] = await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, user_id, type, title, description, images, looking_for_images, country, state, status, created_at, price, currency, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, profiles!listings_user_id_fkey(username, reputation_score, completed_trades)"
        )
        .eq("id", id)
        .single(),
      apiFetch<OfferRow[]>(`/api/offers?listingId=${id}`),
    ]);
    if (!row || (row as unknown as ListingDetail).status === "removed") {
      setNotFound(true);
    } else {
      setListing(row as unknown as ListingDetail);
    }
    setOffers(offersRes.ok && offersRes.data ? offersRes.data : []);
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

  const wantPills: string[] = [];
  if (listing.wants_cash || listing.price !== null) wantPills.push("Cash");
  if (listing.wants_offers) wantPills.push("Any Offers");
  if (listing.wants_singles) wantPills.push("Any Singles");
  if (listing.wants_graded) wantPills.push("Any Graded");
  if (listing.wants_sealed) wantPills.push("Any Sealed");

  async function submitOffer() {
    setBusy(true);
    setError("");
    const res = await apiFetch<{ id: string }>("/api/offers", {
      method: "POST",
      body: { listingId: listing!.id, message: offerText.trim() },
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
        <Text style={styles.seller}>
          {listing.profiles?.username || "Unknown"}
          <Text style={styles.sellerTrades}>
            {" "}· {listing.profiles?.completed_trades ?? 0} trades
            {/* reputation_score is stored x10 (see SellerCard.tsx) */}
            {(listing.profiles?.reputation_score ?? 0) > 0 &&
              ` · ★ ${(listing.profiles!.reputation_score / 10).toFixed(1)}`}
          </Text>
        </Text>
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
});
