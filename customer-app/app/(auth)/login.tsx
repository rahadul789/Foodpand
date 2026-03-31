import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resolveAuthRedirectTarget } from "@/lib/auth-redirect";
import { useAuthStore } from "@/lib/auth-store";
import { useUIStore } from "@/lib/ui-store";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const signIn = useAuthStore((state) => state.signIn);
  const showToast = useUIStore((state) => state.showToast);

  const [email, setEmail] = useState("ava.rahman@example.com");
  const [password, setPassword] = useState("123456");
  const [secureText, setSecureText] = useState(true);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length >= 6,
    [email, password],
  );
  const redirectTarget = resolveAuthRedirectTarget(params.redirectTo);

  const handleLogin = () => {
    if (!canSubmit) {
      showToast("Email আর password দাও।");
      return;
    }

    const result = signIn({ email, password });
    showToast(result.message);

    if (result.ok) {
      router.replace(redirectTarget);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroBubbleOne} />
            <View style={styles.heroBubbleTwo} />
            <Text style={styles.heroEyebrow}>Foodbela</Text>
            <Text style={styles.heroTitle}>Welcome back</Text>
            <Text style={styles.heroText}>
              Login koro, nearby restaurants, offers, আর live cart একদম ready.
            </Text>

            <View style={styles.demoCard}>
              <Text style={styles.demoLabel}>Demo account</Text>
              <Text style={styles.demoValue}>ava.rahman@example.com</Text>
              <Text style={styles.demoValue}>123456</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <FieldLabel label="Email" />
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#8D8178" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="your@email.com"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </View>

            <FieldLabel label="Password" />
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#8D8178" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
              <Pressable onPress={() => setSecureText((current) => !current)}>
                <Ionicons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#8D8178"
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
              onPress={handleLogin}
            >
              <Text style={styles.primaryButtonText}>Login</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>

            <Link
              href={{
                pathname: "/signup",
                params: params.redirectTo ? { redirectTo: params.redirectTo } : {},
              }}
              asChild
            >
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Create new account</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 18,
  },
  heroCard: {
    marginTop: 4,
    borderRadius: 34,
    padding: 22,
    overflow: "hidden",
    backgroundColor: "#FFE8F0",
  },
  heroBubbleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF5D8F",
    opacity: 0.18,
    top: -54,
    right: -34,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFD166",
    opacity: 0.28,
    bottom: -38,
    left: -28,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF5D8F",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "900",
    color: "#20263A",
  },
  heroText: {
    marginTop: 8,
    maxWidth: 270,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  demoCard: {
    marginTop: 18,
    alignSelf: "flex-start",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.82)",
    gap: 4,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8D8178",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  demoValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#20263A",
  },
  formCard: {
    borderRadius: 30,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 10,
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fieldLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#6F6A77",
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFF7F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#20263A",
  },
  primaryButton: {
    marginTop: 10,
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF5D8F",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0EB",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#24314A",
  },
});
