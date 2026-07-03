import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { API_URL } from "../../lib/api";
import { colors } from "../../lib/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    setError("");
    setBusy(true);
    // The reset link lands on the website's /reset-password page, where the
    // user picks a new password and can then log back in here.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmed,
      { redirectTo: `${API_URL}/reset-password` }
    );
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>
          Kanto <Text style={styles.logoAccent}>Keepsakes</Text>
        </Text>
        <Text style={styles.subtitle}>
          Enter your email and we&apos;ll send you a password reset link
        </Text>

        {sent ? (
          <Text style={styles.success} testID="forgot-sent">
            If an account exists for {email.trim()}, a reset link is on its
            way. Check your inbox (and spam folder), then log in with your new
            password.
          </Text>
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              testID="forgot-email"
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleSend}
              disabled={busy}
              testID="forgot-submit"
            >
              <Text style={styles.primaryBtnText}>
                {busy ? "Sending..." : "Send reset link"}
              </Text>
            </Pressable>
          </>
        )}

        <Link href="/(auth)/login" style={styles.link}>
          Back to login
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.black,
    textAlign: "center",
  },
  logoAccent: { color: colors.yellowDark },
  subtitle: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  success: {
    fontSize: 14,
    color: colors.gray700,
    textAlign: "center",
    lineHeight: 20,
  },
  error: {
    color: colors.red,
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  primaryBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  pressed: { opacity: 0.8 },
  primaryBtnText: { fontWeight: "700", fontSize: 15, color: colors.black },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: colors.gray600,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
