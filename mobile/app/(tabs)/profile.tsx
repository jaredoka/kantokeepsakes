import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../context/session";
import { colors } from "../../lib/theme";

interface ProfileRow {
  username: string;
  completed_trades: number;
  reputation_score: number;
}

export default function ProfileScreen() {
  const { session } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("username, completed_trades, reputation_score")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(profile?.username || "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.username} testID="profile-username">
        {profile?.username || "..."}
      </Text>
      <Text style={styles.meta}>
        {profile?.completed_trades ?? 0} trades ·{" "}
        {profile ? (profile.reputation_score / 10).toFixed(1) : "–"} rating
      </Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        onPress={() => supabase.auth.signOut()}
        testID="logout"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    paddingTop: 48,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 28 },
  username: { fontSize: 20, fontWeight: "800", marginTop: 12, color: colors.black },
  meta: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  email: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  logoutBtn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  logoutText: { fontWeight: "700", color: colors.gray700 },
});
