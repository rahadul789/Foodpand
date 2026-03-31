import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  Vibration,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { useAuthStore } from "@/lib/auth-store";
import { getCartCount, useCartStore } from "@/lib/cart-store";
import { useOrderStore } from "@/lib/order-store";
import {
  GUIDE_BUDDY_NAME,
  type GuideBuddyDockSide,
  type GuideBuddyEmotion,
  getGuideBuddyEventReaction,
  getGuideBuddyIntroductionTip,
  getGuideBuddyRouteTips,
  getGuideBuddyTrackingTip,
  normalizeGuideBuddyPath,
  shouldShowGuideBuddy,
  useGuideBuddyStore,
} from "@/lib/guide-buddy";

const FRAME_WIDTH = 220;
const FRAME_HEIGHT = 188;
const PET_SIZE = 58;
const DOCK_VISIBLE = Math.round(PET_SIZE * 0.12);
const DOCK_SIDE: GuideBuddyDockSide = "right";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSamePosition(
  left?: { x: number; y: number } | null,
  right?: { x: number; y: number } | null,
) {
  return Boolean(
    left &&
      right &&
      Math.abs(left.x - right.x) < 0.5 &&
      Math.abs(left.y - right.y) < 0.5,
  );
}

function getFirstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? "";
}

function getPalette(emotion: GuideBuddyEmotion) {
  switch (emotion) {
    case "happy":
      return { glow: "rgba(255,205,96,0.24)", accent: "#FFC857", face: "#FFF5C9" };
    case "love":
      return { glow: "rgba(255,128,173,0.24)", accent: "#FF6FA5", face: "#FFE0EE" };
    case "thinking":
      return { glow: "rgba(123,184,255,0.22)", accent: "#6AA8FF", face: "#DFF0FF" };
    case "angry":
      return { glow: "rgba(255,128,128,0.18)", accent: "#FF7E7E", face: "#FFE2E2" };
    case "sleepy":
      return { glow: "rgba(173,221,255,0.22)", accent: "#82C5F6", face: "#E7F6FF" };
    case "hello":
      return { glow: "rgba(178,148,255,0.2)", accent: "#A782FF", face: "#F3E9FF" };
    case "calm":
    default:
      return { glow: "rgba(255,182,193,0.18)", accent: "#FF9FB2", face: "#FFF0F5" };
  }
}

