// リッチメニュー（移植版 RichMenus/Form）の取得・保存・公開を tenant API に橋渡しする。
import { apiFetch } from "./client";
import type { RichMenu } from "@/types/rich-menu";

/** GET /rich-menus */
export async function fetchRichMenus(): Promise<RichMenu[]> {
  return apiFetch<RichMenu[]>("/rich-menus");
}

/** GET /rich-menus/{id} */
export async function fetchRichMenu(id: number | string): Promise<RichMenu> {
  return apiFetch<RichMenu>(`/rich-menus/${id}`);
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
