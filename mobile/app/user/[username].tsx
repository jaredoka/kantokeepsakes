import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../context/session";
import ListingCard, { type ListingRow } from "../../components/ListingCard";
import {
  formatAccountAge,
  formatTimeAgo,
  reputationTier,
} from "../../lib/format";
import { colors } from "../../lib/theme";

interface ProfileRow {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
  reputation_score: number;
  completed_trades: number;
}

interface ReviewRow {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  revealed: boolean;
  confirmer: { username: string } | null;
  listings: { id: string; title: string; type: string } | null;
}

interface BlockRow {
  blocked_id: string;
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data: row } = await supabase
      .from("profiles")
      .select(
        "id, username, bio, created_at, reputation_score, completed_trades"
      )
      .eq("username", username)
      .single();
    if (!row) {
      setNotFound(true);
      return;
    }
    const prof = row as ProfileRow;
    setProfile(prof);

    const [{ data: listingRows }, reviewsRes, blocksRes] = await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, type, title, images, looking_for_images, country, price, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, profiles!listings_user_id_fkey(username, completed_trades)"
        )
        .eq("user_id", prof.id)
        .eq("status", "active")
        .order("bumped_at", { ascending: false })
        .limit(12),
      // API applies the double-blind reveal logic
      apiFetch<ReviewRow[]>(`/api/trade-confirmations?userId=${prof.id}`),
      apiFetch<BlockRow[]>("/api/blocks"),
    ]);
    setListings((listingRows as unknown as ListingRow[]) || []);
    setReviews(reviewsRes.ok && reviewsRes.data ? reviewsRes.data : []);
    setBlocked(
      !!(
        blocksRes.ok &&
        blocksRes.data &&
        blocksRes.data.some((b) => b.blocked_id === prof.id)
      )
    );
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function toggleBlock() {
    if (!profile) return;
    setBusy(true);
    setError("");
    const res = await apiFetch("/api/blocks", {
      method: blocked ? "DELETE" : "POST",
      body: { userId: profile.id },
    });
    if (res.ok) {
      setBlocked(!blocked);
      setBlockConfirm(false);
    } else {
      setError(res.error || "Failed to update block.");
    }
    setBusy(false);
  }

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  if (notFound) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>User not found.</Text>
      </View>
    );
  }
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Loading...</Text>
      </View>
    );
  }

  const isOwnProfile = session?.user.id === profile.id;
  // reputation_score is stored x10 (see SellerCard.tsx)
  const rating =
    profile.reputation_score > 0
      ? (profile.reputation_score / 10).toFixed(1)
      : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.card}>
        <View style={styles.headerBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username} testID="public-username">
            {profile.username}
          </Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>
              {reputationTier(profile.completed_trades)}
            </Text>
          </View>
          <Text style={styles.meta}>
            {profile.completed_trades} trade
            {profile.completed_trades !== 1 ? "s" : ""}
            {rating ? ` · ★ ${rating}` : ""}
          </Text>
          <Text style={styles.joined}>
            {formatAccountAge(profile.created_at)}
          </Text>
          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {!isOwnProfile &&
            (blockConfirm ? (
              <View style={styles.blockRow}>
                <Pressable
                  style={[styles.blockBtn, busy && styles.btnDisabled]}
                  onPress={toggleBlock}
                  disabled={busy}
                  testID="profile-block-confirm"
                >
                  <Text style={styles.blockBtnText}>
                    {busy ? "..." : blocked ? "Unblock" : "Block"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBlockConfirm(false)}
                  disabled={busy}
                >
                  <Text style={styles.blockLink}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setBlockConfirm(true)}
                testID="profile-block"
              >
                <Text style={styles.blockLink}>
                  {blocked ? "Unblock user" : "Block user"}
                </Text>
              </Pressable>
            ))}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>
          ACTIVE LISTINGS ({listings.length})
        </Text>
        {listings.length === 0 ? (
          <Text style={styles.emptyText}>No active listings.</Text>
        ) : (
          listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              onPress={() =>
                router.push({ pathname: "/listing/[id]", params: { id: l.id } })
              }
            />
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>REVIEWS ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              {r.revealed ? (
                <>
                  <Text style={styles.reviewMeta}>
                    {r.confirmer?.username || "Unknown"}
                    <Text style={styles.reviewSub}>
                      {" "}· {"★".repeat(r.rating || 0)} ·{" "}
                      {formatTimeAgo(r.created_at)}
                    </Text>
                  </Text>
                  {!!r.listings && (
                    <Text style={styles.reviewListing} numberOfLines={1}>
                      {r.listings.type}: {r.listings.title}
                    </Text>
                  )}
                  {!!r.comment && (
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>
                  Rating hidden — visible once both parties rate or after 14
                  days.
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  content: { padding: 12, paddingBottom: 32, gap: 12 },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 12,
  },
  headerBlock: { alignItems: "center", paddingVertical: 8 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 24 },
  username: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
    color: colors.black,
  },
  tierBadge: {
    backgroundColor: colors.yellowLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 6,
  },
  tierBadgeText: { fontSize: 11, fontWeight: "800", color: colors.yellowDark },
  meta: { fontSize: 13, color: colors.gray500, marginTop: 6 },
  joined: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  bio: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 19,
    marginTop: 10,
    textAlign: "center",
  },
  blockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  blockBtn: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  blockBtnText: { fontSize: 12, fontWeight: "700", color: colors.red },
  blockLink: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray500,
    textDecorationLine: "underline",
    marginTop: 10,
  },
  btnDisabled: { opacity: 0.5 },
  error: { color: colors.red, fontSize: 12, marginTop: 8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.gray400,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  emptyText: { fontSize: 13, color: colors.gray500 },
  review: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingVertical: 8,
  },
  reviewMeta: { fontSize: 12, fontWeight: "700", color: colors.black },
  reviewSub: { fontWeight: "400", color: colors.yellowDark, fontSize: 12 },
  reviewListing: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  reviewComment: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 18,
    marginTop: 2,
  },
});
