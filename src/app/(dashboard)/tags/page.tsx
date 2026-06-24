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
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOCK_TAG_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";
import { fetchTags, createTag, deleteTag } from "@/lib/api/tags";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

export default function TagsPage() {
  const { currentChannelId } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string>("tagf_default");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderVisible, setFolderVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageSize, setPageSize] = useState("100");

  const { data: tags, mutate } = useResource(
    currentChannelId ? `tags-page:${currentChannelId}` : null,
    () => fetchTags(),
  );
  const allTags = useMemo(() => tags ?? [], [tags]);

  // 新規作成ダイアログ
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#22c55e");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setCreateError(null);
    try {
      await createTag({ name: newName.trim(), color: newColor, tag_folder_id: null });
      setNewName("");
      setCreateOpen(false);
      mutate();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    await Promise.all(ids.map((id) => deleteTag(id)));
    setSelectedIds(new Set());
    mutate();
  }

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTags) {
      const fid = t.folderId ?? "tagf_default";
      map.set(fid, (map.get(fid) ?? 0) + 1);
    }
    return map;
  }, [allTags]);

  const filtered = useMemo(() => {
    return allTags.filter((t) => {
      if ((t.folderId ?? "tagf_default") !== selectedFolderId) return false;
      if (query.trim()) {
        const s = query.trim().toLowerCase();
        if (!t.name.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allTags, selectedFolderId, query]);

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

  const selectionCount = selectedIds.size;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">タグ管理</h1>
        <p className="text-xs text-muted-foreground mt-1">
          様々なトリガーによって友だちにタグ付けを行い、タグごとに絞り込むことでセグメント配信などが可能となる機能です。
        </p>
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
              {MOCK_TAG_FOLDERS.map((f) => {
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
              <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
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
                onClick={() => setCreateOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                新規作成
              </Button>
              <Button
                size="sm"
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                CSV一括追加
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
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
              {searchOpen ? (
                <div className="relative w-56">
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
                  <SortableHeader label="管理名" />
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    アクション設定
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                    人数制限
                  </th>
                  <SortableHeader label="作成日" className="w-32" />
                  <SortableHeader label="最終編集日" className="w-32" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-12 text-sm text-center text-muted-foreground"
                    >
                      {tags === undefined
                        ? "読み込み中…"
                        : "タグが登録されていません"}
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
                          />
                        </td>
                        <td className="px-3 py-3 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {t.actionLabel ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {t.capacity ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {t.createdAt?.slice(0, 10).replace(/-/g, "/") ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {t.updatedAt?.slice(0, 10).replace(/-/g, "/") ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border flex-wrap">
            <div className="flex items-center gap-2">
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
                onClick={handleBulkDelete}
                className="h-9 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                一括削除
              </Button>
              <a
                href="#"
                className="text-sm text-foreground underline hover:no-underline ml-2"
              >
                削除したアイテム
              </a>
            </div>
            <Select value={pageSize} onValueChange={(v) => v && setPageSize(v)}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50/page</SelectItem>
                <SelectItem value="100">100/page</SelectItem>
                <SelectItem value="200">200/page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを新規作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tag-name">管理名</Label>
              <Input
                id="tag-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: VIP"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tag-color">カラー</Label>
              <input
                id="tag-color"
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-9 w-16 rounded border border-border bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
            <Button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {saving ? "作成中…" : "作成"}
            </Button>
          </DialogFooter>
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
        <FontAwesomeIcon
          icon={faSort}
          className="size-2.5 text-muted-foreground"
        />
      </span>
    </th>
  );
}
