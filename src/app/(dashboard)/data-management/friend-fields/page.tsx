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
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  MOCK_FRIEND_FIELDS,
  MOCK_FRIEND_FIELD_FOLDERS,
} from "@/mocks/data";
import { cn } from "@/lib/utils";

export default function FriendFieldsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("fff_default");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of MOCK_FRIEND_FIELDS) {
      map.set(f.folderId, (map.get(f.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(
    () => MOCK_FRIEND_FIELDS.filter((f) => f.folderId === selectedFolderId),
    [selectedFolderId]
  );

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

  const selectionCount = selectedIds.size;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">友だち情報管理</h1>
        <p className="text-xs text-muted-foreground mt-1">
          友だち情報のページや1:1チャットに表示させる情報を追加で登録することができます。
        </p>
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
            {MOCK_FRIEND_FIELD_FOLDERS.map((f) => {
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
              href="/data-management/friend-fields/new"
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
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-40">
                    作成日
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                    管理名
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-48">
                    情報タイプ
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-32">
                    回答人数
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-sm text-center text-muted-foreground"
                    >
                      データがありません。
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
                          {f.createdAt.slice(0, 10).replace(/-/g, "/")}
                        </td>
                        <td className="px-3 py-3 font-medium">{f.name}</td>
                        <td className="px-3 py-3 text-xs">{f.fieldType}</td>
                        <td className="px-3 py-3 text-xs tabular-nums">
                          {f.answerCount}
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
