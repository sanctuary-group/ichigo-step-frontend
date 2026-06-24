import { API_ORIGIN } from "./config";
import { ensureCsrfCookie, readXsrfToken } from "./csrf";
import { apiFetch, ApiError } from "./client";
import type { ApiTenantContext } from "./types";

export type CurrentUser = { id: number; name: string; email: string };

export type AuthBootstrap = {
  user: CurrentUser;
  currentChannelId: string | null;
};

/**
 * Sanctum SPA ログイン: CSRF cookie 取得 → POST /login。
 * /login は 302 リダイレクトを返すため redirect:"manual"、200/204/3xx を成功扱い。
 * 422 はバリデーションエラーとして ApiError を投げる。
 */
export async function login(params: {
  email: string;
  password: string;
  remember?: boolean;
}): Promise<AuthBootstrap> {
  await ensureCsrfCookie();
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  const token = readXsrfToken();
  if (token) headers.set("X-XSRF-TOKEN", token);

  const res = await fetch(`${API_ORIGIN}/login`, {
    method: "POST",
    credentials: "include",
    redirect: "manual",
    headers,
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      remember: params.remember ?? false,
    }),
  });

  // redirect:"manual" の場合 302 は status 0 / type "opaqueredirect" になる。これも成功。
  const ok = res.ok || res.status === 0 || res.type === "opaqueredirect" || res.status === 302;
  if (!ok) {
    let message = "メールアドレスまたはパスワードが違います。";
    let errors: Record<string, string[]> | undefined;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
      if (data?.errors) errors = data.errors;
    } catch {
      /* noop */
    }
    throw new ApiError(res.status || 422, message, errors);
  }

  return getCurrentUser();
}

/**
 * 認証中ユーザーと現在チャネルを取得（GET /api/tenant/v1/）。
 * 未認証なら 401 で ApiError が投げられる。
 */
export async function getCurrentUser(): Promise<AuthBootstrap> {
  const ctx = await apiFetch<ApiTenantContext>("/", { base: "tenant" });
  return {
    user: ctx.authenticated_as,
    currentChannelId:
      ctx.context.line_channel_id != null ? String(ctx.context.line_channel_id) : null,
  };
}

/** ログアウト（POST /logout）。 */
export async function logout(): Promise<void> {
  await ensureCsrfCookie();
  const headers = new Headers({ Accept: "application/json" });
  const token = readXsrfToken();
  if (token) headers.set("X-XSRF-TOKEN", token);
  await fetch(`${API_ORIGIN}/logout`, {
    method: "POST",
    credentials: "include",
    redirect: "manual",
    headers,
  });
}
