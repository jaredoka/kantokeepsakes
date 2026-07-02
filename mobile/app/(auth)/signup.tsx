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
import { Link, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/api";
import { colors } from "../../lib/theme";

const MOBILE_CLIENT_KEY = process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY || "";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://kantokeepsakes.com";

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignup() {
    setError("");
    setBusy(true);
    try {
      // Signup goes through the website API (rate limiting, username
      // uniqueness, profile creation); the mobile client key replaces
      // Turnstile (B2)
      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mobile-client": MOBILE_CLIENT_KEY,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          username: username.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed.");
        return;
      }
      // Sign in with the new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Account created — please log in.");
        router.replace("/(auth)/login");
        return;
      }
      router.replace("/(tabs)");
    } catch {
      setError("Something went wrong. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Create your account</Text>
        <Text style={styles.subtitle}>
          Post your haves and wants, and start trading
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Username (3-20 characters)"
          placeholderTextColor={colors.gray400}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.gray400}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (6+ characters)"
          placeholderTextColor={colors.gray400}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={handleSignup}
          disabled={busy}
        >
          <Text style={styles.primaryBtnText}>
            {busy ? "Creating account..." : "Sign up"}
          </Text>
        </Pressable>

        <Link href="/(auth)/login" style={styles.link}>
          Already have an account? Log in
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
    fontSize: 22,
    fontWeight: "800",
    color: colors.black,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
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
