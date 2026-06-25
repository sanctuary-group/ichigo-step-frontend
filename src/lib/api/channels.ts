import { apiFetch } from "./client";
import { mapChannel } from "./mappers";
import type { ApiLineChannel } from "./types";
import type { MockChannel } from "@/mocks/data";

/** GET /api/tenant/v1/channels → MockChannel[] */
export async function fetchChannels(): Promise<MockChannel[]> {
  const data = await apiFetch<ApiLineChannel[]>("/channels", { base: "tenant" });
  return data.map(mapChannel);
}

export type CreateChannelInput = {
  name: string;
  channel_id: string;
  channel_secret: string;
  channel_access_token: string;
  basic_id?: string;
  liff_id?: string;
};

/** POST /channels */
export async function createChannel(input: CreateChannelInput): Promise<MockChannel> {
  const data = await apiFetch<ApiLineChannel>("/channels", { method: "POST", body: input });
  return mapChannel(data);
}

/** DELETE /channels/{id} */
export async function deleteChannel(id: string): Promise<void> {
  await apiFetch(`/channels/${id}`, { method: "DELETE" });
}
