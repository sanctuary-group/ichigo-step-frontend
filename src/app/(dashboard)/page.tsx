"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";

type Announcement = {
  date: string;
  title: string;
  isNew?: boolean;
};

const ANNOUNCEMENTS: Announcement[] = [
  { date: "2026年05月12日", title: "2026年5月アップデート情報", isNew: true },
  { date: "2026年04月10日", title: "AI連携（MCP接続）に対応しました" },
  {
    date: "2026年03月14日",
    title: "ichigo-step 有料プラン 2月・3月の請求スケジュールについて",
  },
  { date: "2026年02月04日", title: "2月アップデート情報" },
  { date: "2025年11月22日", title: "11月アップデート情報" },
  {
    date: "2025年04月27日",
    title: "【重要】UnivaPay決済連携の追加設定のご案内",
  },
];

type FriendDailyRow = {
  date: string;
  weekday: string;
  added: number;
  blocked: number;
  diff: number;
  active: number;
  total: number;
};

const FRIEND_ROWS: FriendDailyRow[] = [
  { date: "2026年05月26日", weekday: "火", added: 0, blocked: 0, diff: 0, active: 2, total: 3 },
  { date: "2026年05月25日", weekday: "月", added: 0, blocked: 0, diff: 0, active: 2, total: 3 },
  { date: "2026年05月24日", weekday: "日", added: 0, blocked: 0, diff: 0, active: 2, total: 3 },
  { date: "2026年05月23日", weekday: "土", added: 0, blocked: 1, diff: -1, active: 2, total: 3 },
  { date: "2026年05月22日", weekday: "金", added: 0, blocked: 0, diff: 0, active: 3, total: 3 },
  { date: "2026年05月21日", weekday: "木", added: 0, blocked: 0, diff: 0, active: 3, total: 3 },
  { date: "2026年05月20日", weekday: "水", added: 0, blocked: 0, diff: 0, active: 3, total: 3 },
];

type StatusBucket = {
  label: string;
  color: string;
  count: number;
};

const STATUS_BUCKETS: StatusBucket[] = [
  { label: "見込みあり", color: "#f59e0b", count: 0 },
  { label: "対応中", color: "#3b82f6", count: 0 },
  { label: "フォロー", color: "#10b981", count: 0 },
  { label: "トラブル", color: "#ef4444", count: 0 },
  { label: "対応完了", color: "#6b7280", count: 0 },
  { label: "未設定", color: "#cbd5e1", count: 2 },
];

export default function HomePage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <h1 className="text-xl font-bold tracking-tight">ホーム</h1>

      <section className="space-y-3">
        <h2 className="text-base font-bold">お知らせ</h2>
        <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] bg-muted/60 px-5 py-2.5 text-sm font-bold">
            <div>投稿日</div>
            <div>お知らせ内容</div>
          </div>
          <ul className="max-h-56 overflow-y-auto bg-background/40">
            {ANNOUNCEMENTS.map((a, i) => (
              <li
                key={i}
                className="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] px-5 py-2.5 text-sm border-t border-border/60 first:border-t-0"
              >
                <div className="text-foreground">{a.date}</div>
                <div className="flex items-center gap-2 min-w-0">
                  {a.isNew && (
                    <span className="inline-flex items-center bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  )}
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline truncate"
                  >
                    {a.title}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">友だち数推移</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-muted/60 text-muted-foreground hover:bg-muted"
          >
            詳細表示
            <FontAwesomeIcon icon={faAngleRight} className="size-2.5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary">
              <tr>
                <th className="px-4 py-2.5 text-left font-bold text-primary-foreground">
                  日付
                </th>
                <th className="px-4 py-2.5 text-center font-bold text-primary-foreground">
                  友だち追加数
                </th>
                <th className="px-4 py-2.5 text-center font-bold text-primary-foreground">
                  ブロック数
                </th>
                <th className="px-4 py-2.5 text-center font-bold text-primary-foreground">
                  前日比
                </th>
                <th className="px-4 py-2.5 text-center font-bold text-primary-foreground">
                  有効友だち数
                </th>
                <th className="px-4 py-2.5 text-center font-bold text-primary-foreground">
                  友だち追加総数
                </th>
              </tr>
            </thead>
            <tbody>
              {FRIEND_ROWS.map((r) => (
                <tr key={r.date} className="border-b border-border">
                  <td className="px-4 py-3 text-sm tabular-nums">
                    {r.date} ({r.weekday})
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {r.added === 0 ? (
                      <a
                        href="#"
                        className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                      >
                        0
                      </a>
                    ) : (
                      <a
                        href="#"
                        className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                      >
                        {r.added}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <a
                      href="#"
                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                    >
                      {r.blocked}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {r.diff}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {r.active}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {r.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          ※タイムラグが発生しLINE OFFICIAL ACCOUNT MANAGERの表示数と異なる可能性があります
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">対応ステータス別人数</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {STATUS_BUCKETS.map((s) => (
            <div
              key={s.label}
              className="rounded-md border border-border bg-background px-4 py-3"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </div>
              <div className="text-2xl font-bold tabular-nums mt-1">
                {s.count}
                <span className="text-xs text-muted-foreground ml-1">人</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
