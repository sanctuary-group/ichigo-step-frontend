// 移植版 RichMenus/Form のローダーが必要とする選択肢を tenant API から取得する。
// monolith RichMenuController::create() の builderOptions shape に揃える。
// layouts は API が無いため RichMenuLayouts.php を写経した定数で供給する。
import { apiFetch } from "./client";
import type { RichMenuLayout } from "@/types/rich-menu";

type FolderOption = { id: number; name: string; is_system: boolean };

export type RichMenuActionTemplate = {
  id: number;
  name: string;
  folder_id: number | null;
};
export type RichMenuActionTemplateFolder = { id: number; name: string };
export type RichMenuActionTag = { id: number; name: string; color?: string | null };
type ActionOptionItem = { id: number; name: string };
type ActionFieldFolder = {
  id: number;
  name: string;
  fields: { id: number; name: string }[];
};
type ActionFormOption = { id: number; name: string; url: string };
export type ActionOptions = {
  tags: RichMenuActionTag[];
  chatStatuses: ActionOptionItem[];
  friendFieldFolders: ActionFieldFolder[];
  scenarios: ActionOptionItem[];
  richMenus: { id: number; name: string; is_published: boolean }[];
  reminders: ActionOptionItem[];
  forms: ActionFormOption[];
};

/** RichMenuLayouts.php（唯一の情報源）を写経した定型レイアウト定義。 */
const SIZES = {
  large: { width: 2500, height: 1686 },
  compact: { width: 2500, height: 843 },
} as const;

function layout(
  key: string,
  label: string,
  size: "large" | "compact",
  areas: [number, number, number, number][],
): RichMenuLayout {
  return {
    key,
    label,
    size,
    width: SIZES[size].width,
    height: SIZES[size].height,
    areas: areas.map(([x, y, width, height]) => ({ x, y, width, height })),
  };
}

export const RICH_MENU_LAYOUTS: RichMenuLayout[] = [
  layout("large_6", "大: 6分割 (3×2)", "large", [
    [0, 0, 833, 843], [833, 0, 834, 843], [1667, 0, 833, 843],
    [0, 843, 833, 843], [833, 843, 834, 843], [1667, 843, 833, 843],
  ]),
  layout("large_4", "大: 4分割 (2×2)", "large", [
    [0, 0, 1250, 843], [1250, 0, 1250, 843],
    [0, 843, 1250, 843], [1250, 843, 1250, 843],
  ]),
  layout("large_3v", "大: 3分割 (縦)", "large", [
    [0, 0, 833, 1686], [833, 0, 834, 1686], [1667, 0, 833, 1686],
  ]),
  layout("large_2v", "大: 2分割 (縦)", "large", [
    [0, 0, 1250, 1686], [1250, 0, 1250, 1686],
  ]),
  layout("large_2lr", "大: 2分割 (左大・右小)", "large", [
    [0, 0, 1667, 1686], [1667, 0, 833, 1686],
  ]),
  layout("large_2h", "大: 2分割 (横)", "large", [
    [0, 0, 2500, 843], [0, 843, 2500, 843],
  ]),
  layout("large_1", "大: 1面", "large", [
    [0, 0, 2500, 1686],
  ]),
  layout("compact_3", "小: 3分割 (縦)", "compact", [
    [0, 0, 833, 843], [833, 0, 834, 843], [1667, 0, 833, 843],
  ]),
  layout("compact_2", "小: 2分割 (縦)", "compact", [
    [0, 0, 1250, 843], [1250, 0, 1250, 843],
  ]),
  layout("compact_2lr", "小: 2分割 (左大・右小)", "compact", [
    [0, 0, 1667, 843], [1667, 0, 833, 843],
  ]),
  layout("compact_1", "小: 1面", "compact", [
    [0, 0, 2500, 843],
  ]),
];

export async function fetchRichMenuFolderOptions(): Promise<FolderOption[]> {
  const data = await apiFetch<{ id: number; name: string; is_system: boolean }[]>(
    "/rich-menu-folders",
  );
  return data.map((f) => ({ id: f.id, name: f.name, is_system: f.is_system }));
}

export async function fetchActionTemplates(): Promise<RichMenuActionTemplate[]> {
  const data = await apiFetch<
    { id: number; name: string; template_folder_id: number | null }[]
  >("/templates");
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    folder_id: t.template_folder_id ?? null,
  }));
}

export async function fetchActionTemplateFolders(): Promise<RichMenuActionTemplateFolder[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/template-folders");
  return data.map((f) => ({ id: f.id, name: f.name }));
}

/** monolith RichMenuController::actionOptions() を写経した選択肢一式。 */
export async function fetchRichMenuActionOptions(): Promise<ActionOptions> {
  const [
    tags,
    chatStatuses,
    folders,
    fields,
    scenarios,
    richMenus,
    reminders,
    forms,
  ] = await Promise.all([
    apiFetch<RichMenuActionTag[]>("/tags"),
    apiFetch<ActionOptionItem[]>("/chat-statuses"),
    apiFetch<{ id: number; name: string }[]>("/friend-field-folders"),
    apiFetch<{ id: number; name: string; friend_field_folder_id: number | null }[]>(
      "/friend-fields",
    ),
    apiFetch<ActionOptionItem[]>("/scenarios"),
    apiFetch<{ id: number; name: string; is_published?: boolean }[]>("/rich-menus"),
    apiFetch<ActionOptionItem[]>("/reminders"),
    apiFetch<
      {
        id: number;
        name: string;
        token: string;
        status: string;
        line_channel?: { liff_id?: string | null } | null;
      }[]
    >("/forms"),
  ]);

  return {
    tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color ?? null })),
    chatStatuses: chatStatuses.map((s) => ({ id: s.id, name: s.name })),
    friendFieldFolders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      fields: fields
        .filter((x) => x.friend_field_folder_id === f.id)
        .map((x) => ({ id: x.id, name: x.name })),
    })),
    scenarios: scenarios.map((s) => ({ id: s.id, name: s.name })),
    richMenus: richMenus.map((m) => ({
      id: m.id,
      name: m.name,
      is_published: !!m.is_published,
    })),
    reminders: reminders.map((r) => ({ id: r.id, name: r.name })),
    forms: forms
      .filter((f) => f.status === "published")
      .map((f) => ({ id: f.id, name: f.name, url: formPublicUrl(f) })),
  };
}

/** FormController::publicUrl と同じ規約で公開フォーム URL を組み立てる。 */
function formPublicUrl(form: {
  token: string;
  line_channel?: { liff_id?: string | null } | null;
}): string {
  const liffId = form.line_channel?.liff_id;
  if (liffId) {
    return `https://liff.line.me/${liffId}/f/${form.token}`;
  }
  return `/f/${form.token}`;
}
