// backend の app/Http/Resources/Tenant/*.php を写した API レスポンス型（snake_case）。

export type ApiTenantContext = {
  authenticated_as: { id: number; name: string; email: string };
  context: { organization_id: number | null; line_channel_id: number | null };
  version: string;
  endpoints: string[];
};

export type ApiLineChannel = {
  id: number;
  name: string;
  basic_id: string | null;
  channel_id: string | null;
  liff_id: string | null;
  is_active: boolean;
  fallback_channel_id: number | null;
  risk_level: string | null;
  last_health_checked_at: string | null;
  connection_verified_at: string | null;
  created_at: string | null;
};

export type ApiTag = {
  id: number;
  tag_folder_id: number | null;
  name: string;
  color: string | null;
  sort_order: number | null;
  friends_count?: number;
  created_at: string | null;
};

export type ApiFriend = {
  id: number;
  line_channel_id: number;
  line_user_id: string | null;
  display_name: string | null;
  system_display_name: string | null;
  picture_url: string | null;
  status_message: string | null;
  source: string | null;
  note: string | null;
  is_following: boolean;
  is_test_user: boolean;
  is_hidden: boolean;
  pinned_at: string | null;
  chat_status_id: number | null;
  rich_menu_id: number | null;
  followed_at: string | null;
  unfollowed_at: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  tags?: ApiTag[];
  created_at: string | null;
};

export type ApiMessage = {
  id: number;
  friend_id: number;
  line_channel_id: number;
  direction: "inbound" | "outbound" | string;
  message_type: string;
  content: string | null;
  source: string | null;
  broadcast_id: number | null;
  scenario_step_id: number | null;
  sent_at: string | null;
  created_at: string | null;
};

export type ApiMessagePart = {
  id: number;
  sort_order: number;
  message_type: string;
  text_content: string | null;
  image_url: string | null;
  image_preview_url: string | null;
  media_duration: number | null;
  sticker_package_id: string | null;
  sticker_id: string | null;
  location_title: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  panel_content: unknown;
};

export type ApiBroadcast = {
  id: number;
  line_channel_id: number;
  title: string;
  message_type: string;
  text_content: string | null;
  image_url: string | null;
  image_preview_url: string | null;
  target_type: "all" | "tag" | string;
  target_tag_id: number | null;
  target_filter: unknown;
  actions: unknown;
  linked_template_id: number | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_count: number;
  success_count: number;
  error_message: string | null;
  line_channel?: ApiLineChannel;
  target_tag?: ApiTag;
  messages?: ApiMessagePart[];
  created_at: string | null;
  updated_at: string | null;
};

export type ApiScenarioStep = {
  id: number;
  scenario_id: number;
  step_order: number;
  delay_minutes: number;
  timing_mode: string;
  admin_name: string | null;
  sender_name: string | null;
  sender_icon_url: string | null;
  linked_template_id: number | null;
  message_type: string;
  text_content: string | null;
  image_url: string | null;
  image_preview_url: string | null;
  messages?: ApiMessagePart[];
};

export type ApiScenario = {
  id: number;
  line_channel_id: number;
  scenario_folder_id: number | null;
  name: string;
  description: string | null;
  trigger_type: "friend_add" | "tag_added" | "manual" | string;
  trigger_tag_id: number | null;
  target_filter: unknown;
  is_active: boolean;
  active_count?: number;
  completed_count?: number;
  terminated_count?: number;
  steps?: ApiScenarioStep[];
  trigger_tag?: ApiTag;
  created_at: string | null;
  updated_at: string | null;
};

export type ApiAutoReply = {
  id: number;
  auto_reply_folder_id: number | null;
  trigger_type: string;
  match_mode: string | null;
  keywords: string[] | null;
  audience: string | null;
  schedule_type: string | null;
  schedule_start: string | null;
  schedule_end: string | null;
  action_mode: string | null;
  message_type: string;
  text_content: string | null;
  is_active: boolean;
  hit_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ApiQrAction = {
  id: number;
  line_channel_id: number;
  qr_action_folder_id: number | null;
  token: string | null;
  name: string;
  audience: string | null;
  action_type: string | null;
  action_tag_id: number | null;
  action_scenario_id: number | null;
  message: string | null;
  is_active: boolean;
  scan_count: number;
  follow_count: number;
  action_tag?: ApiTag;
  action_scenario?: ApiScenario;
  created_at: string | null;
  updated_at: string | null;
};

export type ApiForm = {
  id: number;
  line_channel_id: number;
  form_folder_id: number | null;
  token: string | null;
  name: string;
  title: string | null;
  description: string | null;
  form_type: string | null;
  status: string;
  fields_count?: number;
  responses_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ApiGreeting = {
  id: number;
  line_channel_id: number;
  type: string;
  is_active: boolean;
  message_type: string;
  text_content: string | null;
  image_url: string | null;
  image_preview_url: string | null;
  actions: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export type ApiTemplate = {
  id: number;
  template_folder_id: number | null;
  name: string;
  content: string | null;
  image_url: string | null;
  image_preview_url: string | null;
  sort_order: number | null;
  delay_send: boolean;
  messages?: ApiMessagePart[];
  created_at: string | null;
  updated_at: string | null;
};
