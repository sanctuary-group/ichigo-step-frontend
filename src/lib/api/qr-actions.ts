import { apiFetch, ApiError } from "./client";
import { mapQrAction } from "./mappers";
import { API_ORIGIN, TENANT_BASE } from "./config";
import { getToken } from "./token-store";
import { getCurrentChannelId } from "./channel-store";
import type { ApiQrAction } from "./types";
import type { MockQrAction } from "@/mocks/data";
import type { QrAction } from "@/types/qr-action";

/** ビルダー編集フォームが期待する raw な QrAction（snake_case + public_url / image_url） */
export type RawQrAction = QrAction & { public_url?: string; image_url?: string };

/** GET /qr-actions/{id} （編集フォーム用に raw な snake_case 形状を返す） */
export async function fetchRawQrAction(id: number | string): Promise<RawQrAction> {
  return apiFetch<RawQrAction>(`/qr-actions/${id}`);
}

/**
 * 一覧画面用の raw な QrAction 一覧。
 * QRコード公開URL / 画像URL は backend Resource に含まれないため token から導出する
 * （旧 monolith: public_url = {base}/qr/{token}, image_url = /qr/{token}/image）。
 */
export async function fetchQrActionList(
  params: { folder?: string; q?: string } = {},
): Promise<QrAction[]> {
  const data = await apiFetch<QrAction[]>("/qr-actions", {
    query: { folder: params.folder, q: params.q },
  });
  return data.map((q) => ({
    ...q,
    public_url: q.token ? `${API_ORIGIN}/qr/${q.token}` : "",
    image_url: q.token ? `${API_ORIGIN}/qr/${q.token}/image` : undefined,
    account_name: q.line_channel?.name ?? q.account_name ?? null,
  }));
}

/** DELETE /qr-actions/{id} （単体削除） */
export async function deleteQrAction(id: number | string): Promise<void> {
  await apiFetch(`/qr-actions/${id}`, { method: "DELETE" });
}

/** GET /qr-actions */
export async function fetchQrActions(params: { folder?: string; q?: string } = {}): Promise<
  MockQrAction[]
> {
  const data = await apiFetch<ApiQrAction[]>("/qr-actions", {
    query: { folder: params.folder, q: params.q },
  });
  return data.map(mapQrAction);
}

/** DELETE /qr-actions/{id} （bulk-delete エンドポイント利用） */
export async function bulkDeleteQrActions(ids: string[]): Promise<void> {
  await apiFetch("/qr-actions/bulk-delete", {
    method: "POST",
    body: { ids: ids.map(Number) },
  });
}

/** POST /qr-actions */
export async function createQrAction(input: {
  name: string;
  qr_action_folder_id: number;
  audience: "new" | "all";
  message?: string;
  combine_greeting?: boolean;
  action_type?: "none" | "add_tag" | "start_scenario" | "track_source";
}): Promise<MockQrAction> {
  const data = await apiFetch<ApiQrAction>("/qr-actions", { method: "POST", body: input });
  return mapQrAction(data);
}

/** POST /qr-actions または PUT /qr-actions/{id}（ビルダー保存） */
export async function saveQrAction(
  payload: Record<string, unknown>,
  editId?: number,
): Promise<ApiQrAction> {
  const path = editId ? `/qr-actions/${editId}` : "/qr-actions";
  return apiFetch<ApiQrAction>(path, {
    method: editId ? "PUT" : "POST",
    body: payload,
  });
}

/** PATCH /qr-actions/{id}/toggle-active */
export async function toggleQrAction(id: string): Promise<MockQrAction> {
  const data = await apiFetch<ApiQrAction>(`/qr-actions/${id}/toggle-active`, { method: "PATCH" });
  return mapQrAction(data);
}

/* ===== データ詳細（流入分析） ===== */

export type QrActionStatRow = {
  date: string;
  scans: number;
  follows: number;
  actions: number;
};

export type QrActionFriendRow = {
  added_at: string | null;
  display_name: string | null;
  system_display_name: string | null;
  friend_type: "new" | "existing" | "unblock";
  is_following: boolean;
  unfollowed_at: string | null;
};

export type QrActionDataDetail = {
  qrAction: { id: number; name: string; created_date: string };
  period: { from: string; to: string };
  rows: QrActionStatRow[];
  totals: { scans: number; follows: number; actions: number };
  friends: QrActionFriendRow[];
  friendStats: { new: number; existing: number; unblock: number; blocked: number };
};

/**
 * GET /qr-actions/{id}/data?from&to
 * 流入分析データ（数値情報 / 友だち一覧 / 友だち種別統計）をまとめて取得する。
 *
 * NOTE: 2026-06 時点でテナント API（/api/tenant/v1）側に当エンドポイントは未実装。
 * monolith では web ルート `qr-actions/{qrAction}/data`（Inertia）にのみ存在する。
 * 404/未実装時は呼び出し側で空状態フォールバックする想定。
 */
export async function fetchQrActionDataDetail(
  id: number | string,
  period: { from?: string; to?: string } = {},
): Promise<QrActionDataDetail> {
  return apiFetch<QrActionDataDetail>(`/qr-actions/${id}/data`, {
    query: { from: period.from, to: period.to },
  });
}

/** ダウンロードURL（GET /qr-actions/{id}/data/csv） */
export function qrActionDataCsvUrl(
  id: number | string,
  kind: "stats" | "friends" | "lp",
  period: { from?: string; to?: string } = {},
): string {
  const url = new URL(`${API_ORIGIN}${TENANT_BASE}/qr-actions/${id}/data/csv`);
  url.searchParams.set("kind", kind);
  if (period.from) url.searchParams.set("from", period.from);
  if (period.to) url.searchParams.set("to", period.to);
  return url.toString();
}

/**
 * GET /qr-actions/{id}/data/csv
 * Bearer 認証が必要なため blob で取得し、ブラウザでダウンロードを発火する。
 * （downloadCsvJob と同じ作法）
 */
export async function downloadQrActionDataCsv(
  id: number | string,
  kind: "stats" | "friends" | "lp",
  filename: string,
  period: { from?: string; to?: string } = {},
): Promise<void> {
  const headers = new Headers({ Accept: "text/csv" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const channelId = getCurrentChannelId();
  if (channelId) headers.set("X-Line-Channel-Id", channelId);

  const res = await fetch(qrActionDataCsvUrl(id, kind, period), { headers });
  if (!res.ok) throw new ApiError(res.status, `ダウンロードに失敗しました (HTTP ${res.status})`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
