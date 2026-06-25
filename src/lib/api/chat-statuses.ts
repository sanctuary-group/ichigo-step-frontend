import { apiFetch } from "./client";
import type { MockChatStatus } from "@/mocks/data";

type ApiChatStatus = {
  id: number;
  name: string;
  color: string | null;
  sort_order: number | null;
};

/** GET /chat-statuses */
export async function fetchChatStatuses(): Promise<MockChatStatus[]> {
  const data = await apiFetch<ApiChatStatus[]>("/chat-statuses");
  return data.map((s) => ({
    id: String(s.id),
    name: s.name,
    color: s.color ?? "#9ca3af",
  }));
}
