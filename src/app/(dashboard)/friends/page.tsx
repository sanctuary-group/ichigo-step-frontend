"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faBan,
  faHand,
  faSort,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchFriends } from "@/lib/api/friends";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

type FilterMode = "active" | "hidden" | "blocked" | "blockedBy";

const MODE_BUTTONS: {
  value: FilterMode;
  label: string;
  icon?: IconDefinition;
  tone: "gray" | "red-solid" | "red-outline";
}[] = [
  { value: "hidden", label: "非表示中の友だち", tone: "gray" },
  {
    value: "blocked",
    label: "ブロックされた友だち",
    icon: faBan,
    tone: "red-solid",
  },
  {
    value: "blockedBy",
    label: "ブロックした友だち",
    icon: faHand,
    tone: "red-outline",
  },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatYmdHm(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(
    d.getDate(),
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FriendsPage() {
  const { currentChannelId } = useAuth();
  const [query, setQuery] = useState("");
  // 入力中のテキストをそのまま使うと毎打鍵でリクエストするため、絞込みボタンで確定する。
  const [appliedQuery, setAppliedQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // backend は active/hidden/blocked のみ対応。blockedBy は空表示（mockup と同挙動）。
  const apiMode = mode === "blockedBy" ? null : mode;
  const resourceKey =
    apiMode && currentChannelId
      ? `friends:${currentChannelId}:${apiMode}:${appliedQuery}`
      : null;

  const { data } = useResource(resourceKey, () =>
    fetchFriends({ mode: apiMode!, q: appliedQuery || undefined }),
  );

  const friends = data?.friends ?? [];
  const total = data?.meta.total ?? friends.length;

  const navigateSearch = () => {
    setAppliedQuery(query.trim());
    setSelectedIds(new Set());
  };

  const clearAll = () => {
    setQuery("");
    setAppliedQuery("");
    setMode("active");
    setSelectedIds(new Set());
  };

  // モードはトグル: 同じボタンを再クリックでアクティブ（既定）に戻す
  const toggleMode = (value: FilterMode) => {
    setMode((prev) => (prev === value ? "active" : value));
    setSelectedIds(new Set());
  };

  const allCheckedInView =
    friends.length > 0 && friends.every((f) => selectedIds.has(f.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const f of friends) next.delete(f.id);
      } else {
        for (const f of friends) next.add(f.id);
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-foreground/80">
        友だちリスト
      </h1>

      {/* ツールバー */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative w-72 max-w-full">
            <Input
              placeholder="友だち名・システム表示名"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pr-9"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          <Button
            type="submit"
            className="h-10 px-5 bg-blue-500 hover:bg-blue-600 text-white"
          >
            絞込み
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {MODE_BUTTONS.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => toggleMode(m.value)}
                className={cn(
                  "inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-bold transition-colors border",
                  m.tone === "gray" &&
                    (active
                      ? "bg-slate-500 text-white border-slate-500"
                      : "bg-slate-400 text-white border-slate-400 hover:bg-slate-500"),
                  m.tone === "red-solid" &&
                    (active
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-red-500 text-white border-red-500 hover:bg-red-600"),
                  m.tone === "red-outline" &&
                    (active
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-background text-red-500 border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"),
                )}
              >
                {m.icon && (
                  <FontAwesomeIcon icon={m.icon} className="size-3.5" />
                )}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 検索結果バー */}
      <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-4 py-3">
        <div className="text-sm">
          検索結果：{" "}
          <span className="font-bold tabular-nums">{total}</span>人
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-5 bg-muted text-muted-foreground hover:bg-muted/70"
          onClick={clearAll}
        >
          クリア
        </Button>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="px-3 py-3 text-left font-bold w-24">
                <span className="inline-flex items-center gap-2">
                  全選択
                  <input
                    type="checkbox"
                    checked={allCheckedInView}
                    onChange={toggleAll}
                    disabled={friends.length === 0}
                    className="size-4 rounded accent-white"
                    aria-label="すべて選択"
                  />
                </span>
              </th>
              <SortableHeader label="友だち追加日時" />
              <SortableHeader label="最新メッセージ" />
              <th className="px-3 py-3 text-left font-bold">LINE登録名</th>
              <th className="px-3 py-3 text-left font-bold">システム表示名</th>
              <th className="px-3 py-3 text-left font-bold">メールアドレス</th>
              <th className="px-3 py-3 text-left font-bold">
                ステップ配信状況
              </th>
            </tr>
          </thead>
          <tbody>
            {friends.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-12 text-sm text-center text-muted-foreground"
                >
                  該当する友だちはいません
                </td>
              </tr>
            ) : (
              friends.map((f) => {
                const checked = selectedIds.has(f.id);
                return (
                  <tr
                    key={f.id}
                    className={cn(
                      "border-b border-border hover:bg-muted/30",
                      checked && "bg-primary/5",
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRow(f.id)}
                        className="size-4 rounded border-border accent-primary"
                        aria-label="選択"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatYmdHm(f.followedAt)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatYmdHm(f.lastMessageAt ?? null)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/chat?friend=${f.id}`}
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Avatar className="size-7">
                          <AvatarImage src={f.pictureUrl} />
                          <AvatarFallback>
                            {f.displayName.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {f.displayName || "—"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      {f.systemDisplayName || "—"}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {f.email || "—"}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {f.scenarioStepLabel || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="size-9 p-0 text-blue-500 disabled:opacity-30"
            disabled
            aria-label="前のページ"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            className="size-9 p-0 text-blue-500 disabled:opacity-30"
            disabled
            aria-label="次のページ"
          >
            <FontAwesomeIcon icon={faChevronRight} className="size-3.5" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">
          {total}人中 {friends.length > 0 ? 1 : 0} - {friends.length}
          人目を表示中
        </div>
      </div>
    </div>
  );
}

function SortableHeader({ label }: { label: string }) {
  return (
    <th className="px-3 py-3 text-left font-bold w-44">
      <span className="inline-flex items-center gap-1.5">
        {label}
        <FontAwesomeIcon icon={faSort} className="size-2.5 opacity-80" />
      </span>
    </th>
  );
}
