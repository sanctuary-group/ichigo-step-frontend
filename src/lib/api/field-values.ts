import { apiFetch } from "./client";

type ApiFieldValue = { friend_field_id: number; value: string | null };

/** GET /friends/{id}/field-values → { [fieldId]: value } */
export async function fetchFieldValues(friendId: string): Promise<Record<string, string>> {
  const data = await apiFetch<ApiFieldValue[]>(`/friends/${friendId}/field-values`);
  const out: Record<string, string> = {};
  for (const v of data) out[String(v.friend_field_id)] = v.value ?? "";
  return out;
}

/** PUT /friends/{id}/field-values */
export async function updateFieldValues(
  friendId: string,
  values: Record<string, string>,
): Promise<void> {
  // backend は { values: { [fieldId]: value } } を受け取る
  await apiFetch(`/friends/${friendId}/field-values`, {
    method: "PUT",
    body: { values },
  });
}
