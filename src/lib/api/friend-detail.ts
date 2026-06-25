// 1:1 チャット 右情報パネル専用の API 集約。
// monolith の right-info-panel が Inertia props / router で扱っていた
// 「カスタム項目保存・表示項目設定・タグ一括・メモ編集/並べ替え・
//  友だち操作(ステップ/リッチメニュー/ブロック/削除)・フォーム回答取得」を
// テナント API (apiFetch) 経由の関数として提供する。
//
// 既存共有 api（friends.ts / memos.ts / field-values.ts）の既存関数は再利用するが、
// 右パネルは monolith に忠実な型（field_type / options / show_in_chat_panel 等）を
// 必要とするため、ここでは Mock マッパを通さず生の API レスポンス型を扱う。

import { apiFetch, apiFetchPaginated } from "./client";
import type { ApiFriend, ApiFriendField } from "./types";

/* ─────────────────────────── 友だち詳細（基本情報タブ用の生データ） ─────────────────────────── */

// 右パネル基本情報タブは MockFriend に無いフィールド
// （status_message / unfollowed_at / line_user_id / rich_menu_id 等）も表示するため、
// FriendResource を mapper を通さず生で取得する。
export type FriendDetail = ApiFriend & {
  rich_menu?: { id: number; name: string } | null;
  active_scenario?: { id: number; name: string } | null;
};

/** GET /friends/{id} → 右パネル用に FriendResource を生のまま返す。 */
export async function fetchFriendDetail(friendId: number): Promise<FriendDetail> {
  return apiFetch<FriendDetail>(`/friends/${friendId}`);
}

/* ─────────────────────────── 友だち情報項目（カスタム項目） ─────────────────────────── */

export type FriendFieldDetail = {
  id: number;
  name: string;
  field_type: "text" | "choice" | "number" | "date" | "phone" | "email" | string;
  options: string[];
  show_in_chat_panel: boolean;
  folder: { id: number; name: string } | null;
};

function mapFieldDetail(api: ApiFriendField & { friend_field_folder?: { id: number; name: string } | null }): FriendFieldDetail {
  const opts = Array.isArray(api.options)
    ? (api.options as unknown[]).map((o) => String(o))
    : [];
  return {
    id: api.id,
    name: api.name,
    field_type: api.field_type,
    options: opts,
    show_in_chat_panel: Boolean(api.show_in_chat_panel),
    folder: api.friend_field_folder
      ? { id: api.friend_field_folder.id, name: api.friend_field_folder.name }
      : null,
  };
}

/** GET /friend-fields → 右パネル用の詳細型（field_type / options / show_in_chat_panel を保持）。 */
export async function fetchFriendFieldDefs(): Promise<FriendFieldDetail[]> {
  const data = await apiFetch<(ApiFriendField & { friend_field_folder?: { id: number; name: string } | null })[]>(
    "/friend-fields",
  );
  return data.map(mapFieldDetail);
}

export type FieldValueLite = { friend_field_id: number; value: string | null };

/** GET /friends/{id}/field-values → {friend_field_id, value}[]。 */
export async function fetchFriendFieldValues(friendId: number): Promise<FieldValueLite[]> {
  return apiFetch<FieldValueLite[]>(`/friends/${friendId}/field-values`);
}

/** PUT /friends/{id}/field-values（{ values: { [fieldId]: value } }）。 */
export async function saveFriendFieldValues(
  friendId: number,
  values: Record<number, string>,
): Promise<void> {
  await apiFetch(`/friends/${friendId}/field-values`, {
    method: "PUT",
    body: { values },
  });
}

/** POST /chat/field-visibility（表示する項目の id 配列）。 */
export async function saveFieldVisibility(fieldIds: number[]): Promise<void> {
  await apiFetch(`/chat/field-visibility`, {
    method: "POST",
    body: { field_ids: fieldIds },
  });
}

/* ─────────────────────────── タグ一括 ─────────────────────────── */

/** PUT /friends/{id}/tags（タグを指定集合へ一括同期）。 */
export async function syncFriendTagIds(friendId: number, tagIds: number[]): Promise<void> {
  await apiFetch(`/friends/${friendId}/tags`, {
    method: "PUT",
    body: { tag_ids: tagIds },
  });
}

/** DELETE /friends/{id}/tags/{tagId}（個別解除）。 */
export async function detachFriendTagId(friendId: number, tagId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}/tags/${tagId}`, { method: "DELETE" });
}

/* ─────────────────────────── メモ ─────────────────────────── */

export type MemoDetail = {
  id: number;
  title: string | null;
  body: string | null;
  sort_order: number;
  updated_at: string | null;
};

type ApiMemoFull = {
  id: number;
  title: string | null;
  body: string | null;
  sort_order: number;
  updated_at: string | null;
};

/** GET /friends/{id}/memos。 */
export async function fetchFriendMemos(friendId: number): Promise<MemoDetail[]> {
  const data = await apiFetch<ApiMemoFull[]>(`/friends/${friendId}/memos`);
  return data.map((m) => ({
    id: m.id,
    title: m.title,
    body: m.body,
    sort_order: m.sort_order ?? 0,
    updated_at: m.updated_at ?? null,
  }));
}

/** POST /friends/{id}/memos。 */
export async function createFriendMemo(
  friendId: number,
  input: { title: string; body: string },
): Promise<void> {
  await apiFetch(`/friends/${friendId}/memos`, { method: "POST", body: input });
}

/** PATCH /friends/{id}/memos/{memoId}。 */
export async function updateFriendMemo(
  friendId: number,
  memoId: number,
  input: { title: string; body: string },
): Promise<void> {
  await apiFetch(`/friends/${friendId}/memos/${memoId}`, { method: "PATCH", body: input });
}

/** DELETE /friends/{id}/memos/{memoId}。 */
export async function deleteFriendMemo(friendId: number, memoId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}/memos/${memoId}`, { method: "DELETE" });
}

