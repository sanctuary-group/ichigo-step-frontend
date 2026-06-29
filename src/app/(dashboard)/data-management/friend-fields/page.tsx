"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolderPlus,
  faArrowsUpDown,
  faTrashCan,
  faFolderTree,
  faPenToSquare,
  faTrash,
  faArrowUp,
  faArrowDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchFriendFields,
  deleteFriendField,
  reorderFriendFields,
} from "@/lib/api/friend-fields";
import {
  fetchFolders,
  deleteFolder as deleteFolderApi,
  reorderFolders,
} from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { FriendFieldFolderDialog } from "@/components/data-management/friend-field-folder-dialog";

export default function FriendFieldsPage() {
  const { currentChannelId } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderReorder, setFolderReorder] = useState(false);
  const [itemReorder, setItemReorder] = useState(false);

  const { data: folders, mutate: mutateFolders } = useResource(
    currentChannelId ? `friend-field-folders:${currentChannelId}` : null,
    () => fetchFolders("friend-field-folders"),
  );
  const folderList = folders ?? [];

  const { data: fields, mutate } = useResource(
    currentChannelId
      ? `friend-fields:${currentChannelId}:${selectedFolderId ?? "all"}`
      : null,
    () => fetchFriendFields({ folder: selectedFolderId ?? undefined }),
  );
  const items = fields ?? [];

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
    await reorderFolders("friend-field-folders", ids);
    mutateFolders();
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const ids = items.map((f) => Number(f.id));
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await reorderFriendFields(ids);
    mutate();
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm("このフォルダを削除しますか？")) return;
    await deleteFolderApi("friend-field-folders", folderId);
    if (selectedFolderId === folderId) setSelectedFolderId(null);
    mutateFolders();
    mutate();
  };

  const deleteField = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await deleteFriendField(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    mutate();
    mutateFolders();
  };

  async function handleBulkDelete() {
    if (!confirm(`${selectedIds.size} 件を削除しますか？`)) return;
    await Promise.all([...selectedIds].map((id) => deleteFriendField(id)));
    setSelectedIds(new Set());
    mutate();
    mutateFolders();
  }

  const allCheckedInView =
    items.length > 0 && items.every((f) => selectedIds.has(f.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const f of items) next.delete(f.id);
      } else {
        for (const f of items) next.add(f.id);
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
                    onClick={() => {
                      if (folderReorder) return;
                      setSelectedFolderId(f.id);
                      setSelectedIds(new Set());
                    }}
                    disabled={folderReorder}
                    className={cn(
                      "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0",
                      active
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted/50",
                      folderReorder && "cursor-default hover:bg-transparent",
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
                            disabled={folderList[idx - 1]?.isSystem ?? true}
                            aria-label="上へ"
                          >
                            <FontAwesomeIcon icon={faArrowUp} className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="size-7 p-0 text-muted-foreground disabled:opacity-30"
                            onClick={() => moveFolder(idx, 1)}
                            disabled={idx >= folderList.length - 1}
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
                          onClick={() => deleteFolder(f.id)}
                          aria-label="削除"
                        >
                          <FontAwesomeIcon icon={faTrash} className="size-3" />
                        </Button>
                      )}
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap">
            <Link
              href={`/data-management/friend-fields/new${selectedFolderId ? `?folder=${selectedFolderId}` : ""}`}
              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              新規作成
            </Link>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setItemReorder((v) => !v)}
                className={cn(
                  "h-9 text-white",
                  itemReorder
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-zinc-500 hover:bg-zinc-600",
                )}
              >
                <FontAwesomeIcon
                  icon={itemReorder ? faCheck : faArrowsUpDown}
                  className="size-3"
                />
                {itemReorder ? "完了" : "並べ替え"}
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
                onClick={handleBulkDelete}
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
                      disabled={items.length === 0}
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
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-40">
                    情報タイプ
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-28">
                    回答人数
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-24">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-sm text-center text-muted-foreground"
                    >
                      データがありません。
                    </td>
                  </tr>
                ) : (
                  items.map((f, rowIdx) => {
                    const checked = selectedIds.has(f.id);
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
                                disabled={rowIdx === items.length - 1}
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
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {f.createdAt.slice(0, 10).replace(/-/g, "/")}
                        </td>
                        <td className="px-3 py-3 font-medium">{f.name}</td>
                        <td className="px-3 py-3 text-xs">{f.fieldType}</td>
                        <td className="px-3 py-3 text-xs tabular-nums">
                          {f.answerCount}
                        </td>
                        <td className="px-3 py-3">
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={`/data-management/friend-fields/${f.id}/edit`}
                              className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground"
                              aria-label="編集"
                            >
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="size-3.5"
                              />
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteField(f.id, f.name)}
                              className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                              aria-label="削除"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="size-3.5"
                              />
                            </button>
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

      <FriendFieldFolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={() => {
          mutateFolders();
        }}
      />
    </div>
  );
}
