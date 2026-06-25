// API（snake_case）→ mockup の UI 契約型（Mock*）への変換。
// UI コンポーネントを一切変えずに実データを流すためのアダプタ層。

import type {
  MockBroadcast,
  MockChannel,
  MockFriend,
  MockMessage,
  MockMessageType,
  MockScenario,
  MockScenarioStep,
  MockTag,
  MockTemplate,
} from "@/mocks/data";
import type {
  ApiBroadcast,
  ApiFriend,
  ApiLineChannel,
  ApiMessage,
  ApiScenario,
  ApiScenarioStep,
  ApiTag,
  ApiTemplate,
} from "./types";

const s = (v: number | string): string => String(v);

function asMessageType(v: string | null | undefined): MockMessageType {
  return v === "image" || v === "flex" || v === "sticker" ? v : "text";
}

export function mapChannel(api: ApiLineChannel): MockChannel {
  return {
    id: s(api.id),
    name: api.name,
    basicId: api.basic_id ?? "",
  };
}

export function mapTag(api: ApiTag): MockTag {
  return {
    id: s(api.id),
    name: api.name,
    color: api.color ?? "#9ca3af",
    folderId: api.tag_folder_id != null ? s(api.tag_folder_id) : undefined,
    capacity: null,
  };
}

export function mapFriend(api: ApiFriend): MockFriend {
  return {
    id: s(api.id),
    channelId: s(api.line_channel_id),
    displayName: api.display_name ?? "",
    systemDisplayName: api.system_display_name ?? undefined,
    pictureUrl: api.picture_url ?? undefined,
    isFollowing: api.is_following,
    isHidden: api.is_hidden,
    followedAt: api.followed_at ?? "",
    source: api.source ?? "",
    tagIds: (api.tags ?? []).map((t) => s(t.id)),
    lastMessagePreview: api.last_message_preview ?? undefined,
    lastMessageAt: api.last_message_at ?? undefined,
    unreadCount: api.unread_count ?? 0,
  };
}

export function mapMessage(api: ApiMessage): MockMessage {
  const src = api.source;
  const source: MockMessage["source"] =
    src === "broadcast" || src === "scenario" || src === "manual" || src === "user"
      ? src
      : undefined;
  return {
    id: s(api.id),
    friendId: s(api.friend_id),
    direction:
      api.direction === "inbound" || api.direction === "incoming" ? "incoming" : "outgoing",
    type: asMessageType(api.message_type),
    content: api.content ?? "",
    timestamp: api.sent_at ?? api.created_at ?? "",
    source,
  };
}

export function mapBroadcast(api: ApiBroadcast): MockBroadcast {
  return {
    id: s(api.id),
    title: api.title,
    messageType: asMessageType(api.message_type),
    preview: api.text_content ?? api.image_url ?? "",
    targetType: api.target_type === "tag" ? "tag" : "all",
    targetTagId: api.target_tag_id != null ? s(api.target_tag_id) : undefined,
    status: (["draft", "scheduled", "sending", "sent", "failed"].includes(api.status)
      ? api.status
      : "draft") as MockBroadcast["status"],
    scheduledAt: api.scheduled_at ?? undefined,
    sentAt: api.sent_at ?? undefined,
    createdAt: api.created_at ?? "",
    updatedAt: api.updated_at ?? "",
    totalCount: api.total_count ?? 0,
    successCount: api.success_count ?? 0,
  };
}

export function mapScenarioStep(api: ApiScenarioStep): MockScenarioStep {
  return {
    id: s(api.id),
    order: api.step_order,
    delayMinutes: api.delay_minutes ?? 0,
    messageType: asMessageType(api.message_type),
    preview: api.text_content ?? api.image_url ?? "",
  };
}

export function mapTemplate(api: ApiTemplate): MockTemplate {
  const firstMsg = api.messages?.[0];
  return {
    id: s(api.id),
    name: api.name,
    folderId: api.template_folder_id != null ? s(api.template_folder_id) : "",
    messageType: asMessageType(firstMsg?.message_type ?? "text"),
    preview: api.content ?? firstMsg?.text_content ?? firstMsg?.image_url ?? "",
    createdAt: api.created_at ?? "",
    updatedAt: api.updated_at ?? "",
  };
}

export function mapScenario(api: ApiScenario): MockScenario {
  const triggerType: MockScenario["triggerType"] =
    api.trigger_type === "tag_added" || api.trigger_type === "manual"
      ? api.trigger_type
      : "friend_add";
  return {
    id: s(api.id),
    name: api.name,
    description: api.description ?? undefined,
    triggerType,
    triggerTagId: api.trigger_tag_id != null ? s(api.trigger_tag_id) : undefined,
    isActive: api.is_active,
    enrolledCount: api.active_count ?? 0,
    terminatedCount: api.terminated_count ?? 0,
    completedCount: api.completed_count ?? 0,
    folderId: api.scenario_folder_id != null ? s(api.scenario_folder_id) : "",
    steps: (api.steps ?? []).map(mapScenarioStep),
  };
}
