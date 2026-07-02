import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { colors } from "../lib/theme";

export interface ListingRow {
  id: string;
  type: "WTS" | "WTB";
  title: string;
  images: string[];
  looking_for_images: string[] | null;
  country: string | null;
  wants_cash: boolean;
  wants_singles: boolean;
  wants_graded: boolean;
  wants_sealed: boolean;
  wants_offers: boolean;
  price: number | null;
  profiles: {
    username: string;
    completed_trades: number;
  } | null;
}

export default function ListingCard({
  listing,
  onPress,
}: {
  listing: ListingRow;
  onPress?: () => void;
}) {
  const pills: string[] = [];
  if (listing.wants_cash || listing.price !== null) pills.push("Cash");
  if (listing.wants_singles) pills.push("Singles");
  if (listing.wants_graded) pills.push("Graded");
  if (listing.wants_sealed) pills.push("Sealed");
  if (pills.length === 0) pills.push("Offers");

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.username} numberOfLines={1}>
          {listing.profiles?.username || "Unknown"}
          <Text style={styles.trades}>
            {" "}· {listing.profiles?.completed_trades ?? 0} trades
          </Text>
        </Text>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: listing.type === "WTS" ? colors.wtsGold : colors.wtbBlue },
          ]}
        >
          <Text style={styles.typeBadgeText}>{listing.type}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>HAVES</Text>
          <View style={styles.imageRow}>
            {listing.images.slice(0, 4).map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.cardImg} />
            ))}
            {listing.images.length > 4 && (
              <View style={styles.moreBox}>
                <Text style={styles.moreText}>+{listing.images.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>WANTS</Text>
          {(listing.looking_for_images || []).length > 0 && (
            <View style={styles.imageRow}>
              {(listing.looking_for_images || []).slice(0, 3).map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.cardImg} />
              ))}
            </View>
          )}
          <View style={styles.pillRow}>
            {pills.map((p) => (
              <View key={p} style={styles.pill}>
                <Text style={styles.pillText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 12,
    overflow: "hidden",
  },
  pressed: { opacity: 0.85 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  username: { fontWeight: "700", fontSize: 13, color: colors.black, flex: 1 },
  trades: { fontWeight: "400", color: colors.gray500, fontSize: 12 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  typeBadgeText: { color: colors.white, fontWeight: "800", fontSize: 11 },
  body: { flexDirection: "row" },
  panel: { flex: 1, padding: 10 },
  panelLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.gray400,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cardImg: { width: 44, height: 61, borderRadius: 4, backgroundColor: colors.gray100 },
  moreBox: {
    width: 44,
    height: 61,
    borderRadius: 4,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { fontSize: 12, fontWeight: "700", color: colors.gray500 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  pill: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, color: colors.gray600, fontWeight: "600" },
});
