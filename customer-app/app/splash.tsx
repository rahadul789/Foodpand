import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SplashScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const timer = setTimeout(() => {
      router.replace("/allow-location");
    }, 1800);

    return () => clearTimeout(timer);
  }, [pulse, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <View style={styles.wrap}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />

        <Animated.View
          style={[
            styles.logoWrap,
            {
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.06],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="bag-handle" size={36} color="#FFFFFF" />
        </Animated.View>

        <Text style={styles.brand}>Foodbela</Text>
        <Text style={styles.tagline}>Fast cravings. Fresh mood.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  blobOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#FF5D8F",
    opacity: 0.12,
    top: 90,
    right: -60,
  },
  blobTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FFD166",
    opacity: 0.22,
    bottom: 120,
    left: -70,
  },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
    shadowColor: "#FF5D8F",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  brand: {
    marginTop: 22,
    fontSize: 34,
    fontWeight: "900",
    color: "#20263A",
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: "#7B6F69",
  },
});
