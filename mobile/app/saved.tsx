import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/session";
import ListingCard, { type ListingRow } from "../components/ListingCard";
import { colors } from "../lib/theme";

interface SavedRow {
  listing_id: string;
  created_at: string;
  listings: (ListingRow & { status: string }) | null;
}

export default function SavedScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    // RLS scopes saved_listings to the current user
    const { data, error } = await supabase
      .from("saved_listings")
      .select(
        "listing_id, created_at, listings(id, type, title, status, images, looking_for_images, country, price, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, profiles!listings_user_id_fkey(username, completed_trades))"
      )
      .order("created_at", { ascending: false });
    if (error) {
      // Table missing until migration 00025 is applied
      setLoadError("Saved listings are unavailable right now.");
      setRows([]);
    } else {
      setRows((data as unknown as SavedRow[]) || []);
      setLoadError("");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      load();
    }, [session, load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function unsave(listingId: string) {
    if (!session) return;
    setBusyId(listingId);
    const { error } = await supabase
      .from("saved_listings")
      .delete()
      .eq("user_id", session.user.id)
      .eq("listing_id", listingId);
    if (!error) {
      setRows((prev) =>
        prev ? prev.filter((r) => r.listing_id !== listingId) : prev
      );
    }
    setBusyId(null);
  }

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  const visible = (rows || []).filter((r) => r.listings);

  return (
    <View style={styles.container}>
      {rows === null ? (
        <Text style={styles.status}>Loading...</Text>
      ) : loadError ? (
        <Text style={styles.status}>{loadError}</Text>
      ) : visible.length === 0 ? (
        <Text style={styles.status}>
          Nothing saved yet. Tap ☆ Save on a listing to keep an eye on it.
        </Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.listing_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            // Plain guard, not `!.` — React Compiler hoists non-null
            // assertion member expressions into eager memo deps
            const listing = item.listings;
            if (!listing) return null;
            return (
              <View style={styles.savedBlock}>
                <View style={styles.savedHeader}>
                  {listing.status !== "active" && (
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipText}>
                        {listing.status}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => unsave(item.listing_id)}
                    disabled={busyId === item.listing_id}
                    testID={`unsave-${item.listing_id}`}
                  >
                    <Text style={styles.removeLink}>
                      {busyId === item.listing_id ? "..." : "Remove"}
                    </Text>
                  </Pressable>
                </View>
                <ListingCard
                  listing={listing}
                  onPress={() =>
                    router.push({
                      pathname: "/listing/[id]",
                      params: { id: item.listing_id },
                    })
                  }
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  status: {
    textAlign: "center",
    marginTop: 40,
    color: colors.gray500,
    paddingHorizontal: 24,
  },
  list: { padding: 12 },
  savedBlock: { marginBottom: 4 },
  savedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusChip: {
    backgroundColor: colors.gray200,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.gray600,
    textTransform: "uppercase",
  },
  removeLink: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray500,
    textDecorationLine: "underline",
  },
});
