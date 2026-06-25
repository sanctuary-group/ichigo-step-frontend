import { apiFetch } from "./client";

export type Folder = {
  id: string;
  name: string;
  isSystem: boolean;
  itemsCount: number;
};

type ApiFolder = {
  id: number;
  name: string;
  sort_order: number | null;
  is_system: boolean;
  items_count?: number;
};

/** フォルダ種別（ルートの {feature}-folders に対応） */
export type FolderFeature =
  | "scenario-folders"
  | "auto-reply-folders"
  | "qr-action-folders"
  | "form-folders"
  | "rich-menu-folders"
  | "friend-field-folders"
  | "template-folders"
  | "tag-folders";

const map = (f: ApiFolder): Folder => ({
  id: String(f.id),
  name: f.name,
  isSystem: f.is_system,
  itemsCount: f.items_count ?? 0,
});

/** GET /{feature}-folders */
export async function fetchFolders(feature: FolderFeature): Promise<Folder[]> {
  const data = await apiFetch<ApiFolder[]>(`/${feature}`);
  return data.map(map);
}

/** POST /{feature}-folders */
export async function createFolder(feature: FolderFeature, name: string): Promise<Folder> {
  const data = await apiFetch<ApiFolder>(`/${feature}`, { method: "POST", body: { name } });
  return map(data);
}

/** DELETE /{feature}-folders/{id} */
export async function deleteFolder(feature: FolderFeature, id: string): Promise<void> {
  await apiFetch(`/${feature}/${id}`, { method: "DELETE" });
}
