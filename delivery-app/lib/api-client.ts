const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

let accessToken = "";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

function buildHeaders(token?: string | null) {
  const resolvedToken = token ?? accessToken;

  return {
    "Content-Type": "application/json",
    ...(resolvedToken
      ? {
          Authorization: `Bearer ${resolvedToken}`,
        }
      : {}),
  };
}

async function request<T>(path: string, options: RequestOptions = {}) {
  if (!API_BASE_URL) {
    throw new ApiError("EXPO_PUBLIC_API_BASE_URL is not configured.", 500);
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
    throw new ApiError(payload.message || "Request failed", response.status);
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

export function apiDelete<T>(path: string, body?: unknown, token?: string | null) {
  return request<T>(path, { method: "DELETE", body, token });
}

export function setApiAccessToken(token: string | null) {
  accessToken = token ?? "";
}

export { API_BASE_URL };
