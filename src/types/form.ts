export type FormFieldType =
    | "text"
    | "textarea"
    | "radio"
    | "checkbox"
    | "select"
    | "email"
    | "number"
    | "date";

export type FormFieldData = {
    id?: number;
    label: string;
    type: FormFieldType;
    options: string[];
    required: boolean;
    sort_order?: number;
    /** 回答を保存する友だちカスタム項目（未設定なら保存しない） */
    friend_field_id?: number | null;
};

/** フォーム編集で「保存先」に選べる友だちカスタム項目 */
export type FriendFieldOption = {
    id: number;
    name: string;
    field_type: string;
};

/** 回答送信時に実行するアクション（FriendActionRunner 互換） */
export type FormAction = {
    key: string;
    config: Record<string, unknown>;
};

/** 回答後アクションの「シナリオ開始」で選べるシナリオ */
export type ScenarioOption = {
    id: number;
    name: string;
};

export type FormFolder = {
    id: number;
    name: string;
    sort_order: number;
    is_system: boolean;
    forms_count?: number;
};

export type FormStatus = "draft" | "published" | "closed";
export type FormType = "standard" | "survey" | "reservation";

export type FormModel = {
    id: number;
    organization_id: number;
    form_folder_id: number | null;
    line_channel_id: number | null;
    token: string;
    name: string;
    title: string;
    description: string | null;
    form_type: FormType;
    status: FormStatus;
    submit_message: string | null;
    actions?: FormAction[] | null;
    send_thanks_message?: boolean;
    fields?: FormFieldData[];
    fields_count?: number;
    responses_count?: number;
    public_url?: string;
    created_at: string;
    updated_at: string;
};

export type FormResponseRow = {
    id: number;
    form_id: number;
    friend_id: number | null;
    answers: {
        field_id: number;
        label: string;
        type: FormFieldType;
        value: string | string[] | null;
    }[];
    submitted_at: string;
    friend?: {
        id: number;
        display_name: string | null;
        system_display_name: string | null;
    } | null;
};
