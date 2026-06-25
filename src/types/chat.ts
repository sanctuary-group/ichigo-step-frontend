export type Tag = {
    id: number;
    organization_id: number;
    name: string;
    color: string;
};

export type FriendSource = "qr" | "card" | "web" | "manual" | "other" | null;

export type ChatStatus = {
    id: number;
    organization_id: number;
    name: string;
    color: string;
    sort_order: number;
};

export type Friend = {
    id: number;
    organization_id: number;
    line_channel_id: number;
    line_user_id: string;
    display_name: string | null;
    system_display_name: string | null;
    picture_url: string | null;
    status_message: string | null;
    source: FriendSource;
    note: string | null;
    is_following: boolean;
    is_hidden: boolean;
    pinned_at: string | null;
    chat_status_id: number | null;
    chat_status?: ChatStatus | null;
    rich_menu_id?: number | null;
    rich_menu?: { id: number; name: string } | null;
    active_scenario?: { id: number; name: string } | null;
    followed_at: string | null;
    unfollowed_at: string | null;
    last_message_preview: string | null;
    last_message_at: string | null;
    unread_count: number;
    created_at: string;
    updated_at: string;
    tags?: Tag[];
    field_values?: FriendFieldValueLite[];
};

export type FriendFieldValueLite = {
    friend_field_id: number;
    value: string | null;
};

export type ChatAutoRead = {
    bracket: boolean;
    sticker: boolean;
    reactAll: boolean;
    reactKeyword: boolean;
    onReply: boolean;
    onBlock: boolean;
};

export type ChatSettings = {
    send_shortcut: "shift_enter_send" | "enter_send";
    short_url: boolean;
    send_preview: boolean;
    browser_notification: boolean;
    auto_read: ChatAutoRead;
};

export type MessageType =
    | "text"
    | "image"
    | "sticker"
    | "video"
    | "audio"
    | "file"
    | "location"
    | "flex"
    | "postback";

export type Message = {
    id: number;
    organization_id: number;
    line_channel_id: number;
    friend_id: number;
    line_message_id: string | null;
    direction: "incoming" | "outgoing";
    message_type: MessageType;
    content: string;
    source: string;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
};
