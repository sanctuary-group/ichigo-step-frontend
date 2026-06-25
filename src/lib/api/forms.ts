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

/** POST /forms/{id}/publish, /unpublish */
export async function setFormPublished(id: string, published: boolean): Promise<MockForm> {
  const data = await apiFetch<ApiForm>(`/forms/${id}/${published ? "publish" : "unpublish"}`, {
    method: "POST",
  });
  return mapForm(data);
}
