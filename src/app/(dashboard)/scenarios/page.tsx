"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faArrowsUpDown,
  faFolderPlus,
  faAngleDoubleLeft,
  faFolder,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOCK_SCENARIOS,
  MOCK_SCENARIO_FOLDERS,
} from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_SCENARIO_NAME = 20;

export default function ScenariosPage() {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string>("sfld_default");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFolderPane, setShowFolderPane] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState("10");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFolderId, setNewFolderId] = useState<string>("sfld_default");
  const [insertTop, setInsertTop] = useState(false);

  useEffect(() => {
    if (createOpen) {
      setNewName("");
      setNewFolderId(selectedFolderId);
      setInsertTop(false);
    }
  }, [createOpen, selectedFolderId]);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of MOCK_SCENARIOS) {
      map.set(s.folderId, (map.get(s.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    return MOCK_SCENARIOS.filter((s) => {
      if (s.folderId !== selectedFolderId) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.description?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [selectedFolderId, query]);

  const allCheckedInView =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const hasSelection = selectedIds.size > 0;

  const handleFolderChange = (id: string) => {
    setSelectedFolderId(id);
    setSelectedIds(new Set());
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const s of filtered) next.delete(s.id);
      } else {
        for (const s of filtered) next.add(s.id);
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
    <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 gap-4">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ステップ配信</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ステップ配信とは、友だちに対し事前に準備したメッセージを、設定した順番と間隔で自動的に配信する機能です。
        </p>
      </div>

      <hr className="border-border" />

      <div className="flex-1 flex overflow-hidden gap-6">
        {/* 左ペイン: フォルダ */}
        {showFolderPane && (
          <aside className="w-56 shrink-0 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-9">
                <FontAwesomeIcon icon={faFolderPlus} className="size-3" />
                フォルダ追加
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>

            <ul className="flex-1 overflow-y-auto space-y-1">
              {MOCK_SCENARIO_FOLDERS.map((f) => {
                const active = f.id === selectedFolderId;
                const count = folderCounts.get(f.id) ?? 0;
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => handleFolderChange(f.id)}
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
              onClick={() => setShowFolderPane(false)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} className="size-3" />
              フォルダを非表示
            </button>
          </aside>
        )}

        {/* 右ペイン: テーブル */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              {!showFolderPane && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setShowFolderPane(true)}
                >
                  フォルダを表示
                </Button>
              )}
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                新規作成
              </button>
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>

            {searchOpen ? (
              <div className="relative w-64">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  placeholder="管理名を入力"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setSearchOpen(false)}
                  autoFocus
                  className="pl-9 h-9"
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => setSearchOpen(true)}
                aria-label="検索"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
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
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    管理名
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-foreground w-40">
                    購読中の友だち
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-foreground w-40">
                    途中で終了した友だち
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-foreground w-40">
                    読了済の友だち
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="border-b border-border">
                    <td colSpan={5} className="px-3 py-12" />
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const checked = selectedIds.has(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(s.id)}
                            className="size-4 rounded border-border accent-primary"
                            aria-label={`${s.name} を選択`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/scenarios/new?id=${s.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {s.name}
                          </Link>
                          {s.description && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-md">
                              {s.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-sm tabular-nums">
                          {s.enrolledCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-sm tabular-nums">
                          {s.terminatedCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-sm tabular-nums">
                          {s.completedCount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ボトムアクション */}
          <div className="flex items-center justify-between gap-3 pt-3 mt-auto">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="h-9"
              >
                <FontAwesomeIcon icon={faFolder} className="size-3" />
                一括フォルダ変更
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="h-9 text-destructive hover:text-destructive"
              >
                <FontAwesomeIcon icon={faTrash} className="size-3" />
                一括削除
              </Button>
            </div>

            <Select value={pageSize} onValueChange={(v) => v && setPageSize(v)}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10/page</SelectItem>
                <SelectItem value="25">25/page</SelectItem>
                <SelectItem value="50">50/page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-center text-lg font-bold">
            ステップ配信 新規作成
          </DialogTitle>

          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <Label htmlFor="sc-name" className="text-sm font-bold">
                  管理名
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {newName.length}/{MAX_SCENARIO_NAME}
                </span>
              </div>
              <Input
                id="sc-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={MAX_SCENARIO_NAME}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">フォルダ</Label>
              <Select
                value={newFolderId}
                onValueChange={(v) => v && setNewFolderId(v)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_SCENARIO_FOLDERS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={insertTop}
                  onChange={(e) => setInsertTop(e.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                フォルダ内の一番上に追加する
              </label>
              <div className="text-[11px] text-muted-foreground pl-6">
                ※ 未選択の場合、フォルダの一番下に追加されます
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                disabled={newName.length === 0}
                className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-11 disabled:opacity-50"
                onClick={() => {
                  setCreateOpen(false);
                  router.push("/scenarios/new");
                }}
              >
                メッセージの登録に進む
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
