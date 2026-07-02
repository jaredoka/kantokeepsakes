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
import { colors } from "../../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setError("");
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/(tabs)");
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
          Trade Pok&eacute;mon cards with hobbyists around the world
        </Text>

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
          testID="login-email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.gray400}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          testID="login-password"
        />

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={handleLogin}
          disabled={busy}
          testID="login-submit"
        >
          <Text style={styles.primaryBtnText}>
            {busy ? "Logging in..." : "Log in"}
          </Text>
        </Pressable>

        <Link href="/(auth)/signup" style={styles.link}>
          New here? Create an account
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
