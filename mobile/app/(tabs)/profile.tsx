import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../context/session";
import { unregisterPushToken } from "../../lib/push";
import { colors } from "../../lib/theme";

interface ProfileRow {
  username: string;
  completed_trades: number;
  reputation_score: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);

  // Refetch on focus so username edits (Edit Profile screen) show up
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      supabase
        .from("profiles")
        .select("username, completed_trades, reputation_score")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }, [session])
  );

  async function logout() {
    setBusy(true);
    await unregisterPushToken();
    await supabase.auth.signOut();
    setBusy(false);
  }

  async function deleteAccount() {
    setBusy(true);
    setDeleteError("");
    const res = await apiFetch("/api/account", {
      method: "DELETE",
      body: { confirm: "DELETE" },
    });
    if (res.ok) {
      // The auth user is gone; drop the local session too
      await unregisterPushToken();
      await supabase.auth.signOut();
    } else {
      setDeleteError(res.error || "Failed to delete account.");
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username} testID="profile-username">
          {profile?.username || "..."}
        </Text>
        <Text style={styles.meta}>
          {profile?.completed_trades ?? 0} trades
          {/* reputation_score is stored x10 (see SellerCard.tsx) */}
          {(profile?.reputation_score ?? 0) > 0 &&
            ` · ★ ${((profile?.reputation_score ?? 0) / 10).toFixed(1)}`}
        </Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <View style={styles.menu}>
        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/my-listings")}
          testID="menu-my-listings"
        >
          <Text style={styles.menuRowText}>My Listings</Text>
          <Text style={styles.menuRowChevron}>›</Text>
        </Pressable>
        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/saved")}
          testID="menu-saved"
        >
          <Text style={styles.menuRowText}>Saved Listings</Text>
          <Text style={styles.menuRowChevron}>›</Text>
        </Pressable>
        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/edit-profile")}
          testID="menu-edit-profile"
        >
          <Text style={styles.menuRowText}>Edit Profile</Text>
          <Text style={styles.menuRowChevron}>›</Text>
        </Pressable>
        <Pressable
          style={styles.menuRow}
          onPress={() => {
            // Plain guard, not `!.` (React Compiler hazard)
            if (!profile) return;
            router.push({
              pathname: "/user/[username]",
              params: { username: profile.username },
            });
          }}
          testID="menu-public-profile"
        >
          <Text style={styles.menuRowText}>View Public Profile</Text>
          <Text style={styles.menuRowChevron}>›</Text>
        </Pressable>
        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/blocked-users")}
          testID="menu-blocked-users"
        >
          <Text style={styles.menuRowText}>Blocked Users</Text>
          <Text style={styles.menuRowChevron}>›</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        onPress={logout}
        disabled={busy}
        testID="logout"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger zone</Text>
        {deleteOpen ? (
          <>
            <Text style={styles.dangerText}>
              This permanently deletes your account, listings, offers, and
              messages. It cannot be undone. Type DELETE to confirm.
            </Text>
            <TextInput
              style={styles.dangerInput}
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder="Type DELETE"
              placeholderTextColor={colors.gray400}
              autoCapitalize="characters"
              testID="delete-confirm-input"
            />
            {!!deleteError && <Text style={styles.dangerError}>{deleteError}</Text>}
            <View style={styles.dangerRow}>
              <Pressable
                style={[
                  styles.dangerBtn,
                  (busy || deleteConfirm !== "DELETE") && styles.btnDisabled,
                ]}
                onPress={deleteAccount}
                disabled={busy || deleteConfirm !== "DELETE"}
                testID="delete-account-submit"
              >
                <Text style={styles.dangerBtnText}>
                  {busy ? "Deleting..." : "Delete my account"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setDeleteOpen(false);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                disabled={busy}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            onPress={() => setDeleteOpen(true)}
            testID="delete-account-open"
          >
            <Text style={styles.dangerLink}>Delete account...</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: 48 },
  headerBlock: { alignItems: "center", paddingTop: 40, paddingBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 28 },
  username: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
    color: colors.black,
  },
  meta: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  email: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  menu: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginHorizontal: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  menuRowText: { fontSize: 15, fontWeight: "600", color: colors.black },
  menuRowChevron: { fontSize: 18, color: colors.gray400 },
  logoutBtn: {
    marginTop: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutText: { fontWeight: "700", color: colors.gray700 },
  dangerZone: {
    marginTop: 40,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fef2f2",
  },
  dangerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.red,
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dangerLink: { fontSize: 13, fontWeight: "600", color: colors.red },
  dangerText: { fontSize: 13, color: colors.gray700, lineHeight: 18 },
  dangerInput: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.black,
    backgroundColor: colors.white,
    marginTop: 10,
  },
  dangerError: { fontSize: 12, color: colors.red, marginTop: 8 },
  dangerRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  dangerBtn: {
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    flexGrow: 1,
  },
  dangerBtnText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  cancelBtnText: { fontWeight: "700", fontSize: 13, color: colors.gray700 },
  btnDisabled: { opacity: 0.5 },
});
