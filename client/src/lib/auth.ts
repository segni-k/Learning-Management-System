import { apiFetch, apiJson } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export async function csrf() {
  await apiFetch("/sanctum/csrf-cookie");
}

export async function login(email: string, password: string) {
  await csrf();
  return apiJson<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  await csrf();
  return apiJson<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return apiJson<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export async function me() {
  return apiJson<AuthResponse>("/api/v1/auth/me");
}
