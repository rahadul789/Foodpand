import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ChatMessage = {
  id: string;
  author: "admin" | "user";
  text: string;
  time: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "support-1",
    author: "admin",
    text: "Hi, this is Foodbela support. Tell us what happened and we will help you from here.",
    time: "Now",
  },
  {
    id: "support-2",
    author: "admin",
    text: "You can mention order delay, missing item, refund, address or any delivery issue.",
    time: "Now",
  },
];

const quickReplies = [
  "My order is late",
  "I got a wrong item",
  "Need refund help",
  "Change delivery address",
];

function formatChatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildAutoReply(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("late")) {
    return "We are checking the delivery timeline now. Please share the order ID if you have it, and we will guide you faster.";
  }

  if (lower.includes("wrong") || lower.includes("missing")) {
    return "Sorry about that. Please tell us which item is wrong or missing, and if possible keep a quick photo ready for verification.";
  }

  if (lower.includes("refund")) {
    return "We can help with refund status or eligibility. Let us know the order ID and what happened during the order.";
  }

  if (lower.includes("address") || lower.includes("location")) {
    return "If the order has not progressed too far, we may still help with address updates. Share the order ID and the new location details.";
  }

  return "Thanks for sharing. A support agent will review this and guide you with the next steps.";
}

export default function SupportChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView | null>(null);

  const title = useMemo(
    () => (params.mode === "call" ? "Support request" : "Chat with support"),
    [params.mode],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);

    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) {
      return;
    }

    const messageId = `${Date.now()}`;
    const replyId = `${Date.now()}-reply`;

    setMessages((current) => [
      ...current,
      {
        id: messageId,
        author: "user",
        text: cleanText,
        time: formatChatTime(),
      },
    ]);
    setDraft("");

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: replyId,
          author: "admin",
          text: buildAutoReply(cleanText),
          time: formatChatTime(),
        },
      ]);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#20263A" />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={styles.headerLabel}>{title}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Admin online</Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons
              name={params.mode === "call" ? "call-outline" : "chatbubble-outline"}
              size={18}
              color="#24314A"
            />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowPink} />
          <View style={styles.heroGlowBlue} />
          <Text style={styles.heroTitle}>Direct support chat</Text>
          <Text style={styles.heroText}>
            Share your issue here and the admin side can continue the
            conversation from the same thread later.
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickReplyRow}
          >
            {quickReplies.map((reply) => (
              <Pressable
                key={reply}
                style={styles.quickReplyChip}
                onPress={() => sendMessage(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {messages.map((message) => {
            const isUser = message.author === "user";

            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowAdmin,
                ]}
              >
                {!isUser ? (
                  <View style={styles.avatar}>
                    <Ionicons
                      name="headset-outline"
                      size={16}
                      color="#24314A"
                    />
                  </View>
                ) : null}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.messageBubbleUser : styles.messageBubbleAdmin,
                  ]}
                >
                  {!isUser ? (
                    <Text style={styles.adminName}>Foodbela Admin</Text>
                  ) : null}
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.messageTextUser : styles.messageTextAdmin,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isUser ? styles.messageTimeUser : styles.messageTimeAdmin,
                    ]}
                  >
                    {message.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputShell}>
          <View style={styles.inputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your message..."
              placeholderTextColor="#9B9087"
              style={styles.input}
              multiline
              maxLength={400}
            />
            <Pressable
              style={[
                styles.sendButton,
                draft.trim().length === 0 && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(draft)}
            >
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerMeta: {
    flex: 1,
    gap: 4,
  },
  headerLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#37C978",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7B6F69",
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  heroCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 28,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  heroGlowPink: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FF5D8F",
    opacity: 0.12,
    top: -60,
    right: -24,
  },
  heroGlowBlue: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#5C7CFA",
    opacity: 0.14,
    bottom: -18,
    left: -12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#20263A",
  },
  heroText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  chatContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
  },
  quickReplyRow: {
    gap: 10,
    paddingRight: 18,
  },
  quickReplyChip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowAdmin: {
    justifyContent: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  messageBubble: {
    maxWidth: "78%",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  messageBubbleAdmin: {
    borderBottomLeftRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  messageBubbleUser: {
    borderBottomRightRadius: 10,
    backgroundColor: "#FF5D8F",
  },
  adminName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#5C7CFA",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextAdmin: {
    color: "#20263A",
  },
  messageTextUser: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 11,
    fontWeight: "700",
  },
  messageTimeAdmin: {
    color: "#8A7E75",
  },
  messageTimeUser: {
    color: "rgba(255,255,255,0.86)",
  },
  inputShell: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 8,
    backgroundColor: "#FFF7F2",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderRadius: 24,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    fontSize: 15,
    lineHeight: 20,
    color: "#20263A",
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#20263A",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
