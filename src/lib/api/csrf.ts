import { API_ORIGIN } from "./config";

/**
 * cookie から値を読む（ブラウザのみ）。
 */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Sanctum の XSRF-TOKEN cookie を読み、X-XSRF-TOKEN ヘッダ用の値を返す。
 */
export function readXsrfToken(): string | null {
  return readCookie("XSRF-TOKEN");
}

/**
 * Sanctum の CSRF cookie を取得する。未取得なら 1 度だけ叩く。
 * force=true で強制再取得（419 リトライ用）。
 */
export async function ensureCsrfCookie(force = false): Promise<void> {
  if (!force && readXsrfToken()) return;
  await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}
