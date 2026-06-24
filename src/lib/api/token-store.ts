const TOKEN_STORAGE_KEY = "ichigo.authToken";

/**
 * Sanctum 個人アクセストークン（Bearer）を保持する非Reactストア。
 * 別ドメイン構成（Vercel ＋ 独自APIドメイン）では Cookie が使えないため
 * トークンを localStorage に保存し、apiFetch が Authorization ヘッダに載せる。
 */
let token: string | null = null;

export function getToken(): string | null {
  if (token !== null) return token;
  if (typeof window !== "undefined") {
    token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return token;
}

export function setToken(value: string | null): void {
  token = value;
  if (typeof window !== "undefined") {
    if (value) window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
