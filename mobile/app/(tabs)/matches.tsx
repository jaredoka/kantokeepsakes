import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "../../lib/api";
import ListingCard, { type ListingRow } from "../../components/ListingCard";
import { colors } from "../../lib/theme";

interface MatchSection {
  listing: { id: string; title: string };
  matches: {
    listing: ListingRow;
    theyHaveIWant: string[];
    theyWantIHave: string[];
    twoWay: boolean;
  }[];
}

export default function MatchesScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<MatchSection[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch<{ sections: MatchSection[] }>("/api/matches");
    if (res.ok && res.data) {
      setSections(res.data.sections);
      setError("");
    } else {
      setError(res.error || "Failed to load matches.");
      setSections([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const flat = (sections || []).flatMap((s) =>
    s.matches.map((m) => ({ section: s.listing, match: m }))
  );

  return (
    <View style={styles.container}>
      {sections === null ? (
        <Text style={styles.status}>Loading...</Text>
      ) : error ? (
        <Text style={styles.status}>{error}</Text>
      ) : flat.length === 0 ? (
        <Text style={styles.status}>
          No matches yet. Post listings with haves and wants, and trades that
          fit will show up here.
        </Text>
      ) : (
        <FlatList
          data={flat}
          keyExtractor={(item) => `${item.section.id}-${item.match.listing.id}`}
          renderItem={({ item }) => (
            <View style={styles.matchBlock}>
              <Text style={styles.matchFor} numberOfLines={1}>
                {item.match.twoWay ? "⇄ Two-way match" : "Match"} for{" "}
                {item.section.title}
              </Text>
              <ListingCard
                listing={item.match.listing}
                onPress={() =>
                  router.push({
                    pathname: "/listing/[id]",
                    params: { id: item.match.listing.id },
                  })
                }
              />
            </View>
          )}
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
  status: {
    textAlign: "center",
    marginTop: 40,
    color: colors.gray500,
    paddingHorizontal: 24,
  },
  list: { padding: 12 },
  matchBlock: { marginBottom: 4 },
  matchFor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.yellowDark,
    marginBottom: 4,
  },
});
