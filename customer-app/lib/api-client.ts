const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
let accessToken = "";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

function buildHeaders(token?: string | null) {
  return {
    "Content-Type": "application/json",
    ...(token ?? accessToken
      ? {
          Authorization: `Bearer ${token ?? accessToken}`,
        }
      : {}),
  };
}

async function request<T>(path: string, options: RequestOptions = {}) {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: buildHeaders(options.token),
    ...(options.body !== undefined
      ? {
          body: JSON.stringify(options.body),
        }
      : {}),
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export function apiGet<T>(path: string, token?: string | null) {
  return request<T>(path, { method: "GET", token });
}

export function apiPost<T>(path: string, body?: unknown, token?: string | null) {
  return request<T>(path, { method: "POST", body, token });
}

export function apiPatch<T>(path: string, body?: unknown, token?: string | null) {
  return request<T>(path, { method: "PATCH", body, token });
}

export function apiDelete<T>(path: string, token?: string | null) {
  return request<T>(path, { method: "DELETE", token });
}

export function setApiAccessToken(token: string | null) {
  accessToken = token ?? "";
}

export { API_BASE_URL };
