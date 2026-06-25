export type RiskLevel = "normal" | "warning" | "danger";

export type ChannelHealth = {
  id: number;
  name: string;
  basic_id: string | null;
  channel_id: string;
  is_active: boolean;
  risk_level: RiskLevel;
  last_health_checked_at: string | null;
  last_health_error: string | null;
  fallback_channel_id: number | null;
  friend_add_url: string | null;
};

export type AutoSwitchConfig = {
  enabled: boolean;
  danger_streak: number;
};

export type ChannelHealthLog = {
  id: number;
  organization_id: number;
  line_channel_id: number;
  http_status: number | null;
  error_code: string | null;
  error_message: string | null;
  risk_level: RiskLevel;
  checked_at: string;
  created_at: string;
  updated_at: string;
};
