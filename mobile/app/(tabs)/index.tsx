import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import ListingCard, { type ListingRow } from "../../components/ListingCard";
import { colors } from "../../lib/theme";

export default function BrowseScreen() {
  const router = useRouter();
  const [type, setType] = useState<"WTS" | "WTB">("WTS");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced copy of `search`
  const [country, setCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Country options = countries that actually have active listings
  useEffect(() => {
    supabase
      .from("listings")
      .select("country")
      .eq("status", "active")
      .not("country", "is", null)
      .limit(1000)
      .then(({ data }) => {
        const unique = [
          ...new Set((data || []).map((r) => r.country as string)),
        ].sort();
        setCountries(unique);
      });
  }, []);

  const load = useCallback(
    async (
      listingType: "WTS" | "WTB",
      searchTerm: string,
      countryFilter: string | null
    ) => {
      let q = supabase
        .from("listings")
        .select(
          "id, type, title, images, looking_for_images, country, price, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, profiles!listings_user_id_fkey(username, completed_trades)"
        )
        .eq("status", "active")
        .eq("type", listingType);
      if (searchTerm) q = q.ilike("title", `%${searchTerm}%`);
      if (countryFilter) q = q.eq("country", countryFilter);
      const { data } = await q
        .order("bumped_at", { ascending: false })
        .limit(30);
      setListings((data as unknown as ListingRow[]) || []);
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    load(type, query, country).finally(() => setLoading(false));
  }, [type, query, country, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(type, query, country);
    setRefreshing(false);
  }, [type, query, country, load]);

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

      <View style={styles.filterRow}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search listings..."
          placeholderTextColor={colors.gray400}
          autoCapitalize="none"
          returnKeyType="search"
          testID="browse-search"
        />
        <Pressable
          style={[styles.countryChip, country && styles.countryChipActive]}
          onPress={() => setCountryOpen(true)}
          testID="browse-country"
        >
          <Text
            style={[
              styles.countryChipText,
              country && styles.countryChipTextActive,
            ]}
            numberOfLines={1}
          >
            📍 {country || "Everywhere"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <Text style={styles.status}>Loading...</Text>
      ) : listings.length === 0 ? (
        <Text style={styles.status}>
          {query || country
            ? "No listings match your filters."
            : "No active listings."}
        </Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() =>
                router.push({
                  pathname: "/listing/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Modal
        visible={countryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCountryOpen(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Filter by country</Text>
            <FlatList
              data={["", ...countries]}
              keyExtractor={(item) => item || "all"}
              renderItem={({ item }) => {
                const selected = item === "" ? country === null : country === item;
                return (
                  <Pressable
                    style={styles.countryOption}
                    onPress={() => {
                      setCountry(item === "" ? null : item);
                      setCountryOpen(false);
                    }}
                    testID={`country-${item || "all"}`}
                  >
                    <Text
                      style={[
                        styles.countryOptionText,
                        selected && styles.countryOptionSelected,
                      ]}
                    >
                      {item === "" ? "All Countries" : item}
                      {selected ? "  ✓" : ""}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  toggle: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 12,
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 10,
  },
  search: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.black,
  },
  countryChip: {
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    maxWidth: 150,
  },
  countryChipActive: {
    borderColor: colors.yellowDark,
    backgroundColor: colors.yellowLight,
  },
  countryChipText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
  countryChipTextActive: { color: colors.black },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 8,
  },
  countryOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  countryOptionText: { fontSize: 14, color: colors.gray700 },
  countryOptionSelected: { fontWeight: "800", color: colors.black },
});
