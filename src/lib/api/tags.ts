import { apiFetch } from "./client";
import { mapTag } from "./mappers";
import type { ApiTag } from "./types";
import type { MockTag } from "@/mocks/data";
import type { GreetingAction } from "@/types/greeting";

export type TagListParams = { folder?: string; q?: string };

export type TagWithCount = MockTag & {
  friendsCount: number;
  personLimit: number | null;
  actionCount: number;
};

/**
 * API レスポンスから一覧表示に必要な拡張フィールドを取り出す。
 * （TagResource が person_limit / actions / updated_at を返さない場合は安全に既定値へフォールバック）
 */
type ApiTagExtended = ApiTag & {
  updated_at?: string | null;
  deleted_at?: string | null;
  person_limit?: number | null;
  actions?: GreetingAction[] | null;
  action_run_once?: boolean;
  limit_actions?: GreetingAction[] | null;
  limit_action_run_once?: boolean;
};

function mapTagWithCount(t: ApiTagExtended): TagWithCount {
  return {
    ...mapTag(t),
    updatedAt: t.updated_at ?? t.created_at ?? undefined,
    friendsCount: t.friends_count ?? 0,
    personLimit: t.person_limit ?? null,
    actionCount: t.actions?.length ?? 0,
  };
}

/** GET /tags */
export async function fetchTags(params: TagListParams = {}): Promise<TagWithCount[]> {
  const data = await apiFetch<ApiTagExtended[]>("/tags", {
    query: { folder: params.folder, q: params.q },
  });
  return data.map(mapTagWithCount);
}

/** 編集画面で扱うタグ詳細（アクション・人数制限を含む）。 */
export type TagDetail = {
  id: string;
  name: string;
  color: string;
  tagFolderId: number | null;
  actions: GreetingAction[];
  actionRunOnce: boolean;
  personLimit: number | null;
  limitActions: GreetingAction[];
  limitActionRunOnce: boolean;
};

function mapTagDetail(t: ApiTagExtended): TagDetail {
  return {
    id: String(t.id),
    name: t.name,
    color: t.color ?? "#9ca3af",
    tagFolderId: t.tag_folder_id ?? null,
    actions: t.actions ?? [],
    actionRunOnce: t.action_run_once ?? true,
    personLimit: t.person_limit ?? null,
    limitActions: t.limit_actions ?? [],
    limitActionRunOnce: t.limit_action_run_once ?? true,
  };
}

/**
 * 編集画面用のタグ詳細を取得する。
 * 専用の show エンドポイントが無いため一覧から該当 ID を抽出する。
 */
export async function fetchTagDetail(id: string): Promise<TagDetail> {
  const data = await apiFetch<ApiTagExtended[]>("/tags");
  const found = data.find((t) => String(t.id) === String(id));
  if (!found) throw new Error("タグが見つかりません");
  return mapTagDetail(found);
}

export type SaveTagInput = {
  name: string;
  color: string;
  tag_folder_id?: number | null;
  person_limit?: number | null;
  actions?: GreetingAction[];
  action_run_once?: boolean;
  limit_actions?: GreetingAction[];
  limit_action_run_once?: boolean;
};

/** POST /tags */
export async function createTag(input: SaveTagInput): Promise<MockTag> {
  const data = await apiFetch<ApiTag>("/tags", { method: "POST", body: input });
  return mapTag(data);
}

/** PUT /tags/{id} */
export async function updateTag(id: string, input: SaveTagInput): Promise<MockTag> {
  const data = await apiFetch<ApiTag>(`/tags/${id}`, { method: "PUT", body: input });
  return mapTag(data);
}

/** DELETE /tags/{id} */
export async function deleteTag(id: string): Promise<void> {
  await apiFetch(`/tags/${id}`, { method: "DELETE" });
}

/** POST /tags/bulk-move */
export async function bulkMoveTags(ids: string[], tagFolderId: string): Promise<void> {
  await apiFetch("/tags/bulk-move", {
    method: "POST",
    body: { ids: ids.map(Number), tag_folder_id: Number(tagFolderId) },
  });
}

/** POST /tags/bulk-delete */
export async function bulkDeleteTags(ids: string[]): Promise<void> {
  await apiFetch("/tags/bulk-delete", {
    method: "POST",
    body: { ids: ids.map(Number) },
  });
}

/** POST /tags/reorder */
export async function reorderTags(ids: string[]): Promise<void> {
  await apiFetch("/tags/reorder", { method: "POST", body: { ids: ids.map(Number) } });
}

/** 削除済みタグ（ゴミ箱）の一行。 */
export type TrashedTag = {
  id: string;
  name: string;
  color: string;
  friendsCount: number;
  deletedAt: string | null;
};

/** GET /tags/trashed */
export async function fetchTrashedTags(): Promise<TrashedTag[]> {
  const data = await apiFetch<ApiTagExtended[]>("/tags/trashed");
  return data.map((t) => ({
    id: String(t.id),
    name: t.name,
    color: t.color ?? "#9ca3af",
    friendsCount: t.friends_count ?? 0,
    deletedAt: t.deleted_at ?? null,
  }));
}

/** POST /tags/{id}/restore */
export async function restoreTag(id: string): Promise<void> {
  await apiFetch(`/tags/${id}/restore`, { method: "POST" });
}

/** DELETE /tags/{id}/force */
export async function forceDeleteTag(id: string): Promise<void> {
  await apiFetch(`/tags/${id}/force`, { method: "DELETE" });
}
