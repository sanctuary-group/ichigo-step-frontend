export type GreetingType = "new_friend" | "existing" | "unblock";

export type GreetingActionType =
    | "tag_attach"
    | "tag_detach"
    | "scenario_start"
    | "link_rich_menu"
    | "send_template"
    | "send_text"
    | "reminder"
    | "bookmark"
    | "friend_field"
    | "chat_status"
    | "block";

export type ScenarioMode = "start" | "stop" | "place";

export type GreetingAction = {
    type: GreetingActionType;
    /** @deprecated 単一タグ（旧データ互換用）。新規は tag_ids を使う */
    tag_id?: number | null;
    /** タグ付け/外しの対象タグ（複数選択） */
    tag_ids?: number[];
    scenario_id?: number | null;
    rich_menu_id?: number | null;
    template_id?: number | null;
    /** send_text のメッセージ本文 */
    text?: string;
    /** reminder: 対象リマインド / 操作 / 配信終了日時 */
    reminder_id?: number | null;
    reminder_op?: "start" | "stop";
    reminder_end_at?: string | null;
    /** ステップ配信の配信設定: start=開始・再開 / stop=停止 / place=途中から配置 */
    scenario_mode?: ScenarioMode;
    /** place のとき、この step_order から配信する */
    start_step_order?: number | null;
    /** bookmark: ブックマークする(add) / 外す(remove) */
    bookmark_op?: "add" | "remove";
    /** friend_field: 設定する友だちカスタム項目と値 */
    friend_field_id?: number | null;
    friend_field_value?: string;
    /** chat_status: つける(add) / はずす(remove) と対象ステータス */
    chat_status_op?: "add" | "remove";
    chat_status_id?: number | null;
    /** block: ブロック/解除/表示/非表示 */
    block_mode?: "block" | "unblock" | "hide" | "show";
};

export type RichMenuRef = { id: number; name: string };
export type FriendFieldRef = {
    id: number;
    name: string;
    field_type: string;
    friend_field_folder_id: number | null;
    options: string[] | null;
};
export type FriendFieldFolderRef = { id: number; name: string };
export type TemplateRef = {
    id: number;
    name: string;
    template_folder_id: number | null;
};
export type TemplateFolderRef = { id: number; name: string };
export type ReminderRef = { id: number; name: string };

export type Greeting = {
    id?: number;
    organization_id?: number;
    line_channel_id: number;
    type: GreetingType;
    is_active: boolean;
    message_type: "text" | "image" | "video" | "audio";
    text_content: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    media_duration: number | null;
    actions: GreetingAction[];
};
