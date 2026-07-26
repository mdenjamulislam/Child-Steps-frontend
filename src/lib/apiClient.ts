// ── API Client — Typed fetch wrapper ─────────────────────────────────────────
// Attaches Bearer token from storage on every request,
// handles JSON parsing, and normalises error responses.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const TOKEN_KEY = "cs_token";

// ── Token Storage Helpers ─────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ── Request Options ───────────────────────────────────────────────────────────

interface ApiClientOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Override the Bearer token (defaults to stored token) */
  token?: string;
}

// ── Core fetch function ───────────────────────────────────────────────────────

export async function apiRequest<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { body, token, headers: extraHeaders, ...restOptions } = options;

  const storedToken = token ?? getStoredToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
    ...(extraHeaders ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Parse JSON regardless of status code
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    const errObj = json as { error?: string; message?: string };
    throw new Error(
      errObj?.error ?? errObj?.message ?? `Request failed with status ${response.status}`
    );
  }

  return json as T;
}

// ── Convenience Methods ───────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, options?: ApiClientOptions) =>
    apiRequest<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body: unknown, options?: ApiClientOptions) =>
    apiRequest<T>(path, { method: "POST", body, ...options }),

  put: <T>(path: string, body: unknown, options?: ApiClientOptions) =>
    apiRequest<T>(path, { method: "PUT", body, ...options }),

  patch: <T>(path: string, body: unknown, options?: ApiClientOptions) =>
    apiRequest<T>(path, { method: "PATCH", body, ...options }),

  delete: <T>(path: string, options?: ApiClientOptions) =>
    apiRequest<T>(path, { method: "DELETE", ...options }),
};
