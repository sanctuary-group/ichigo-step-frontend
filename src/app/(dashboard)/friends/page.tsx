"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faSort,
  faChevronLeft,
  faChevronRight,
  faBan,
  faHandPaper,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_FRIENDS } from "@/mocks/data";
import { cn } from "@/lib/utils";

type FilterMode = "active" | "hidden" | "blocked" | "blockedBy";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
function formatYmd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return MOCK_FRIENDS.filter((f) => {
      if (mode === "hidden" && !f.isHidden) return false;
      if (mode === "blocked" && f.isFollowing) return false;
      if (mode === "blockedBy") return false;
      if (mode === "active" && (!f.isFollowing || f.isHidden)) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay =
          f.displayName.toLowerCase() +
          " " +
          (f.systemDisplayName?.toLowerCase() ?? "");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [mode, query]);

  const allCheckedInView =
    filtered.length > 0 && filtered.every((f) => selectedIds.has(f.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const f of filtered) next.delete(f.id);
      } else {
        for (const f of filtered) next.add(f.id);
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

  const clearable = query.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">友だちリスト</h1>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
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
            <Button className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold">
              絞込み
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMode("hidden")}
              className={cn(
                "h-10 px-5 font-bold text-white",
                mode === "hidden"
                  ? "bg-zinc-600 hover:bg-zinc-700"
                  : "bg-zinc-500 hover:bg-zinc-600"
              )}
            >
              非表示中の友だち
            </Button>
            <Button
              onClick={() => setMode("blocked")}
              className={cn(
                "h-10 px-5 font-bold text-white",
                mode === "blocked"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-500 hover:bg-red-600"
              )}
            >
              <FontAwesomeIcon icon={faBan} className="size-3.5" />
              ブロックされた友だち
            </Button>
            <Button
              onClick={() => setMode("blockedBy")}
              variant="outline"
              className={cn(
                "h-10 px-5 font-bold border-2",
                mode === "blockedBy"
                  ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30"
                  : "border-red-300 text-red-600 hover:bg-red-50/40 dark:hover:bg-red-950/20"
              )}
            >
              <FontAwesomeIcon icon={faHandPaper} className="size-3.5" />
              ブロックした友だち
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/40 px-6 py-3 border-y border-border">
          <div className="text-sm">
            検索結果： <span className="font-bold">{filtered.length}人</span>
          </div>
          <Button
            variant="outline"
            disabled={!clearable}
            onClick={() => setQuery("")}
            className="h-9 px-6 bg-muted/60 border-border disabled:opacity-50"
          >
            クリア
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left text-primary-foreground w-28">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <span className="font-bold text-xs">全選択</span>
                    <input
                      type="checkbox"
                      checked={allCheckedInView}
                      onChange={toggleAll}
                      disabled={filtered.length === 0}
                      className="size-4 rounded border-white/30 accent-white bg-white/10"
                      aria-label="すべて選択"
                    />
                  </label>
                </th>
                <PrimaryHeader label="友だち追加日時" className="w-40" />
                <PrimaryHeader label="最新メッセージ" className="w-40" />
                <th className="px-3 py-3 text-left text-primary-foreground font-bold">
                  LINE登録名
                </th>
                <th className="px-3 py-3 text-left text-primary-foreground font-bold">
                  システム表示名
                </th>
                <th className="px-3 py-3 text-left text-primary-foreground font-bold">
                  メールアドレス
                </th>
                <th className="px-3 py-3 text-left text-primary-foreground font-bold w-32">
                  ステップ配信状況
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-sm text-center text-muted-foreground"
                  >
                    該当する友だちはいません
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const checked = selectedIds.has(f.id);
                  return (
                    <tr
                      key={f.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/30",
                        checked && "bg-primary/5"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(f.id)}
                          className="size-4 rounded border-border accent-primary"
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatYmd(f.followedAt)}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {f.lastMessageAt ? formatYmd(f.lastMessageAt) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href="/chat"
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Avatar className="size-7">
                            <AvatarImage src={f.pictureUrl} />
                            <AvatarFallback>
                              {f.displayName.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{f.displayName}</span>
                        </a>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {f.systemDisplayName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {f.email ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {f.scenarioStepLabel ?? "停止中"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-border flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-9" aria-label="前へ">
              <FontAwesomeIcon
                icon={faChevronLeft}
                className="size-3 text-blue-600"
              />
            </Button>
            <Button variant="ghost" size="icon" className="size-9" aria-label="次へ">
              <FontAwesomeIcon
                icon={faChevronRight}
                className="size-3 text-blue-600"
              />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">
            {filtered.length}人中 {filtered.length > 0 ? 1 : 0} -{" "}
            {filtered.length}人目を表示中
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left font-bold text-primary-foreground cursor-pointer",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <FontAwesomeIcon icon={faSort} className="size-2.5 text-white/70" />
      </span>
    </th>
  );
}
