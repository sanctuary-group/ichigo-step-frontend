/**
 * ダッシュボード用の 30 日分時系列ダミーデータ。
 * 末尾の日付 = 「今日」想定（2026/05/25）。
 */

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  followers: number; // 新規友だち
  blocks: number; // ブロック
  messages: number; // 送信メッセージ数
  broadcasts: number; // 配信件数
};

const SEED_FOLLOWERS = [
  12, 8, 15, 22, 18, 9, 6, 14, 19, 28, 24, 16, 11, 7, 13, 20, 25, 31, 18, 14,
  10, 8, 12, 17, 23, 29, 22, 15, 11, 9,
];
const SEED_BLOCKS = [
  2, 1, 3, 4, 2, 1, 1, 2, 3, 5, 4, 2, 1, 0, 2, 3, 4, 5, 3, 2, 1, 1, 2, 3, 4, 5,
  3, 2, 1, 1,
];
const SEED_MESSAGES = [
  120, 95, 180, 320, 280, 110, 90, 175, 220, 410, 360, 195, 130, 85, 165, 245,
  320, 480, 240, 175, 130, 100, 155, 220, 305, 430, 320, 210, 145, 120,
];
const SEED_BROADCASTS = [
  1, 0, 1, 2, 1, 0, 0, 1, 1, 2, 2, 1, 1, 0, 1, 1, 2, 3, 1, 1, 0, 0, 1, 1, 2, 2,
  1, 1, 0, 0,
];

export const LAST_30_DAYS: DailyPoint[] = (() => {
  const today = new Date("2026-05-25T00:00:00+09:00");
  const days: DailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const idx = 29 - i;
    days.push({
      date: iso,
      followers: SEED_FOLLOWERS[idx],
      blocks: SEED_BLOCKS[idx],
      messages: SEED_MESSAGES[idx],
      broadcasts: SEED_BROADCASTS[idx],
    });
  }
  return days;
})();

export const TOTAL_FRIENDS = 1853;
export const ACTIVE_FRIENDS = 1742;

export type Kpi = {
  label: string;
  value: number;
  unit?: string;
  diff: number; // 前期比 (%)
};

export const KPIS: Kpi[] = [
  {
    label: "総友だち数",
    value: TOTAL_FRIENDS,
    diff: +8.4,
  },
  {
    label: "直近30日 新規",
    value: LAST_30_DAYS.reduce((s, d) => s + d.followers, 0),
    diff: +12.1,
  },
  {
    label: "直近30日 ブロック",
    value: LAST_30_DAYS.reduce((s, d) => s + d.blocks, 0),
    diff: -3.2,
  },
  {
    label: "直近30日 送信数",
    value: LAST_30_DAYS.reduce((s, d) => s + d.messages, 0),
    unit: "通",
    diff: +18.7,
  },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
