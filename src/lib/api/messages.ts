import { API_ORIGIN, TENANT_BASE } from "./config";
import { getToken } from "./token-store";
import { getCurrentChannelId } from "./channel-store";
import { ApiError, apiFetch } from "./client";
import { mapFriend, mapMessage } from "./mappers";
import type { ApiFriend, ApiMessage } from "./types";
import type { MockFriend, MockMessage } from "@/mocks/data";

/**
 * 1:1 チャットの送信・既読系 API。
 * 共有 friends.ts には載せず、チャットスレッド専用のエンドポイントをここへ集約する。
 *
 * 送信は backend の TenantMessageController@store（POST /friends/{id}/messages）。
 * テキストは JSON、画像は multipart/form-data（content または image のいずれか必須）。
 */

/** POST /friends/{id}/messages （テキスト送信） */
export async function sendTextMessage(
  friendId: string,
  content: string,
): Promise<MockMessage> {
  const data = await apiFetch<ApiMessage>(`/friends/${friendId}/messages`, {
    method: "POST",
    body: { content },
  });
  return mapMessage(data);
}

/**
 * POST /friends/{id}/messages （画像送信）
 * multipart/form-data で画像ファイルを直接送る。Content-Type はブラウザに任せる。
 */
export async function sendImageMessage(
  friendId: string,
  image: Blob,
): Promise<MockMessage> {
  const fd = new FormData();
  fd.append("image", image);

  const headers = new Headers({ Accept: "application/json" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const channelId = getCurrentChannelId();
  if (channelId) headers.set("X-Line-Channel-Id", channelId);

  const res = await fetch(`${API_ORIGIN}${TENANT_BASE}/friends/${friendId}/messages`, {
    method: "POST",
    headers, // Content-Type は付けない（boundary をブラウザに任せる）
    body: fd,
  });

  if (!res.ok) {
    let message = `画像送信に失敗しました (HTTP ${res.status})`;
    let errors: Record<string, string[]> | undefined;
    try {
      const json = await res.json();
      if (json?.message) message = json.message;
      if (json?.errors) errors = json.errors;
    } catch {
      /* JSON でない場合は既定メッセージ */
    }
    throw new ApiError(res.status, message, errors);
  }

  const json = await res.json();
  const data = (json && "data" in json ? json.data : json) as ApiMessage;
  return mapMessage(data);
}

/** PATCH /friends/{id}/read （既読/未読トグル） */
export async function toggleFriendRead(friendId: string): Promise<MockFriend> {
  const data = await apiFetch<ApiFriend>(`/friends/${friendId}/read`, {
    method: "PATCH",
  });
  return mapFriend(data);
}
