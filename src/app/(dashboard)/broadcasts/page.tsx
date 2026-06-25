"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faSort,
  faPenToSquare,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/tag-badge";
import { BroadcastStatusBadge } from "@/components/broadcasts/status-badge";
import { type MockBroadcast, type MockTag } from "@/mocks/data";
import { cn } from "@/lib/utils";
import {
  fetchBroadcasts,
  deleteBroadcast,
  sendBroadcastNow,
  bulkDeleteBroadcasts,
} from "@/lib/api/broadcasts";
import { fetchTags } from "@/lib/api/tags";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

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
  const { currentChannelId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("scheduled");
  const [allPeriod, setAllPeriod] = useState(true);
  const [yearMonth, setYearMonth] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const month = !allPeriod && yearMonth ? yearMonth : undefined;
  const { data: broadcasts, mutate } = useResource(
    currentChannelId
      ? `broadcasts:${currentChannelId}:${activeTab}:${month ?? "all"}`
      : null,
    () => fetchBroadcasts({ tab: activeTab, month }),
  );
  const { data: tagList } = useResource(
    currentChannelId ? `tags:${currentChannelId}` : null,
    () => fetchTags(),
  );
  const tags = tagList ?? [];

  // サーバ側で tab/month による絞込み・並べ替え済み。
  const items = broadcasts ?? [];

  async function handleDelete(b: MockBroadcast) {
    if (!confirm(`「${b.title}」を削除しますか？`)) return;
    await deleteBroadcast(b.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(b.id);
      return next;
    });
    mutate();
  }

  async function handleSendNow(b: MockBroadcast) {
    if (!confirm(`「${b.title}」を今すぐ配信しますか？`)) return;
    await sendBroadcastNow(b.id);
    mutate();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件の配信を削除しますか？`)) return;
    await bulkDeleteBroadcasts([...selectedIds]);
    setSelectedIds(new Set());
    mutate();
  }

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
    setAllPeriod(true);
    setYearMonth("");
  };

  const emptyMessage = {
    scheduled: "配信予約の登録はありません",
    draft: "下書きはありません",
    history: "配信履歴はありません",
  }[activeTab];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* タイトル */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">メッセージ配信</h1>
          <p className="text-sm text-muted-foreground mt-1">
            通信状況により配信予定時間から5~15分遅れて配信される場合があります。
          </p>
        </div>
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

      {/* ツールバー */}
      <div className="flex items-center gap-3 flex-wrap">
        {activeTab !== "history" && (
          <Link
            href="/broadcasts/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3" />
            新規作成
          </Link>
        )}
        <Button
          variant={!allPeriod ? "outline" : "default"}
          className={cn(
            "h-10",
            allPeriod && "bg-muted text-foreground hover:bg-muted"
          )}
          onClick={() => {
            setAllPeriod(true);
            setYearMonth("");
          }}
        >
          全期間
        </Button>
        <Input
          type="month"
          value={yearMonth}
          onChange={(e) => {
            setYearMonth(e.target.value);
            setAllPeriod(!e.target.value);
          }}
          className="h-10 w-44"
        />
        <span className="text-xs text-muted-foreground">
          {activeTab === "draft"
            ? "※ 下書きは配信予定日時を過ぎても配信されません。"
            : activeTab === "scheduled"
              ? "※ 配信日時5分前から配信内容の編集はできません。"
              : "※ 配信履歴は変更できません。"}
        </span>
        {activeTab !== "history" && (
          <Button
            variant="outline"
            className="h-10 ml-auto text-muted-foreground hover:text-destructive"
            disabled={!hasSelection}
            onClick={handleBulkDelete}
          >
            <FontAwesomeIcon icon={faTrash} className="size-3" />
            一括削除
          </Button>
        )}
      </div>

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
                  状態
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <EmptyRow colSpan={5} message={emptyMessage} />
              ) : (
                items.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      {formatDt(b.sentAt)}
                    </td>
                    <td className="px-3 py-3">
                      <TitleCell broadcast={b} />
                    </td>
                    <td className="px-3 py-3">
                      <TargetCell broadcast={b} tags={tags} />
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
                  </tr>
                ))
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
                <SortableHeader
                  label={activeTab === "draft" ? "更新日時" : "配信予定日時"}
                  className="w-40"
                />
                <th className="px-3 py-2 text-left font-bold text-foreground">
                  管理用タイトル
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                  配信先絞込み
                </th>
                <th className="px-3 py-2 text-right font-bold text-foreground w-24">
                  配信数
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                  送信者名
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                  アクション
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-28">
                  クイックテスト
                </th>
                <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <EmptyRow colSpan={9} message={emptyMessage} />
              ) : (
                items.map((b) => {
                  const when =
                    activeTab === "draft" ? b.updatedAt : b.scheduledAt;
                  const checked = selectedIds.has(b.id);
                  // 編集・今すぐ配信は下書き/予約のみ（配信済み・送信中は不可）
                  const editable =
                    b.status === "draft" || b.status === "scheduled";
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
                        <TitleCell broadcast={b} />
                      </td>
                      <td className="px-3 py-3">
                        <TargetCell broadcast={b} tags={tags} />
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums text-muted-foreground">
                        {b.totalCount > 0
                          ? b.totalCount.toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground truncate">
                        {b.lineChannelName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {b.actionsCount && b.actionsCount > 0 ? (
                          <span className="inline-flex items-center rounded border border-border px-2 py-1 text-[11px] font-bold text-foreground">
                            設定済 {b.actionsCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        —
                      </td>
                      <td className="px-3 py-3">
                        <div className="inline-flex items-center gap-1">
                          {editable && (
                            <Link
                              href={`/broadcasts/new?id=${b.id}`}
                              className="inline-flex items-center justify-center size-9 rounded-md hover:bg-muted text-foreground"
                              aria-label="編集"
                            >
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="size-3.5"
                              />
                            </Link>
                          )}
                          {editable && (
                            <button
                              onClick={() => handleSendNow(b)}
                              className="inline-flex items-center justify-center size-9 rounded-md hover:bg-muted text-blue-600 dark:text-blue-400"
                              aria-label="今すぐ配信"
                              title="今すぐ配信"
                            >
                              <FontAwesomeIcon
                                icon={faPaperPlane}
                                className="size-3.5"
                              />
                            </button>
                          )}
                          {b.status !== "sending" && (
                            <button
                              onClick={() => handleDelete(b)}
                              className="inline-flex items-center justify-center size-9 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                              aria-label="削除"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="size-3.5"
                              />
                            </button>
                          )}
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
        全{items.length}件中 {items.length === 0 ? "1−0" : `1−${items.length}`}
        件を表示
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr className="border-b border-border">
      <td
        colSpan={colSpan}
        className="px-3 py-8 text-center text-sm text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  );
}

function TitleCell({ broadcast: b }: { broadcast: MockBroadcast }) {
  return (
    <>
      <div className="text-sm font-medium truncate">{b.title}</div>
      <div className="text-[11px] text-muted-foreground truncate max-w-md">
        {b.preview}
      </div>
    </>
  );
}

function TargetCell({
  broadcast,
  tags,
}: {
  broadcast: MockBroadcast;
  tags: MockTag[];
}) {
  if (broadcast.targetType === "all") {
    return <span className="text-xs text-muted-foreground">全員</span>;
  }
  const tag = tags.find((t) => t.id === broadcast.targetTagId);
  if (tag) {
    return <TagBadge tag={tag} size="sm" />;
  }
  return <span className="text-xs text-muted-foreground">—</span>;
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
        <FontAwesomeIcon
          icon={faSort}
          className="size-2.5 text-muted-foreground"
        />
      </span>
    </th>
  );
}
