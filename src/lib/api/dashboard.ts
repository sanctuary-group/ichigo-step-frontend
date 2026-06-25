import { apiFetch } from "./client";
import type { BroadcastStatus } from "@/types/broadcast";
import type { MockTag } from "@/mocks/data";

export type Point = { date: string; value: number };

export type Kpi = {
  label: string;
  value: number;
  unit?: string;
  diff: number | null;
};

export type RecentBroadcast = {
  id: number;
  title: string;
  preview: string;
  status: BroadcastStatus;
  tag: MockTag | null;
};

export type ActiveScenario = {
  id: number;
  name: string;
  steps_count: number;
  enrolled_count: number;
};

export type DashboardStats = {
  kpis: Kpi[];
  followerSeries: Point[];
  blockSeries: Point[];
  messageSeries: Point[];
  recentBroadcasts: RecentBroadcast[];
  activeScenarios: ActiveScenario[];
};

/**
 * GET /dashboard/stats（※backend 未実装。実装後に有効化。）
 * KPI・グラフ系列・最近の配信・進行中ステップをまとめて返す想定。
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}

export type FriendDailyRow = {
  date: string;
  weekday: string;
  added: number;
  blocked: number;
  diff: number;
  active: number;
  total: number;
};

export type StatusBucket = {
  label: string;
  color: string;
  count: number;
};

export type FriendTrend = {
  friendDailyRows: FriendDailyRow[];
  statusBuckets: StatusBucket[];
};

/**
 * GET /dashboard/friend-trend（※backend 未実装。実装後に有効化。）
 * ホームの友だち推移テーブル・対応ステータス別人数を返す想定。
 */
export async function fetchFriendTrend(): Promise<FriendTrend> {
  return apiFetch<FriendTrend>("/dashboard/friend-trend");
}