/** POST /friends/{id}/memos/reorder（並び替え後の id 配列）。 */
export async function reorderFriendMemos(friendId: number, ids: number[]): Promise<void> {
  await apiFetch(`/friends/${friendId}/memos/reorder`, { method: "POST", body: { ids } });
}

/* ─────────────────────────── 友だち操作（基本情報編集 / 友だち削除） ─────────────────────────── */

/** PUT /friends/{id}（system_display_name / source / note の更新）。 */
export async function updateFriendBasic(
  friendId: number,
  payload: { system_display_name?: string | null; source?: string | null; note?: string | null },
): Promise<void> {
  await apiFetch(`/friends/${friendId}`, { method: "PUT", body: payload });
}

/**
 * GET /friends/{id}/messages のページネーション meta から総メッセージ数を取得。
 * （テナント API に messageCount 専用エンドポイントが無いため meta.total を使う）
 */
export async function fetchFriendMessageCount(friendId: number): Promise<number> {
  const { meta } = await apiFetchPaginated(`/friends/${friendId}/messages`);
  return meta.total ?? 0;
}

/** POST /friends/{id}/refresh-profile（LINE プロフィール再取得）。 */
export async function refreshFriendProfile(friendId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}/refresh-profile`, { method: "POST" });
}

/** DELETE /friends/{id}（友だち削除）。 */
export async function deleteFriend(friendId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}`, { method: "DELETE" });
}

/* ─────────────────────────── ステップ配信操作 ─────────────────────────── */

export type ScenarioStepLite = { step_order: number };
export type ScenarioLite = { id: number; name: string; steps: ScenarioStepLite[] };
export type ScenarioFolderTree = { id: number; name: string; scenarios: ScenarioLite[] };

type ApiScenarioForTree = {
  id: number;
  name: string;
  scenario_folder_id: number | null;
  steps?: { step_order: number }[];
};
type ApiFolder = { id: number; name: string };

/**
 * GET /scenario-folders + GET /scenarios を結合し、
 * フォルダ → シナリオ（steps 付き）のツリーに整形する。
 * 未分類（folder_id null）は先頭に「未分類」として配置。
 */
export async function fetchScenarioTree(): Promise<ScenarioFolderTree[]> {
  const [folders, scenarios] = await Promise.all([
    apiFetch<ApiFolder[]>("/scenario-folders"),
    apiFetch<ApiScenarioForTree[]>("/scenarios"),
  ]);

  const mapScenario = (s: ApiScenarioForTree): ScenarioLite => ({
    id: s.id,
    name: s.name,
    steps: (s.steps ?? []).map((st) => ({ step_order: st.step_order })),
  });

  const byFolder = new Map<number | null, ScenarioLite[]>();
  for (const s of scenarios) {
    const key = s.scenario_folder_id ?? null;
    const arr = byFolder.get(key) ?? [];
    arr.push(mapScenario(s));
    byFolder.set(key, arr);
  }

  const tree: ScenarioFolderTree[] = [];
  const unclassified = byFolder.get(null) ?? [];
  if (unclassified.length > 0) {
    tree.push({ id: 0, name: "未分類", scenarios: unclassified });
  }
  for (const f of folders) {
    tree.push({ id: f.id, name: f.name, scenarios: byFolder.get(f.id) ?? [] });
  }
  return tree;
}

/** POST /friends/{id}/scenario/enroll（開始・変更）。 */
export async function enrollScenario(
  friendId: number,
  scenarioId: number,
  startStepOrder?: number,
): Promise<void> {
  const body: Record<string, number> = { scenario_id: scenarioId };
  if (startStepOrder && startStepOrder > 0) body.start_step_order = startStepOrder;
  await apiFetch(`/friends/${friendId}/scenario/enroll`, { method: "POST", body });
}

/** POST /friends/{id}/scenario/stop（停止）。 */
export async function stopScenario(friendId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}/scenario/stop`, { method: "POST" });
}

/* ─────────────────────────── リッチメニュー操作 ─────────────────────────── */

export type RichMenuOption = { id: number; name: string };

type ApiRichMenu = { id: number; name: string; is_published?: boolean };

/** GET /rich-menus → 公開済みのみを選択肢として返す。 */
export async function fetchRichMenuOptions(): Promise<RichMenuOption[]> {
  const data = await apiFetch<ApiRichMenu[]>("/rich-menus");
  return data
    .filter((r) => r.is_published)
    .map((r) => ({ id: r.id, name: r.name }));
}

/** POST /friends/{id}/rich-menu（リッチメニュー表示・変更）。 */
export async function linkRichMenu(friendId: number, richMenuId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}/rich-menu`, {
    method: "POST",
    body: { rich_menu_id: richMenuId },
  });
}

/** POST /friends/{id}/rich-menu/stop（表示停止）。 */
export async function unlinkRichMenu(friendId: number): Promise<void> {
  await apiFetch(`/friends/${friendId}/rich-menu/stop`, { method: "POST" });
}

/* ─────────────────────────── フォーム回答 ─────────────────────────── */

export type FormResponseLite = {
  id: number;
  form_name: string;
  submitted_at: string | null;
};

/**
 * GET /friends/{id}/form-responses（フォーム回答一覧）。
 * 注意: テナント API に当該エンドポイントは未実装。実装されるまでは空配列を返す。
 */
export async function fetchFriendFormResponses(friendId: number): Promise<FormResponseLite[]> {
  try {
    return await apiFetch<FormResponseLite[]>(`/friends/${friendId}/form-responses`);
  } catch {
    // エンドポイント未実装（404）時は空配列にフォールバック。
    return [];
  }
}
