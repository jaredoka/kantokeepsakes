import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Redirect, useFocusEffect } from "expo-router";
import { apiFetch } from "../lib/api";
import { useSession } from "../context/session";
import { formatTimeAgo } from "../lib/format";
import { colors } from "../lib/theme";

interface BlockRow {
  blocked_id: string;
  created_at: string;
  profiles: { username: string } | null;
}

export default function BlockedUsersScreen() {
  const { session, loading: sessionLoading } = useSession();
  const [blocks, setBlocks] = useState<BlockRow[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<BlockRow[]>("/api/blocks");
    if (res.ok && res.data) {
      setBlocks(res.data);
      setLoadError("");
    } else {
      setLoadError(res.error || "Failed to load blocked users.");
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

  async function unblock(userId: string) {
    setBusyId(userId);
    const res = await apiFetch("/api/blocks", {
      method: "DELETE",
      body: { userId },
    });
    if (res.ok) {
      setBlocks((prev) =>
        prev ? prev.filter((b) => b.blocked_id !== userId) : prev
      );
    } else {
      setLoadError(res.error || "Failed to unblock user.");
    }
    setBusyId(null);
  }

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      {blocks === null ? (
        <Text style={styles.status}>{loadError || "Loading..."}</Text>
      ) : blocks.length === 0 ? (
        <Text style={styles.status}>You haven&apos;t blocked anyone.</Text>
      ) : (
        <>
          {!!loadError && <Text style={styles.error}>{loadError}</Text>}
          <FlatList
            data={blocks}
            keyExtractor={(item) => item.blocked_id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.name}>
                    {item.profiles?.username || "Unknown user"}
                  </Text>
                  <Text style={styles.time}>
                    Blocked {formatTimeAgo(item.created_at)}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.unblockBtn,
                    busyId === item.blocked_id && styles.btnDisabled,
                  ]}
                  onPress={() => unblock(item.blocked_id)}
                  disabled={busyId === item.blocked_id}
                  testID={`unblock-${item.blocked_id}`}
                >
                  <Text style={styles.unblockText}>
                    {busyId === item.blocked_id ? "..." : "Unblock"}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  error: {
    color: colors.red,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  rowBody: { flex: 1 },
  name: { fontWeight: "700", fontSize: 14, color: colors.black },
  time: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  unblockBtn: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unblockText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  btnDisabled: { opacity: 0.5 },
});
