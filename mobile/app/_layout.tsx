import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../context/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="listing/[id]"
          options={{
            headerShown: true,
            title: "Listing",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
      </Stack>
    </SessionProvider>
  );
}
