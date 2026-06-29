"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faFolderPlus,
  faArrowsUpDown,
  faSort,
  faClockRotateLeft,
  faTrashCan,
  faFolderTree,
  faEyeSlash,
  faInbox,
  faMobileScreenButton,
  faUser,
  faEllipsis,
  faChartColumn,
  faArrowUp,
  faArrowDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BulkMoveDialog } from "@/components/rich-menus/bulk-move-dialog";
import { FolderDialog } from "@/components/rich-menus/folder-dialog";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import {
  fetchRichMenus,
  deleteRichMenu as apiDeleteRichMenu,
  bulkDeleteRichMenus,
  bulkMoveRichMenus,
  reorderRichMenus,
} from "@/lib/api/rich-menus";
import {
  fetchFolders,
  createFolder,
  deleteFolder as apiDeleteFolder,
  reorderFolders,
  type Folder,
} from "@/lib/api/folders";
import type { RichMenu } from "@/types/rich-menu";

const MAX_NAME = 50;

type RichMenuRow = RichMenu & { display_count?: number };

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatYmd(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export default function RichMenusPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [folderVisible, setFolderVisible] = useState(true);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [folderReorder, setFolderReorder] = useState(false);
  const [itemReorder, setItemReorder] = useState(false);

  const { data: folders, mutate: mutateFolders } = useResource(
    currentChannelId ? `rich-menu-folders:${currentChannelId}` : null,
    () => fetchFolders("rich-menu-folders"),
  );
  const folderList: Folder[] = folders ?? [];

  const { data: richMenusData, mutate } = useResource(
    currentChannelId
      ? `rich-menus:${currentChannelId}:${selectedFolderId ?? ""}:${appliedQuery}`
      : null,
    () =>
      fetchRichMenus({
        folder: selectedFolderId ?? undefined,
        q: appliedQuery || undefined,
      }),
  );
  const richMenus: RichMenuRow[] = richMenusData ?? [];

  const selectFolder = (folderId: string) => {
    if (folderReorder) return;
    setSelectedFolderId((cur) => (cur === folderId ? null : folderId));
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
    await reorderFolders("rich-menu-folders", ids);
    mutateFolders();
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= richMenus.length) return;
    const ids = richMenus.map((m) => m.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderRichMenus(ids);
    mutate();
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
  };

  const deleteRichMenu = async (m: RichMenu) => {
    const msg = m.is_published
      ? `「${m.name}」は公開中です。削除すると LINE 側のリッチメニューも取り下げられます。削除しますか？`
      : `「${m.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await apiDeleteRichMenu(m.id);
    mutate();
    mutateFolders();
  };

  const deleteFolder = async (f: Folder) => {
    if (f.isSystem) return;
    const count = f.itemsCount ?? 0;
    const msg =
      count > 0
        ? `「${f.name}」を削除します。${count} 件のリッチメニューも一緒に削除されます。`
        : `「${f.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await apiDeleteFolder("rich-menu-folders", f.id);
    if (selectedFolderId === f.id) setSelectedFolderId(null);
    mutateFolders();
    mutate();
  };

  const allCheckedInView =
    richMenus.length > 0 && richMenus.every((m) => selectedIds.has(m.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const m of richMenus) next.delete(m.id);
      } else {
        for (const m of richMenus) next.add(m.id);
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

  const selectionCount = selectedIds.size;

  const bulkDelete = async () => {
    if (selectionCount === 0) return;
    if (
      !confirm(
        `選択した ${selectionCount} 件を削除します。公開中のメニューは LINE 側からも取り下げられます。よろしいですか？`,
      )
    )
      return;
    await bulkDeleteRichMenus([...selectedIds]);
    setSelectedIds(new Set());
    mutate();
    mutateFolders();
  };

  const onBulkMove = async (folderId: string) => {
    await bulkMoveRichMenus([...selectedIds], folderId);
    setSelectedIds(new Set());
    setBulkMoveOpen(false);
    mutate();
    mutateFolders();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-muted/30">
        <h1 className="text-lg font-bold tracking-tight">リッチメニュー</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 rounded-md font-bold text-sm transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="size-3.5" />
          新規作成
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {folderVisible && (
          <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-[40vh] md:max-h-none">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-bold">フォルダ</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFolderDialogOpen(true)}
                  className="grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground"
                  aria-label="フォルダ追加"
                >
                  <FontAwesomeIcon icon={faFolderPlus} className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFolderReorder((v) => !v)}
                  className={cn(
                    "grid place-items-center size-7 rounded text-muted-foreground",
                    folderReorder
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                  aria-label={folderReorder ? "並べ替えを完了" : "並べ替え"}
                >
                  <FontAwesomeIcon
                    icon={folderReorder ? faCheck : faArrowsUpDown}
                    className="size-3.5"
                  />
                </button>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-2 space-y-1">
              {folderList.map((f, idx) => {
                const active = f.id === selectedFolderId;
                return (
                  <li key={f.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => selectFolder(f.id)}
                      disabled={folderReorder}
                      className={cn(
                        "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2 min-w-0",
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
                            onClick={() => deleteFolder(f)}
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
            <form onSubmit={onSearch} className="relative w-72 max-w-full">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="管理名を入力して検索"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </form>
            <div className="flex items-center gap-2 flex-wrap">
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
              <Button variant="outline" size="sm" className="h-9" disabled>
                <FontAwesomeIcon icon={faClockRotateLeft} className="size-3.5" />
                操作予約・履歴
              </Button>
              <Button
                variant={itemReorder ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setItemReorder((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={itemReorder ? faCheck : faArrowsUpDown}
                  className="size-3.5"
                />
                {itemReorder ? "完了" : "並べ替え"}
              </Button>
              <Button variant="outline" size="sm" className="h-9" disabled>
                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                削除したアイテム
              </Button>
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
                      disabled={richMenus.length === 0}
                      className="size-4 rounded border-border accent-primary"
                      aria-label="すべて選択"
                    />
                  </th>
                  <SortableHeader label="管理名" />
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    設定済みアクション
                  </th>
                  <SortableHeader label="作成日" className="w-32" />
                  <SortableHeader label="最終編集日" className="w-32" />
                  <th className="px-3 py-2 text-left font-bold text-foreground whitespace-nowrap">
                    操作
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground whitespace-nowrap">
                    表示中
                  </th>
                </tr>
              </thead>
              <tbody>
                {richMenus.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
                        <FontAwesomeIcon
                          icon={faInbox}
                          className="size-14 text-muted-foreground/30"
                        />
                        <div className="text-sm">まだデータがありません</div>
                        <div className="text-xs">
                          <button
                            onClick={() => setCreateOpen(true)}
                            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                          >
                            新規作成
                          </button>{" "}
                          するとここにデータが表示されます
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  richMenus.map((m, rowIdx) => {
                    const checked = selectedIds.has(m.id);
                    const actionCount = (m.areas ?? []).filter(
                      (a) => a.type !== "none",
                    ).length;
                    return (
                      <tr
                        key={m.id}
                        onClick={() =>
                          !itemReorder && router.push(`/rich-menus/${m.id}/edit`)
                        }
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          !itemReorder && "cursor-pointer",
                          checked && "bg-primary/5",
                        )}
                      >
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                                disabled={rowIdx === richMenus.length - 1}
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
                              onChange={() => toggleRow(m.id)}
                              className="size-4 rounded border-border accent-primary"
                              aria-label={`${m.name} を選択`}
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Link
                            href={`/rich-menus/${m.id}/edit`}
                            onClick={(e) => itemReorder && e.preventDefault()}
                            className={cn(
                              "group block w-40",
                              itemReorder
                                ? "cursor-default"
                                : "cursor-pointer",
                            )}
                          >
                            <span className="block font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                              {m.name}
                            </span>
                            <span className="mt-1.5 block overflow-hidden rounded border border-border transition group-hover:border-primary group-hover:ring-2 group-hover:ring-primary/30">
                              {m.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.image_url}
                                  alt={m.name}
                                  className="block w-full object-cover aspect-[5/3] transition group-hover:opacity-90"
                                />
                              ) : (
                                <span className="grid w-full place-items-center aspect-[5/3] bg-muted text-muted-foreground/40">
                                  <FontAwesomeIcon
                                    icon={faMobileScreenButton}
                                    className="size-6"
                                  />
                                </span>
                              )}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {actionCount > 0 ? (
                            <span className="inline-flex items-center rounded border border-border px-3 py-1.5 text-xs text-foreground">
                              アクション設定済
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              未設定
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground tabular-nums">
                          {formatYmd(m.created_at)}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground tabular-nums">
                          {formatYmd(m.updated_at)}
                        </td>
                        <td
                          className="px-3 py-3 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/rich-menus/${m.id}/display`}
                            className={cn(
                              "inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-bold transition-colors",
                              m.is_published
                                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                : "border-border text-foreground hover:bg-muted",
                            )}
                          >
                            <FontAwesomeIcon
                              icon={faMobileScreenButton}
                              className="size-3.5"
                            />
                            表示・停止する
                          </Link>
                        </td>
                        <td
                          className="px-3 py-3 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 text-sm">
                              <FontAwesomeIcon
                                icon={faUser}
                                className="size-3.5 text-muted-foreground"
                              />
                              <span className="font-bold tabular-nums">
                                {m.display_count ?? 0}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                人
                              </span>
                            </span>
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-60"
                            >
                              <FontAwesomeIcon
                                icon={faChartColumn}
                                className="size-3"
                              />
                              データ表示
                            </button>
                            <RowActionsMenu onDelete={() => deleteRichMenu(m)} />
                          </div>
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
                onClick={() => setBulkMoveOpen(true)}
                className="h-9 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFolderTree} className="size-3.5" />
                一括フォルダ変更
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectionCount === 0}
                onClick={bulkDelete}
                className="h-9 disabled:opacity-50 text-destructive hover:text-destructive"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                一括削除
              </Button>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              全 {richMenus.length} 件
            </span>
          </div>
        </section>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreate={async (name) => {
          await createFolder("rich-menu-folders", name);
          mutateFolders();
        }}
      />
      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folders={folderList}
        defaultFolderId={selectedFolderId ?? folderList[0]?.id ?? null}
      />
      <BulkMoveDialog
        open={bulkMoveOpen}
        onClose={() => setBulkMoveOpen(false)}
        folders={folderList}
        count={selectionCount}
        onMove={onBulkMove}
      />
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

function RowActionsMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.right - 140 });
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={toggle}
        className="grid place-items-center size-8 rounded-md hover:bg-muted text-muted-foreground"
        aria-label="その他の操作"
      >
        <FontAwesomeIcon icon={faEllipsis} className="size-4" />
      </button>
      {open && pos && (
        <div
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-[140px] rounded-md border border-border bg-popover py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
          >
            <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
            削除
          </button>
        </div>
      )}
    </>
  );
}

function CreateDialog({
  open,
  onClose,
  folders,
  defaultFolderId,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>(defaultFolderId ?? "");
  const [addToTop, setAddToTop] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setFolderId(defaultFolderId ?? folders[0]?.id ?? "");
      setAddToTop(false);
    }
  }, [open, defaultFolderId, folders]);

  const onSubmit = () => {
    const params = new URLSearchParams({ name, folder: folderId });
    router.push(`/rich-menus/new?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogTitle className="text-base font-bold">
          リッチメニュー 新規作成
        </DialogTitle>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <Label htmlFor="rm-name" className="text-sm font-bold">
                管理名
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {name.length}/{MAX_NAME}
              </span>
            </div>
            <Input
              id="rm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              placeholder="管理名を入力して下さい"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">フォルダ</Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addToTop}
              onChange={(e) => setAddToTop(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            フォルダ内の一番上に追加する
          </label>

          <p className="text-xs text-muted-foreground">
            ※ 未選択の場合、フォルダの一番下に追加されます
          </p>

          <div className="pt-2 flex justify-end">
            <button
              disabled={name.length === 0}
              onClick={onSubmit}
              className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
            >
              リッチメニューの登録に進む
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
