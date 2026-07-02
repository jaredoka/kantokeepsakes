import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../context/session";
import { colors } from "../../lib/theme";

interface ConvoRow {
  id: string;
  last_message_at: string;
  participant_1: string;
  participant_2: string;
  p1: { username: string } | null;
  p2: { username: string } | null;
}

export default function InboxScreen() {
  const { session } = useSession();
  const [convos, setConvos] = useState<ConvoRow[] | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("conversations")
      .select(
        "id, last_message_at, participant_1, participant_2, p1:profiles!conversations_participant_1_fkey(username), p2:profiles!conversations_participant_2_fkey(username)"
      )
      .or(`participant_1.eq.${session.user.id},participant_2.eq.${session.user.id}`)
      .order("last_message_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setConvos((data as unknown as ConvoRow[]) || []));
  }, [session]);

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
          renderItem={({ item }) => {
            const other =
              item.participant_1 === session?.user.id ? item.p2 : item.p1;
            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(other?.username || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.name}>{other?.username || "Unknown"}</Text>
              </View>
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
  name: { fontWeight: "700", fontSize: 14, color: colors.black },
});
