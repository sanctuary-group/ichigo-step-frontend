"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faBookOpen,
  faSort,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagBadge } from "@/components/tag-badge";
import { BroadcastStatusBadge } from "@/components/broadcasts/status-badge";
import { MOCK_BROADCASTS, MOCK_TAGS, type MockBroadcast } from "@/mocks/data";
import { cn } from "@/lib/utils";

type TabId = "scheduled" | "draft" | "history";

const TABS: { id: TabId; label: string; statuses: MockBroadcast["status"][] }[] = [
  { id: "scheduled", label: "配信予約", statuses: ["scheduled", "sending"] },
  { id: "draft", label: "下書き", statuses: ["draft"] },
  { id: "history", label: "配信履歴", statuses: ["sent", "failed"] },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BroadcastsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("scheduled");
  const [allPeriod, setAllPeriod] = useState(true);
  const [yearMonth, setYearMonth] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState("100");

  const items = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return MOCK_BROADCASTS.filter((b) => tab.statuses.includes(b.status))
      .filter((b) => {
        if (allPeriod || !yearMonth) return true;
        const when = b.scheduledAt ?? b.sentAt;
        if (!when) return false;
        return when.startsWith(yearMonth);
      })
      .sort((a, b) => {
        const aw = a.scheduledAt ?? a.sentAt ?? "";
        const bw = b.scheduledAt ?? b.sentAt ?? "";
        return bw.localeCompare(aw);
      });
  }, [activeTab, allPeriod, yearMonth]);

  const allCheckedInView =
    items.length > 0 && items.every((it) => selectedIds.has(it.id));
  const hasSelection = selectedIds.size > 0;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const it of items) next.delete(it.id);
      } else {
        for (const it of items) next.add(it.id);
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

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setSelectedIds(new Set());
  };

  const emptyMessage = {
    scheduled: "配信予約の登録はありません",
    draft: "下書きはありません",
    history: "配信履歴はありません",
  }[activeTab];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* タイトル + マニュアル */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">メッセージ配信</h1>
          <p className="text-sm text-muted-foreground mt-1">
            通信状況により配信予定時間から5~15分遅れて配信される場合があります。
          </p>
        </div>
        <Button variant="outline">
          <FontAwesomeIcon icon={faBookOpen} className="size-3.5" />
          マニュアル
        </Button>
      </div>

      {/* タブ */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {TABS.map((t) => {
            const on = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "py-2 text-sm font-bold transition-colors relative -mb-px",
                  on
                    ? "text-primary border-b-2 border-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* アクション行 */}
      {activeTab === "history" ? (
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="month"
            placeholder="----年--月"
            value={yearMonth}
            onChange={(e) => {
              setYearMonth(e.target.value);
              if (e.target.value) setAllPeriod(false);
            }}
            className="w-40 h-10"
          />
          <button
            onClick={() => {
              setAllPeriod(true);
              setYearMonth("");
            }}
            className={cn(
              "h-10 px-6 rounded-md text-sm font-medium transition-colors border",
              allPeriod
                ? "bg-background text-foreground border-border"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            全期間
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">表示件数:</span>
            <Select value={pageSize} onValueChange={(v) => v && setPageSize(v)}>
              <SelectTrigger className="w-28 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25件</SelectItem>
                <SelectItem value="50">50件</SelectItem>
                <SelectItem value="100">100件</SelectItem>
                <SelectItem value="200">200件</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/broadcasts/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3" />
            新規作成
          </Link>

          {activeTab !== "draft" && (
            <>
              <button
                onClick={() => setAllPeriod(true)}
                className={cn(
                  "h-10 px-6 rounded-md text-sm font-medium transition-colors border",
                  allPeriod
                    ? "bg-background text-foreground border-border"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                全期間
              </button>
              <Input
                type="month"
                placeholder="----年--月"
                value={yearMonth}
                onChange={(e) => {
                  setYearMonth(e.target.value);
                  if (e.target.value) setAllPeriod(false);
                }}
                className="w-40 h-10"
              />
            </>
          )}

          <span className="text-xs text-muted-foreground">
            {activeTab === "draft"
              ? "配信予定日時が現在日時より前の場合でも、下書きの場合は配信されません。"
              : "※配信日時5分前から配信内容の編集はできません。"}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelection}
            className="ml-auto h-10 text-destructive hover:text-destructive"
          >
            <FontAwesomeIcon icon={faTrash} className="size-3" />
            一括削除
          </Button>
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto">
        {activeTab === "history" ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <SortableHeader label="配信日時" className="w-44" />
                <th className="px-3 py-2 text-left font-bold text-foreground">
                  管理用タイトル
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                  配信先絞込み
                </th>
                <th className="px-3 py-2 text-right font-bold text-foreground w-28">
                  配信数
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-b border-border">
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((b) => {
                  const tag = MOCK_TAGS.find((t) => t.id === b.targetTagId);
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDt(b.sentAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium truncate">
                          {b.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-md">
                          {b.preview}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {b.targetType === "all" ? (
                          <span className="text-xs text-muted-foreground">
                            全員
                          </span>
                        ) : tag ? (
                          <TagBadge tag={tag} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums">
                        {b.successCount.toLocaleString()}
                        <span className="text-muted-foreground">
                          {" / "}
                          {b.totalCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          詳細
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : activeTab === "draft" ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allCheckedInView}
                    onChange={toggleAll}
                    disabled={items.length === 0}
                    className="size-4 rounded border-border accent-primary"
                    aria-label="すべて選択"
                  />
                </th>
                <SortableHeader label="作成・更新日時" className="w-44" />
                <th className="px-3 py-2 text-left font-bold text-foreground">
                  管理用タイトル
                </th>
                <SortableHeader label="配信予定日時" className="w-44" />
                <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                  配信先絞込み
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-b border-border">
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((b) => {
                  const tag = MOCK_TAGS.find((t) => t.id === b.targetTagId);
                  const checked = selectedIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/30",
                        checked && "bg-primary/5"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(b.id)}
                          className="size-4 rounded border-border accent-primary"
                          aria-label={`${b.title} を選択`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDt(b.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium truncate">
                          {b.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-md">
                          {b.preview}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDt(b.scheduledAt)}
                      </td>
                      <td className="px-3 py-3">
                        {b.targetType === "all" ? (
                          <span className="text-xs text-muted-foreground">
                            全員
                          </span>
                        ) : tag ? (
                          <TagBadge tag={tag} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="編集"
                          >
                            <FontAwesomeIcon
                              icon={faPenToSquare}
                              className="size-3.5"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="削除"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="size-3.5"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allCheckedInView}
                    onChange={toggleAll}
                    disabled={items.length === 0}
                    className="size-4 rounded border-border accent-primary"
                    aria-label="すべて選択"
                  />
                </th>
                <SortableHeader label="配信予定日時" className="w-44" />
                <th className="px-3 py-2 text-left font-bold text-foreground">
                  管理用タイトル
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                  配信先絞込み
                </th>
                <th className="px-3 py-2 text-right font-bold text-foreground w-24">
                  配信数
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                  状態
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-b border-border">
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((b) => {
                  const tag = MOCK_TAGS.find((t) => t.id === b.targetTagId);
                  const when = b.scheduledAt ?? b.sentAt;
                  const checked = selectedIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/30",
                        checked && "bg-primary/5"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(b.id)}
                          className="size-4 rounded border-border accent-primary"
                          aria-label={`${b.title} を選択`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDt(when)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium truncate">
                          {b.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-md">
                          {b.preview}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {b.targetType === "all" ? (
                          <span className="text-xs text-muted-foreground">
                            全員
                          </span>
                        ) : tag ? (
                          <TagBadge tag={tag} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums">
                        {b.successCount.toLocaleString()}
                        <span className="text-muted-foreground">
                          {" / "}
                          {b.totalCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <BroadcastStatusBadge status={b.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="編集"
                          >
                            <FontAwesomeIcon
                              icon={faPenToSquare}
                              className="size-3.5"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="削除"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="size-3.5"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        全{items.length}件中 {items.length === 0 ? "1−0" : `1−${items.length}`}件を表示
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left font-bold text-foreground cursor-pointer hover:text-primary",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <FontAwesomeIcon icon={faSort} className="size-2.5 text-muted-foreground" />
      </span>
    </th>
  );
}
