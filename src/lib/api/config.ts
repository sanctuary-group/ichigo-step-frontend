// バックエンド（Laravel）のオリジン。認証(/api/tenant/login)も
// テナントAPI(/api/tenant/v1)もこのオリジン直下にある。
export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

// テナント CRUD API のベースパス
export const TENANT_BASE = "/api/tenant/v1";

// 現在チャネル id を localStorage に保持するキー
export const CURRENT_CHANNEL_STORAGE_KEY = "ichigo.currentChannelId";
