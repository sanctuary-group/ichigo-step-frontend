"use client";

import { FormEvent, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchFriends } from "@/lib/api/friends";
import { bulkUpdateRead } from "@/lib/api/chat-settings";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

type ViewMode = "all" | "unread";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatReceivedAt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChatManagementPage() {
  const { currentChannelId } = useAuth();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [view, setView] = useState<ViewMode>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"read" | "unread">("read");
  const [submitting, setSubmitting] = useState(false);

  const resourceKey = currentChannelId
    ? `chat-management:${currentChannelId}:${appliedQuery}:${page}`
    : null;

  const { data, isLoading, mutate } = useResource(resourceKey, () =>
    fetchFriends({
      mode: "active",
      q: appliedQuery || undefined,
      sort: "last_message_at",
      dir: "desc",
      page,
    }),
  );

  const meta = data?.meta;

  // backend の friends 一覧は view(未確認のみ)・日付範囲を未対応のため、
  // 取得済みページ内でクライアントフィルタする。
  const rows = useMemo(() => {
    const list = data?.friends ?? [];
    return list.filter((f) => {
      if (view === "unread" && f.unreadCount === 0) return false;
      if (dateFrom && f.lastMessageAt && f.lastMessageAt < dateFrom) return false;
      if (dateTo && f.lastMessageAt && f.lastMessageAt > dateTo + "T23:59:59") {
        return false;
      }
      return true;
    });
  }, [data?.friends, view, dateFrom, dateTo]);

  const allTime = !dateFrom && !dateTo;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  };

  const setAllTime = () => {
    setDateFrom("");
    setDateTo("");
  };

  const allCheckedInView =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

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

  const onBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await bulkUpdateRead(Array.from(selectedIds), bulkStatus);
      setSelectedIds(new Set());
      mutate();
    } finally {
      setSubmitting(false);
    }
  };

  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < lastPage;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">チャット管理</h1>

      <form onSubmit={onSearch} className="flex items-center gap-3">
        <Label className="font-bold w-28 shrink-0">メッセージ検索</Label>
        <div className="relative max-w-xl flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="LINE 名 / システム表示名 / メッセージ内容"
            className="pr-10 h-10"
          />
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        <Button type="submit" className="h-10 px-5">
          検索
        </Button>
      </form>

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

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={setAllTime}
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
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40 h-10"
          />
          <span className="text-sm">から</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40 h-10"
          />
        </div>
      </div>

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
              <th className="px-3 py-3 text-left font-semibold w-44">LINE 名</th>
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
                  {isLoading
                    ? "読み込み中…"
                    : "該当するメッセージがありません。"}
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
                      {formatReceivedAt(r.lastMessageAt)}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={`/chat?friend=${r.id}`}
                        className="text-sm font-medium truncate text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {r.displayName}
                      </a>
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
                className="accent-primary"
              />
              確認済
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input
                type="radio"
                name="bulk-status"
                checked={bulkStatus === "unread"}
                onChange={() => setBulkStatus("unread")}
                className="accent-primary"
              />
              未確認
            </label>
            <Button
              size="sm"
              disabled={selectedIds.size === 0 || submitting}
              onClick={onBulkUpdate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-5"
            >
              変更 ({selectedIds.size})
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 px-3"
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
            前へ
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {lastPage}
          </span>
          <Button
            variant="outline"
            className="h-9 px-3"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            次へ
            <FontAwesomeIcon icon={faChevronRight} className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