const DockedBuddyButton = memo(function DockedBuddyButton({
  palette,
  activeEvent,
  onPress,
}: {
  palette: ReturnType<typeof getPalette>;
  activeEvent: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.peekAvatarButton} onPress={onPress}>
      <View style={[styles.peekAvatarGlow, { backgroundColor: palette.glow }]} />
      <View style={styles.peekAvatarBody}>
        <View style={[styles.peekAvatarFace, { backgroundColor: palette.face }]}>
          <View style={styles.peekAvatarEyeRow}>
            <View style={styles.peekAvatarEye} />
            <View style={styles.peekAvatarEye} />
          </View>
          <View style={styles.peekAvatarMouth} />
        </View>
      </View>
      {activeEvent ? (
        <View style={[styles.peekAvatarBadge, { backgroundColor: palette.accent }]}>
          <Text style={styles.peekAvatarBadgeText}>!</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

export const GuideBuddyOverlay = memo(function GuideBuddyOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPath = useMemo(() => normalizeGuideBuddyPath(pathname), [pathname]);
  const firstName = getFirstName(useAuthStore((state) => state.user?.name));
  const cartCount = useCartStore((state) => getCartCount(state.items));
  const trackingOrder = useOrderStore(
    (state) => state.activeOrders[0] ?? state.previousOrders[0] ?? null,
  );
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const {
    enabled,
    introduced,
    savedPosition,
    docked,
    lastEvent,
    completeIntroduction,
    setPosition,
    setDocked,
  } = useGuideBuddyStore(
    useShallow((state) => ({
      enabled: state.enabled,
      introduced: state.introduced,
      savedPosition: state.position,
      docked: state.docked,
      lastEvent: state.lastEvent,
      completeIntroduction: state.completeIntroduction,
      setPosition: state.setPosition,
      setDocked: state.setDocked,
    })),
  );

  const [expanded, setExpanded] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const routeTips = useMemo(
    () => getGuideBuddyRouteTips(normalizedPath, { firstName }),
    [firstName, normalizedPath],
  );
  const introTip = useMemo(
    () => (!introduced ? getGuideBuddyIntroductionTip(firstName) : null),
    [firstName, introduced],
  );
  const eventTip = useMemo(
    () => getGuideBuddyEventReaction(lastEvent, firstName),
    [firstName, lastEvent],
  );
  const trackingTip = useMemo(
    () =>
      normalizedPath === "/tracking"
        ? getGuideBuddyTrackingTip(trackingOrder)
        : null,
    [normalizedPath, trackingOrder],
  );

  const shouldShow = enabled && shouldShowGuideBuddy(normalizedPath);
  const activeTip =
    introTip ??
    trackingTip ??
    (eventTip && activeEventId === eventTip.id
      ? eventTip
      : routeTips[tipIndex % routeTips.length]);
  const displayEmotion = dragging ? "angry" : activeTip?.emotion ?? "calm";
  const palette = getPalette(displayEmotion);
  const showPrimaryAction = Boolean(activeTip?.actionLabel) &&
    !(activeTip?.actionRoute === "/checkout" && cartCount === 0);

  const bounds = useMemo(
    () => ({
      minX: 10,
      maxX: Math.max(width - FRAME_WIDTH - 10, 10),
      minY: insets.top + 8,
      maxY: Math.max(height - FRAME_HEIGHT - insets.bottom - 8, insets.top + 8),
    }),
    [height, insets.bottom, insets.top, width],
  );
  const defaultPosition = useMemo(
    () => ({
      x: bounds.maxX,
      y: Math.max(bounds.maxY - 12, bounds.minY),
    }),
    [bounds.maxX, bounds.maxY, bounds.minY],
  );

  const position = useRef(new Animated.ValueXY(defaultPosition)).current;
  const dragOrigin = useRef(defaultPosition);
  const appliedPosition = useRef(defaultPosition);
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const bodyFloat = useRef(new Animated.Value(0)).current;
  const bodyScale = useRef(new Animated.Value(1)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const autoCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touchFeedback = useCallback(() => {
    Vibration.vibrate(8);
    void Haptics.selectionAsync();
    Animated.spring(bodyScale, {
      toValue: 1.08,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(bodyScale, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [bodyScale]);

  const getDockedX = useCallback(
    () => width - FRAME_WIDTH + PET_SIZE - DOCK_VISIBLE,
    [width],
  );

  const dockBuddy = useCallback(() => {
    const next = {
      x: getDockedX(),
      y: clamp(dragOrigin.current.y, bounds.minY, bounds.maxY),
    };
    setDocked(true, DOCK_SIDE);
    setExpanded(false);
    dragOrigin.current = next;
    appliedPosition.current = next;
    setPosition(next);
    Animated.spring(position, {
      toValue: next,
      friction: 8,
      tension: 120,
      useNativeDriver: false,
    }).start();
  }, [bounds.maxY, bounds.minY, getDockedX, position, setDocked, setPosition]);

  const undockBuddy = useCallback(() => {
    const next = {
      x: bounds.maxX,
      y: clamp(dragOrigin.current.y, bounds.minY, bounds.maxY),
    };
    setDocked(false, DOCK_SIDE);
    setPosition(next);
    dragOrigin.current = next;
    appliedPosition.current = next;
    setExpanded(true);
    Animated.spring(position, {
      toValue: next,
      friction: 8,
      tension: 120,
      useNativeDriver: false,
    }).start();
  }, [bounds.maxX, bounds.maxY, bounds.minY, position, setDocked, setPosition]);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    const base = savedPosition ?? defaultPosition;
    const clamped = {
      x: clamp(base.x, bounds.minX, bounds.maxX),
      y: clamp(base.y, bounds.minY, bounds.maxY),
    };
    if (docked || isSamePosition(appliedPosition.current, clamped)) {
      return;
    }
    position.setValue(clamped);
    dragOrigin.current = clamped;
    appliedPosition.current = clamped;
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, defaultPosition, docked, position, savedPosition, shouldShow]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bodyFloat, { toValue: 1, duration: 1700, useNativeDriver: true }),
        Animated.timing(bodyFloat, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [bodyFloat]);

  useEffect(() => {
    let cancelled = false;
    const loopBlink = () => {
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(blink, { toValue: 0.2, duration: 90, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 130, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) {
          loopBlink();
        }
      });
    };
    loopBlink();
    return () => {
      cancelled = true;
      blink.stopAnimation();
    };
  }, [blink]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(sparkle, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(sparkle, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [activeTip?.id, sparkle]);

  useEffect(() => {
    Animated.spring(bubbleScale, {
      toValue: expanded && !docked ? 1 : 0.92,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [bubbleScale, docked, expanded]);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    setTipIndex(0);
    setActiveEventId(null);
    if (introTip) {
      setExpanded(true);
      return;
    }
    if (!docked) {
      setExpanded(false);
    }
  }, [docked, introTip, normalizedPath, shouldShow]);

  useEffect(() => {
    if (!lastEvent || !eventTip) {
      return;
    }
    if (lastEvent.type === "item_added") {
      Vibration.vibrate(10);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveEventId(eventTip.id);
    if (!introTip && !docked) {
      setExpanded(false);
    }
  }, [docked, eventTip, introTip, lastEvent]);

  useEffect(() => {
    if (!activeTip || !shouldShow || !expanded) {
      return;
    }
    if (introTip) {
      return;
    }
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
    }
    autoCollapseTimer.current = setTimeout(() => {
      if (!docked) {
        setExpanded(false);
      }
      setActiveEventId(null);
    }, activeEventId ? 5200 : 6500);
    return () => {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
    };
  }, [activeEventId, activeTip, docked, expanded, introTip, shouldShow]);

  const cycleTip = useCallback(() => {
    touchFeedback();
    if (introTip) {
      completeIntroduction();
      setExpanded(false);
      setActiveEventId(null);
      return;
    }
    setActiveEventId(null);
    setExpanded(true);
    setTipIndex((current) => (current + 1) % routeTips.length);
  }, [completeIntroduction, introTip, routeTips.length, touchFeedback]);

  const handlePrimaryAction = useCallback(() => {
    touchFeedback();
    if (introTip) {
      completeIntroduction();
    }
    if (docked) {
      undockBuddy();
      return;
    }
    if (showPrimaryAction && activeTip?.actionRoute) {
      router.push(activeTip.actionRoute as never);
      return;
    }
    setExpanded(false);
  }, [activeTip?.actionRoute, completeIntroduction, docked, introTip, router, showPrimaryAction, touchFeedback, undockBuddy]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !docked && (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3),
        onPanResponderGrant: () => {
          position.stopAnimation((value) => {
            dragOrigin.current = value;
          });
          setDragging(true);
          longPressTriggered.current = false;
          if (!docked) {
            longPressTimer.current = setTimeout(() => {
              longPressTriggered.current = true;
              setDragging(false);
              dockBuddy();
            }, 560);
          }
          Vibration.vibrate(12);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
        onPanResponderMove: (_, gesture) => {
          if (docked) {
            return;
          }
          if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
          position.setValue({
            x: clamp(dragOrigin.current.x + gesture.dx, bounds.minX, bounds.maxX),
            y: clamp(dragOrigin.current.y + gesture.dy, bounds.minY, bounds.maxY),
          });
        },
        onPanResponderRelease: (_, gesture) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          if (longPressTriggered.current) {
            longPressTriggered.current = false;
            return;
          }
          setDragging(false);
          if (docked) {
            undockBuddy();
            touchFeedback();
            return;
          }
          const moved = Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
          const next = {
            x: clamp(dragOrigin.current.x + gesture.dx, bounds.minX, bounds.maxX),
            y: clamp(dragOrigin.current.y + gesture.dy, bounds.minY, bounds.maxY),
          };
          dragOrigin.current = next;
          appliedPosition.current = next;
          setPosition(next);
          Animated.spring(position, {
            toValue: next,
            friction: 8,
            tension: 120,
            useNativeDriver: false,
          }).start();
          if (!moved) {
            touchFeedback();
            setExpanded((current) => !current);
          } else {
            Vibration.vibrate(6);
          }
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        },
      }),
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, dockBuddy, docked, position, setPosition, touchFeedback, undockBuddy],
  );

  if (!shouldShow || !activeTip) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.frame, { transform: position.getTranslateTransform() }]}
      >
        {!docked ? (
          <Animated.View
            pointerEvents={expanded ? "auto" : "none"}
            style={[
              styles.bubbleWrap,
              {
                opacity: expanded ? 1 : 0,
                transform: [
                  { scale: bubbleScale },
                  {
                    translateY: bubbleScale.interpolate({
                      inputRange: [0.92, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.bubble}>
              <View style={styles.bubbleTopRow}>
                <Text style={[styles.bubbleEyebrow, { color: palette.accent }]}>
                  {GUIDE_BUDDY_NAME}
                </Text>
                <View style={[styles.bubbleDot, { backgroundColor: palette.accent }]} />
              </View>
              <Text style={styles.bubbleTitle}>{activeTip.title}</Text>
              <Text style={styles.bubbleText}>{activeTip.message}</Text>
              <Text style={styles.longPressHint}>Long press to hide me.</Text>
              <View style={styles.bubbleActions}>
                <Pressable style={styles.secondaryButton} onPress={cycleTip}>
                  <Text style={styles.secondaryButtonText}>{introTip ? "থাক, পরে" : "আরও hint"}</Text>
                </Pressable>
                {showPrimaryAction ? (
                  <Pressable style={styles.primaryButton} onPress={handlePrimaryAction}>
                    <Text style={styles.primaryButtonText}>{activeTip.actionLabel}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Animated.View>
        ) : (
          <DockedBuddyButton
            activeEvent={Boolean(activeEventId)}
            onPress={handlePrimaryAction}
            palette={palette}
          />
        )}

        <View style={styles.petDock}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.petTouchArea,
              {
                transform: [
                  {
                    translateY: bodyFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                  { scale: bodyScale },
                ],
              },
            ]}
          >
            <View style={styles.petShadow} />
            <View style={[styles.petGlow, { backgroundColor: palette.glow }]} />
            <Animated.View
              style={[
                styles.sparkleDot,
                {
                  backgroundColor: palette.accent,
                  opacity: sparkle.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 1],
                  }),
                  transform: [
                    {
                      translateY: sparkle.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, -4],
                      }),
                    },
                    {
                      scale: sparkle.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.12],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={[styles.petEar, styles.petEarLeft]} />
            <View style={[styles.petEar, styles.petEarRight]} />
            <View style={styles.petBody}>
              <View style={[styles.petFace, { backgroundColor: palette.face }]}>
                <View style={styles.cheekRow}>
                  <View style={styles.cheek} />
                  <View style={styles.cheek} />
                </View>
                <View style={styles.eyeRow}>
                  <Animated.View
                    style={[
                      styles.eyeShell,
                      displayEmotion === "sleepy" && styles.eyeSleepy,
                      displayEmotion === "thinking" && styles.eyeThinking,
                      displayEmotion === "happy" && styles.eyeHappy,
                      displayEmotion === "angry" && styles.eyeAngry,
                      {
                        transform: [
                          { scaleY: blink },
                          displayEmotion === "love"
                            ? { rotate: "45deg" }
                            : displayEmotion === "angry"
                              ? { rotate: "-15deg" }
                            : { rotate: "0deg" },
                        ],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.eye,
                        displayEmotion === "love" && styles.eyeLove,
                        displayEmotion === "sleepy" && styles.eyeSleepyInner,
                        displayEmotion === "happy" && styles.eyeHappyInner,
                        displayEmotion === "thinking" && styles.eyeThinkingInner,
                        displayEmotion === "angry" && styles.eyeAngryInner,
                      ]}
                    />
                    {displayEmotion === "sleepy" ||
                    displayEmotion === "happy" ||
                    displayEmotion === "love" ||
                    displayEmotion === "angry" ? null : (
                      <View style={styles.eyeSparkle} />
                    )}
                  </Animated.View>
                  <Animated.View
                    style={[
                      styles.eyeShell,
                      displayEmotion === "sleepy" && styles.eyeSleepy,
                      displayEmotion === "thinking" && styles.eyeThinking,
                      displayEmotion === "happy" && styles.eyeHappy,
                      displayEmotion === "angry" && styles.eyeAngryRight,
                      {
                        transform: [
                          { scaleY: blink },
                          displayEmotion === "love"
                            ? { rotate: "45deg" }
                            : displayEmotion === "angry"
                              ? { rotate: "15deg" }
                            : { rotate: "0deg" },
                        ],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.eye,
                        displayEmotion === "love" && styles.eyeLove,
                        displayEmotion === "sleepy" && styles.eyeSleepyInner,
                        displayEmotion === "happy" && styles.eyeHappyInner,
                        displayEmotion === "thinking" && styles.eyeThinkingInner,
                        displayEmotion === "angry" && styles.eyeAngryInner,
                      ]}
                    />
                    {displayEmotion === "sleepy" ||
                    displayEmotion === "happy" ||
                    displayEmotion === "love" ||
                    displayEmotion === "angry" ? null : (
                      <View style={styles.eyeSparkle} />
                    )}
                  </Animated.View>
                </View>
                <View
                  style={[
                    styles.mouth,
                    displayEmotion === "happy" && styles.mouthHappy,
                    displayEmotion === "thinking" && styles.mouthThinking,
                    displayEmotion === "sleepy" && styles.mouthSleepy,
                    displayEmotion === "love" && styles.mouthLove,
                    displayEmotion === "angry" && styles.mouthAngry,
                  ]}
                />
              </View>
              <View style={styles.petBelly} />
              <View style={[styles.petFoot, styles.petFootLeft]} />
              <View style={[styles.petFoot, styles.petFootRight]} />
              <View style={styles.petBadge}>
                <Text style={styles.petBadgeText}>{activeEventId ? "!" : "★"}</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { position: "absolute", width: FRAME_WIDTH, height: FRAME_HEIGHT, alignItems: "flex-end", justifyContent: "flex-end" },
  bubbleWrap: { width: "100%", alignItems: "flex-end", paddingRight: 4, marginBottom: 8 },
  bubble: { width: 216, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#FFFFFF", shadowColor: "#111827", shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10, gap: 7 },
  bubbleTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bubbleEyebrow: { fontSize: 12, fontWeight: "900" },
  bubbleDot: { width: 8, height: 8, borderRadius: 999 },
  bubbleTitle: { fontSize: 15, fontWeight: "900", color: "#20263A" },
  bubbleText: { fontSize: 12, lineHeight: 18, color: "#5F5965" },
  longPressHint: { fontSize: 11, lineHeight: 16, color: "#8A7E75" },
  bubbleActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  secondaryButton: { minHeight: 36, borderRadius: 14, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F0EB" },
  secondaryButtonText: { fontSize: 12, fontWeight: "900", color: "#24314A" },
  primaryButton: { flex: 1, minHeight: 36, borderRadius: 14, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#20263A" },
  primaryButtonText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  peekAvatarButton: { position: "absolute", top: 20, right: PET_SIZE - 8, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  peekAvatarGlow: { position: "absolute", width: 36, height: 36, borderRadius: 18, opacity: 0.95 },
  peekAvatarBody: { width: 30, height: 30, borderRadius: 14, backgroundColor: "#FFF7FB", borderWidth: 2, borderColor: "#F8D8E8", alignItems: "center", justifyContent: "center", shadowColor: "#D46A96", shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  peekAvatarFace: { width: 21, height: 16, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  peekAvatarEyeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  peekAvatarEye: { width: 3.5, height: 4.5, borderRadius: 999, backgroundColor: "#20263A" },
  peekAvatarMouth: { marginTop: 2, width: 8, height: 4, borderBottomWidth: 1.8, borderBottomColor: "#20263A", borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  peekAvatarBadge: { position: "absolute", top: -1, right: -1, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  peekAvatarBadgeText: { fontSize: 9, fontWeight: "900", color: "#FFFFFF" },
  petDock: { width: "100%", alignItems: "flex-end" },
  petTouchArea: { width: PET_SIZE + 12, height: PET_SIZE + 20, alignItems: "center", justifyContent: "flex-end" },
  petShadow: { position: "absolute", bottom: 3, width: 30, height: 8, borderRadius: 999, backgroundColor: "rgba(23,29,45,0.16)" },
  petGlow: { position: "absolute", width: 68, height: 68, borderRadius: 34 },
  sparkleDot: { position: "absolute", top: -6, right: 6, width: 12, height: 12, borderRadius: 999 },
  petEar: { position: "absolute", top: 5, width: 18, height: 18, borderRadius: 8, backgroundColor: "#FFF7FB", borderWidth: 2, borderColor: "#F8D8E8" },
  petEarLeft: { left: 10, transform: [{ rotate: "-32deg" }] },
  petEarRight: { right: 10, transform: [{ rotate: "32deg" }] },
  petBody: { width: PET_SIZE, height: PET_SIZE, borderRadius: 24, backgroundColor: "#FFF7FB", borderWidth: 2, borderColor: "#F8D8E8", alignItems: "center", justifyContent: "flex-start", shadowColor: "#D46A96", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  petFace: { width: 42, height: 34, marginTop: 8, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cheekRow: { position: "absolute", width: "100%", bottom: 7, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 5 },
  cheek: { width: 7, height: 4, borderRadius: 999, backgroundColor: "rgba(255,123,151,0.45)" },
  eyeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  eyeShell: { width: 10, height: 10, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  eye: { width: 8, height: 10, borderRadius: 999, backgroundColor: "#20263A" },
  eyeSparkle: { position: "absolute", top: 1, right: 1, width: 2.5, height: 2.5, borderRadius: 999, backgroundColor: "#FFFFFF" },
  eyeSleepy: { height: 3, marginTop: 4 },
  eyeThinking: { width: 11, height: 11 },
  eyeHappy: { width: 10, height: 4, marginTop: 2, borderRadius: 999 },
  eyeAngry: { marginTop: 1 },
  eyeAngryRight: { marginTop: 1 },
  eyeLove: { width: 8, height: 8, borderRadius: 3, backgroundColor: "#FF5D8F" },
  eyeSleepyInner: { width: 10, height: 2.5, borderRadius: 999 },
  eyeHappyInner: { width: 10, height: 4, borderRadius: 999 },
  eyeThinkingInner: { width: 7, height: 7, borderRadius: 999 },
  eyeAngryInner: { width: 10, height: 3.5, borderRadius: 999 },
  mouth: { marginTop: 4, width: 16, height: 8, borderBottomWidth: 2.5, borderBottomColor: "#20263A", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  mouthHappy: { width: 18, height: 10 },
  mouthThinking: { width: 12, height: 2, borderBottomWidth: 0, borderRadius: 999, backgroundColor: "#20263A" },
  mouthSleepy: { width: 10, height: 2, borderBottomWidth: 0, borderRadius: 999, backgroundColor: "#20263A" },
  mouthLove: { width: 14, height: 14, borderBottomWidth: 0, borderRadius: 8, backgroundColor: "#20263A" },
  mouthAngry: { width: 12, height: 3, borderBottomWidth: 0, borderRadius: 999, backgroundColor: "#20263A" },
  petBelly: { position: "absolute", bottom: 10, width: 22, height: 12, borderRadius: 999, backgroundColor: "#FFFFFF", opacity: 0.72 },
  petFoot: { position: "absolute", bottom: -3, width: 14, height: 10, borderRadius: 999, backgroundColor: "#FFF7FB", borderWidth: 2, borderColor: "#F8D8E8" },
  petFootLeft: { left: 12 },
  petFootRight: { right: 12 },
  petBadge: { position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#FFD166" },
  petBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
});

