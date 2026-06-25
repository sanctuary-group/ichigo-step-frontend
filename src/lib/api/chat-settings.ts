import { apiFetch } from "./client";

export type ChatAutoRead = {
  bracket: boolean;
  sticker: boolean;
  reactAll: boolean;
  reactKeyword: boolean;
  onReply: boolean;
  onBlock: boolean;
};

export type ChatSettings = {
  send_shortcut: "shift_enter_send" | "enter_send";
  short_url: boolean;
  send_preview: boolean;
  browser_notification: boolean;
  auto_read: ChatAutoRead;
};

/** 部分更新用ペイロード。 */
export type ChatSettingsPatch = Partial<
  Omit<ChatSettings, "auto_read">
> & { auto_read?: Partial<ChatAutoRead> };

/** GET /chat-settings */
export async function fetchChatSettings(): Promise<ChatSettings> {
  return apiFetch<ChatSettings>("/chat-settings");
}

/** PUT /chat-settings （部分更新可・auto_read はサーバ側でデフォルトとマージ） */
export async function updateChatSettings(
  payload: ChatSettingsPatch,
): Promise<ChatSettings> {
  return apiFetch<ChatSettings>("/chat-settings", {
    method: "PUT",
    body: payload,
  });
}

/** POST /chat/bulk-read （選択友だちの未読/既読を一括変更） */
export async function bulkUpdateRead(
  friendIds: string[],
  status: "read" | "unread",
): Promise<void> {
  await apiFetch("/chat/bulk-read", {
    method: "POST",
    body: { friend_ids: friendIds.map(Number), status },
  });
}
