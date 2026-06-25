import { apiFetch } from "./client";
import { mapForm } from "./mappers";
import type { ApiForm } from "./types";
import type { MockForm } from "@/mocks/data";

/** GET /forms */
export async function fetchForms(params: { folder?: string; q?: string } = {}): Promise<MockForm[]> {
  const data = await apiFetch<ApiForm[]>("/forms", {
    query: { folder: params.folder, q: params.q },
  });
  return data.map(mapForm);
}

/** POST /forms/bulk-delete */
export async function bulkDeleteForms(ids: string[]): Promise<void> {
  await apiFetch("/forms/bulk-delete", { method: "POST", body: { ids: ids.map(Number) } });
}

/** POST /forms（新規）/ PUT /forms/{id}（更新）。フォームビルダーの送信payload。 */
export async function saveForm(
  payload: unknown,
  editId?: string,
): Promise<ApiForm> {
  if (editId) {
    return apiFetch<ApiForm>(`/forms/${editId}`, { method: "PUT", body: payload });
  }
  return apiFetch<ApiForm>("/forms", { method: "POST", body: payload });
}

/** POST /forms/{id}/publish, /unpublish */
export async function setFormPublished(id: string, published: boolean): Promise<MockForm> {
  const data = await apiFetch<ApiForm>(`/forms/${id}/${published ? "publish" : "unpublish"}`, {
    method: "POST",
  });
  return mapForm(data);
}
