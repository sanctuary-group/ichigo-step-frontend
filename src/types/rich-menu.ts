import type { LineChannel } from "@/types/broadcast";

export type RichMenuActionType = "none" | "uri" | "message" | "postback";

export type RichMenuAreaAction = {
    type: RichMenuActionType;
    value: string;
    label?: string;
    config?: Record<string, unknown> | null;
};

export type RichMenuLayoutArea = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type RichMenuLayout = {
    key: string;
    label: string;
    size: "large" | "compact";
    width: number;
    height: number;
    areas: RichMenuLayoutArea[];
};

export type RichMenuFolder = {
    id: number;
    name: string;
    sort_order: number;
    is_system: boolean;
    rich_menus_count?: number;
};

export type RichMenu = {
    id: number;
    organization_id: number;
    line_channel_id: number | null;
    rich_menu_folder_id: number | null;
    name: string;
    chat_bar_text: string;
    selected: boolean;
    layout_key: string;
    size: "large" | "compact";
    image_path: string | null;
    image_url?: string | null;
    areas: RichMenuAreaAction[] | null;
    is_published: boolean;
    line_rich_menu_id: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    line_channel?: LineChannel | null;
    folder?: RichMenuFolder | null;
};
