const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : null;
}

function isStateChangingMethod(method: string) {
  const normalizedMethod = method.toUpperCase();
  return normalizedMethod !== "GET" && normalizedMethod !== "HEAD" && normalizedMethod !== "OPTIONS";
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  const method = init.method ?? "GET";

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isStateChangingMethod(method) && !headers.has("X-XSRF-TOKEN")) {
    const xsrfToken = getCookieValue("XSRF-TOKEN");
    if (xsrfToken) {
      headers.set("X-XSRF-TOKEN", xsrfToken);
    }
  }

  return fetch(url, {
    ...init,
    method,
    headers,
    credentials: "include",
  });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
}
