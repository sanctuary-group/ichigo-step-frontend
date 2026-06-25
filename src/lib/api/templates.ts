import { apiFetch } from "./client";
import { mapTemplate } from "./mappers";
import type { ApiTemplate } from "./types";
import type { MockTemplate } from "@/mocks/data";
import type {
  Template,
  TemplateMessage,
  TemplateMessageType,
  PanelContent,
} from "@/types/template";

export type TemplateListParams = {
  folder?: string;
  q?: string;
  sort?: "name" | "created_at" | "updated_at";
  dir?: "asc" | "desc";
};

/** GET /templates */
export async function fetchTemplates(params: TemplateListParams = {}): Promise<MockTemplate[]> {
  const data = await apiFetch<ApiTemplate[]>("/templates", {
    query: { folder: params.folder, q: params.q, sort: params.sort, dir: params.dir },
  });
  return data.map(mapTemplate);
}

// ── 生テンプレート（messages 含む）。Edit/Index の表示で使う ──

type ApiTemplateFull = ApiTemplate & {
  organization_id?: number;
};

function mapMessage(m: NonNullable<ApiTemplate["messages"]>[number]): TemplateMessage {
  return {
    id: m.id,
    sort_order: m.sort_order,
    message_type: (m.message_type as TemplateMessageType) ?? "text",
    text_content: m.text_content,
    image_url: m.image_url,
    image_preview_url: m.image_preview_url,
    media_duration: m.media_duration,
    sticker_package_id:
      m.sticker_package_id != null ? Number(m.sticker_package_id) : null,
    sticker_id: m.sticker_id != null ? Number(m.sticker_id) : null,
    location_title: m.location_title,
    location_address: m.location_address,
    latitude: m.latitude,
    longitude: m.longitude,
    panel_content: (m.panel_content as PanelContent | null) ?? null,
  };
}

function mapRawTemplate(api: ApiTemplateFull): Template {
  return {
    id: api.id,
    organization_id: api.organization_id ?? 0,
    template_folder_id: api.template_folder_id,
    name: api.name,
    content: api.content ?? "",
    image_url: api.image_url,
    image_preview_url: api.image_preview_url,
    delay_send: api.delay_send,
    messages: (api.messages ?? []).map(mapMessage),
    created_at: api.created_at ?? "",
    updated_at: api.updated_at ?? "",
  };
}

/** GET /templates → 生 Template[]（messages 含む） */
export async function fetchRawTemplates(
  params: TemplateListParams = {},
): Promise<Template[]> {
  const data = await apiFetch<ApiTemplateFull[]>("/templates", {
    query: { folder: params.folder, q: params.q, sort: params.sort, dir: params.dir },
  });
  return data.map(mapRawTemplate);
}

/** GET /templates から id 一致を抽出（単体取得APIが無いため一覧から取得） */
export async function fetchRawTemplate(id: number | string): Promise<Template | null> {
  const all = await fetchRawTemplates();
  return all.find((t) => String(t.id) === String(id)) ?? null;
}

/** POST /templates （template_folder_id 必須） */
export async function createTemplate(input: {
  name: string;
  template_folder_id: number;
  delay_send?: boolean;
}): Promise<MockTemplate> {
  const data = await apiFetch<ApiTemplate>("/templates", { method: "POST", body: input });
  return mapTemplate(data);
}

/** PUT /templates/{id} */
export async function updateTemplate(
  id: string | number,
  input: { name?: string; template_folder_id?: number; delay_send?: boolean },
): Promise<MockTemplate> {
  const data = await apiFetch<ApiTemplate>(`/templates/${id}`, { method: "PUT", body: input });
  return mapTemplate(data);
}

/** DELETE /templates/{id} */
export async function deleteTemplate(id: string | number): Promise<void> {
  await apiFetch(`/templates/${id}`, { method: "DELETE" });
}

/** POST /templates/bulk-delete */
export async function bulkDeleteTemplates(ids: number[]): Promise<void> {
  await apiFetch("/templates/bulk-delete", { method: "POST", body: { ids } });
}

/** POST /templates/bulk-move */
export async function bulkMoveTemplates(
  ids: number[],
  templateFolderId: number,
): Promise<void> {
  await apiFetch("/templates/bulk-move", {
    method: "POST",
    body: { ids, template_folder_id: templateFolderId },
  });
}

/** POST /templates/reorder */
export async function reorderTemplates(ids: number[]): Promise<void> {
  await apiFetch("/templates/reorder", { method: "POST", body: { ids } });
}

/** POST /templates/{id}/send-option */
export async function setTemplateSendOption(
  id: number | string,
  delaySend: boolean,
): Promise<void> {
  await apiFetch(`/templates/${id}/send-option`, {
    method: "POST",
    body: { delay_send: delaySend },
  });
}

export type TestSendResult = { sent: number; failed?: string[] };

/** POST /templates/{id}/test-send */
export async function testSendTemplate(
  id: number | string,
  friendIds: number[],
): Promise<TestSendResult> {
  return apiFetch<TestSendResult>(`/templates/${id}/test-send`, {
    method: "POST",
    body: { friend_ids: friendIds },
  });
}

// ── テストユーザー（クイックテスト用） ──
export type TestUser = { id: number; name: string; picture_url: string | null };

/** GET /templates/test-users */
export async function fetchTestUsers(): Promise<TestUser[]> {
  const data = await apiFetch<{ users?: TestUser[] } | TestUser[]>(
    "/templates/test-users",
  );
  if (Array.isArray(data)) return data;
  return data.users ?? [];
}

// ── メッセージ CRUD ──

/** メッセージ保存用ペイロード（normalizeComposerValue の出力をそのまま渡す） */
export type TemplateMessageInput = {
  message_type: TemplateMessageType;
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
  panel_content?: PanelContent | null;
};

/** POST /templates/{id}/messages */
export async function createTemplateMessage(
  templateId: number | string,
  input: TemplateMessageInput,
): Promise<void> {
  await apiFetch(`/templates/${templateId}/messages`, { method: "POST", body: input });
}

/** PUT /templates/{id}/messages/{messageId} */
export async function updateTemplateMessage(
  templateId: number | string,
  messageId: number | string,
  input: TemplateMessageInput,
): Promise<void> {
  await apiFetch(`/templates/${templateId}/messages/${messageId}`, {
    method: "PUT",
    body: input,
  });
}

/** DELETE /templates/{id}/messages/{messageId} */
export async function deleteTemplateMessage(
  templateId: number | string,
  messageId: number | string,
): Promise<void> {
  await apiFetch(`/templates/${templateId}/messages/${messageId}`, { method: "DELETE" });
}

/** POST /templates/{id}/messages/bulk-delete */
export async function bulkDeleteTemplateMessages(
  templateId: number | string,
  ids: number[],
): Promise<void> {
  await apiFetch(`/templates/${templateId}/messages/bulk-delete`, {
    method: "POST",
    body: { ids },
  });
}

/** POST /templates/{id}/messages/reorder */
export async function reorderTemplateMessages(
  templateId: number | string,
  ids: number[],
): Promise<void> {
  await apiFetch(`/templates/${templateId}/messages/reorder`, {
    method: "POST",
    body: { ids },
  });
}
