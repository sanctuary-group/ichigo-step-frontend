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

/** POST /friend-fields */
export async function createFriendField(input: {
  name: string;
  friend_field_folder_id: number;
  field_type: "choice" | "text" | "number" | "date" | "phone" | "email";
  run_mode: "once" | "repeat";
  options?: string[];
}): Promise<MockFriendField> {
  const data = await apiFetch<ApiFriendField>("/friend-fields", { method: "POST", body: input });
  return mapFriendField(data);
}

/** DELETE /friend-fields/{id} */
export async function deleteFriendField(id: string): Promise<void> {
  await apiFetch(`/friend-fields/${id}`, { method: "DELETE" });
}
