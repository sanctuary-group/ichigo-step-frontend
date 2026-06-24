"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrash,
  faSort,
  faFolderPlus,
  faBookOpen,
  faArrowsUpDown,
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
import { MOCK_TEMPLATES, MOCK_TEMPLATE_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_TEMPLATE_NAME = 20;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatYmd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export default function TemplatesPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("fld_default");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFolderId, setNewFolderId] = useState<string>("fld_default");

  useEffect(() => {
    if (createOpen) {
      setNewName("");
      setNewFolderId(selectedFolderId);
    }
  }, [createOpen, selectedFolderId]);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of MOCK_TEMPLATES) {
      map.set(t.folderId, (map.get(t.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    return MOCK_TEMPLATES.filter((t) => {
      if (t.folderId !== selectedFolderId) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.preview.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [selectedFolderId, query]);

  const allCheckedInView =
    filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const t of filtered) next.delete(t.id);
      } else {
        for (const t of filtered) next.add(t.id);
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

  const handleFolderChange = (id: string) => {
    setSelectedFolderId(id);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* タイトル行 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">テンプレート</h1>
        <Button variant="outline">
          <FontAwesomeIcon icon={faBookOpen} className="size-3.5" />
          マニュアル
        </Button>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 md:gap-6">
        {/* 左ペイン: フォルダ */}
        <aside className="space-y-3">
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

          <ul className="space-y-1">
            {MOCK_TEMPLATE_FOLDERS.map((f) => {
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
        </aside>

        {/* 右ペイン: テーブル */}
        <section className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setCreateOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                新規作成
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>
            <div className="relative w-72 max-w-full">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="管理名を入力"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
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
                  <SortableHeader label="管理名" />
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    内容
                  </th>
                  <SortableHeader label="作成日" className="w-32" />
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    最終
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="border-b border-border">
                    <td
                      colSpan={6}
                      className="px-3 py-5 text-sm font-bold text-foreground"
                    >
                      データがありません。
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const checked = selectedIds.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(t.id)}
                            className="size-4 rounded border-border accent-primary"
                            aria-label={`${t.name} を選択`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium truncate">
                            {t.name}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs text-muted-foreground line-clamp-2 max-w-xl">
                            {t.preview}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(t.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(t.updatedAt)}
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
          </div>
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-center text-lg font-bold">
            テンプレート作成
          </DialogTitle>

          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <Label htmlFor="tpl-name" className="text-sm font-bold">
                  管理名
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {newName.length}/{MAX_TEMPLATE_NAME}
                </span>
              </div>
              <Input
                id="tpl-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={MAX_TEMPLATE_NAME}
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
                  {MOCK_TEMPLATE_FOLDERS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                disabled={newName.length === 0}
                className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-11 disabled:opacity-50"
                onClick={() => setCreateOpen(false)}
              >
                テンプレートを作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
