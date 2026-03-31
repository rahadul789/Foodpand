import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { type ReactNode, useMemo, useState } from "react";
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

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const signUp = useAuthStore((state) => state.signUp);
  const showToast = useUIStore((state) => state.showToast);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSubmit = useMemo(
    () =>
      name.trim().length >= 2 &&
      email.trim().length > 0 &&
      phone.trim().length >= 11 &&
      password.trim().length >= 6 &&
      confirmPassword.trim().length >= 6,
    [confirmPassword, email, name, password, phone],
  );
  const redirectTarget = resolveAuthRedirectTarget(params.redirectTo);

  const handleSignup = () => {
    if (!canSubmit) {
      showToast("সব field ঠিকমতো fill up করো।");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      showToast("Password match করছে না।");
      return;
    }

    const result = signUp({ name, email, phone, password });
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
          <View style={styles.topRow}>
            <Link
              href={{
                pathname: "/login",
                params: params.redirectTo ? { redirectTo: params.redirectTo } : {},
              }}
              asChild
            >
              <Pressable style={styles.backButton}>
                <Ionicons name="chevron-back" size={20} color="#20263A" />
              </Pressable>
            </Link>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBubbleOne} />
            <View style={styles.heroBubbleTwo} />
            <Text style={styles.heroEyebrow}>New account</Text>
            <Text style={styles.heroTitle}>Let’s get you started</Text>
            <Text style={styles.heroText}>
              Ekta quick signup, তারপর nearby restaurants, deals, আর cart সব ready.
            </Text>
          </View>

          <View style={styles.formCard}>
            <FieldLabel label="Full name" />
            <InputShell icon="person-outline">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </InputShell>

            <FieldLabel label="Email" />
            <InputShell icon="mail-outline">
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="your@email.com"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </InputShell>

            <FieldLabel label="Phone" />
            <InputShell icon="call-outline">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="01XXXXXXXXX"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </InputShell>

            <FieldLabel label="Password" />
            <InputShell icon="lock-closed-outline">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Minimum 6 characters"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </InputShell>

            <FieldLabel label="Confirm password" />
            <InputShell icon="shield-checkmark-outline">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Type password again"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </InputShell>

            <Pressable
              style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
              onPress={handleSignup}
            >
              <Text style={styles.primaryButtonText}>Create account</Text>
              <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function InputShell({
  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color="#8D8178" />
      {children}
    </View>
  );
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
  topRow: {
    marginTop: 4,
    flexDirection: "row",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  heroCard: {
    borderRadius: 34,
    padding: 22,
    overflow: "hidden",
    backgroundColor: "#E8EDFF",
  },
  heroBubbleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#5C7CFA",
    opacity: 0.18,
    top: -58,
    right: -36,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#7BDFF2",
    opacity: 0.28,
    bottom: -34,
    left: -24,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5C7CFA",
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
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
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
    backgroundColor: "#5C7CFA",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
