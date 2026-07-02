import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { supabase } from "../../lib/supabase";
import ListingCard, { type ListingRow } from "../../components/ListingCard";
import { colors } from "../../lib/theme";

export default function BrowseScreen() {
  const [type, setType] = useState<"WTS" | "WTB">("WTS");
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (listingType: "WTS" | "WTB") => {
    const { data } = await supabase
      .from("listings")
      .select(
        "id, type, title, images, looking_for_images, country, price, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, profiles!listings_user_id_fkey(username, completed_trades)"
      )
      .eq("status", "active")
      .eq("type", listingType)
      .order("bumped_at", { ascending: false })
      .limit(30);
    setListings((data as unknown as ListingRow[]) || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    load(type).finally(() => setLoading(false));
  }, [type, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(type);
    setRefreshing(false);
  }, [type, load]);

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        {(["WTS", "WTB"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.toggleBtn, type === t && styles.toggleBtnActive]}
            onPress={() => setType(t)}
            testID={`browse-${t}`}
          >
            <Text
              style={[styles.toggleText, type === t && styles.toggleTextActive]}
            >
              {t === "WTS" ? "Want to Sell" : "Want to Buy"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Text style={styles.status}>Loading...</Text>
      ) : listings.length === 0 ? (
        <Text style={styles.status}>No active listings.</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  toggle: {
    flexDirection: "row",
    margin: 12,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: colors.white },
  toggleText: { fontSize: 13, fontWeight: "600", color: colors.gray500 },
  toggleTextActive: { color: colors.black },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
});
