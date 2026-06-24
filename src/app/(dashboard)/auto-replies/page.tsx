"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolderPlus,
  faArrowsUpDown,
  faTrashCan,
  faFolderTree,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { MOCK_AUTO_REPLIES, MOCK_AUTO_REPLY_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

export default function AutoRepliesPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("arf_default");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of MOCK_AUTO_REPLIES) {
      map.set(r.folderId, (map.get(r.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(
    () => MOCK_AUTO_REPLIES.filter((r) => r.folderId === selectedFolderId),
    [selectedFolderId]
  );

  const allCheckedInView =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const r of filtered) next.delete(r.id);
      } else {
        for (const r of filtered) next.add(r.id);
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

  const selectionCount = selectedIds.size;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border flex items-start justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight">自動応答</h1>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-bold">
          <FontAwesomeIcon icon={faBookOpen} className="size-3.5" />
          マニュアル
        </Button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-[40vh] md:max-h-none">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-bold">フォルダ</div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground"
                aria-label="フォルダ追加"
              >
                <FontAwesomeIcon icon={faFolderPlus} className="size-3.5" />
              </button>
              <button
                type="button"
                className="grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground"
                aria-label="並べ替え"
              >
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3.5" />
              </button>
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto px-2 space-y-1">
            {MOCK_AUTO_REPLY_FOLDERS.map((f) => {
              const active = f.id === selectedFolderId;
              const count = folderCounts.get(f.id) ?? 0;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => {
                      setSelectedFolderId(f.id);
                      setSelectedIds(new Set());
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    {f.name} ({count})
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap">
            <Link
              href="/auto-replies/new"
              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              新規作成
            </Link>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 bg-zinc-500 hover:bg-zinc-600 text-white"
              >
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
              <Button
                size="sm"
                disabled={selectionCount === 0}
                className="h-9 bg-zinc-500 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFolderTree} className="size-3" />
                一括フォルダ変更
              </Button>
              <Button
                size="sm"
                disabled={selectionCount === 0}
                className="h-9 bg-zinc-400 hover:bg-zinc-500 text-white disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                一括削除
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-6">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allCheckedInView}
                      onChange={toggleAll}
                      disabled={filtered.length === 0}
                      className="size-4 rounded border-white/30 accent-white bg-white/10"
                      aria-label="すべて選択"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-32">
                    作成日
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-28">
                    稼働状況
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                    キーワード
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-48">
                    スケジュール
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? null : (
                  filtered.map((r) => {
                    const checked = selectedIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(r.id)}
                            className="size-4 rounded border-border accent-primary"
                          />
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {r.createdAt.slice(0, 10).replace(/-/g, "/")}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {r.isActive ? "稼働中" : "停止中"}
                        </td>
                        <td className="px-3 py-3 font-medium">{r.keyword}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {r.schedule}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
