import { apiFetch } from "./client";
import { mapAutoReply } from "./mappers";
import type { ApiAutoReply } from "./types";
import type { MockAutoReply } from "@/mocks/data";

/** GET /auto-replies */
export async function fetchAutoReplies(params: { folder?: string } = {}): Promise<MockAutoReply[]> {
  const data = await apiFetch<ApiAutoReply[]>("/auto-replies", {
    query: { folder: params.folder },
  });
  return data.map(mapAutoReply);
}

/** DELETE /auto-replies/{id} */
export async function deleteAutoReply(id: string): Promise<void> {
  await apiFetch(`/auto-replies/${id}`, { method: "DELETE" });
}

/** PATCH /auto-replies/{id}/toggle-active */
export async function toggleAutoReply(id: string): Promise<MockAutoReply> {
  const data = await apiFetch<ApiAutoReply>(`/auto-replies/${id}/toggle-active`, {
    method: "PATCH",
  });
  return mapAutoReply(data);
}
