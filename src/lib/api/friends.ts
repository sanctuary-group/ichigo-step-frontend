import { apiFetch, apiFetchPaginated, type Paginated } from "./client";
import { mapFriend, mapMessage } from "./mappers";
import type { ApiFriend, ApiMessage } from "./types";
import type { MockFriend, MockMessage } from "@/mocks/data";

export type FriendListParams = {
  mode?: "active" | "hidden" | "blocked";
  q?: string;
  tag?: string;
  sort?: "followed_at" | "last_message_at";
  dir?: "asc" | "desc";
  page?: number;
};

export type FriendListResult = {
  friends: MockFriend[];
  meta: Paginated<ApiFriend>["meta"];
};

/** GET /friends */
export async function fetchFriends(params: FriendListParams = {}): Promise<FriendListResult> {
  const { items, meta } = await apiFetchPaginated<ApiFriend>("/friends", {
    query: {
      mode: params.mode,
      q: params.q,
      tag: params.tag,
      sort: params.sort,
      dir: params.dir,
      page: params.page,
    },
  });
  return { friends: items.map(mapFriend), meta };
}

/** GET /friends/{id} */
export async function fetchFriend(id: string): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${id}`);
  return mapFriend(data);
}

/** GET /friends/{id}/messages */
export async function fetchFriendMessages(id: string): Promise<MockMessage[]> {
  const { items } = await apiFetchPaginated<ApiMessage>(`/friends/${id}/messages`);
  return items.map(mapMessage);
}

/** POST /friends/{id}/messages （テキスト1:1送信） */
export async function sendFriendMessage(id: string, content: string): Promise<MockMessage> {
  const data = await apiFetch<ApiMessage>(`/friends/${id}/messages`, {
    method: "POST",
    body: { content },
  });
  return mapMessage(data);
}

/** PATCH /friends/{id}/pin */
export async function toggleFriendPin(id: string): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${id}/pin`, { method: "PATCH" });
  return mapFriend(data);
}

/** PATCH /friends/{id}/hidden */
export async function toggleFriendHidden(id: string): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${id}/hidden`, { method: "PATCH" });
  return mapFriend(data);
}

/** PATCH /friends/{id}/chat-status */
export async function setFriendChatStatus(
  id: string,
  chatStatusId: string | null,
): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${id}/chat-status`, {
    method: "PATCH",
    body: { chat_status_id: chatStatusId != null ? Number(chatStatusId) : null },
  });
  return mapFriend(data);
}

/** PUT /friends/{id} （system_display_name / source / note 更新） */
export async function updateFriend(
  id: string,
  payload: { system_display_name?: string; source?: string; note?: string },
): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${id}`, { method: "PUT", body: payload });
  return mapFriend(data);
}

/** PUT /friends/{id}/tags （タグ一括同期） */
export async function syncFriendTags(id: string, tagIds: string[]): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${id}/tags`, {
    method: "PUT",
    body: { tag_ids: tagIds.map(Number) },
  });
  return mapFriend(data);
}

/** POST /friends/{id}/tags/{tagId} */
export async function attachFriendTag(id: string, tagId: string): Promise<void> {
  await apiFetch(`/friends/${id}/tags/${tagId}`, { method: "POST" });
}

/** DELETE /friends/{id}/tags/{tagId} */
export async function detachFriendTag(id: string, tagId: string): Promise<void> {
  await apiFetch(`/friends/${id}/tags/${tagId}`, { method: "DELETE" });
}
