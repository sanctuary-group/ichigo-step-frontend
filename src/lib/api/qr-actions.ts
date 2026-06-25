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

/** PATCH /qr-actions/{id}/toggle-active */
export async function toggleQrAction(id: string): Promise<MockQrAction> {
  const data = await apiFetch<ApiQrAction>(`/qr-actions/${id}/toggle-active`, { method: "PATCH" });
  return mapQrAction(data);
}
