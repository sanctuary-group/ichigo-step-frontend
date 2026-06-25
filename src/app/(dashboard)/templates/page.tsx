"use client";

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
  faSort,
  faArrowUp,
  faArrowDown,
  faCheck,
  faCirclePlay,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import { FormEvent, useMemo, useState } from "react";

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
import { PreviewTestDialog } from "@/components/templates/preview-test-dialog";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { apiFetch } from "@/lib/api/client";
import {
  fetchRawTemplates,
  createTemplate,
  deleteTemplate,
  bulkDeleteTemplates,
  bulkMoveTemplates,
  reorderTemplates,
  testSendTemplate,
  fetchTestUsers,
  type TestUser,
} from "@/lib/api/templates";
import {
  fetchFolders,
  createFolder,
  deleteFolder,
  type Folder,
} from "@/lib/api/folders";
import type { Template, TemplateMessage } from "@/types/template";

const MAX_TEMPLATE_NAME = 20;

type SortColumn = "name" | "created_at" | "updated_at";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatYmd(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export default function TemplatesPage() {
  const { currentChannelId } = useAuth();
  const router = useRouter();

  const [folderId, setFolderId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortColumn | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [folderReorder, setFolderReorder] = useState(false);
  const [templateReorder, setTemplateReorder] = useState(false);
  const [folderHidden, setFolderHidden] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [sendingTestId, setSendingTestId] = useState<number | null>(null);

  const { data: folders, mutate: mutateFolders } = useResource<Folder[]>(
    currentChannelId ? `template-folders:${currentChannelId}` : null,
    () => fetchFolders("template-folders"),
  );
  const { data: testUsers } = useResource<TestUser[]>(
    currentChannelId ? `template-test-users:${currentChannelId}` : null,
    () => fetchTestUsers().catch(() => []),
  );
  const { data: templates, mutate } = useResource<Template[]>(
    currentChannelId
      ? `templates-raw:${currentChannelId}:${folderId ?? ""}:${search}:${sort ?? ""}:${dir}`
      : null,
    () =>
      fetchRawTemplates({
        folder: folderId != null ? String(folderId) : undefined,
        q: search || undefined,
        sort: sort ?? undefined,
        dir: sort ? dir : undefined,
      }),
  );

  const allFolders = useMemo(() => folders ?? [], [folders]);
  const allTemplates = useMemo(() => templates ?? [], [templates]);
  const users = useMemo(() => testUsers ?? [], [testUsers]);

  const hasTestUsers = users.length > 0;
  const testUserLabel =
    users.length === 0
      ? ""
      : users.length === 1
        ? users[0].name
        : `${users[0].name} 他${users.length - 1}名`;

  const quickTest = async (t: Template) => {
    if (!hasTestUsers) return;
    if ((t.messages?.length ?? 0) === 0) {
      alert("送信するメッセージがありません");
      return;
    }
    if (!confirm(`「${t.name}」をテストユーザー全員に送信しますか？`)) return;
    setSendingTestId(t.id);
    try {
      const d = await testSendTemplate(
        t.id,
        users.map((u) => u.id),
      );
      const failed: string[] = d.failed ?? [];
      alert(
        failed.length === 0
          ? `${d.sent}件にテスト送信しました`
          : `${d.sent}件送信・${failed.length}件失敗（${failed.join("、")}）`,
      );
    } catch {
      alert("送信に失敗しました");
    } finally {
      setSendingTestId(null);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件のテンプレートを削除しますか？`)) return;
    await bulkDeleteTemplates(Array.from(selectedIds));
    setSelectedIds(new Set());
    mutate();
  };

  const moveFolder = async (index: number, d: -1 | 1) => {
    const j = index + d;
    if (
      j < 0 ||
      j >= allFolders.length ||
      allFolders[index].isSystem ||
      allFolders[j].isSystem
    ) {
      return;
    }
    const ids = allFolders.map((f) => Number(f.id));
    [ids[index], ids[j]] = [ids[j], ids[index]];
    // template-folders には reorder ルートがあるため fetchFolders 系外で直接呼ぶ
    await reorderFolders(ids);
    mutateFolders();
  };

  const moveTemplate = async (index: number, d: -1 | 1) => {
    const j = index + d;
    if (j < 0 || j >= allTemplates.length) return;
    const ids = allTemplates.map((t) => t.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderTemplates(ids);
    mutate();
  };

  const selectFolder = (id: number) => {
    setFolderId(id);
    setSelectedIds(new Set());
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(query);
  };

  const sortBy = (column: SortColumn) => {
    const nextDir = sort === column && dir === "asc" ? "desc" : "asc";
    setSort(column);
    setDir(nextDir);
  };

  const handleDeleteTemplate = async (t: Template) => {
    if (!confirm(`「${t.name}」を削除しますか？`)) return;
    await deleteTemplate(t.id);
    mutate();
  };

  const handleDeleteFolder = async (f: Folder) => {
    if (f.isSystem) return;
    if (!confirm(`「${f.name}」を削除しますか？`)) return;
    await deleteFolder("template-folders", f.id);
    if (folderId != null && String(folderId) === f.id) setFolderId(null);
    mutateFolders();
    mutate();
  };

  const allCheckedInView =
    allTemplates.length > 0 && allTemplates.every((t) => selectedIds.has(t.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const t of allTemplates) next.delete(t.id);
      } else {
        for (const t of allTemplates) next.add(t.id);
      }
      return next;
    });
  };

  const toggleRow = (id: number) => {
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
        <h1 className="text-2xl font-bold tracking-tight">テンプレート</h1>

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
                {allFolders.map((f, idx) => {
                  const active = String(f.id) === String(folderId);
                  return (
                    <li key={f.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => selectFolder(Number(f.id))}
                        className={cn(
                          "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0",
                          active
                            ? "bg-muted text-foreground"
                            : "text-foreground hover:bg-muted/50",
                        )}
                      >
                        <span className="truncate">
                          {f.name} ({f.itemsCount})
                        </span>
                      </button>
                      {folderReorder
                        ? !f.isSystem && (
                            <span className="flex items-center">
                              <Button
                                variant="ghost"
                                className="size-7 p-0 text-muted-foreground disabled:opacity-30"
                                onClick={() => moveFolder(idx, -1)}
                                disabled={allFolders[idx - 1]?.isSystem ?? true}
                                aria-label="上へ"
                              >
                                <FontAwesomeIcon icon={faArrowUp} className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                className="size-7 p-0 text-muted-foreground disabled:opacity-30"
                                onClick={() => moveFolder(idx, 1)}
                                disabled={idx >= allFolders.length - 1}
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
                  variant={templateReorder ? "default" : "outline"}
                  size="sm"
                  className="h-9"
                  onClick={() => setTemplateReorder((v) => !v)}
                  disabled={allTemplates.length === 0}
                >
                  <FontAwesomeIcon
                    icon={templateReorder ? faCheck : faArrowsUpDown}
                    className="size-3"
                  />
                  {templateReorder ? "完了" : "並べ替え"}
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
                        disabled={allTemplates.length === 0}
                        className="size-4 rounded border-border accent-primary"
                        aria-label="すべて選択"
                      />
                    </th>
                    <SortableHeader
                      label="管理名"
                      column="name"
                      activeColumn={sort}
                      dir={dir}
                      onSort={sortBy}
                    />
                    <th className="px-3 py-2 text-left font-bold text-foreground">
                      内容
                    </th>
                    <SortableHeader
                      label="作成日"
                      column="created_at"
                      activeColumn={sort}
                      dir={dir}
                      onSort={sortBy}
                      className="w-32"
                    />
                    <SortableHeader
                      label="最終編集日"
                      column="updated_at"
                      activeColumn={sort}
                      dir={dir}
                      onSort={sortBy}
                      className="w-32"
                    />
                    <th className="px-3 py-2 text-left font-bold text-foreground">
                      クイックテスト
                    </th>
                    <th className="px-3 py-2 text-left font-bold text-foreground w-28">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTemplates.length === 0 ? (
                    <tr className="border-b border-border">
                      <td
                        colSpan={7}
                        className="px-3 py-5 text-sm font-bold text-foreground"
                      >
                        データがありません。
                      </td>
                    </tr>
                  ) : (
                    allTemplates.map((t, rowIdx) => {
                      const checked = selectedIds.has(t.id);
                      return (
                        <tr
                          key={t.id}
                          onClick={() =>
                            !templateReorder &&
                            router.push(`/templates/${t.id}/edit`)
                          }
                          className={cn(
                            "border-b border-border hover:bg-muted/30",
                            checked && "bg-primary/5",
                            !templateReorder && "cursor-pointer",
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
                            <div className="text-sm font-medium truncate">
                              {t.name}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <TemplatePreview template={t} />
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                            {formatYmd(t.created_at)}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                            {formatYmd(t.updated_at)}
                          </td>
                          <td
                            className="px-3 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewTemplate(t)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {hasTestUsers
                                ? testUserLabel
                                : "テストユーザーが登録されていません"}
                            </button>
                          </td>
                          <td
                            className="px-3 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {templateReorder ? (
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                  aria-label="上へ"
                                  disabled={rowIdx === 0}
                                  onClick={() => moveTemplate(rowIdx, -1)}
                                >
                                  <FontAwesomeIcon icon={faArrowUp} className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                  aria-label="下へ"
                                  disabled={rowIdx === allTemplates.length - 1}
                                  onClick={() => moveTemplate(rowIdx, 1)}
                                >
                                  <FontAwesomeIcon icon={faArrowDown} className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                                  aria-label="クイックテスト送信"
                                  disabled={!hasTestUsers || sendingTestId === t.id}
                                  onClick={() => quickTest(t)}
                                >
                                  <FontAwesomeIcon
                                    icon={faCirclePlay}
                                    className="size-4"
                                    spin={sendingTestId === t.id}
                                  />
                                </Button>
                                <Link
                                  href={`/templates/${t.id}/edit`}
                                  aria-label="編集"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                                </Link>
                                <Button
                                  variant="ghost"
                                  className="size-9 p-0 text-muted-foreground hover:text-destructive"
                                  aria-label="削除"
                                  onClick={() => handleDeleteTemplate(t)}
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

            <div className="flex items-center gap-2 border-t border-border pt-3">
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
                onClick={bulkDelete}
              >
                <FontAwesomeIcon icon={faTrash} className="size-3" />
                一括削除
              </Button>
            </div>
          </section>
        </div>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={() => {
          mutateFolders();
          setFolderDialogOpen(false);
        }}
      />
      <CreateTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folders={allFolders}
        defaultFolderId={folderId ?? Number(allFolders[0]?.id ?? 0)}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/templates/${id}/edit`);
        }}
      />
      <BulkMoveDialog
        open={bulkMoveOpen}
        onClose={() => setBulkMoveOpen(false)}
        folders={allFolders}
        ids={Array.from(selectedIds)}
        onMoved={() => {
          setSelectedIds(new Set());
          setBulkMoveOpen(false);
          mutate();
          mutateFolders();
        }}
      />
      <PreviewTestDialog
        open={previewTemplate !== null}
        onClose={() => setPreviewTemplate(null)}
        templateId={previewTemplate?.id ?? 0}
        messages={(previewTemplate?.messages ?? []) as TemplateMessage[]}
      />
    </>
  );
}

