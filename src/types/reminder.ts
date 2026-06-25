import type { ComposerValue } from "@/components/templates/message-composer";

/** 一覧行（GET /reminders の各要素）。 */
export type ReminderRow = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    steps_count: number;
    friend_reminders_count: number;
    created_at: string;
};

/** 詳細レコードのステップ（GET /reminders/{id}）。 */
export type ReminderStep = {
    id?: number;
    offset_minutes: number;
    linked_template_id?: number | null;
    messages?: Partial<ComposerValue>[];
};

/** 詳細レコード（編集フォーム初期化用）。 */
export type Reminder = {
    id: number;
    name: string;
    description: string | null;
    line_channel_id: number | null;
    is_active: boolean;
    steps?: ReminderStep[];
};
