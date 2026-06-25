import { apiFetch } from "./client";
import type { MockChatStatus } from "@/mocks/data";

type ApiChatStatus = {
  id: number;
  name: string;
  color: string | null;
  sort_order: number | null;
};

function mapChatStatus(s: ApiChatStatus): MockChatStatus {
  return {
    id: String(s.id),
    name: s.name,
    color: s.color ?? "#9ca3af",
  };
}

/** GET /chat-statuses */
export async function fetchChatStatuses(): Promise<MockChatStatus[]> {
  const data = await apiFetch<ApiChatStatus[]>("/chat-statuses");
  return data.map(mapChatStatus);
}

/** POST /chat-statuses */
export async function createChatStatus(payload: {
  name: string;
  color: string;
}): Promise<MockChatStatus> {
  const data = await apiFetch<ApiChatStatus>("/chat-statuses", {
    method: "POST",
    body: payload,
  });
  return mapChatStatus(data);
}

/** PUT /chat-statuses/{id} */
export async function updateChatStatus(
  id: string,
  payload: { name?: string; color?: string },
): Promise<MockChatStatus> {
  const data = await apiFetch<ApiChatStatus>(`/chat-statuses/${id}`, {
    method: "PUT",
    body: payload,
  });
  return mapChatStatus(data);
}

/** DELETE /chat-statuses/{id} */
export async function deleteChatStatus(id: string): Promise<void> {
  await apiFetch(`/chat-statuses/${id}`, { method: "DELETE" });
}
