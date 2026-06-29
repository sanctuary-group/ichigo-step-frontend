import { apiFetch } from "./client";
import { mapFriendField } from "./mappers";
import type { ApiFriendField } from "./types";
import type { MockFriendField } from "@/mocks/data";

export type FriendFieldType = "choice" | "text" | "number" | "date" | "phone" | "email";
export type FriendFieldRunMode = "once" | "repeat";

/** 情報タイプの表示ラベル（backend の field_type に対応）。 */
export const FIELD_TYPE_LABELS: Record<FriendFieldType, string> = {
  choice: "選択肢",
  text: "テキスト",
  number: "数値",
  date: "日付",
  phone: "電話番号",
  email: "メール",
};

/** 編集画面で扱う項目詳細（field_type/options/run_mode/フォルダを保持）。 */
export type FriendFieldDetail = {
  id: string;
  name: string;
  folderId: number | null;
  fieldType: FriendFieldType;
  runMode: FriendFieldRunMode;
  options: string[];
};

function mapFriendFieldDetail(api: ApiFriendField): FriendFieldDetail {
  const ft = (api.field_type as FriendFieldType) ?? "text";
  const opts = Array.isArray(api.options) ? (api.options as string[]) : [];
  return {
    id: String(api.id),
    name: api.name,
    folderId: api.friend_field_folder_id,
    fieldType: ft,
    runMode: (api.run_mode as FriendFieldRunMode) ?? "once",
    options: opts,
  };
}

/** GET /friend-fields */
export async function fetchFriendFields(params: { folder?: string } = {}): Promise<
  MockFriendField[]
> {
  const data = await apiFetch<ApiFriendField[]>("/friend-fields", {
    query: { folder: params.folder },
  });
  return data.map(mapFriendField);
}

/**
 * 単一項目の取得。
 * backend に単体 GET が無いため一覧から id 一致を取り出す。
 */
export async function fetchFriendField(id: string): Promise<FriendFieldDetail | null> {
  const data = await apiFetch<ApiFriendField[]>("/friend-fields");
  const found = data.find((f) => String(f.id) === String(id));
  return found ? mapFriendFieldDetail(found) : null;
}

/** POST /friend-fields */
export async function createFriendField(input: {
  name: string;
  friend_field_folder_id: number;
  field_type: FriendFieldType;
  run_mode: FriendFieldRunMode;
  options?: string[];
}): Promise<MockFriendField> {
  const data = await apiFetch<ApiFriendField>("/friend-fields", { method: "POST", body: input });
  return mapFriendField(data);
}

/**
 * PUT /friend-fields/{id}
 * field_type は backend 側で変更不可（送っても無視される）。
 */
export async function updateFriendField(
  id: string,
  input: {
    name: string;
    friend_field_folder_id: number;
    run_mode: FriendFieldRunMode;
    options?: string[];
  },
): Promise<MockFriendField> {
  const data = await apiFetch<ApiFriendField>(`/friend-fields/${id}`, {
    method: "PUT",
    body: input,
  });
  return mapFriendField(data);
}

/** DELETE /friend-fields/{id} */
export async function deleteFriendField(id: string): Promise<void> {
  await apiFetch(`/friend-fields/${id}`, { method: "DELETE" });
}

/** POST /friend-fields/reorder（並べ替え後の id 配列）。 */
export async function reorderFriendFields(ids: number[]): Promise<void> {
  await apiFetch("/friend-fields/reorder", { method: "POST", body: { ids } });
}
