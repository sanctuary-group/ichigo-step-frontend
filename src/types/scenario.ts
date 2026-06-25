import type { Tag } from "@/types/chat";
import type { LineChannel } from "@/types/broadcast";

export type ScenarioTriggerType = "friend_add" | "tag_added";

export type StepTimingMode = "immediate" | "datetime" | "elapsed";

export type ScenarioStepMessage = {
    message_type:
        | "text"
        | "image"
        | "video"
        | "audio"
        | "sticker"
        | "location"
        | "panel";
    text_content?: string | null;
    image_url?: string | null;
    image_preview_url?: string | null;
    media_duration?: number | null;
    sticker_package_id?: number | null;
    sticker_id?: number | null;
    location_title?: string | null;
    location_address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    panel_content?: unknown;
};

export type ScenarioStep = {
    id?: number;
    scenario_id?: number;
    step_order: number;
    delay_minutes: number;
    timing_mode: StepTimingMode;
    admin_name?: string | null;
    sender_name?: string | null;
    sender_icon_url?: string | null;
    linked_template_id?: number | null;
    message_type: "text" | "image";
    text_content: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    messages?: ScenarioStepMessage[];
};

export type ScenarioFolder = {
    id: number;
    organization_id: number;
    name: string;
    sort_order: number;
    is_system: boolean;
    scenarios_count?: number;
};

export type Scenario = {
    id: number;
    organization_id: number;
    line_channel_id: number;
    scenario_folder_id: number | null;
    name: string;
    description: string | null;
    trigger_type: ScenarioTriggerType;
    trigger_tag_id: number | null;
    target_filter?: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    steps?: ScenarioStep[];
    trigger_tag?: Tag | null;
    line_channel?: LineChannel | null;
    folder?: ScenarioFolder | null;
    active_count?: number;
    completed_count?: number;
    terminated_count?: number;
};
