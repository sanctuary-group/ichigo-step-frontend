import { apiFetch } from "./client";
import { mapFriendField } from "./mappers";
import type { ApiFriendField } from "./types";
import type { MockFriendField } from "@/mocks/data";

/** GET /friend-fields */
export async function fetchFriendFields(params: { folder?: string } = {}): Promise<
  MockFriendField[]
> {
  const data = await apiFetch<ApiFriendField[]>("/friend-fields", {
    query: { folder: params.folder },
  });
  return data.map(mapFriendField);
}

/** DELETE /friend-fields/{id} */
export async function deleteFriendField(id: string): Promise<void> {
  await apiFetch(`/friend-fields/${id}`, { method: "DELETE" });
}
