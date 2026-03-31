import type { Href } from "expo-router";

const DEFAULT_AUTH_REDIRECT = "/(tabs)/home";

export function resolveAuthRedirectTarget(
  redirectTo?: string | string[],
): Href {
  const normalized = Array.isArray(redirectTo) ? redirectTo[0] : redirectTo;

  if (!normalized || !normalized.startsWith("/")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (
    normalized === "/login" ||
    normalized === "/signup" ||
    normalized.startsWith("/(auth)")
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return normalized as Href;
}
