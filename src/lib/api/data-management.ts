import { apiFetchPaginated } from "./client";
import { fetchTags } from "./tags";
import { fetchBroadcasts } from "./broadcasts";
import type { ApiFriend } from "./types";

export type DataManagementStats = {
  friendsTotal: number;
  friendsActive: number;
  tags: number;
  broadcastSuccess: number;
};

/**
 * データ管理ハブの統計。専用 API が無いため既存一覧 API を集計する。
 * - 友だち合計/アクティブ: /friends のページネーション meta.total
 * - タグ数: /tags の件数
 * - 配信成功: /broadcasts の success_count 合計
 */
export async function fetchDataManagementStats(): Promise<DataManagementStats> {
  const [all, active, tags, broadcasts] = await Promise.all([
    apiFetchPaginated<ApiFriend>("/friends"),
    apiFetchPaginated<ApiFriend>("/friends", { query: { mode: "active" } }),
    fetchTags(),
    fetchBroadcasts({ tab: "history" }),
  ]);

  const broadcastSuccess = broadcasts.reduce(
    (sum, b) => sum + (b.successCount ?? 0),
    0,
  );

  return {
    friendsTotal: all.meta.total,
    friendsActive: active.meta.total,
    tags: tags.length,
    broadcastSuccess,
  };
}
