import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

const tabs = {
  home: { icon: "home", label: "Home", active: "#FF7A59", soft: "#FFE3D8" },
  discover: {
    icon: "search",
    label: "Discover",
    active: "#5C7CFA",
    soft: "#E8EDFF",
  },
  favorites: {
    icon: "heart",
    label: "Favorites",
    active: "#FF5D8F",
    soft: "#FFE0EA",
  },
  cart: {
    icon: "bag-handle",
    label: "Cart",
    active: "#FFB100",
    soft: "#FFF1CC",
  },
  orders: {
    icon: "receipt",
    label: "Orders",
    active: "#2FBF71",
    soft: "#DFF7E9",
  },
  profile: {
    icon: "person",
    label: "Profile",
    active: "#FF5D8F",
    soft: "#FFE0EA",
  },
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const config = tabs[route.name as keyof typeof tabs];

        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: focused ? config.soft : "#F6F0EB" },
                ]}
              >
                <Ionicons
                  name={
                    focused
                      ? (config.icon as keyof typeof Ionicons.glyphMap)
                      : (`${config.icon}-outline` as keyof typeof Ionicons.glyphMap)
                  }
                  size={20}
                  color={focused ? config.active : "#9C9187"}
                />
              </View>
            </View>
          ),
        };
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="discover" options={{ title: "Discover" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    height: 74,
    paddingTop: 17,
    paddingBottom: 8,
    borderTopWidth: 0,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#B79D8C",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
