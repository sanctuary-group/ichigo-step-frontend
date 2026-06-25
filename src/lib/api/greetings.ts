import { apiFetch, ApiError } from "./client";
import { mapGreeting } from "./mappers";
import type { ApiGreeting } from "./types";
import type { MockGreeting } from "@/mocks/data";
import type { Greeting } from "@/types/greeting";

export type GreetingType = "new_friend" | "existing" | "unblock";

/** GET /greetings/{type} */
export async function fetchGreeting(type: GreetingType): Promise<MockGreeting> {
  const data = await apiFetch<ApiGreeting>(`/greetings/${type}`);
  return mapGreeting(data);
}

/**
 * GET /greetings/{type} の生 Greeting を取得する（GreetingForm 用）。
 * 未設定の種別はサーバが 404 を返すため、その場合は null を返す。
 */
export async function fetchRawGreeting(
  type: GreetingType,
): Promise<Greeting | null> {
  try {
    return await apiFetch<Greeting>(`/greetings/${type}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
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
