"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_FRIENDS } from "@/mocks/data";
import { cn } from "@/lib/utils";

type ViewMode = "all" | "unread";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatReceivedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChatManagementPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("all");
  const [includeReplies, setIncludeReplies] = useState(false);
  const [allTime, setAllTime] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"read" | "unread">("read");

  const rows = useMemo(() => {
    return MOCK_FRIENDS.filter((f) => {
      if (view === "unread" && f.unreadCount === 0) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !f.displayName.toLowerCase().includes(q) &&
          !(f.lastMessagePreview?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      if (!allTime && f.lastMessageAt) {
        if (dateFrom && f.lastMessageAt < dateFrom) return false;
        if (dateTo && f.lastMessageAt > dateTo + "T23:59:59") return false;
      }
      return true;
    }).sort((a, b) =>
      (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")
    );
  }, [query, view, allTime, dateFrom, dateTo]);

  const allCheckedInView = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const r of rows) next.delete(r.id);
      } else {
        for (const r of rows) next.add(r.id);
      }
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">チャット管理</h1>

      {/* メッセージ検索 */}
      <div className="flex items-center gap-3">
        <Label className="font-bold w-28 shrink-0">メッセージ検索</Label>
        <div className="relative max-w-xl flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10 h-10"
          />
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>

      {/* フィルタ行 */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setView("all")}
          className={cn(
            "h-10 px-8 rounded-md text-sm font-medium transition-colors border",
            view === "all"
              ? "bg-background text-primary border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/40"
          )}
        >
          一覧
        </button>
        <button
          onClick={() => setView("unread")}
          className={cn(
            "h-10 px-6 rounded-md text-sm font-medium transition-colors",
            view === "unread"
              ? "bg-primary text-primary-foreground"
              : "bg-primary/80 text-primary-foreground hover:bg-primary"
          )}
        >
          未確認のみ
        </button>
        <button className="h-10 px-6 rounded-md text-sm font-medium bg-[oklch(0.62_0.13_220)] text-white hover:opacity-90 transition-opacity">
          絞り込み
        </button>
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            checked={includeReplies}
            onChange={(e) => setIncludeReplies(e.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          返信を含める
        </label>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setAllTime(true)}
            className={cn(
              "h-10 px-6 rounded-md text-sm font-medium transition-colors",
              allTime
                ? "bg-muted text-foreground"
                : "bg-background border border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            全期間
          </button>
          <Label className="font-bold">表示期間</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              if (e.target.value) setAllTime(false);
            }}
            className="w-40 h-10"
          />
          <span className="text-sm">から</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              if (e.target.value) setAllTime(false);
            }}
            className="w-40 h-10"
          />
        </div>
      </div>

      {/* テーブル */}
      <div className="rounded-md overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="w-24 px-3 py-2 text-left align-bottom">
                <div className="text-[10px] font-normal mb-1">ページ内選択</div>
                <input
                  type="checkbox"
                  checked={allCheckedInView}
                  onChange={toggleAll}
                  disabled={rows.length === 0}
                  className="size-4 rounded border-white/40 accent-white"
                  aria-label="すべて選択"
                />
              </th>
              <th className="px-3 py-3 text-left font-semibold w-28">
                ステータス
              </th>
              <th className="px-3 py-3 text-left font-semibold w-40">受信日時</th>
              <th className="px-3 py-3 text-left font-semibold w-44">LINE名</th>
              <th className="px-3 py-3 text-left font-semibold">メッセージ内容</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-sm text-foreground py-8"
                >
                  該当するメッセージがありません。
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isUnread = r.unreadCount > 0;
                const checked = selectedIds.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-t border-border hover:bg-muted/30",
                      checked && "bg-primary/5"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRow(r.id)}
                        className="size-4 rounded border-border accent-primary"
                        aria-label={`${r.displayName} を選択`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium",
                          isUnread
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isUnread ? "未確認" : "確認済"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      {r.lastMessageAt ? formatReceivedAt(r.lastMessageAt) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium truncate">
                        {r.displayName}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-foreground line-clamp-1 max-w-xl">
                        {r.lastMessagePreview ?? "—"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 一括変更 + ページネーション */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-foreground">
            ステータス 一括変更
          </div>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input
                type="radio"
                name="bulk-status"
                checked={bulkStatus === "read"}
                onChange={() => setBulkStatus("read")}
                className="accent-blue-600"
              />
              確認済
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input
                type="radio"
                name="bulk-status"
                checked={bulkStatus === "unread"}
                onChange={() => setBulkStatus("unread")}
                className="accent-blue-600"
              />
              未確認
            </label>
            <Button
              size="sm"
              disabled={selectedIds.size === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-5"
            >
              変更
            </Button>
          </div>
        </div>

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-8">
          次へ
        </Button>
      </div>
    </div>
  );
}
