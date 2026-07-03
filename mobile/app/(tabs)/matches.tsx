import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
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

/** Matched-card thumbnails for one direction of a match. */
function DirectionRow({ label, urls }: { label: string; urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <View style={styles.directionRow}>
      <Text style={styles.directionLabel}>{label}</Text>
      <View style={styles.directionThumbs}>
        {urls.slice(0, 6).map((url) => (
          <Image key={url} source={{ uri: url }} style={styles.matchThumb} />
        ))}
        {urls.length > 6 && (
          <View style={styles.moreBox}>
            <Text style={styles.moreText}>+{urls.length - 6}</Text>
          </View>
        )}
      </View>
    </View>
  );
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
        <View style={styles.errorWrap}>
          <Text style={styles.status}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load} testID="matches-retry">
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
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
              <View style={styles.matchHeader}>
                {item.match.twoWay && (
                  <View style={styles.twoWayBadge} testID="two-way-badge">
                    <Text style={styles.twoWayBadgeText}>⇄ Two-way</Text>
                  </View>
                )}
                <Text style={styles.matchFor} numberOfLines={1}>
                  Match for {item.section.title}
                </Text>
              </View>
              <DirectionRow
                label="They have · you want"
                urls={item.match.theyHaveIWant}
              />
              <DirectionRow
                label="They want · you have"
                urls={item.match.theyWantIHave}
              />
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
  errorWrap: { alignItems: "center" },
  retryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  retryText: { fontWeight: "700", fontSize: 13, color: colors.gray700 },
  list: { padding: 12 },
  matchBlock: { marginBottom: 12 },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  matchFor: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.yellowDark,
  },
  twoWayBadge: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  twoWayBadgeText: { fontSize: 11, fontWeight: "800", color: colors.black },
  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  directionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.gray600,
    width: 110,
  },
  directionThumbs: { flexDirection: "row", gap: 4, flex: 1, flexWrap: "wrap" },
  matchThumb: {
    width: 32,
    height: 45,
    borderRadius: 3,
    backgroundColor: colors.gray200,
    borderWidth: 1,
    borderColor: colors.yellowDark,
  },
  moreBox: {
    width: 32,
    height: 45,
    borderRadius: 3,
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontSize: 10, fontWeight: "700", color: colors.gray500 },
});
