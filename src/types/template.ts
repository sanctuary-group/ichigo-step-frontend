export type TemplateFolder = {
    id: number;
    organization_id: number;
    name: string;
    sort_order: number;
    is_system: boolean;
    templates_count?: number;
};

export type TemplateMessageType =
    | "text"
    | "image"
    | "video"
    | "audio"
    | "sticker"
    | "location"
    | "panel";

export type TemplateMessage = {
    id?: number;
    template_id?: number;
    sort_order?: number;
    message_type: TemplateMessageType;
    text_content: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    media_duration?: number | null;
    sticker_package_id?: number | null;
    sticker_id?: number | null;
    location_title?: string | null;
    location_address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    panel_content?: PanelContent | null;
};

export type PanelButtonActionType =
    | "message"
    | "url"
    | "tag_attach"
    | "tag_detach"
    | "scenario_start";

export type PanelButton = {
    label: string;
    action_type: PanelButtonActionType;
    url: string;
    tag_id: number | null;
    scenario_id: number | null;
    button_color?: string;
    text_color?: string;
};
export type PanelTapAction = {
    action_type: PanelButtonActionType;
    url: string;
    tag_id: number | null;
    scenario_id: number | null;
};

export type Panel = {
    image_url: string;
    image_preview_url: string;
    title: string;
    body: string;
    title_color?: string;
    title_bold?: boolean;
    body_color?: string;
    body_bold?: boolean;
    buttons: PanelButton[];
    // 画像タイプ専用
    label_enabled?: boolean;
    label_text?: string;
    label_bg?: string;
    label_color?: string;
    title_enabled?: boolean;
    title_bg?: string;
    tap_action?: PanelTapAction;
};
export type PanelContent = {
    variant: string;
    panels: Panel[];
    alt_text?: string;
    size?: "large" | "medium" | "small";
    tap_limit?: "once_all" | "once_panel" | "once_choice" | "unlimited";
    over_tap_send?: "send" | "no";
    over_tap_message?: string;
    // クイックリプライ専用
    question_type?: "text" | "image";
    question_text?: string;
    question_image_url?: string;
    quick_buttons?: PanelButton[];
};

export type Template = {
    id: number;
    organization_id: number;
    template_folder_id: number | null;
    name: string;
    content: string;
    image_url: string | null;
    image_preview_url: string | null;
    delay_send?: boolean;
    messages?: TemplateMessage[];
    created_at: string;
    updated_at: string;
};
