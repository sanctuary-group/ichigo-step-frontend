"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  faUpRightFromSquare,
  faCopy,
  faChartSimple,
  faArrowUp,
  faArrowDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { GuideButton } from "@/components/guide-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchForms, bulkDeleteForms, deleteForm, reorderForms } from "@/lib/api/forms";
import {
  fetchFolders,
  deleteFolder as deleteFolderApi,
  reorderFolders,
  type Folder,
} from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockForm } from "@/mocks/data";
import { FolderDialog } from "@/components/forms/folder-dialog";
import { CreateDialog } from "@/components/forms/create-dialog";

export default function FormsPage() {
  const { currentChannelId } = useAuth();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderVisible, setFolderVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [folderReorder, setFolderReorder] = useState(false);
  const [itemReorder, setItemReorder] = useState(false);

  const { data: folders, mutate: mutateFolders } = useResource(
    currentChannelId ? `form-folders:${currentChannelId}` : null,
    () => fetchFolders("form-folders"),
  );
  const folderList = useMemo(() => folders ?? [], [folders]);

  // 既定の選択フォルダ（先頭フォルダ）を初期化。
  useEffect(() => {
    if (selectedFolderId === null && folderList.length > 0) {
      setSelectedFolderId(folderList[0].id);
    }
  }, [folderList, selectedFolderId]);

  const { data: forms, mutate } = useResource(
    currentChannelId
      ? `forms:${currentChannelId}:${selectedFolderId ?? ""}:${appliedQuery}`
      : null,
    () =>
      fetchForms({
        folder: selectedFolderId ?? undefined,
        q: appliedQuery || undefined,
      }),
  );
  const rows = useMemo(() => forms ?? [], [forms]);

  const refresh = () => {
    mutate();
    mutateFolders();
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
  };

  const selectFolder = (id: string) => {
    if (folderReorder) return;
    setSelectedFolderId(id);
    setSelectedIds(new Set());
  };

  const moveFolder = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (
      j < 0 ||
      j >= folderList.length ||
      folderList[index].isSystem ||
      folderList[j].isSystem
    ) {
      return;
    }
    const ids = folderList.map((f) => Number(f.id));
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderFolders("form-folders", ids);
    mutateFolders();
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const ids = rows.map((f) => Number(f.id));
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderForms(ids);
    mutate();
  };

  const handleDeleteForm = async (f: MockForm) => {
    if (!confirm(`「${f.name}」を削除しますか？回答データも削除されます。`)) return;
    await deleteForm(f.id);
    refresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `${selectedIds.size}件のフォームを削除しますか？回答データも削除されます。`,
      )
    )
      return;
    await bulkDeleteForms([...selectedIds]);
    setSelectedIds(new Set());
    refresh();
  };

  const handleDeleteFolder = async (f: Folder) => {
    if (f.isSystem) return;
    const count = f.itemsCount ?? 0;
    const msg =
      count > 0
        ? `「${f.name}」を削除します。${count} 件のフォームも一緒に削除されます。`
        : `「${f.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await deleteFolderApi("form-folders", f.id);
    if (selectedFolderId === f.id) setSelectedFolderId(folderList[0]?.id ?? null);
    refresh();
  };

  const copyUrl = async (f: MockForm) => {
    if (!f.distributionUrl) return;
    try {
      await navigator.clipboard.writeText(f.distributionUrl);
      setCopiedId(f.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* noop */
    }
  };

  const allCheckedInView =
    rows.length > 0 && rows.every((f) => selectedIds.has(f.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const f of rows) next.delete(f.id);
      } else {
        for (const f of rows) next.add(f.id);
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
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold tracking-tight">フォーム作成</h1>
        <GuideButton topic="liff" />
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {folderVisible && (
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
                className="flex-1 h-9 px-2"
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
              {folderList.map((f, idx) => {
                const active = f.id === selectedFolderId;
                return (
                  <li key={f.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => selectFolder(f.id)}
                      disabled={folderReorder}
                      className={cn(
                        "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0 flex items-center justify-between gap-2",
                        active
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/50",
                        folderReorder && "cursor-default hover:bg-transparent",
                      )}
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        ({f.itemsCount ?? 0})
                      </span>
                    </button>
                    {folderReorder
                      ? !f.isSystem && (
                          <span className="flex items-center">
                            <button
                              onClick={() => moveFolder(idx, -1)}
                              disabled={folderList[idx - 1]?.isSystem ?? true}
                              className="grid place-items-center size-7 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                              aria-label="上へ"
                            >
                              <FontAwesomeIcon icon={faArrowUp} className="size-3" />
                            </button>
                            <button
                              onClick={() => moveFolder(idx, 1)}
                              disabled={idx >= folderList.length - 1}
                              className="grid place-items-center size-7 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                              aria-label="下へ"
                            >
                              <FontAwesomeIcon icon={faArrowDown} className="size-3" />
                            </button>
                          </span>
                        )
                      : !f.isSystem && (
                          <button
                            onClick={() => handleDeleteFolder(f)}
                            className="grid place-items-center size-7 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="削除"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                          </button>
                        )}
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
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                新規作成
              </button>
              <Button
                variant={itemReorder ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setItemReorder((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={itemReorder ? faCheck : faArrowsUpDown}
                  className="size-3"
                />
                {itemReorder ? "完了" : "並べ替え"}
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
              {searchOpen ? (
                <form onSubmit={onSearch} className="relative w-64">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    placeholder="管理名で検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    onBlur={() => !query && setSearchOpen(false)}
                    className="pl-9 h-9"
                  />
                </form>
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
                      disabled={rows.length === 0}
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
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    クイックテスト
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    回答情報
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-12 text-sm text-center text-muted-foreground"
                    >
                      フォームが登録されていません。
                    </td>
                  </tr>
                ) : (
                  rows.map((f, rowIdx) => {
                    const checked = selectedIds.has(f.id);
                    const published = f.status === "published";
                    return (
                      <tr
                        key={f.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5",
                        )}
                      >
                        <td className="px-3 py-3">
                          {itemReorder ? (
                            <div className="inline-flex items-center">
                              <button
                                onClick={() => moveItem(rowIdx, -1)}
                                disabled={rowIdx === 0}
                                className="grid place-items-center size-7 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                                aria-label="上へ"
                              >
                                <FontAwesomeIcon icon={faArrowUp} className="size-3" />
                              </button>
                              <button
                                onClick={() => moveItem(rowIdx, 1)}
                                disabled={rowIdx === rows.length - 1}
                                className="grid place-items-center size-7 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                                aria-label="下へ"
                              >
                                <FontAwesomeIcon icon={faArrowDown} className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRow(f.id)}
                              className="size-4 rounded border-border accent-primary"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <StatusBadge status={f.status} />
                        </td>
                        <td className="px-3 py-3 font-medium">
                          {itemReorder ? (
                            <span>{f.name}</span>
                          ) : (
                            <Link
                              href={`/forms/${f.id}/edit`}
                              className="hover:underline"
                            >
                              {f.name}
                            </Link>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {published && f.distributionUrl ? (
                            <div className="flex items-center gap-2 max-w-[280px]">
                              <span className="truncate">
                                {f.distributionUrl}
                              </span>
                              <button
                                onClick={() => copyUrl(f)}
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label="URLをコピー"
                              >
                                <FontAwesomeIcon
                                  icon={faCopy}
                                  className="size-3"
                                />
                              </button>
                              {copiedId === f.id && (
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                                  コピー済
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">
                              公開後に発行
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">{f.formType}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {f.createdAt
                            ? f.createdAt.slice(0, 10).replace(/-/g, "/")
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {f.updatedAt
                            ? f.updatedAt.slice(0, 10).replace(/-/g, "/")
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {published && f.distributionUrl ? (
                            <a
                              href={f.distributionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              aria-label="回答ページを開く"
                            >
                              <FontAwesomeIcon
                                icon={faUpRightFromSquare}
                                className="size-3.5"
                              />
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <Link
                            href={`/forms/${f.id}/responses`}
                            className="inline-flex items-center gap-1.5 text-foreground hover:underline tabular-nums"
                          >
                            <FontAwesomeIcon
                              icon={faChartSimple}
                              className="size-3 text-muted-foreground"
                            />
                            {f.responseCount}
                          </Link>
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
              onClick={handleBulkDelete}
              className="h-9 disabled:opacity-50 text-destructive hover:text-destructive"
            >
              <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
              一括削除
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums ml-auto">
              全 {rows.length} 件
            </span>
          </div>
        </section>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={refresh}
      />
      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folders={folderList}
        defaultFolderId={selectedFolderId ?? folderList[0]?.id ?? null}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: MockForm["status"] }) {
  if (status === "published")
    return (
      <span className="font-bold text-emerald-600 dark:text-emerald-400">
        公開中
      </span>
    );
  if (status === "closed")
    return <span className="text-muted-foreground">終了</span>;
  return <span className="text-muted-foreground">下書き</span>;
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
        "px-3 py-2 text-left font-bold text-foreground",
        className,
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
