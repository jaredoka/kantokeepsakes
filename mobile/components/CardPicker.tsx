import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  ERA_DATA,
  JA_SET_MAP,
  PROMO_SETS_BY_ERA,
  ALL_PROMO_SET_IDS,
  SET_RANK,
  PTCGIO_SET_MAP,
  expandQuery,
  type CardItem,
} from "../lib/cardData";
import { colors } from "../lib/theme";

interface TCGDexCardBrief {
  id?: string;
  localId: string | number;
  name?: string;
  image?: string;
}

interface PickerCard {
  id: string;
  localId: string;
  name: string;
  img: string; // resolved image URL, "" when TCGdex has no scan
  setId: string;
}

const API = "https://api.tcgdex.net/v2";
const MAX_RESULTS = 100;
// Website asset — same placeholder the web CardPicker stores for scanless cards
const PLACEHOLDER_IMG = "https://kantokeepsakes.com/images/card-placeholder.svg";
const NO_CARDS: PickerCard[] = [];

/** pokemontcg.io image fallback for English cards TCGdex has no scan of. */
function ptcgioImg(setId: string, localId: string): string {
  const pid = PTCGIO_SET_MAP[setId];
  if (!pid) return "";
  const num = localId.replace(/^0+(?=\d)/, "");
  return `https://images.pokemontcg.io/${pid}/${num}.png`;
}

/** Best image URL for a card brief: TCGdex scan, else pokemontcg.io (EN only). */
function cardImg(c: TCGDexCardBrief, setId: string, lang: "en" | "ja"): string {
  if (c.image) return `${c.image}/high.webp`;
  return lang === "en" ? ptcgioImg(setId, String(c.localId ?? "")) : "";
}

