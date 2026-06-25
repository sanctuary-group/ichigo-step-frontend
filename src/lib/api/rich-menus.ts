// リッチメニュー（移植版 RichMenus/Form）の取得・保存・公開を tenant API に橋渡しする。
import { apiFetch } from "./client";
import { API_ORIGIN } from "./config";
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
