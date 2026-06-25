"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  faFileCsv,
  faBolt,
  faUsers,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api/client";
import { API_ORIGIN, TENANT_BASE } from "@/lib/api/config";
import { getToken } from "@/lib/api/token-store";
import { getCurrentChannelId } from "@/lib/api/channel-store";
import {
  fetchTags,
  deleteTag,
  bulkDeleteTags,
  reorderTags,
  type TagWithCount,
} from "@/lib/api/tags";
import {
  fetchFolders,
  createFolder,
  deleteFolder as deleteFolderApi,
  type Folder,
} from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
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
  const [search, setSearch] = useState("");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderReorder, setFolderReorder] = useState(false);
  const [tagReorder, setTagReorder] = useState(false);
  const [folderHidden, setFolderHidden] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);

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
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        if (!t.name.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allTags, selectedFolderId, search]);

  const trashedCount = 0;

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件のタグを削除しますか？`)) return;
    await bulkDeleteTags([...selectedIds]);
    setSelectedIds(new Set());
    mutate();
  };

  const moveFolder = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (
      j < 0 ||
      j >= folders.length ||
      folders[index].isSystem ||
      folders[j].isSystem
    ) {
      return;
    }
    const ids = folders.map((f) => Number(f.id));
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await apiFetch("/tag-folders/reorder", { method: "POST", body: { ids } });
    mutate();
  };

  const moveTag = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= filtered.length) return;
    const ids = filtered.map((t) => t.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderTags(ids);
    mutate();
  };

  const selectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedIds(new Set());
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(query);
  };

  const handleDeleteTag = async (t: TagWithCount) => {
    const note =
      t.friendsCount > 0
        ? `「${t.name}」を削除します。${t.friendsCount} 件の友だちから外されます。`
        : `「${t.name}」を削除しますか？`;
    if (!confirm(note)) return;
    await deleteTag(t.id);
    mutate();
  };

  const handleDeleteFolder = async (f: Folder) => {
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
  };

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

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">タグ管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            様々なトリガーによって友だちにタグ付けを行い、タグごとに絞り込むことでセグメント配信などが可能となる機能です。
          </p>
        </div>

        <hr className="border-border" />

        <div
          className={cn(
            "grid grid-cols-1 gap-4 md:gap-6",
            folderHidden ? "md:grid-cols-1" : "md:grid-cols-[240px_1fr]",
          )}
        >
          {!folderHidden && (
            <aside className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => setFolderDialogOpen(true)}
                >
                  <FontAwesomeIcon icon={faFolderPlus} className="size-3" />
                  フォルダ追加
                </Button>
                <Button
                  variant={folderReorder ? "default" : "outline"}
                  size="sm"
                  className="h-9"
                  onClick={() => setFolderReorder((v) => !v)}
                >
                  <FontAwesomeIcon
                    icon={folderReorder ? faCheck : faArrowsUpDown}
                    className="size-3"
                  />
                  {folderReorder ? "完了" : "並べ替え"}
                </Button>
              </div>

              <ul className="space-y-1">
                {folders.map((f, idx) => {
                  const active = f.id === selectedFolderId;
                  const count = folderCounts.get(f.id) ?? 0;
                  return (
                    <li key={f.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => selectFolder(f.id)}
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
                      {folderReorder
                        ? !f.isSystem && (
                            <span className="flex items-center">
                              <Button
                                variant="ghost"
                                className="size-7 p-0 text-muted-foreground disabled:opacity-30"
                                onClick={() => moveFolder(idx, -1)}
                                disabled={folders[idx - 1]?.isSystem ?? true}
                                aria-label="上へ"
                              >
                                <FontAwesomeIcon icon={faArrowUp} className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                className="size-7 p-0 text-muted-foreground disabled:opacity-30"
                                onClick={() => moveFolder(idx, 1)}
                                disabled={idx >= folders.length - 1}
                                aria-label="下へ"
                              >
                                <FontAwesomeIcon icon={faArrowDown} className="size-3" />
                              </Button>
                            </span>
                          )
                        : !f.isSystem && (
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
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <FontAwesomeIcon icon={faAnglesLeft} className="size-3" />
                フォルダを非表示
              </button>
            </aside>
          )}

          <section className="space-y-3 min-w-0">
            {folderHidden && (
              <button
                type="button"
                onClick={() => setFolderHidden(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <FontAwesomeIcon icon={faAnglesRight} className="size-3" />
                フォルダを表示
              </button>
            )}
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
                <Button
                  size="sm"
                  className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => setCsvOpen(true)}
                >
                  <FontAwesomeIcon icon={faFileCsv} className="size-3" />
                  CSV一括追加
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
              <form onSubmit={onSearch} className="relative w-72 max-w-full">
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
              </form>
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
                    <th className="px-3 py-2 text-left font-bold text-foreground">
                      管理名
                    </th>
                    <th className="px-3 py-2 text-left font-bold text-foreground">
                      アクション設定
                    </th>
                    <th className="px-3 py-2 text-left font-bold text-foreground">
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
                    <tr className="border-b border-border">
                      <td
                        colSpan={8}
                        className="px-3 py-5 text-sm font-bold text-foreground"
                      >
                        データがありません。
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t, rowIdx) => {
                      const checked = selectedIds.has(t.id);
                      const actionCount = t.actionCount ?? 0;
                      return (
                        <tr
                          key={t.id}
                          onClick={() =>
                            !tagReorder && router.push(`/tags/${t.id}/edit`)
                          }
                          className={cn(
                            "border-b border-border hover:bg-muted/30",
                            checked && "bg-primary/5",
                            !tagReorder && "cursor-pointer",
                          )}
                        >
                          <td
                            className="px-3 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRow(t.id)}
                              className="size-4 rounded border-border accent-primary"
                              aria-label={`${t.name} を選択`}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-medium text-blue-600 dark:text-blue-400 truncate">
                              {t.name}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {actionCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <FontAwesomeIcon
                                  icon={faBolt}
                                  className="size-3 text-amber-500"
                                />
                                アクション{actionCount}件
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
                          <td
                            className="px-3 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tagReorder ? (
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                  aria-label="上へ"
                                  disabled={rowIdx === 0}
                                  onClick={() => moveTag(rowIdx, -1)}
                                >
                                  <FontAwesomeIcon icon={faArrowUp} className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                  aria-label="下へ"
                                  disabled={rowIdx === filtered.length - 1}
                                  onClick={() => moveTag(rowIdx, 1)}
                                >
                                  <FontAwesomeIcon icon={faArrowDown} className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0"
                                  aria-label="編集"
                                  onClick={() => router.push(`/tags/${t.id}/edit`)}
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground hover:text-destructive"
                                  aria-label="削除"
                                  onClick={() => handleDeleteTag(t)}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="size-3.5" />
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

            {/* 一括操作バー */}
            <div className="flex items-center gap-2 border-t border-border pt-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-muted-foreground"
                disabled={selectedIds.size === 0}
                onClick={() => setBulkMoveOpen(true)}
              >
                <FontAwesomeIcon icon={faFolder} className="size-3" />
                一括フォルダ変更
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-muted-foreground hover:text-destructive"
                disabled={selectedIds.size === 0}
                onClick={handleBulkDelete}
              >
                <FontAwesomeIcon icon={faTrash} className="size-3" />
                一括削除
              </Button>
              <Link
                href="/tags/trashed"
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground underline"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                削除したアイテム
                {trashedCount > 0 ? `（${trashedCount}）` : ""}
              </Link>
            </div>
          </section>
        </div>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={() => {
          mutate();
          setFolderDialogOpen(false);
        }}
      />
      <CreateTagDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folders={folders}
        defaultFolderId={selectedFolderId ?? folders[0]?.id ?? null}
        onCreated={() => {
          setCreateOpen(false);
          mutate();
        }}
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
      <CsvImportDialog
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        folders={folders}
        defaultFolderId={selectedFolderId ?? folders[0]?.id ?? null}
        onImported={() => {
          setCsvOpen(false);
          mutate();
        }}
      />
    </>
  );
}

const CREATE_MAX_ROWS = 20;
const CREATE_NAME_MAX = 50;

function CreateTagDialog({
  open,
  onClose,
  folders,
  defaultFolderId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId: string | null;
  onCreated: () => void;
}) {
  const [folderId, setFolderId] = useState<string>(defaultFolderId ?? "");
  const [names, setNames] = useState<string[]>([""]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFolderId(defaultFolderId ?? "");
      setNames([""]);
      setError(null);
      setProcessing(false);
    }
  }, [open, defaultFolderId]);

  const addRow = () =>
    setNames((n) => (n.length >= CREATE_MAX_ROWS ? n : [...n, ""]));
  const removeRow = (i: number) =>
    setNames((n) => (n.length <= 1 ? n : n.filter((_, idx) => idx !== i)));
  const setRow = (i: number, v: string) =>
    setNames((n) =>
      n.map((x, idx) => (idx === i ? v.slice(0, CREATE_NAME_MAX) : x)),
    );

  const canSave = names.some((n) => n.trim() !== "") && !processing;

  const save = async () => {
    setProcessing(true);
    setError(null);
    try {
      await apiFetch("/tags/bulk-create", {
        method: "POST",
        body: {
          tag_folder_id: folderId ? Number(folderId) : null,
          names: names.map((n) => n.trim()),
        },
      });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.fieldErrors())[0] ?? err.message);
      } else {
        setError("作成に失敗しました");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">タグ新規作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-6">
            <Label className="text-sm font-bold w-20 shrink-0">フォルダ</Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-56"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <Label className="text-sm font-bold w-20 shrink-0">タグ管理名</Label>
            <span className="text-sm text-muted-foreground">
              同時に{CREATE_MAX_ROWS}個までタグが作成できます
            </span>
          </div>

          <div className="rounded-lg bg-muted/40 p-4 max-h-80 overflow-y-auto space-y-2">
            {names.map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-5 text-right tabular-nums shrink-0">
                  {i + 1}
                </span>
                <Input
                  value={name}
                  onChange={(e) => setRow(i, e.target.value)}
                  maxLength={CREATE_NAME_MAX}
                  placeholder="タグ管理名を入力してください"
                  className="h-11 bg-background"
                  autoFocus={i === names.length - 1}
                />
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-12 text-right">
                  {name.length}/{CREATE_NAME_MAX}
                </span>
                {names.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeRow(i)}
                    aria-label={`${i + 1} 行目を削除`}
                  >
                    <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-11 px-5"
              onClick={addRow}
              disabled={names.length >= CREATE_MAX_ROWS}
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              タグを追加
            </Button>
            <Button
              type="button"
              className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-10"
              onClick={save}
              disabled={!canSave}
            >
              {processing ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FolderDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
      setProcessing(false);
    }
  }, [open]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      await createFolder("tag-folders", name);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldErrors().name ?? err.message);
      } else {
        setError("作成に失敗しました");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォルダを追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">名前</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? "保存中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CsvImportDialog({
  open,
  onClose,
  folders,
  defaultFolderId,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId: string | null;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState<string>(defaultFolderId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setFolderId(defaultFolderId ?? "");
      setError(null);
      setProcessing(false);
    }
  }, [open, defaultFolderId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      if (folderId) body.append("tag_folder_id", folderId);
      const headers = new Headers({ Accept: "application/json" });
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const channelId = getCurrentChannelId();
      if (channelId) headers.set("X-Line-Channel-Id", channelId);
      const res = await fetch(`${API_ORIGIN}${TENANT_BASE}/tags/csv-import`, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        let message = res.statusText || `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.errors?.file?.[0]) message = data.errors.file[0];
          else if (data?.message) message = data.message;
        } catch {
          /* noop */
        }
        throw new Error(message);
      }
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSV一括追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            1 行 1 タグで CSV をアップロードします。1
            列目をタグ名、任意で 2 列目に色（#rrggbb）を指定できます。
          </p>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">追加先フォルダ</Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="csv-file" className="text-sm font-bold">
              CSV ファイル
            </Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={processing || !file}>
              <FontAwesomeIcon icon={faUsers} className="size-3.5" />
              {processing ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
