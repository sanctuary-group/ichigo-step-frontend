import { apiFetch } from "./client";
import type {
  AutoSwitchConfig,
  ChannelHealth,
  ChannelHealthLog,
} from "@/types/ban-detection";

export type BanDetectionIndex = {
  channels: ChannelHealth[];
  logsByChannel: Record<string, ChannelHealthLog[]>;
  autoSwitch: AutoSwitchConfig;
};

type ApiBanDetectionIndex = {
  channels: ChannelHealth[];
  logs_by_channel: Record<string, ChannelHealthLog[]>;
  auto_switch: AutoSwitchConfig;
};

/** GET /ban-detection */
export async function fetchBanDetection(): Promise<BanDetectionIndex> {
  const data = await apiFetch<ApiBanDetectionIndex>("/ban-detection");
  return {
    channels: data.channels ?? [],
    logsByChannel: data.logs_by_channel ?? {},
    autoSwitch: data.auto_switch ?? { enabled: false, danger_streak: 2 },
  };
}

/** POST /ban-detection/check （line_channel_id 省略で全件チェック） */
export async function runHealthCheck(lineChannelId?: number): Promise<void> {
  await apiFetch("/ban-detection/check", {
    method: "POST",
    body: lineChannelId != null ? { line_channel_id: lineChannelId } : {},
  });
}

/** POST /ban-detection/switch （from を停止・to を有効化） */
export async function switchActiveChannel(
  fromChannelId: number,
  toChannelId: number,
): Promise<void> {
  await apiFetch("/ban-detection/switch", {
    method: "POST",
    body: { from_channel_id: fromChannelId, to_channel_id: toChannelId },
  });
}

/** POST /ban-detection/fallback （BAN 時の自動切替先を設定） */
export async function setFallbackChannel(
  channelId: number,
  fallbackChannelId: number | null,
): Promise<void> {
  await apiFetch("/ban-detection/fallback", {
    method: "POST",
    body: { channel_id: channelId, fallback_channel_id: fallbackChannelId },
  });
}
