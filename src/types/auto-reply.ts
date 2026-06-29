import type { GreetingAction } from "@/types/greeting";

export type AutoReplyTriggerType = "all" | "keyword" | "follow";
export type AutoReplyMatchMode = "partial" | "exact";
export type AutoReplyScheduleType = "always" | "business" | "custom";
export type AutoReplyActionMode = "once" | "repeat";
export type AutoReplyMessageType = "text" | "image" | "video" | "audio";
export type AutoReplyAudience = "active" | "blocked";

export type AutoReplyFolder = {
    id: number;
    name: string;
    sort_order: number;
    is_system: boolean;
    auto_replies_count?: number;
};

export type AutoReply = {
    id: number;
    organization_id: number;
    title: string | null;
    auto_reply_folder_id: number | null;
    trigger_type: AutoReplyTriggerType;
    match_mode: AutoReplyMatchMode;
    keywords: string[] | null;
    exclude_bracket: boolean;
    audience: AutoReplyAudience;
    schedule_type: AutoReplyScheduleType;
    schedule_start: string | null;
    schedule_end: string | null;
    action_mode: AutoReplyActionMode;
    message_type: AutoReplyMessageType;
    text_content: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    media_duration: number | null;
    actions: GreetingAction[] | null;
    is_active: boolean;
    hit_count: number;
    created_at: string;
    updated_at: string;
};
