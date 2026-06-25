// アクションビルダー（ActionDialog）が必要とする選択肢を tenant API から取得する。
// monolith の AutoReplyController::builderOptions() と同じ shape を返す。
import { apiFetch } from "./client";
import type { ScenarioRef } from "@/components/greetings/greeting-form";
import type {
  RichMenuRef,
  TemplateRef,
  TemplateFolderRef,
  ReminderRef,
  FriendFieldRef,
  FriendFieldFolderRef,
} from "@/types/greeting";
import type { Tag, ChatStatus } from "@/types/chat";

export type BuilderOptions = {
  scenarios: ScenarioRef[];
  richMenus: RichMenuRef[];
  templates: TemplateRef[];
  templateFolders: TemplateFolderRef[];
  reminders: ReminderRef[];
  friendFields: FriendFieldRef[];
  friendFieldFolders: FriendFieldFolderRef[];
};

export type BuilderFolderOption = { id: number; name: string; is_system: boolean };

export async function fetchScenarioRefs(): Promise<ScenarioRef[]> {
  const data = await apiFetch<{ id: number; name: string; steps_count?: number }[]>(
    "/scenarios",
  );
  return data.map((s) => ({ id: s.id, name: s.name, steps_count: s.steps_count }));
}

export async function fetchRichMenuRefs(): Promise<RichMenuRef[]> {
  const data = await apiFetch<{ id: number; name: string; is_published?: boolean }[]>(
    "/rich-menus",
  );
  return data
    .filter((r) => r.is_published !== false)
    .map((r) => ({ id: r.id, name: r.name }));
}

export async function fetchTemplateRefs(): Promise<TemplateRef[]> {
  const data = await apiFetch<
    { id: number; name: string; template_folder_id: number | null }[]
  >("/templates");
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    template_folder_id: t.template_folder_id ?? null,
  }));
}

export async function fetchTemplateFolderRefs(): Promise<TemplateFolderRef[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/template-folders");
  return data.map((f) => ({ id: f.id, name: f.name }));
}

export async function fetchReminderRefs(): Promise<ReminderRef[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/reminders");
  return data.map((r) => ({ id: r.id, name: r.name }));
}

export async function fetchFriendFieldRefs(): Promise<FriendFieldRef[]> {
  const data = await apiFetch<
    {
      id: number;
      name: string;
      field_type: string;
      friend_field_folder_id: number | null;
      options: string[] | null;
    }[]
  >("/friend-fields");
  return data.map((f) => ({
    id: f.id,
    name: f.name,
    field_type: f.field_type,
    friend_field_folder_id: f.friend_field_folder_id ?? null,
    options: f.options ?? null,
  }));
}

export async function fetchFriendFieldFolderRefs(): Promise<FriendFieldFolderRef[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/friend-field-folders");
  return data.map((f) => ({ id: f.id, name: f.name }));
}

export async function fetchTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>("/tags");
}

export async function fetchChatStatuses(): Promise<ChatStatus[]> {
  return apiFetch<ChatStatus[]>("/chat-statuses");
}

/** ActionDialog 用の選択肢一式をまとめて取得する。 */
export async function fetchBuilderOptions(): Promise<BuilderOptions> {
  const [
    scenarios,
    richMenus,
    templates,
    templateFolders,
    reminders,
    friendFields,
    friendFieldFolders,
  ] = await Promise.all([
    fetchScenarioRefs(),
    fetchRichMenuRefs(),
    fetchTemplateRefs(),
    fetchTemplateFolderRefs(),
    fetchReminderRefs(),
    fetchFriendFieldRefs(),
    fetchFriendFieldFolderRefs(),
  ]);
  return {
    scenarios,
    richMenus,
    templates,
    templateFolders,
    reminders,
    friendFields,
    friendFieldFolders,
  };
}
