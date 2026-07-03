import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Redirect,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../context/session";
import { formatMessageTime } from "../../lib/format";
import { colors } from "../../lib/theme";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface ConvoMeta {
  id: string;
  listing_id: string;
  participant_1: string;
  participant_2: string;
  listings: { id: string; title: string; type: string } | null;
  p1: { username: string } | null;
  p2: { username: string } | null;
}

function prependUnique(prev: Message[] | null, msg: Message): Message[] {
  if (!prev) return [msg];
  if (prev.some((m) => m.id === msg.id)) return prev;
  return [msg, ...prev];
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id ?? null;

  const [meta, setMeta] = useState<ConvoMeta | null>(null);
  // Newest-first (API order) — rendered by an inverted FlatList
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Load conversation meta + messages (GET also marks them read server-side)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const [{ data: conv }, msgsRes] = await Promise.all([
        supabase
          .from("conversations")
          .select(
            "id, listing_id, participant_1, participant_2, listings(id, title, type), p1:profiles!conversations_participant_1_fkey(username), p2:profiles!conversations_participant_2_fkey(username)"
          )
          .eq("id", conversationId)
          .single(),
        apiFetch<Message[]>(
          `/api/conversations/${conversationId}/messages?limit=50`
        ),
      ]);
      if (cancelled) return;

      const row = conv as unknown as ConvoMeta | null;
      if (!row) {
        setLoadError("Conversation not found.");
        return;
      }
      if (row.participant_1 !== userId && row.participant_2 !== userId) {
        setLoadError("You don't have access to this conversation.");
        return;
      }
      setMeta(row);
      setMessages(msgsRes.ok && msgsRes.data ? msgsRes.data : []);
      if (!msgsRes.ok) setLoadError(msgsRes.error || "Failed to load messages.");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, userId]);

  // Realtime: new messages in this conversation
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => prependUnique(prev, newMsg));
          // Mark the other party's message read (same as the website chat)
          if (newMsg.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe((status) => {
        // A message inserted after the initial GET but before the channel
        // went live would otherwise be lost until the screen reopens —
        // refetch once the subscription is actually delivering.
        if (status !== "SUBSCRIBED") return;
        apiFetch<Message[]>(
          `/api/conversations/${conversationId}/messages?limit=50`
        ).then((res) => {
          if (!res.ok || !res.data) return;
          const fresh = res.data;
          const freshIds = new Set(fresh.map((m) => m.id));
          setMessages((prev) =>
            prev ? [...fresh, ...prev.filter((m) => !freshIds.has(m.id))] : fresh
          );
        });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  // Ref guard: a fast double-tap can fire onPress twice before the
  // `sending` state re-renders the disabled button.
  const sendingRef = useRef(false);
  const send = useCallback(async () => {
    const body = input.trim();
    if (!body || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError("");
    const res = await apiFetch<Message>(
      `/api/conversations/${conversationId}/messages`,
      { method: "POST", body: { body } }
    );
    if (res.ok && res.data) {
      const msg = res.data;
      setMessages((prev) => prependUnique(prev, msg));
      setInput("");
    } else {
      setSendError(res.error || "Failed to send message.");
    }
    sendingRef.current = false;
    setSending(false);
  }, [conversationId, input]);

  const openListing = useCallback(() => {
    if (!meta) return;
    router.push({ pathname: "/listing/[id]", params: { id: meta.listing_id } });
  }, [meta, router]);

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  if (loadError && !meta) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Chat" }} />
        <Text style={styles.status}>{loadError}</Text>
      </View>
    );
  }
  if (!meta || messages === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Chat" }} />
        <Text style={styles.status}>Loading...</Text>
      </View>
    );
  }

  const otherUsername =
    (meta.participant_1 === userId ? meta.p2?.username : meta.p1?.username) ||
    "Chat";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <Stack.Screen options={{ title: otherUsername }} />

      {meta.listings && (
        <Pressable style={styles.listingBar} onPress={openListing}>
          <Text style={styles.listingBarText} numberOfLines={1}>
            Re: {meta.listings.title}
          </Text>
        </Pressable>
      )}

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        // Inverted keeps the newest message pinned to the bottom; skip it
        // when empty so the empty state isn't rendered upside down.
        inverted={messages.length > 0}
        ListEmptyComponent={
          <Text style={styles.status}>
            {loadError
              ? "Couldn't load messages."
              : "No messages yet. Start the conversation!"}
          </Text>
        }
        renderItem={({ item }) => {
          const isMine = item.sender_id === userId;
          return (
            <View
              style={[
                styles.bubble,
                isMine ? styles.bubbleMine : styles.bubbleTheirs,
              ]}
            >
              <Text style={isMine ? styles.bubbleTextMine : styles.bubbleText}>
                {item.body}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  isMine ? styles.bubbleTimeMine : null,
                ]}
              >
                {formatMessageTime(item.created_at)}
              </Text>
            </View>
          );
        }}
      />

      {!!(sendError || loadError) && (
        <Text style={styles.error}>{sendError || loadError}</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.gray400}
          multiline
          maxLength={2000}
          testID="chat-input"
        />
        <Pressable
          style={[
            styles.sendBtn,
            (sending || !input.trim()) && styles.sendBtnDisabled,
          ]}
          onPress={send}
          disabled={sending || !input.trim()}
          testID="chat-send"
        >
          <Text style={styles.sendBtnText}>{sending ? "..." : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  listingBar: {
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listingBarText: { fontSize: 12, fontWeight: "600", color: colors.gray600 },
  list: { flex: 1 },
  listContent: { padding: 12, gap: 8 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.black,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: colors.black, lineHeight: 19 },
  bubbleTextMine: { fontSize: 14, color: colors.white, lineHeight: 19 },
  bubbleTime: { fontSize: 10, color: colors.gray500, marginTop: 2 },
  bubbleTimeMine: { color: colors.gray400 },
  error: {
    color: colors.red,
    fontSize: 12,
    textAlign: "center",
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.black,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontWeight: "800", fontSize: 13, color: colors.black },
});
