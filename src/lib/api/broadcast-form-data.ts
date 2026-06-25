// 配信フォーム（移植版 Broadcasts/Form）が必要とする生shapeを取得する。
// monolith の型（数値id）に合わせるため、Mock マッパーは通さない。
import { apiFetch } from "./client";
import type { LineChannel, ScenarioOption, RichMenuOption, ReminderOption } from "@/types/broadcast";
import type { Tag, ChatStatus } from "@/types/chat";
import type { FriendFieldFolder } from "@/components/broadcasts/filter-dialog";

type ApiMessagePart = {
  message_type: string;
  text_content?: string | null;
  image_url?: string | null;
  image_preview_url?: string | null;
  media_duration?: number | null;
  sticker_package_id?: number | null;
  sticker_id?: number | null;
  location_title?: string | null;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  panel_content?: unknown;
};

export type ImportTemplate = {
  id: number;
  name: string;
  messages: ApiMessagePart[];
};

export async function fetchFormChannels(): Promise<LineChannel[]> {
  return apiFetch<LineChannel[]>("/channels");
}

export async function fetchFormTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>("/tags");
}

export async function fetchFormChatStatuses(): Promise<ChatStatus[]> {
  return apiFetch<ChatStatus[]>("/chat-statuses");
}

export async function fetchFormTemplates(): Promise<ImportTemplate[]> {
  const data = await apiFetch<
    { id: number; name: string; messages?: ApiMessagePart[] }[]
  >("/templates");
  return data.map((t) => ({ id: t.id, name: t.name, messages: t.messages ?? [] }));
}

export async function fetchFormScenarios(): Promise<ScenarioOption[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/scenarios");
  return data.map((s) => ({ id: s.id, name: s.name }));
}

export async function fetchFormRichMenus(): Promise<RichMenuOption[]> {
  const data = await apiFetch<{ id: number; name: string; is_published?: boolean }[]>(
    "/rich-menus",
  );
  return data.map((r) => ({ id: r.id, name: r.name, is_published: !!r.is_published }));
}

export async function fetchFormReminders(): Promise<ReminderOption[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/reminders");
  return data.map((r) => ({ id: r.id, name: r.name }));
}

/** friend-field-folders + friend-fields を結合して {id,name,fields[]} を作る */
export async function fetchFormFriendFieldFolders(): Promise<FriendFieldFolder[]> {
  const [folders, fields] = await Promise.all([
    apiFetch<{ id: number; name: string }[]>("/friend-field-folders"),
    apiFetch<{ id: number; name: string; friend_field_folder_id: number | null }[]>(
      "/friend-fields",
    ),
  ]);
  return folders.map((f) => ({
    id: f.id,
    name: f.name,
    fields: fields
      .filter((x) => x.friend_field_folder_id === f.id)
      .map((x) => ({ id: x.id, name: x.name })),
  }));
}

/** 編集用: 単体ブロードキャスト取得（生shape） */
export async function fetchRawBroadcast(id: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/broadcasts/${id}`);
}

/** POST /broadcasts（移植版フォームの送信payloadをそのまま送る） */
export async function submitBroadcast(
  payload: Record<string, unknown>,
  editId?: string,
): Promise<void> {
  if (editId) {
    await apiFetch(`/broadcasts/${editId}`, { method: "PUT", body: payload });
  } else {
    await apiFetch("/broadcasts", { method: "POST", body: payload });
  }
}

/** POST /broadcasts/recipient-count */
export async function fetchRecipientCount(payload: {
  target_type: string;
  target_filter: unknown;
}): Promise<number | null> {
  const res = await apiFetch<{ count: number | null }>("/broadcasts/recipient-count", {
    method: "POST",
    body: payload,
  });
  return res?.count ?? null;
}
