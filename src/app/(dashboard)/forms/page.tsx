"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faFolderPlus,
  faArrowsUpDown,
  faSort,
  faTrashCan,
  faFolderTree,
  faEyeSlash,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_FORMS, MOCK_FORM_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

export default function FormsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("fmf_default");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderVisible, setFolderVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of MOCK_FORMS) {
      map.set(f.folderId, (map.get(f.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    return MOCK_FORMS.filter((f) => {
      if (f.folderId !== selectedFolderId) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!f.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedFolderId, query]);

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
        <h1 className="text-lg font-bold tracking-tight">フォーム作成</h1>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {folderVisible && (
          <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-[40vh] md:max-h-none">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
              <Button variant="outline" size="sm" className="flex-1 h-9 px-2">
                <FontAwesomeIcon icon={faFolderPlus} className="size-3" />
                フォルダ追加
              </Button>
              <Button variant="outline" size="sm" className="flex-1 h-9 px-2">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
              {MOCK_FORM_FOLDERS.map((f) => {
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
            <button
              type="button"
              onClick={() => setFolderVisible(false)}
              className="border-t border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEyeSlash} className="size-3.5" />
              フォルダを非表示
            </button>
          </aside>
        )}

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                新規作成
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {!folderVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setFolderVisible(true)}
                >
                  <FontAwesomeIcon icon={faFolderTree} className="size-3.5" />
                  フォルダを表示
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
              >
                <FontAwesomeIcon icon={faFileLines} className="size-3.5" />
                未連携
              </Button>
              {searchOpen ? (
                <div className="relative w-64">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    placeholder="管理名で検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    onBlur={() => {
                      if (!query) setSearchOpen(false);
                    }}
                    className="pl-9 h-9"
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="size-9"
                  aria-label="検索"
                >
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="size-3.5 text-muted-foreground"
                  />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={allCheckedInView}
                      onChange={toggleAll}
                      disabled={filtered.length === 0}
                      className="size-4 rounded border-border accent-primary"
                      aria-label="すべて選択"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    公開状態
                  </th>
                  <SortableHeader label="管理名" />
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    配信用URL
                  </th>
                  <SortableHeader label="タイプ" className="w-24" />
                  <SortableHeader label="作成日" className="w-32" />
                  <SortableHeader label="最終編集日" className="w-32" />
                  <th className="px-3 py-2 text-left font-bold text-foreground w-28">
                    クイックテスト
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-28">
                    回答情報
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-12 text-sm text-center text-muted-foreground"
                    >
                      フォームが登録されていません。
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
                        <td className="px-3 py-3 text-xs">
                          {f.status === "published"
                            ? "公開中"
                            : f.status === "draft"
                              ? "下書き"
                              : "終了"}
                        </td>
                        <td className="px-3 py-3 font-medium">{f.name}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[280px]">
                          {f.distributionUrl}
                        </td>
                        <td className="px-3 py-3 text-xs">{f.formType}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {f.createdAt.slice(0, 10).replace(/-/g, "/")}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {f.updatedAt.slice(0, 10).replace(/-/g, "/")}
                        </td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3 text-xs tabular-nums">
                          {f.responseCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-start gap-3 px-6 py-3 border-t border-border flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={selectionCount === 0}
              className="h-9 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faFolderTree} className="size-3.5" />
              一括フォルダ変更
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectionCount === 0}
              className="h-9 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
              一括削除
            </Button>
            <a
              href="#"
              className="text-sm text-foreground underline hover:no-underline ml-2"
            >
              削除したフォーム
            </a>
          </div>
        </section>
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
        <FontAwesomeIcon
          icon={faSort}
          className="size-2.5 text-muted-foreground"
        />
      </span>
    </th>
  );
}