// template-folders/reorder（folders.ts に reorder が無いためここで直接）
async function reorderFolders(ids: number[]): Promise<void> {
  await apiFetch("/template-folders/reorder", { method: "POST", body: { ids } });
}

function BulkMoveDialog({
  open,
  onClose,
  folders,
  ids,
  onMoved,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  ids: number[];
  onMoved: () => void;
}) {
  const [folderId, setFolderId] = useState<number>(Number(folders[0]?.id ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (ids.length === 0) return;
    setSaving(true);
    try {
      await bulkMoveTemplates(ids, folderId);
      onMoved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォルダを一括変更</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            選択した {ids.length} 件の移動先フォルダを選択してください。
          </p>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">移動先フォルダ</Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              キャンセル
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "変更中..." : "変更"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SortableHeader({
  label,
  column,
  activeColumn,
  dir,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn | null;
  dir: "asc" | "desc";
  onSort: (c: SortColumn) => void;
  className?: string;
}) {
  const active = activeColumn === column;
  return (
    <th
      className={cn("px-3 py-2 text-left font-bold text-foreground", className)}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 hover:text-primary"
      >
        {label}
        <FontAwesomeIcon
          icon={active ? (dir === "asc" ? faArrowUp : faArrowDown) : faSort}
          className={cn(
            "size-2.5",
            active ? "text-primary" : "text-muted-foreground",
          )}
        />
      </button>
    </th>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createFolder("template-folders", name.trim());
      setName("");
      onCreated();
    } catch {
      setError("作成に失敗しました");
    } finally {
      setSaving(false);
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
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              キャンセル
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "保存中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateTemplateDialog({
  open,
  onClose,
  folders,
  defaultFolderId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId: number;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<number>(defaultFolderId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ダイアログを開くたびに既定値へ同期
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setName("");
    setFolderId(defaultFolderId);
    setError(null);
    setWasOpen(true);
  }
  if (!open && wasOpen) setWasOpen(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createTemplate({
        name,
        template_folder_id: folderId,
      });
      onCreated(created.id);
    } catch {
      setError("作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-center text-lg font-bold">
          テンプレート作成
        </DialogTitle>
        <form onSubmit={onSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <Label htmlFor="tpl-name" className="text-sm font-bold">
                管理名
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {name.length}/{MAX_TEMPLATE_NAME}
              </span>
            </div>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_TEMPLATE_NAME}
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">フォルダ</Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(Number(e.target.value))}
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground">
            本文は作成後の編集画面で入力できます。
          </p>

          <div className="pt-2 flex justify-center">
            <Button
              type="submit"
              variant="outline"
              disabled={name.length === 0 || saving}
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-11 disabled:opacity-50"
            >
              {saving ? "作成中..." : "テンプレートを作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** 一覧の「内容」列プレビュー（先頭メッセージから生成） */
function TemplatePreview({ template }: { template: Template }) {
  const first = template.messages?.[0];
  const count = template.messages?.length ?? 0;
  if (!first) {
    return (
      <span className="text-xs italic text-muted-foreground">
        （内容未設定）
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {first.message_type === "image" && first.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={first.image_url}
          alt=""
          className="size-10 rounded border border-border object-cover shrink-0"
        />
      ) : null}
      <div className="text-xs text-muted-foreground line-clamp-2 max-w-xl">
        {first.message_type === "image"
          ? "画像"
          : first.text_content || "（本文未設定）"}
      </div>
      {count > 1 && (
        <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
          +{count - 1}
        </span>
      )}
    </div>
  );
}
