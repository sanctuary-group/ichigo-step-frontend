import { apiFetch } from "./client";
import { mapChannel } from "./mappers";
import type { ApiLineChannel } from "./types";
import type { MockChannel } from "@/mocks/data";

/** GET /api/tenant/v1/channels → MockChannel[] */
export async function fetchChannels(): Promise<MockChannel[]> {
  const data = await apiFetch<ApiLineChannel[]>("/channels", { base: "tenant" });
  return data.map(mapChannel);
}
