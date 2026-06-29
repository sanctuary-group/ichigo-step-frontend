// リッチメニュー（移植版 RichMenus/Form）の取得・保存・公開を tenant API に橋渡しする。
import { apiFetch, apiFetchPaginated } from "./client";
import { API_ORIGIN } from "./config";
import type { ApiFriend } from "./types";
import type { RichMenu } from "@/types/rich-menu";

/**
 * image_path から公開 URL を組み立てる（backend UploadController と同規約）。
 * Resource は image_url を返さないため、フロント側で image_path から導出する。
 */
function deriveImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (/^https?:\/\//.test(imagePath)) return imagePath;
  return `${API_ORIGIN}/storage/${imagePath.replace(/^\/+/, "")}`;
}

/** GET /rich-menus（folder / q フィルタ対応）。Resource は image_url を返さないため補完する。 */
export async function fetchRichMenus(params?: {
  folder?: number | string | null;
  q?: string;
}): Promise<RichMenu[]> {
  const data = await apiFetch<RichMenu[]>("/rich-menus", {
    query: {
      folder: params?.folder ?? undefined,
      q: params?.q || undefined,
    },
  });
  return data.map((m) => ({
    ...m,
    image_url: m.image_url ?? deriveImageUrl(m.image_path),
  }));
}

/** GET /rich-menus/{id} */
export async function fetchRichMenu(id: number | string): Promise<RichMenu> {
  return apiFetch<RichMenu>(`/rich-menus/${id}`);
}

/**
 * GET /rich-menus/{id}（編集フォーム用の raw 取得）。
 * apiFetch が `{ data }` を unwrap し、ビルダー Inner の `richMenu` prop が期待する
 * snake_case 形状 `RichMenu & { image_url? }` をそのまま返す。
 */
export async function fetchRawRichMenu(
  id: number | string,
): Promise<RichMenu & { image_url?: string | null }> {
  const data = await apiFetch<RichMenu & { image_url?: string | null }>(
    `/rich-menus/${id}`,
  );
  // Resource が image_url を返さない場合は image_path から導出して補完する。
  return { ...data, image_url: data.image_url ?? deriveImageUrl(data.image_path) };
}

/**
 * POST /rich-menus（新規）/ PUT /rich-menus/{id}（更新）。
 * 送信 payload は monolith RichMenuController::validatePayload と同 shape。
 */
export async function saveRichMenu(
  payload: Record<string, unknown>,
  editId?: number | string,
): Promise<RichMenu> {
  if (editId) {
    return apiFetch<RichMenu>(`/rich-menus/${editId}`, { method: "PUT", body: payload });
  }
  return apiFetch<RichMenu>("/rich-menus", { method: "POST", body: payload });
}

/** POST /rich-menus/{id}/publish */
export async function publishRichMenu(id: number | string): Promise<RichMenu> {
  return apiFetch<RichMenu>(`/rich-menus/${id}/publish`, { method: "POST" });
}

/** POST /rich-menus/{id}/unpublish */
export async function unpublishRichMenu(id: number | string): Promise<RichMenu> {
  return apiFetch<RichMenu>(`/rich-menus/${id}/unpublish`, { method: "POST" });
}

/** DELETE /rich-menus/{id}（公開中は LINE 取り下げ・画像削除込み）。 */
export async function deleteRichMenu(id: number | string): Promise<void> {
  await apiFetch(`/rich-menus/${id}`, { method: "DELETE" });
}

/** POST /rich-menus/bulk-delete */
export async function bulkDeleteRichMenus(
  ids: (number | string)[],
): Promise<{ deleted: number }> {
  return apiFetch<{ deleted: number }>("/rich-menus/bulk-delete", {
    method: "POST",
    body: { ids },
  });
}

/** 表示・停止画面（RichMenus/Display）が消費する友だち1件。 */
export type RichMenuDisplayFriend = {
  id: number;
  name: string;
  picture_url: string | null;
  linked: boolean;
};

/** 表示・停止画面のローダーが返すデータ一式。 */
export type RichMenuDisplayData = {
  displayCount: number;
  followingCount: number;
  friends: RichMenuDisplayFriend[];
};

/**
 * 表示・停止画面用のデータをまとめて取得する。
 * backend に専用エンドポイントが無いため GET /friends を全ページ取得し、
 *   - friends: 各友だち（linked = rich_menu_id === richMenuId）
 *   - displayCount: このリッチメニューが表示されている友だち数（rich_menu_id 一致）
 *   - followingCount: フォロー中の友だち総数（is_following）
 * を導出する。
 */
export async function fetchRichMenuDisplayData(
  richMenuId: number | string,
): Promise<RichMenuDisplayData> {
  const rid = Number(richMenuId);
  const all: ApiFriend[] = [];
  let page = 1;
  // friends は per_page=50 のページネーション。全件取得する。
  for (;;) {
    const { items, meta } = await apiFetchPaginated<ApiFriend>("/friends", {
      query: { page },
    });
    all.push(...items);
    if (page >= (meta.last_page ?? 1)) break;
    page += 1;
  }

  const friends: RichMenuDisplayFriend[] = all.map((f) => ({
    id: f.id,
    name: f.system_display_name || f.display_name || "（名前未設定）",
    picture_url: f.picture_url,
    linked: f.rich_menu_id === rid,
  }));

  return {
    friends,
    displayCount: all.filter((f) => f.rich_menu_id === rid).length,
    followingCount: all.filter((f) => f.is_following).length,
  };
}

/** 表示・停止の適用（POST /rich-menus/{id}/display）に送る payload。 */
export type DisplayRichMenuPayload = {
  mode: "show" | "stop";
  schedule: "now" | "reserved";
  scheduled_at: string | null;
  target: "all" | "individual";
  friend_ids: number[];
};

/**
 * POST /rich-menus/{id}/display（applyDisplay）。
 * mode=show|stop, schedule=now|reserved, target=all|individual。実 LINE 反映あり。
 */
export async function displayRichMenu(
  id: number | string,
  payload: DisplayRichMenuPayload,
): Promise<{ status: string; message?: string }> {
  return apiFetch<{ status: string; message?: string }>(
    `/rich-menus/${id}/display`,
    { method: "POST", body: payload },
  );
}

/** POST /rich-menus/bulk-move */
export async function bulkMoveRichMenus(
  ids: (number | string)[],
  folderId: number | string,
): Promise<{ moved: number }> {
  return apiFetch<{ moved: number }>("/rich-menus/bulk-move", {
    method: "POST",
    body: { ids, folder_id: Number(folderId) },
  });
}

/** POST /rich-menus/reorder（並べ替え後の id 配列）。 */
export async function reorderRichMenus(ids: number[]): Promise<void> {
  await apiFetch("/rich-menus/reorder", { method: "POST", body: { ids } });
}
