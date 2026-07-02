import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../context/session";
import CardPicker from "../../components/CardPicker";
import {
  COUNTRIES,
  STATES_BY_COUNTRY,
  type CardItem,
  type Country,
} from "../../lib/cardData";
import { colors } from "../../lib/theme";

const MAX_TITLE = 40;
const MAX_DESC = 300;

function SectionHead({
  num,
  title,
  note,
}: {
  num: number;
  title: string;
  note?: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionNum}>
        <Text style={styles.sectionNumText}>{num}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!note && <Text style={styles.sectionNote}>{note}</Text>}
    </View>
  );
}

/** Selected-card thumbnails with a remove button. */
function ThumbRow({
  items,
  onRemove,
}: {
  items: CardItem[];
  onRemove: (index: number) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.thumbEmpty}>
        <Text style={styles.thumbEmptyText}>
          Pick cards below — they show up here.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.thumbRow}>
      {items.map((c, i) => (
        <View key={`${c.set}-${c.localId}-${i}`} style={styles.thumb}>
          <Image source={{ uri: c.img }} style={styles.thumbImg} />
          <Pressable
            style={styles.thumbRemove}
            onPress={() => onRemove(i)}
            testID={`remove-thumb-${i}`}
          >
            <Text style={styles.thumbRemoveText}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function PrefChip({
  label,
  active,
  onToggle,
  testID,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      style={[styles.prefChip, active && styles.prefChipActive]}
      onPress={onToggle}
      testID={testID}
    >
      <Text style={[styles.prefChipText, active && styles.prefChipTextActive]}>
        {active ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}

export default function NewListingScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  const [country, setCountry] = useState<Country | null>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const [stateOpen, setStateOpen] = useState(false);

  const [havesText, setHavesText] = useState("");
  const [wantsText, setWantsText] = useState("");
  const [haveCards, setHaveCards] = useState<CardItem[]>([]);
  const [wantCards, setWantCards] = useState<CardItem[]>([]);
  const [wPrefs, setWPrefs] = useState({
    cash: false,
    singles: false,
    graded: false,
    sealed: false,
  });
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Prefill country/state from the user's most recent listing (as the website does)
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    supabase
      .from("listings")
      .select("country, state")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.country) return;
        setCountry((prev) => {
          if (prev) return prev; // user already picked one
          const match = COUNTRIES.find((c) => c.name === data.country);
          if (match && data.state) setState(data.state);
          return match || null;
        });
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  const states = country ? STATES_BY_COUNTRY[country.name] || [] : [];
  const countryMatches = countryQuery.trim()
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(countryQuery.trim().toLowerCase())
      ).slice(0, 30)
    : COUNTRIES;

  const canSubmit =
    !!country && havesText.trim().length > 0 && wantsText.trim().length > 0;

  async function submit() {
    // Plain guard, not `country!` — the React Compiler hoists member
    // expressions from non-null assertions into eager memo deps, which
    // throws while country is still null.
    if (!country) return;
    setBusy(true);
    setError("");
    const res = await apiFetch<{ id: string }>("/api/listings", {
      method: "POST",
      body: {
        havesText: havesText.trim(),
        wantsText: wantsText.trim(),
        description: description.trim(),
        price: null,
        currency: "BND",
        haveImages: haveCards.map((c) => ({ url: c.img })),
        wantItems: wantCards.map((c) => ({ url: c.img })),
        wantsCash: wPrefs.cash,
        wantsOffers: false,
        wantsSingles: wPrefs.singles,
        wantsGraded: wPrefs.graded,
        wantsSealed: wPrefs.sealed,
        country: country.name,
        state: state || undefined,
      },
    });
    if (res.ok && res.data) {
      router.replace({ pathname: "/listing/[id]", params: { id: res.data.id } });
    } else {
      setError(res.error || "Failed to create listing.");
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1 — Country */}
      <View style={styles.card}>
        <SectionHead
          num={1}
          title="Your country"
          note={country ? `${country.flag} ${country.name}` : "Required"}
        />
        <Pressable
          style={styles.countryField}
          onPress={() => setCountryOpen((o) => !o)}
          testID="country-field"
        >
          <Text
            style={[styles.countryFieldText, !country && styles.placeholder]}
          >
            {country ? `${country.flag} ${country.name}` : "Select your country..."}
          </Text>
        </Pressable>
        {countryOpen && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Search countries..."
              placeholderTextColor={colors.gray400}
              value={countryQuery}
              onChangeText={setCountryQuery}
              autoCapitalize="none"
              testID="country-search"
            />
            <ScrollView style={styles.countryList} nestedScrollEnabled>
              {countryMatches.map((c) => (
                <Pressable
                  key={c.name}
                  style={styles.countryOption}
                  onPress={() => {
                    setCountry(c);
                    setState(null);
                    setCountryOpen(false);
                    setCountryQuery("");
                  }}
                  testID={`country-${c.name}`}
                >
                  <Text style={styles.countryOptionText}>
                    {c.flag} {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {states.length > 0 && (
          <View style={styles.stateWrap}>
            <Text style={styles.stateLabel}>
              State / Province / District{" "}
              <Text style={styles.stateOptional}>(optional)</Text>
            </Text>
            <Pressable
              style={styles.countryField}
              onPress={() => setStateOpen((o) => !o)}
              testID="state-field"
            >
              <Text
                style={[styles.countryFieldText, !state && styles.placeholder]}
              >
                {state || "Select..."}
              </Text>
            </Pressable>
            {stateOpen && (
              <ScrollView style={styles.countryList} nestedScrollEnabled>
                <Pressable
                  style={styles.countryOption}
                  onPress={() => {
                    setState(null);
                    setStateOpen(false);
                  }}
                >
                  <Text style={styles.countryOptionText}>— None —</Text>
                </Pressable>
                {states.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.countryOption}
                    onPress={() => {
                      setState(s);
                      setStateOpen(false);
                    }}
                  >
                    <Text style={styles.countryOptionText}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* 2 — Title */}
      <View style={styles.card}>
        <SectionHead num={2} title="Title" />
        <Text style={styles.titlePreview} numberOfLines={2}>
          [H] {havesText || "..."} [W] {wantsText || "..."}
        </Text>
        <View style={styles.titleRow}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>[H]</Text>
          </View>
          <TextInput
            style={styles.titleInput}
            placeholder="What you have"
            placeholderTextColor={colors.gray400}
            value={havesText}
            onChangeText={(t) => setHavesText(t.slice(0, MAX_TITLE))}
            testID="haves-text"
          />
          <Text style={styles.charCount}>
            {havesText.length}/{MAX_TITLE}
          </Text>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>[W]</Text>
          </View>
          <TextInput
            style={styles.titleInput}
            placeholder="What you want"
            placeholderTextColor={colors.gray400}
            value={wantsText}
            onChangeText={(t) => setWantsText(t.slice(0, MAX_TITLE))}
            testID="wants-text"
          />
          <Text style={styles.charCount}>
            {wantsText.length}/{MAX_TITLE}
          </Text>
        </View>
      </View>

      {/* 3 — Haves */}
      <View style={styles.card}>
        <SectionHead num={3} title="Haves" note="Cards you're trading away" />
        <ThumbRow
          items={haveCards}
          onRemove={(i) => setHaveCards((l) => l.filter((_, j) => j !== i))}
        />
        <CardPicker
          onSelectCard={(c) => setHaveCards((l) => [...l, c])}
        />
      </View>

      {/* 4 — Wants */}
      <View style={styles.card}>
        <SectionHead num={4} title="Wants" note="What you'd trade for" />
        <ThumbRow
          items={wantCards}
          onRemove={(i) => setWantCards((l) => l.filter((_, j) => j !== i))}
        />
        <View style={styles.prefRow}>
          <PrefChip
            label="Cash"
            active={wPrefs.cash}
            onToggle={() => setWPrefs((p) => ({ ...p, cash: !p.cash }))}
            testID="pref-cash"
          />
          <PrefChip
            label="Singles"
            active={wPrefs.singles}
            onToggle={() => setWPrefs((p) => ({ ...p, singles: !p.singles }))}
            testID="pref-singles"
          />
          <PrefChip
            label="Graded"
            active={wPrefs.graded}
            onToggle={() => setWPrefs((p) => ({ ...p, graded: !p.graded }))}
            testID="pref-graded"
          />
          <PrefChip
            label="Sealed"
            active={wPrefs.sealed}
            onToggle={() => setWPrefs((p) => ({ ...p, sealed: !p.sealed }))}
            testID="pref-sealed"
          />
        </View>
        <CardPicker
          onSelectCard={(c) => setWantCards((l) => [...l, c])}
        />
      </View>

      {/* 5 — Description */}
      <View style={styles.card}>
        <SectionHead num={5} title="Description" note="Optional" />
        <TextInput
          style={styles.descInput}
          placeholder="Condition, grading details, trade preferences..."
          placeholderTextColor={colors.gray400}
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, MAX_DESC))}
          multiline
          testID="description"
        />
        <Text style={styles.charCount}>
          {description.length}/{MAX_DESC}
        </Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.submitBtn, (!canSubmit || busy) && styles.submitDisabled]}
        onPress={submit}
        disabled={!canSubmit || busy}
        testID="submit-listing"
      >
        <Text style={styles.submitText}>
          {busy ? "Posting..." : "Post Listing"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  content: { padding: 12, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 12,
    gap: 8,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.black },
  sectionNote: { fontSize: 12, color: colors.gray500, marginLeft: "auto" },
  countryField: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  countryFieldText: { fontSize: 14, color: colors.black },
  placeholder: { color: colors.gray400 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.black,
    marginTop: 6,
  },
  countryList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    marginTop: 4,
  },
  countryOption: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  countryOptionText: { fontSize: 13, color: colors.gray700 },
  stateWrap: { gap: 4 },
  stateLabel: { fontSize: 12, fontWeight: "700", color: colors.gray600 },
  stateOptional: { fontWeight: "400", color: colors.gray400 },
  titlePreview: {
    fontFamily: "monospace",
    fontSize: 12,
    color: colors.gray700,
    backgroundColor: colors.gray100,
    borderRadius: 6,
    padding: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleBadge: {
    backgroundColor: colors.gray100,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titleBadgeText: { fontWeight: "800", fontSize: 12, color: colors.gray600 },
  titleInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.black,
  },
  charCount: {
    fontSize: 11,
    color: colors.gray400,
    textAlign: "right",
    minWidth: 42,
  },
  thumbEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  thumbEmptyText: { fontSize: 12, color: colors.gray400 },
  thumbRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    padding: 8,
  },
  thumb: { width: 54, height: 75 },
  thumbImg: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.gray100,
  },
  thumbRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRemoveText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 14,
  },
  prefRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  prefChip: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
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
  descInput: {
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
  submitBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontWeight: "800", fontSize: 15, color: colors.black },
});
