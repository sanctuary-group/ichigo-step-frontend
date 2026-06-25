import { apiFetch } from "./client";
import { mapQrAction } from "./mappers";
import type { ApiQrAction } from "./types";
import type { MockQrAction } from "@/mocks/data";

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
