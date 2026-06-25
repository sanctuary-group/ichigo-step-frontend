import type { Tag } from "@/types/chat";

export type BroadcastStatus =
    | "draft"
    | "scheduled"
    | "sending"
    | "sent"
    | "failed";

export type BroadcastMessageType = "text" | "image";

export type BroadcastTargetType = "all" | "tag";

export type LineChannel = {
    id: number;
    name: string;
    basic_id: string | null;
    channel_id: string;
    is_active: boolean;
    friend_add_url?: string | null;
};

export type BroadcastAction = {
    key: string;
    config: Record<string, unknown>;
};

export type ScenarioOption = { id: number; name: string };
export type RichMenuOption = { id: number; name: string; is_published: boolean };
export type ReminderOption = { id: number; name: string };

export type Broadcast = {
    id: number;
    organization_id: number;
    line_channel_id: number;
    title: string;
    message_type: BroadcastMessageType;
    text_content: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    target_type: BroadcastTargetType;
    target_tag_id: number | null;
    target_filter?: Record<string, unknown> | null;
    actions?: BroadcastAction[] | null;
    status: BroadcastStatus;
    scheduled_at: string | null;
    sent_at: string | null;
    total_count: number;
    success_count: number;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    line_channel?: LineChannel | null;
    target_tag?: Tag | null;
};
