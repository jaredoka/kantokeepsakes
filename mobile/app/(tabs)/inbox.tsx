import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../context/session";
import { formatTimeAgo } from "../../lib/format";
import { colors } from "../../lib/theme";

interface ConversationItem {
  id: string;
  listing_id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  listings: { id: string; title: string; type: string } | null;
  participant1: { username: string } | null;
  participant2: { username: string } | null;
  lastMessage: { body: string; sender_id: string; created_at: string } | null;
  unreadCount: number;
}

export default function InboxScreen() {
  const { session } = useSession();
  const router = useRouter();
  const [convos, setConvos] = useState<ConversationItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<ConversationItem[]>("/api/conversations");
    setConvos(res.ok && res.data ? res.data : []);
  }, []);

  // Reload whenever the tab regains focus — read/unread state changes
  // while the user is inside a chat screen.
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

  return (
    <View style={styles.container}>
      {convos === null ? (
        <Text style={styles.status}>Loading...</Text>
      ) : convos.length === 0 ? (
        <Text style={styles.status}>No conversations yet.</Text>
      ) : (
        <FlatList
          data={convos}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const other =
              item.participant_1 === session?.user.id
                ? item.participant2
                : item.participant1;
            const unread = item.unreadCount > 0;
            return (
              <Pressable
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[id]",
                    params: { id: item.id },
                  })
                }
                testID={`convo-${item.id}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(other?.username || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.topLine}>
                    <Text
                      style={[styles.name, unread && styles.nameUnread]}
                      numberOfLines={1}
                    >
                      {other?.username || "Unknown"}
                    </Text>
                    {!!item.lastMessage && (
                      <Text style={styles.time}>
                        {formatTimeAgo(item.lastMessage.created_at)}
                      </Text>
                    )}
                    {unread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!item.listings && (
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      Re: {item.listings.title}
                    </Text>
                  )}
                  <Text
                    style={[styles.preview, unread && styles.previewUnread]}
                    numberOfLines={1}
                  >
                    {item.lastMessage ? item.lastMessage.body : "No messages yet"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800" },
  body: { flex: 1, gap: 1 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: {
    fontWeight: "700",
    fontSize: 14,
    color: colors.black,
    flexShrink: 1,
    flexGrow: 1,
  },
  nameUnread: { fontWeight: "800" },
  time: { fontSize: 11, color: colors.gray500 },
  unreadBadge: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: { fontSize: 10, fontWeight: "800", color: colors.black },
  listingTitle: { fontSize: 11, color: colors.gray500 },
  preview: { fontSize: 13, color: colors.gray500 },
  previewUnread: { color: colors.black, fontWeight: "600" },
});
