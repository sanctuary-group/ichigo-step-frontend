import { apiFetch } from "./client";
import type { Reminder, ReminderRow } from "@/types/reminder";

/** GET /reminders — 一覧（q 検索・件数つき）。 */
export async function fetchReminders(
    params: { q?: string } = {},
): Promise<ReminderRow[]> {
    return apiFetch<ReminderRow[]>("/reminders", { query: { q: params.q } });
}

/** GET /reminders/{id} — 編集フォーム初期化用の生レコード（{data} unwrap 済）。 */
export async function fetchRawReminder(id: string): Promise<Reminder> {
    return apiFetch<Reminder>(`/reminders/${id}`);
}

/** SaveReminderRequest に合わせた送信ペイロード。 */
export type SaveReminderPayload = {
    name: string;
    description: string | null;
    line_channel_id: number;
    is_active: boolean;
    steps: {
        offset_minutes: number;
        linked_template_id?: number | null;
        messages: Record<string, unknown>[];
    }[];
};

/** ビルダーフォームの全項目を送る保存（POST / PUT）。 */
export async function saveReminder(
    payload: SaveReminderPayload,
    editId?: string,
): Promise<Reminder> {
    return editId
        ? apiFetch<Reminder>(`/reminders/${editId}`, { method: "PUT", body: payload })
        : apiFetch<Reminder>("/reminders", { method: "POST", body: payload });
}

/** DELETE /reminders/{id} */
export async function deleteReminder(id: string): Promise<void> {
    await apiFetch(`/reminders/${id}`, { method: "DELETE" });
}

/** PATCH /reminders/{id}/toggle-active */
export async function toggleReminder(id: string): Promise<void> {
    await apiFetch(`/reminders/${id}/toggle-active`, { method: "PATCH" });
}
