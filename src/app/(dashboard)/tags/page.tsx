"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrash,
  faFolderPlus,
  faFolder,
  faArrowsUpDown,
  faArrowUp,
  faArrowDown,
  faCheck,
  faAnglesLeft,
  faAnglesRight,
  faBolt,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  fetchTags,
  createTag,
  deleteTag,
  bulkDeleteTags,
  reorderTags,
  type TagWithCount,
} from "@/lib/api/tags";
import {
  fetchFolders,
  deleteFolder as deleteFolderApi,
  type Folder,
} from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { FolderDialog } from "@/components/tags/folder-dialog";
import { BulkMoveDialog } from "@/components/tags/bulk-move-dialog";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatYmd(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export default function TagsPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderHidden, setFolderHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [folderReorder, setFolderReorder] = useState(false);
  const [tagReorder, setTagReorder] = useState(false);

  const { data, mutate } = useResource(
    currentChannelId ? `tags-page:${currentChannelId}` : null,
    async () => {
      const [tags, folders] = await Promise.all([
        fetchTags(),
        fetchFolders("tag-folders"),
      ]);
      return { tags, folders };
    },
  );
  const allTags = useMemo(() => data?.tags ?? [], [data]);
  const folders = useMemo(() => data?.folders ?? [], [data]);

  // 新規作成ダイアログ
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#22c55e");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // フォルダ追加 / 一括フォルダ変更
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);

  async function handleCreate() {
    setSaving(true);
    setCreateError(null);
    try {
      await createTag({
        name: newName.trim(),
        color: newColor,
        tag_folder_id: selectedFolderId ? Number(selectedFolderId) : null,
      });
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
    if (ids.length === 0) return;
    if (!confirm(`${ids.length}件のタグを削除しますか？`)) return;
    await bulkDeleteTags(ids);
    setSelectedIds(new Set());
    mutate();
  }

  async function handleDeleteTag(t: TagWithCount) {
    const note =
      t.friendsCount > 0
        ? `「${t.name}」を削除します。${t.friendsCount} 件の友だちから外されます。`
        : `「${t.name}」を削除しますか？`;
    if (!confirm(note)) return;
    await deleteTag(t.id);
    mutate();
  }

  async function handleDeleteFolder(f: Folder) {
    if (f.isSystem) return;
    const count = f.itemsCount ?? 0;
    const msg =
      count > 0
        ? `「${f.name}」を削除します。${count} 件のタグも未分類に移動します。`
        : `「${f.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await deleteFolderApi("tag-folders", f.id);
    if (selectedFolderId === f.id) setSelectedFolderId(null);
    mutate();
  }

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTags) {
      if (!t.folderId) continue;
      map.set(t.folderId, (map.get(t.folderId) ?? 0) + 1);
    }
    return map;
  }, [allTags]);

  const filtered = useMemo(() => {
    return allTags.filter((t) => {
      if (selectedFolderId && (t.folderId ?? null) !== selectedFolderId)
        return false;
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

  const moveTag = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= filtered.length) return;
    const ids = filtered.map((t) => t.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderTags(ids);
    mutate();
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
        {!folderHidden && (
          <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-[40vh] md:max-h-none">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 px-2"
                onClick={() => setFolderDialogOpen(true)}
              >
                <FontAwesomeIcon icon={faFolderPlus} className="size-3" />
                フォルダ追加
              </Button>
              <Button
                variant={folderReorder ? "default" : "outline"}
                size="sm"
                className="h-9 px-2"
                onClick={() => setFolderReorder((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={folderReorder ? faCheck : faArrowsUpDown}
                  className="size-3"
                />
                {folderReorder ? "完了" : "並べ替え"}
              </Button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
              <li>
                <button
                  onClick={() => {
                    setSelectedFolderId(null);
                    setSelectedIds(new Set());
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedFolderId === null
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/50",
                  )}
                >
                  すべて ({allTags.length})
                </button>
              </li>
              {folders.map((f) => {
                const active = f.id === selectedFolderId;
                const count = folderCounts.get(f.id) ?? 0;
                return (
                  <li key={f.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedFolderId(f.id);
                        setSelectedIds(new Set());
                      }}
                      className={cn(
                        "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0",
                        active
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/50",
                      )}
                    >
                      <span className="truncate">
                        {f.name} ({count})
                      </span>
                    </button>
                    {!folderReorder && !f.isSystem && (
                      <Button
                        variant="ghost"
                        className="size-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteFolder(f)}
                        aria-label="削除"
                      >
                        <FontAwesomeIcon icon={faTrash} className="size-3" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setFolderHidden(true)}
              className="border-t border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faAnglesLeft} className="size-3" />
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
                variant={tagReorder ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setTagReorder((v) => !v)}
                disabled={filtered.length === 0}
              >
                <FontAwesomeIcon
                  icon={tagReorder ? faCheck : faArrowsUpDown}
                  className="size-3"
                />
                {tagReorder ? "完了" : "並べ替え"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {folderHidden && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setFolderHidden(false)}
                >
                  <FontAwesomeIcon icon={faAnglesRight} className="size-3.5" />
                  フォルダを表示
                </Button>
              )}
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
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    管理名
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    アクション設定
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                    人数制限
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                    作成日
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                    最終編集日
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-20">
                    人数
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-12 text-sm text-center text-muted-foreground"
                    >
                      {data === undefined
                        ? "読み込み中…"
                        : "タグが登録されていません"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, rowIdx) => {
                    const checked = selectedIds.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5",
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
                          <Link
                            href={`/tags/${t.id}/edit`}
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {t.actionCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-foreground">
                              <FontAwesomeIcon
                                icon={faBolt}
                                className="size-3 text-amber-500"
                              />
                              アクション{t.actionCount}件
                            </span>
                          ) : (
                            "アクション設定なし"
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {t.personLimit !== null
                            ? `${t.personLimit.toLocaleString()}人`
                            : "人数制限なし"}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(t.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(t.updatedAt)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {t.friendsCount.toLocaleString()}人
                        </td>
                        <td className="px-3 py-3">
                          {tagReorder ? (
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                aria-label="上へ"
                                disabled={rowIdx === 0}
                                onClick={() => moveTag(rowIdx, -1)}
                              >
                                <FontAwesomeIcon
                                  icon={faArrowUp}
                                  className="size-3.5"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                aria-label="下へ"
                                disabled={rowIdx === filtered.length - 1}
                                onClick={() => moveTag(rowIdx, 1)}
                              >
                                <FontAwesomeIcon
                                  icon={faArrowDown}
                                  className="size-3.5"
                                />
                              </Button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                className="size-9 p-0"
                                aria-label="編集"
                                onClick={() =>
                                  router.push(`/tags/${t.id}/edit`)
                                }
                              >
                                <FontAwesomeIcon
                                  icon={faPenToSquare}
                                  className="size-3.5"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                className="size-9 p-0 text-muted-foreground hover:text-destructive"
                                aria-label="削除"
                                onClick={() => handleDeleteTag(t)}
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="size-3.5"
                                />
                              </Button>
                            </div>
                          )}
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
                disabled={selectionCount === 0 || folders.length === 0}
                onClick={() => setBulkMoveOpen(true)}
                className="h-9 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFolder} className="size-3.5" />
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
              <Link
                href="/tags/trashed"
                className="inline-flex items-center gap-1.5 text-sm text-foreground underline hover:no-underline ml-2"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                削除したアイテム
              </Link>
            </div>
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
            <DialogClose render={<Button variant="outline" />}>
              キャンセル
            </DialogClose>
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

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={() => mutate()}
      />
      <BulkMoveDialog
        open={bulkMoveOpen}
        onClose={() => setBulkMoveOpen(false)}
        folders={folders}
        ids={[...selectedIds]}
        onDone={() => {
          setSelectedIds(new Set());
          mutate();
        }}
      />
    </div>
  );
}
