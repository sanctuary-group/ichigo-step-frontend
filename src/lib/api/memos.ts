import { apiFetch } from "./client";

export type FriendMemo = {
  id: string;
  title: string | null;
  body: string | null;
};

type ApiMemo = {
  id: number;
  friend_id: number;
  title: string | null;
  body: string | null;
  sort_order: number;
};

const map = (m: ApiMemo): FriendMemo => ({ id: String(m.id), title: m.title, body: m.body });

/** GET /friends/{id}/memos */
export async function fetchMemos(friendId: string): Promise<FriendMemo[]> {
  const data = await apiFetch<ApiMemo[]>(`/friends/${friendId}/memos`);
  return data.map(map);
}

/** POST /friends/{id}/memos */
export async function createMemo(
  friendId: string,
  input: { title?: string; body: string },
): Promise<FriendMemo> {
  const data = await apiFetch<ApiMemo>(`/friends/${friendId}/memos`, {
    method: "POST",
    body: input,
  });
  return map(data);
}

/** DELETE /friends/{id}/memos/{memoId} */
export async function deleteMemo(friendId: string, memoId: string): Promise<void> {
  await apiFetch(`/friends/${friendId}/memos/${memoId}`, { method: "DELETE" });
}
