import { apiFetch } from "./client";
import { mapGreeting } from "./mappers";
import type { ApiGreeting } from "./types";
import type { MockGreeting } from "@/mocks/data";

export type GreetingType = "new_friend" | "existing" | "unblock";

/** GET /greetings/{type} */
export async function fetchGreeting(type: GreetingType): Promise<MockGreeting> {
  const data = await apiFetch<ApiGreeting>(`/greetings/${type}`);
  return mapGreeting(data);
}

/** PUT /greetings/{type}（upsert） */
export async function saveGreeting(
  type: GreetingType,
  input: { is_active: boolean; message_type: "text"; text_content: string },
): Promise<MockGreeting> {
  const data = await apiFetch<ApiGreeting>(`/greetings/${type}`, {
    method: "PUT",
    body: { ...input, actions: [] },
  });
  return mapGreeting(data);
}
