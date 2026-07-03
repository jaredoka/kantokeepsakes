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
        <Stack.Screen
          name="listing/new"
          options={{
            headerShown: true,
            title: "New Listing",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            title: "Chat",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="listing/edit/[id]"
          options={{
            headerShown: true,
            title: "Edit Listing",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="my-listings"
          options={{
            headerShown: true,
            title: "My Listings",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="blocked-users"
          options={{
            headerShown: true,
            title: "Blocked Users",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="saved"
          options={{
            headerShown: true,
            title: "Saved Listings",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            title: "Edit Profile",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
        <Stack.Screen
          name="user/[username]"
          options={{
            headerShown: true,
            title: "Trader Profile",
            headerTitleStyle: { fontWeight: "800" },
          }}
        />
      </Stack>
    </SessionProvider>
  );
}
