import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { apiFetch } from "../../../lib/api";
import { useSession } from "../../../context/session";
import { colors } from "../../../lib/theme";

interface EditableListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  images: string[];
  looking_for_images: string[] | null;
  price: number | null;
  currency: string;
  status: string;
  wants_cash: boolean;
  wants_singles: boolean;
  wants_graded: boolean;
  wants_sealed: boolean;
  wants_offers: boolean;
}

/** Split a "[H] ... [W] ..." title back into its two halves. */
function parseTitle(title: string): { haves: string; wants: string } {
  const m = title.match(/^\[H\]\s*([\s\S]*?)\s*\[W\]\s*([\s\S]*)$/);
  if (m) return { haves: m[1], wants: m[2] };
  return { haves: title, wants: "" };
}

const PREF_KEYS = ["cash", "singles", "graded", "sealed"] as const;
type PrefKey = (typeof PREF_KEYS)[number];
const PREF_LABELS: Record<PrefKey, string> = {
  cash: "Cash",
  singles: "Singles",
  graded: "Graded",
  sealed: "Sealed",
};

function ThumbRow({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (url: string) => void;
}) {
  if (urls.length === 0) {
    return <Text style={styles.emptyThumbs}>No cards.</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.thumbRow}>
        {urls.map((url) => (
          <View key={url} style={styles.thumbWrap}>
            <Image source={{ uri: url }} style={styles.thumb} />
            <Pressable
              style={styles.thumbRemove}
              onPress={() => onRemove(url)}
              hitSlop={6}
            >
              <Text style={styles.thumbRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id ?? null;

  const [listing, setListing] = useState<EditableListing | null>(null);
  const [loadError, setLoadError] = useState("");
  const [havesText, setHavesText] = useState("");
  const [wantsText, setWantsText] = useState("");
  const [description, setDescription] = useState("");
  const [haveImages, setHaveImages] = useState<string[]>([]);
  const [wantImages, setWantImages] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    cash: false,
    singles: false,
    graded: false,
    sealed: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("listings")
      .select(
        "id, user_id, title, description, images, looking_for_images, price, currency, status, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers"
      )
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as unknown as EditableListing | null;
        if (!row || row.status === "removed") {
          setLoadError("Listing not found.");
          return;
        }
        if (row.user_id !== userId) {
          setLoadError("You can only edit your own listings.");
          return;
        }
        const { haves, wants } = parseTitle(row.title);
        setListing(row);
        setHavesText(haves);
        setWantsText(wants);
        setDescription(row.description || "");
        setHaveImages(row.images || []);
        setWantImages(row.looking_for_images || []);
        setPrefs({
          cash: row.wants_cash,
          singles: row.wants_singles,
          graded: row.wants_graded,
          sealed: row.wants_sealed,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  async function save() {
    if (!listing) return;
    setBusy(true);
    setError("");
    const res = await apiFetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      body: {
        havesText: havesText.trim(),
        wantsText: wantsText.trim(),
        description: description.trim(),
        price: listing.price,
        currency: listing.currency || "BND",
        haveImages: haveImages.map((url) => ({
          url,
          grader: "RAW",
          grade: "",
        })),
        wantItems: wantImages.map((url) => ({ url, type: "singles" })),
        wantsCash: prefs.cash,
        wantsOffers: listing.wants_offers,
        wantsSingles: prefs.singles,
        wantsGraded: prefs.graded,
        wantsSealed: prefs.sealed,
      },
    });
    setBusy(false);
    if (res.ok) {
      router.back();
    } else {
      setError(res.error || "Failed to save changes.");
    }
  }

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  if (loadError) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>{loadError}</Text>
      </View>
    );
  }
  if (!listing) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>TITLE</Text>
        <Text style={styles.preview} numberOfLines={2}>
          [H] {havesText.trim() || "..."} [W] {wantsText.trim() || "..."}
        </Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefixBadge}>[H]</Text>
          <TextInput
            style={styles.input}
            value={havesText}
            onChangeText={setHavesText}
            placeholder="What you have"
            placeholderTextColor={colors.gray400}
            maxLength={40}
            testID="edit-haves"
          />
          <Text style={styles.charCount}>{havesText.length}/40</Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.prefixBadge}>[W]</Text>
          <TextInput
            style={styles.input}
            value={wantsText}
            onChangeText={setWantsText}
            placeholder="What you want"
            placeholderTextColor={colors.gray400}
            maxLength={40}
            testID="edit-wants"
          />
          <Text style={styles.charCount}>{wantsText.length}/40</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>HAVES — CARDS</Text>
        <ThumbRow
          urls={haveImages}
          onRemove={(url) =>
            setHaveImages((prev) => prev.filter((u) => u !== url))
          }
        />
        <Text style={styles.hint}>
          Tap × to remove a card. To add cards, create a new listing.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>WANTS — CARDS & PREFERENCES</Text>
        <ThumbRow
          urls={wantImages}
          onRemove={(url) =>
            setWantImages((prev) => prev.filter((u) => u !== url))
          }
        />
        <View style={styles.prefRow}>
          {PREF_KEYS.map((key) => (
            <Pressable
              key={key}
              style={[styles.prefChip, prefs[key] && styles.prefChipActive]}
              onPress={() =>
                setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              testID={`pref-${key}`}
            >
              <Text
                style={[
                  styles.prefChipText,
                  prefs[key] && styles.prefChipTextActive,
                ]}
              >
                {PREF_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>DESCRIPTION (OPTIONAL)</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Condition notes, trade preferences, region..."
          placeholderTextColor={colors.gray400}
          multiline
          maxLength={300}
          testID="edit-description"
        />
        <Text style={styles.charCountRight}>{description.length}/300</Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={save}
          disabled={busy || !havesText.trim() || !wantsText.trim()}
          testID="edit-save"
        >
          <Text style={styles.primaryBtnText}>
            {busy ? "Saving..." : "Save changes"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.back()}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  content: { padding: 12, paddingBottom: 32, gap: 12 },
  statusText: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.gray400,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  preview: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: colors.gray700,
    backgroundColor: colors.gray100,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  prefixBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.gray600,
    backgroundColor: colors.gray100,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.black,
  },
  charCount: { fontSize: 10, color: colors.gray400, width: 38 },
  charCountRight: {
    fontSize: 10,
    color: colors.gray400,
    textAlign: "right",
    marginTop: 4,
  },
  emptyThumbs: { fontSize: 13, color: colors.gray500 },
  thumbRow: { flexDirection: "row", gap: 8 },
  thumbWrap: { position: "relative" },
  thumb: {
    width: 72,
    height: 100,
    borderRadius: 6,
    backgroundColor: colors.gray100,
  },
  thumbRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRemoveText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 16,
  },
  hint: { fontSize: 11, color: colors.gray400, marginTop: 8 },
  prefRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  prefChip: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  prefChipActive: {
    borderColor: colors.yellowDark,
    backgroundColor: colors.yellowLight,
  },
  prefChipText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
  prefChipTextActive: { color: colors.black },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    fontSize: 14,
    color: colors.black,
    textAlignVertical: "top",
  },
  error: { color: colors.red, fontSize: 13, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 8 },
  primaryBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  primaryBtnText: { fontWeight: "800", fontSize: 14, color: colors.black },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
    backgroundColor: colors.white,
  },
  secondaryBtnText: { fontWeight: "700", fontSize: 14, color: colors.gray700 },
  btnDisabled: { opacity: 0.6 },
});
