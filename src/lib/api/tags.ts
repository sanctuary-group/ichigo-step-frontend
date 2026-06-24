import { apiFetch } from "./client";
import { mapTag } from "./mappers";
import type { ApiTag } from "./types";
import type { MockTag } from "@/mocks/data";

export type TagListParams = { folder?: string; q?: string };

export type TagWithCount = MockTag & { friendsCount: number };

/** GET /tags */
export async function fetchTags(params: TagListParams = {}): Promise<TagWithCount[]> {
  const data = await apiFetch<ApiTag[]>("/tags", {
    query: { folder: params.folder, q: params.q },
  });
  return data.map((t) => ({ ...mapTag(t), friendsCount: t.friends_count ?? 0 }));
}

export type SaveTagInput = {
  name: string;
  color: string;
  tag_folder_id?: number | null;
  person_limit?: number | null;
};

/** POST /tags */
export async function createTag(input: SaveTagInput): Promise<MockTag> {
  const data = await apiFetch<ApiTag>("/tags", { method: "POST", body: input });
  return mapTag(data);
}

/** PUT /tags/{id} */
export async function updateTag(id: string, input: SaveTagInput): Promise<MockTag> {
  const data = await apiFetch<ApiTag>(`/tags/${id}`, { method: "PUT", body: input });
  return mapTag(data);
}

/** DELETE /tags/{id} */
export async function deleteTag(id: string): Promise<void> {
  await apiFetch(`/tags/${id}`, { method: "DELETE" });
}
