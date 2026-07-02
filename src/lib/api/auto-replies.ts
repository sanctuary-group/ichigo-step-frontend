import { apiFetch } from "./client";
import { mapAutoReply } from "./mappers";
import type { ApiAutoReply } from "./types";
import type { MockAutoReply } from "@/mocks/data";
import type { AutoReply } from "@/types/auto-reply";

/** GET /auto-replies/{id} — 編集フォーム初期化用の生レコード（{data} unwrap 済）。 */
export async function fetchRawAutoReply(id: string): Promise<AutoReply> {
  return apiFetch<AutoReply>(`/auto-replies/${id}`);
}

/** GET /auto-replies */
export async function fetchAutoReplies(params: { folder?: string } = {}): Promise<MockAutoReply[]> {
  const data = await apiFetch<ApiAutoReply[]>("/auto-replies", {
    query: { folder: params.folder },
  });
  return data.map(mapAutoReply);
}

/**
 * GET /auto-replies — 一覧画面の要約整形（keywordSummary/scheduleSummary）に
 * 必要な構造化フィールドを保ったまま生レコードを返す。
 */
export async function fetchAutoRepliesRaw(
  params: { folder?: string } = {},
): Promise<ApiAutoReply[]> {
  return apiFetch<ApiAutoReply[]>("/auto-replies", {
    query: { folder: params.folder },
  });
}

/** POST /auto-replies */
export async function createAutoReply(input: {
  auto_reply_folder_id: number;
  trigger_type: "all" | "keyword" | "follow";
  match_mode: "partial" | "exact";
  keywords?: string[];
  exclude_bracket?: boolean;
  audience: "active" | "blocked";
  schedule_type: "always" | "business" | "custom";
  action_mode: "once" | "repeat";
}): Promise<MockAutoReply> {
  const data = await apiFetch<ApiAutoReply>("/auto-replies", { method: "POST", body: input });
  return mapAutoReply(data);
}

/** ビルダーフォームの全項目を送る保存（POST/PUT）。 */
export async function saveAutoReply(
  payload: Record<string, unknown>,
  editId?: string,
): Promise<MockAutoReply> {
  const data = editId
    ? await apiFetch<ApiAutoReply>(`/auto-replies/${editId}`, { method: "PUT", body: payload })
    : await apiFetch<ApiAutoReply>("/auto-replies", { method: "POST", body: payload });
  return mapAutoReply(data);
}

/** DELETE /auto-replies/{id} */
export async function deleteAutoReply(id: string): Promise<void> {
  await apiFetch(`/auto-replies/${id}`, { method: "DELETE" });
}

/** PATCH /auto-replies/{id}/toggle-active */
export async function toggleAutoReply(id: string): Promise<MockAutoReply> {
  const data = await apiFetch<ApiAutoReply>(`/auto-replies/${id}/toggle-active`, {
    method: "PATCH",
  });
  return mapAutoReply(data);
}

/** POST /auto-replies/reorder（並べ替え後の id 配列）。 */
export async function reorderAutoReplies(ids: number[]): Promise<void> {
  await apiFetch("/auto-replies/reorder", { method: "POST", body: { ids } });
}

/**
 * POST /auto-replies/{id}/duplicate — サーバー側で即複製。
 * タイトル末尾に「 のコピー」付与・is_active=false で新規作成される。
 */
export async function duplicateAutoReply(id: string): Promise<MockAutoReply> {
  const data = await apiFetch<ApiAutoReply>(`/auto-replies/${id}/duplicate`, {
    method: "POST",
  });
  return mapAutoReply(data);
}
