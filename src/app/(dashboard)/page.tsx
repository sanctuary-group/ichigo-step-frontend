"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { fetchAnnouncements, type AnnouncementImportance } from "@/lib/api/announcements";
import { fetchFriendTrend } from "@/lib/api/dashboard";
import { useResource } from "@/lib/api/use-resource";

const IMPORTANCE_LABEL: Record<
  AnnouncementImportance,
  { label: string; className: string } | null
> = {
  normal: null,
  important: { label: "重要", className: "bg-red-500 text-white" },
  maintenance: { label: "メンテナンス", className: "bg-amber-500 text-white" },
};

export default function HomePage() {
  const { data: announcements } = useResource(
    "announcements",
    fetchAnnouncements,
  );
  const announcementList = announcements ?? [];

  const { data: trend } = useResource("home-friend-trend", fetchFriendTrend);
  const friendDailyRows = trend?.friendDailyRows ?? [];
  const statusBuckets = trend?.statusBuckets ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <h1 className="text-xl font-bold tracking-tight">ホーム</h1>

      {/* お知らせ */}
      <section className="space-y-3">
        <h2 className="text-base font-bold">お知らせ</h2>
        <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] bg-muted/60 px-5 py-2.5 text-sm font-bold">
            <div>投稿日</div>
            <div>お知らせ内容</div>
          </div>
          <ul className="max-h-56 overflow-y-auto bg-background/40">
            {announcementList.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground text-center">
                お知らせはありません
              </li>
            ) : (
              announcementList.map((a) => {
                const imp = IMPORTANCE_LABEL[a.importance];
                return (
                  <li
                    key={a.id}
                    className="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] px-5 py-2.5 text-sm border-t border-border/60 first:border-t-0"
                  >
                    <div className="text-foreground">{a.date}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      {a.isNew && (
                        <span className="inline-flex items-center bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                          NEW
                        </span>
                      )}
                      {imp && (
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${imp.className}`}
                        >
                          {imp.label}
                        </span>
                      )}
                      <span className="text-foreground truncate">
                        {a.title}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      {/* 友だち数推移 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">友だち数推移</h2>
          <Link href="/friends">
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-muted/60 text-muted-foreground hover:bg-muted"
            >
              詳細表示
              <FontAwesomeIcon icon={faAngleRight} className="size-2.5" />
            </Button>
          </Link>
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
              {friendDailyRows.length === 0 ? (
                <tr className="border-b border-border">
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    データがありません
                  </td>
                </tr>
              ) : (
                friendDailyRows.map((r) => (
                  <tr key={r.date} className="border-b border-border">
                    <td className="px-4 py-3 text-sm tabular-nums">
                      {r.date} ({r.weekday})
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {r.added}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {r.blocked}
                    </td>
                    <td
                      className={`px-4 py-3 text-center tabular-nums ${r.diff > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : r.diff < 0 ? "text-destructive font-bold" : ""}`}
                    >
                      {r.diff > 0 ? "+" : ""}
                      {r.diff}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {r.active}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {r.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          ※タイムラグが発生し LINE OFFICIAL ACCOUNT MANAGER
          の表示数と異なる可能性があります
        </p>
      </section>

      {/* 対応ステータス別人数 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold">対応ステータス別人数</h2>
        {statusBuckets.length === 0 ? (
          <div className="rounded-md border border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            データがありません
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {statusBuckets.map((s) => (
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
        )}
      </section>
    </div>
  );
}
