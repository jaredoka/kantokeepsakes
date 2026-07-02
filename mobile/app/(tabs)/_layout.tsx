import { Link, Redirect, Tabs } from "expo-router";
import { Pressable, Text, type ColorValue } from "react-native";
import { useSession } from "../../context/session";
import { colors } from "../../lib/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

function PostButton() {
  return (
    <Link href="/listing/new" asChild>
      <Pressable
        style={{
          backgroundColor: colors.yellow,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginRight: 12,
        }}
        testID="post-listing"
      >
        <Text style={{ fontWeight: "800", fontSize: 13, color: colors.black }}>
          + Post
        </Text>
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  const { session, loading } = useSession();
  if (!loading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: colors.yellowDark,
        tabBarInactiveTintColor: colors.gray400,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Browse",
          tabBarIcon: ({ color }) => <TabIcon glyph="🗂" color={color} />,
          headerRight: () => <PostButton />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color }) => <TabIcon glyph="⇄" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <TabIcon glyph="✉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon glyph="●" color={color} />,
        }}
      />
    </Tabs>
  );
}
