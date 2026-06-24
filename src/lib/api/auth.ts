import { API_ORIGIN } from "./config";
import { apiFetch, ApiError } from "./client";
import { setToken } from "./token-store";
import type { ApiTenantContext } from "./types";

export type CurrentUser = { id: number; name: string; email: string };

export type AuthBootstrap = {
  user: CurrentUser;
  currentChannelId: string | null;
};

type LoginResponse = {
  token: string;
  authenticated_as: CurrentUser;
  context: { organization_id: number | null; line_channel_id: number | null };
};

/**
 * Bearer トークンログイン（別ドメイン構成）。
 * POST /api/tenant/login にメール/パスワードを送り、トークンを受け取り保存する。
 */
export async function login(params: {
  email: string;
  password: string;
}): Promise<AuthBootstrap> {
  const res = await fetch(`${API_ORIGIN}/api/tenant/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      device_name: "web",
    }),
  });

  if (!res.ok) {
    let message = "メールアドレスまたはパスワードが違います。";
    let errors: Record<string, string[]> | undefined;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
      if (data?.errors) errors = data.errors;
    } catch {
      /* noop */
    }
    throw new ApiError(res.status, message, errors);
  }

  const json = await res.json();
  const data = (json?.data ?? json) as LoginResponse;
  setToken(data.token);

  return {
    user: data.authenticated_as,
    currentChannelId:
      data.context.line_channel_id != null ? String(data.context.line_channel_id) : null,
  };
}

/**
 * 認証中ユーザーと現在チャネルを取得（GET /api/tenant/v1/）。
 * トークン未保持・無効なら 401 で ApiError が投げられる。
 */
export async function getCurrentUser(): Promise<AuthBootstrap> {
  const ctx = await apiFetch<ApiTenantContext>("/", { base: "tenant" });
  return {
    user: ctx.authenticated_as,
    currentChannelId:
      ctx.context.line_channel_id != null ? String(ctx.context.line_channel_id) : null,
  };
}

/** ログアウト（POST /api/tenant/logout）。トークンを失効・破棄。 */
export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/tenant/logout", { base: "origin", method: "POST" });
  } catch {
    /* トークンが既に無効でも握りつぶす */
  } finally {
    setToken(null);
  }
}
