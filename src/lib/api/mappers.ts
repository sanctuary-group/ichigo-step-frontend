// API（snake_case）→ mockup の UI 契約型（Mock*）への変換。
// UI コンポーネントを一切変えずに実データを流すためのアダプタ層。

import type {
  MockAutoReply,
  MockBroadcast,
  MockChannel,
  MockForm,
  MockFriend,
  MockGreeting,
  MockMessage,
  MockMessageType,
  MockQrAction,
  MockScenario,
  MockScenarioStep,
  MockTag,
  MockTemplate,
} from "@/mocks/data";
import type {
  ApiAutoReply,
  ApiBroadcast,
  ApiForm,
  ApiFriend,
  ApiGreeting,
  ApiLineChannel,
  ApiMessage,
  ApiQrAction,
  ApiScenario,
  ApiScenarioStep,
  ApiTag,
  ApiTemplate,
} from "./types";
import { API_ORIGIN } from "./config";

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

export function mapAutoReply(api: ApiAutoReply): MockAutoReply {
  const triggerType: MockAutoReply["triggerType"] =
    api.trigger_type === "follow" || api.trigger_type === "default"
      ? api.trigger_type
      : "keyword";
  const schedule =
    !api.schedule_type || api.schedule_type === "always" ? "24時間対応" : "期間指定";
  return {
    id: s(api.id),
    folderId: api.auto_reply_folder_id != null ? s(api.auto_reply_folder_id) : "",
    triggerType,
    keyword: (api.keywords ?? []).join("、"),
    schedule,
    replyPreview: api.text_content ?? "",
    hitCount: api.hit_count ?? 0,
    isActive: api.is_active,
    createdAt: api.created_at ?? "",
  };
}

export function mapQrAction(api: ApiQrAction): MockQrAction {
  const action: MockQrAction["action"] = api.action_scenario_id
    ? "start_scenario"
    : api.action_tag_id
      ? "add_tag"
      : "track_source";
  const actionLabel =
    api.action_tag?.name ?? api.action_scenario?.name ?? (api.message ? "メッセージ" : "—");
  return {
    id: s(api.id),
    name: api.name,
    folderId: api.qr_action_folder_id != null ? s(api.qr_action_folder_id) : "",
    isActive: api.is_active,
    audience: api.audience ?? "",
    action,
    actionLabel,
    scanCount: api.scan_count ?? 0,
    followCount: api.follow_count ?? 0,
    createdAt: api.created_at ?? "",
  };
}

export function mapForm(api: ApiForm): MockForm {
  const formType: MockForm["formType"] =
    api.form_type === "reservation" ? "予約" : api.form_type === "survey" ? "アンケート" : "標準";
  const status: MockForm["status"] = ["draft", "published", "closed"].includes(api.status)
    ? (api.status as MockForm["status"])
    : "draft";
  return {
    id: s(api.id),
    name: api.name,
    folderId: api.form_folder_id != null ? s(api.form_folder_id) : "",
    formType,
    distributionUrl: api.token ? `${API_ORIGIN}/f/${api.token}` : "",
    status,
    questionCount: api.fields_count ?? 0,
    responseCount: api.responses_count ?? 0,
    createdAt: api.created_at ?? "",
    updatedAt: api.updated_at ?? "",
  };
}

export function mapGreeting(api: ApiGreeting): MockGreeting {
  return {
    isActive: api.is_active,
    messageType: asMessageType(api.message_type),
    content: api.text_content ?? "",
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