function sortCards(list: PickerCard[]): PickerCard[] {
  return [...list].sort((a, b) => {
    const ra = SET_RANK[a.setId] ?? Number.MAX_SAFE_INTEGER;
    const rb = SET_RANK[b.setId] ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    if (a.setId !== b.setId) return a.setId < b.setId ? -1 : 1;
    const na = parseInt(a.localId, 10);
    const nb = parseInt(b.localId, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return a.localId.localeCompare(b.localId);
  });
}

/** Fetch full card lists for one or more sets (set browse / promo browse). */
async function loadSets(setIds: string[], lang: "en" | "ja"): Promise<PickerCard[]> {
  const settled = await Promise.allSettled(
    setIds.map(async (sid) => {
      const r = await fetch(`${API}/${lang}/sets/${encodeURIComponent(sid)}`);
      if (!r.ok) throw new Error(`set ${sid}: ${r.status}`);
      const data = await r.json();
      return ((data.cards || []) as TCGDexCardBrief[]).map((c): PickerCard => ({
        id: c.id || `${sid}-${c.localId}`,
        localId: String(c.localId),
        name: c.name || "",
        setId: sid,
        img: cardImg(c, sid, lang),
      }));
    })
  );
  const ok = settled.filter(
    (s): s is PromiseFulfilledResult<PickerCard[]> => s.status === "fulfilled"
  );
  if (ok.length === 0) throw new Error("all set fetches failed");
  return sortCards(ok.flatMap((s) => s.value));
}

/** Search cards by name across all sets, optionally restricted to a set of set IDs. */
async function loadSearch(
  query: string,
  lang: "en" | "ja",
  allowedSets: Set<string> | null
): Promise<PickerCard[]> {
  const terms = expandQuery(query);
  const settled = await Promise.allSettled(
    terms.map(async (t) => {
      const r = await fetch(`${API}/${lang}/cards?name=like:${encodeURIComponent(t)}`);
      if (!r.ok) throw new Error(`search: ${r.status}`);
      return (await r.json()) as TCGDexCardBrief[];
    })
  );
  const ok = settled.filter(
    (s): s is PromiseFulfilledResult<TCGDexCardBrief[]> => s.status === "fulfilled"
  );
  if (ok.length === 0) throw new Error("all search fetches failed");
  const seen = new Set<string>();
  const out: PickerCard[] = [];
  for (const s of ok) {
    for (const c of s.value) {
      const id = c.id || "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const setId = id.slice(0, id.lastIndexOf("-"));
      if (allowedSets && !allowedSets.has(setId)) continue;
      out.push({
        id,
        localId: String(c.localId ?? ""),
        name: c.name || "",
        setId,
        img: cardImg(c, setId, lang),
      });
    }
  }
  return sortCards(out);
}

/** All TCGdex set IDs belonging to an era for the given language (incl. promos). */
function eraSetIds(eraId: string, lang: "en" | "ja"): Set<string> {
  const ids = new Set<string>();
  const eraObj = ERA_DATA.find((e) => e.id === eraId);
  if (!eraObj) return ids;
  for (const s of eraObj.sets) {
    if (lang === "ja") {
      for (const jaId of JA_SET_MAP[s.id] ?? []) ids.add(jaId);
    } else {
      ids.add(s.id);
    }
  }
  if (lang === "en") {
    for (const promoId of PROMO_SETS_BY_ERA[eraId] ?? []) ids.add(promoId);
  }
  return ids;
}

/** Inline dropdown: a pressable field that expands into a scrollable option list. */
function Select({
  value,
  placeholder,
  options,
  disabled,
  onChange,
  testID,
}: {
  value: string;
  placeholder: string;
  options: { id: string; label: string }[];
  disabled?: boolean;
  onChange: (id: string) => void;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <View style={styles.selectWrap}>
      <Pressable
        style={[styles.selectField, disabled && styles.selectDisabled]}
        onPress={() => !disabled && setOpen((o) => !o)}
        testID={testID}
      >
        <Text
          style={[styles.selectText, !current && styles.selectPlaceholder]}
          numberOfLines={1}
        >
          {current ? current.label : placeholder}
        </Text>
        <Text style={styles.selectChevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open && (
        <ScrollView style={styles.selectList} nestedScrollEnabled>
          {options.map((o) => (
            <Pressable
              key={o.id || "__all"}
              style={styles.selectOption}
              onPress={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  o.id === value && styles.selectOptionActive,
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function CardPicker({
  onSelectCard,
}: {
  onSelectCard: (card: CardItem) => void;
}) {
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced copy of `search`
  const [era, setEra] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [cardType, setCardType] = useState<"all" | "card" | "promo">("all");
  const [loaded, setLoaded] = useState<{ key: string; cards: PickerCard[] }>({
    key: "",
    cards: [],
  });
  const [errKey, setErrKey] = useState("");

  const currentEra = ERA_DATA.find((e) => e.id === era);
  const sets = currentEra ? currentEra.sets : [];

  // Debounce the search input so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Decide what to load. Priority: specific set > name search > era promos.
  const plan = useMemo<
    | { kind: "sets"; ids: string[]; key: string }
    | { kind: "search"; q: string; key: string }
    | { kind: "notice"; msg: string; key: string }
  >(() => {
    const q = query.trim();
    if (filterSet) {
      const ids = lang === "ja" ? JA_SET_MAP[filterSet] ?? [] : [filterSet];
      return ids.length > 0
        ? { kind: "sets", ids, key: `sets:${lang}:${ids.join(",")}` }
        : { kind: "notice", msg: "No Japanese card data for this set yet.", key: "" };
    }
    if (q) {
      return { kind: "search", q, key: `search:${lang}:${era}:${q}` };
    }
    if (era && cardType === "promo") {
      const ids = lang === "ja" ? [] : PROMO_SETS_BY_ERA[era] ?? [];
      return ids.length > 0
        ? { kind: "sets", ids, key: `sets:${lang}:${ids.join(",")}` }
        : {
            kind: "notice",
            msg:
              lang === "ja"
                ? "Japanese promo data isn't available — try searching by name."
                : "No promo sets for this era.",
            key: "",
          };
    }
    return {
      kind: "notice",
      msg: "Type a card name to search, or pick an era and set to browse.",
      key: "",
    };
  }, [filterSet, lang, era, query, cardType]);

  const notice = plan.kind === "notice" ? plan.msg : null;
  const cards = loaded.key === plan.key ? loaded.cards : NO_CARDS;
  const fetchErr = plan.kind !== "notice" && errKey === plan.key;
  const loading = plan.kind !== "notice" && loaded.key !== plan.key && !fetchErr;

  useEffect(() => {
    if (plan.kind === "notice") return;
    if (loaded.key === plan.key || errKey === plan.key) return;
    let cancelled = false;
    const { key } = plan;

    const load =
      plan.kind === "sets"
        ? loadSets(plan.ids, lang)
        : loadSearch(plan.q, lang, era ? eraSetIds(era, lang) : null);

    load
      .then((result) => {
        if (!cancelled) setLoaded({ key, cards: result });
      })
      .catch(() => {
        if (!cancelled) setErrKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [plan, lang, era, loaded.key, errKey]);

  const filtered = useMemo(() => {
    let list = cards;
    // With a specific set loaded, narrow by name in-memory for instant feedback
    if (filterSet && search.trim()) {
      const terms = expandQuery(search);
      list = list.filter((c) =>
        terms.some((t) => c.name.toLowerCase().includes(t))
      );
    }
    if (cardType !== "all") {
      const isPromo = (c: PickerCard) =>
        ALL_PROMO_SET_IDS.has(c.setId) || /^[A-Za-z]/.test(c.localId);
      list = list.filter((c) => (cardType === "promo") === isPromo(c));
    }
    return list;
  }, [cards, filterSet, search, cardType]);

  // Cap broad name searches only — set browsing shows the full set
  const capped = plan.kind === "search";
  const visible = capped ? filtered.slice(0, MAX_RESULTS) : filtered;
  const truncated = capped && filtered.length > MAX_RESULTS;

  return (
    <View style={styles.wrapper}>
      {/* Row 1: language toggle + search */}
      <View style={styles.row}>
        <View style={styles.langToggle}>
          {(["en", "ja"] as const).map((id) => (
            <Pressable
              key={id}
              style={[styles.langBtn, lang === id && styles.langBtnActive]}
              onPress={() => setLang(id)}
              testID={`picker-lang-${id}`}
            >
              <Text
                style={[styles.langText, lang === id && styles.langTextActive]}
              >
                {id === "en" ? "EN" : "JP"}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search card name..."
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          testID="picker-search"
        />
      </View>

      {/* Row 2: era + set selects */}
      <View style={styles.row}>
        <Select
          value={era}
          placeholder="All Eras"
          options={[
            { id: "", label: "All Eras" },
            ...ERA_DATA.map((e) => ({ id: e.id, label: e.en })),
          ]}
          onChange={(id) => {
            setEra(id);
            setFilterSet("");
          }}
          testID="picker-era"
        />
        <Select
          value={filterSet}
          placeholder={era ? "All Sets" : "— Pick era first —"}
          disabled={!era}
          options={[
            { id: "", label: era ? "All Sets" : "— Pick era first —" },
            ...sets.map((s) => ({ id: s.id, label: s.en })),
          ]}
          onChange={setFilterSet}
          testID="picker-set"
        />
      </View>

      {/* Row 3: type pills */}
      <View style={styles.row}>
        {([
          { id: "all", label: "All" },
          { id: "card", label: "Cards" },
          { id: "promo", label: "Promos" },
        ] as const).map(({ id, label }) => (
          <Pressable
            key={id}
            style={[styles.typePill, cardType === id && styles.typePillActive]}
            onPress={() => setCardType(id)}
          >
            <Text
              style={[
                styles.typePillText,
                cardType === id && styles.typePillTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Card grid */}
      <ScrollView style={styles.grid} nestedScrollEnabled>
        {loading ? (
          <Text style={styles.statusMsg}>Loading...</Text>
        ) : fetchErr ? (
          <Text style={styles.statusMsg}>Card data unavailable. Try again.</Text>
        ) : notice ? (
          <Text style={styles.statusMsg}>{notice}</Text>
        ) : visible.length === 0 ? (
          <Text style={styles.statusMsg}>No cards found</Text>
        ) : (
          <View style={styles.gridInner}>
            {visible.map((card) => (
              <Pressable
                key={card.id}
                style={styles.tile}
                onPress={() =>
                  onSelectCard({
                    localId: card.localId,
                    name: card.name,
                    img: card.img || PLACEHOLDER_IMG,
                    set: card.setId,
                    lang,
                  })
                }
                testID={`picker-card-${card.id}`}
              >
                {card.img ? (
                  <Image source={{ uri: card.img }} style={styles.tileImg} />
                ) : (
                  <Text style={styles.tileName} numberOfLines={3}>
                    {card.name || card.localId}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
        {truncated && (
          <Text style={styles.statusMsg}>
            {`Showing first ${MAX_RESULTS} of ${filtered.length} results — refine your search`}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: colors.yellowDark,
    backgroundColor: "#fffef7",
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  row: { flexDirection: "row", gap: 6, zIndex: 1 },
  langToggle: {
    flexDirection: "row",
    backgroundColor: colors.gray200,
    borderRadius: 6,
    padding: 2,
    gap: 2,
  },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  langBtnActive: { backgroundColor: colors.white },
  langText: { fontSize: 12, fontWeight: "700", color: colors.gray500 },
  langTextActive: { color: colors.black },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.black,
    backgroundColor: colors.white,
  },
  selectWrap: { flex: 1 },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  selectDisabled: { opacity: 0.5 },
  selectText: { fontSize: 12, color: colors.black, flexShrink: 1 },
  selectPlaceholder: { color: colors.gray500 },
  selectChevron: { fontSize: 8, color: colors.gray400, marginLeft: 4 },
  selectList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 6,
    backgroundColor: colors.white,
    marginTop: 2,
  },
  selectOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  selectOptionText: { fontSize: 12, color: colors.gray700 },
  selectOptionActive: { fontWeight: "800", color: colors.black },
  typePill: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.white,
  },
  typePillActive: {
    borderColor: colors.yellowDark,
    backgroundColor: colors.yellowLight,
  },
  typePillText: { fontSize: 12, fontWeight: "600", color: colors.gray600 },
  typePillTextActive: { color: colors.black },
  grid: { maxHeight: 240 },
  gridInner: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  statusMsg: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: "center",
    paddingVertical: 16,
  },
  tile: {
    width: 54,
    height: 75,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tileImg: { width: "100%", height: "100%" },
  tileName: { fontSize: 8, color: colors.gray600, textAlign: "center", padding: 2 },
});
