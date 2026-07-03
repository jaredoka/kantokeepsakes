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
import { apiFetch } from "../lib/api";
import { useSession } from "../context/session";
import ListingCard, { type ListingRow } from "../components/ListingCard";
import { colors } from "../lib/theme";

interface MyListingRow extends ListingRow {
  status: "active" | "sold" | "expired" | "removed";
  expires_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#dcfce7",
  sold: colors.yellowLight,
  expired: colors.gray200,
};

export default function MyListingsScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id ?? null;

  const [listings, setListings] = useState<MyListingRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(
    null
  );

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("listings")
      .select(
        "id, type, title, images, looking_for_images, country, price, wants_cash, wants_singles, wants_graded, wants_sealed, wants_offers, status, expires_at, profiles!listings_user_id_fkey(username, completed_trades)"
      )
      .eq("user_id", userId)
      .neq("status", "removed")
      .order("created_at", { ascending: false });
    setListings((data as unknown as MyListingRow[]) || []);
  }, [userId]);

  // Refetch on focus — edits and status changes happen on other screens
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function act(
    id: string,
    action: "bump" | "relist" | "delete"
  ): Promise<void> {
    setBusyId(id);
    setRowError(null);
    const res =
      action === "delete"
        ? await apiFetch(`/api/listings/${id}`, { method: "DELETE" })
        : await apiFetch(`/api/listings/${id}/${action}`, { method: "POST" });
    if (res.ok) {
      setConfirmDeleteId(null);
      await load();
    } else {
      setRowError({ id, msg: res.error || `Failed to ${action} listing.` });
    }
    setBusyId(null);
  }

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      {listings === null ? (
        <Text style={styles.status}>Loading...</Text>
      ) : listings.length === 0 ? (
        <Text style={styles.status}>You don&apos;t have any listings yet.</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const busy = busyId === item.id;
            return (
              <View style={styles.item}>
                <ListingCard
                  listing={item}
                  onPress={() =>
                    router.push({
                      pathname: "/listing/[id]",
                      params: { id: item.id },
                    })
                  }
                />
                <View style={styles.actionBar}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          STATUS_COLORS[item.status] || colors.gray200,
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>

                  {confirmDeleteId === item.id ? (
                    <>
                      <Text style={styles.confirmText}>Delete?</Text>
                      <Pressable
                        style={[styles.dangerBtn, busy && styles.btnDisabled]}
                        onPress={() => act(item.id, "delete")}
                        disabled={busy}
                        testID={`confirm-delete-${item.id}`}
                      >
                        <Text style={styles.dangerBtnSolidText}>
                          {busy ? "..." : "Yes, delete"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => setConfirmDeleteId(null)}
                        disabled={busy}
                      >
                        <Text style={styles.actionBtnText}>Cancel</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      {item.status === "active" && (
                        <Pressable
                          style={[styles.actionBtn, busy && styles.btnDisabled]}
                          onPress={() => act(item.id, "bump")}
                          disabled={busy}
                          testID={`bump-${item.id}`}
                        >
                          <Text style={styles.actionBtnText}>
                            {busy ? "..." : "Bump"}
                          </Text>
                        </Pressable>
                      )}
                      {item.status === "expired" && (
                        <Pressable
                          style={[styles.actionBtn, busy && styles.btnDisabled]}
                          onPress={() => act(item.id, "relist")}
                          disabled={busy}
                          testID={`relist-${item.id}`}
                        >
                          <Text style={styles.actionBtnText}>
                            {busy ? "..." : "Relist"}
                          </Text>
                        </Pressable>
                      )}
                      {item.status !== "sold" && (
                        <Pressable
                          style={styles.actionBtn}
                          onPress={() =>
                            router.push({
                              pathname: "/listing/edit/[id]",
                              params: { id: item.id },
                            })
                          }
                          testID={`edit-${item.id}`}
                        >
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => {
                          setConfirmDeleteId(item.id);
                          setRowError(null);
                        }}
                        testID={`delete-${item.id}`}
                      >
                        <Text style={styles.dangerBtnText}>Delete</Text>
                      </Pressable>
                    </>
                  )}
                </View>
                {rowError && rowError.id === item.id && (
                  <Text style={styles.error}>{rowError.msg}</Text>
                )}
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
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  list: { padding: 12, paddingBottom: 24 },
  item: { marginBottom: 4 },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -6,
    marginBottom: 10,
    paddingHorizontal: 2,
    flexWrap: "wrap",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: "auto",
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: colors.gray700 },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  dangerBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.red,
  },
  dangerBtnText: { fontSize: 12, fontWeight: "700", color: colors.red },
  dangerBtnSolidText: { fontSize: 12, fontWeight: "700", color: colors.white },
  confirmText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  btnDisabled: { opacity: 0.5 },
  error: {
    color: colors.red,
    fontSize: 12,
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
});
