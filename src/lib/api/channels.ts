import { API_ORIGIN } from "./config";
import { apiFetch } from "./client";
import { mapChannel } from "./mappers";
import type { ApiLineChannel } from "./types";
import type { MockChannel } from "@/mocks/data";

/** GET /api/tenant/v1/channels → MockChannel[]（チャネル切替UI用の最小形） */
export async function fetchChannels(): Promise<MockChannel[]> {
  const data = await apiFetch<ApiLineChannel[]>("/channels", { base: "tenant" });
  return data.map(mapChannel);
}

/** 設定画面で必要なチャネルの全フィールド。Webhook URL は channel_id から導出。 */
export type ChannelDetail = {
  id: string;
  name: string;
  basicId: string | null;
  channelId: string | null;
  liffId: string | null;
  isActive: boolean;
  connectionVerifiedAt: string | null;
  webhookUrl: string | null;
};

/** チャネル固有の Webhook URL を組み立てる。 */
export function channelWebhookUrl(channelId: string | null): string | null {
  if (!channelId) return null;
  return `${API_ORIGIN}/api/line/webhook/${channelId}`;
}

function mapChannelDetail(api: ApiLineChannel): ChannelDetail {
  return {
    id: String(api.id),
    name: api.name,
    basicId: api.basic_id,
    channelId: api.channel_id,
    liffId: api.liff_id,
    isActive: api.is_active,
    connectionVerifiedAt: api.connection_verified_at,
    webhookUrl: channelWebhookUrl(api.channel_id),
  };
}

/** GET /channels → ChannelDetail[]（設定画面用） */
export async function fetchChannelDetails(): Promise<ChannelDetail[]> {
  const data = await apiFetch<ApiLineChannel[]>("/channels");
  return data.map(mapChannelDetail);
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
export async function createChannel(input: CreateChannelInput): Promise<ChannelDetail> {
  const data = await apiFetch<ApiLineChannel>("/channels", { method: "POST", body: input });
  return mapChannelDetail(data);
}

export type UpdateChannelInput = {
  name: string;
  channel_id: string;
  basic_id?: string;
  liff_id?: string;
  /** 空欄なら既存維持 */
  channel_secret?: string;
  channel_access_token?: string;
};

/** PUT /channels/{id} */
export async function updateChannel(
  id: string,
  input: UpdateChannelInput,
): Promise<ChannelDetail> {
  const data = await apiFetch<ApiLineChannel>(`/channels/${id}`, {
    method: "PUT",
    body: input,
  });
  return mapChannelDetail(data);
}

/** DELETE /channels/{id} */
export async function deleteChannel(id: string): Promise<void> {
  await apiFetch(`/channels/${id}`, { method: "DELETE" });
}

/** GET /channels/{id}/credentials → 復号済み認証情報（編集フォーム用） */
export async function fetchCredentials(id: string): Promise<{
  channel_secret: string | null;
  channel_access_token: string | null;
}> {
  return apiFetch(`/channels/${id}/credentials`);
}

/** POST /channels/{id}/test → 接続テスト。成功で connection_verified_at 更新。 */
export async function testChannel(id: string): Promise<{ ok: boolean; name: string }> {
  return apiFetch(`/channels/${id}/test`, { method: "POST" });
}
