import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { useSession } from "../context/session";
import { colors } from "../lib/theme";

interface ProfileRow {
  username: string;
  bio: string | null;
  notify_offers: boolean | null;
  notify_messages: boolean | null;
  notify_trades: boolean | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  const [loaded, setLoaded] = useState<ProfileRow | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [notifyOffers, setNotifyOffers] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyTrades, setNotifyTrades] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("username, bio, notify_offers, notify_messages, notify_trades")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const row = data as ProfileRow;
        setLoaded(row);
        setUsername(row.username);
        setBio(row.bio || "");
        setNotifyOffers(row.notify_offers ?? true);
        setNotifyMessages(row.notify_messages ?? true);
        setNotifyTrades(row.notify_trades ?? true);
      });
  }, [session]);

  async function save() {
    if (!loaded) return;
    setBusy(true);
    setError("");
    setSuccess(false);
    const res = await apiFetch<{ username: string }>("/api/profile", {
      method: "PATCH",
      body: {
        username: username.trim(),
        bio: bio.trim(),
        // Only send prefs that changed (keeps saves working until
        // migration 00018 adds the notify_* columns)
        ...(notifyOffers !== (loaded.notify_offers ?? true) && {
          notifyOffers,
        }),
        ...(notifyMessages !== (loaded.notify_messages ?? true) && {
          notifyMessages,
        }),
        ...(notifyTrades !== (loaded.notify_trades ?? true) && {
          notifyTrades,
        }),
      },
    });
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.back(), 600);
    } else {
      setError(res.error || "Failed to update profile.");
    }
    setBusy(false);
  }

  if (!sessionLoading && !session) return <Redirect href="/(auth)/login" />;

  if (!loaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        maxLength={20}
        testID="edit-username"
      />
      <Text style={styles.hint}>
        3–20 characters. Letters, numbers, hyphens, and underscores.
      </Text>

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell traders about yourself..."
        placeholderTextColor={colors.gray400}
        multiline
        maxLength={500}
        testID="edit-bio"
      />
      <Text style={styles.hint}>{bio.length}/500</Text>

      <Text style={styles.sectionTitle}>Email notifications</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Offers and counteroffers</Text>
        <Switch
          value={notifyOffers}
          onValueChange={setNotifyOffers}
          trackColor={{ true: colors.yellow }}
          testID="pref-offers"
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>New messages</Text>
        <Switch
          value={notifyMessages}
          onValueChange={setNotifyMessages}
          trackColor={{ true: colors.yellow }}
          testID="pref-messages"
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Trade updates and ratings</Text>
        <Switch
          value={notifyTrades}
          onValueChange={setNotifyTrades}
          trackColor={{ true: colors.yellow }}
          testID="pref-trades"
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Profile updated!</Text>}

      <Pressable
        style={[styles.saveBtn, busy && styles.btnDisabled]}
        onPress={save}
        disabled={busy}
        testID="edit-profile-save"
      >
        <Text style={styles.saveBtnText}>{busy ? "Saving..." : "Save"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 16, paddingBottom: 48 },
  status: { textAlign: "center", marginTop: 40, color: colors.gray500 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.black,
  },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  hint: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.black,
    marginTop: 24,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  switchLabel: { fontSize: 14, color: colors.gray700, flex: 1 },
  error: { color: colors.red, fontSize: 13, marginTop: 16 },
  success: { color: colors.green, fontSize: 13, marginTop: 16 },
  saveBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnText: { fontWeight: "800", fontSize: 14, color: colors.black },
  btnDisabled: { opacity: 0.6 },
});
