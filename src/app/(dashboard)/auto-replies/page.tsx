"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolderPlus,
  faArrowsUpDown,
  faTrashCan,
  faFolderTree,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  fetchAutoRepliesRaw,
  deleteAutoReply,
  toggleAutoReply,
} from "@/lib/api/auto-replies";
import {
  fetchFolders,
  deleteFolder as deleteFolderApi,
  type Folder,
} from "@/lib/api/folders";
import type { ApiAutoReply } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { FolderDialog } from "@/components/auto-replies/folder-dialog";

function formatYmd(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

function keywordSummary(r: ApiAutoReply): string {
  if (r.trigger_type === "all") return "全メッセージに反応";
  if (r.trigger_type === "follow") return "友だち追加時";
  const ks = (r.keywords ?? []).filter((k) => k.trim() !== "");
  return ks.length ? ks.join("、") : "（キーワード未設定）";
}

function scheduleSummary(r: ApiAutoReply): string {
  if (r.schedule_type === "business") return "営業時間内のみ";
  if (r.schedule_type === "custom") {
    const s = r.schedule_start ? formatYmd(r.schedule_start) : "";
    const e = r.schedule_end ? formatYmd(r.schedule_end) : "";
    return `${s} 〜 ${e}`;
  }
  return "常に（24時間/365日）反応";
}

export default function AutoRepliesPage() {
  const { currentChannelId } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const { data: folders, mutate: mutateFolders } = useResource(
    currentChannelId ? `auto-reply-folders:${currentChannelId}` : null,
    () => fetchFolders("auto-reply-folders"),
  );
  const folderList = useMemo(() => folders ?? [], [folders]);

  // 既定の選択フォルダ（先頭フォルダ）を初期化。
  useEffect(() => {
    if (selectedFolderId === null && folderList.length > 0) {
      setSelectedFolderId(folderList[0].id);
    }
  }, [folderList, selectedFolderId]);

  const { data: autoReplies, mutate } = useResource(
    currentChannelId
      ? `auto-replies:${currentChannelId}:${selectedFolderId ?? ""}`
      : null,
    () => fetchAutoRepliesRaw({ folder: selectedFolderId ?? undefined }),
  );
  const rows = useMemo(() => autoReplies ?? [], [autoReplies]);

  const refresh = () => {
    mutate();
    mutateFolders();
  };

  const selectFolder = (id: string) => {
    setSelectedFolderId(id);
    setSelectedIds(new Set());
  };

  const toggleActive = async (r: ApiAutoReply) => {
    await toggleAutoReply(String(r.id));
    mutate();
  };

  const handleDeleteFolder = async (f: Folder) => {
    if (f.isSystem) return;
    const count = f.itemsCount ?? 0;
    const msg =
      count > 0
        ? `「${f.name}」を削除します。${count} 件の自動応答も一緒に削除されます。`
        : `「${f.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await deleteFolderApi("auto-reply-folders", f.id);
    if (selectedFolderId === f.id) setSelectedFolderId(null);
    refresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 件の自動応答を削除しますか？`)) return;
    await Promise.all(
      [...selectedIds].map((id) => deleteAutoReply(String(id))),
    );
    setSelectedIds(new Set());
    refresh();
  };

  const allCheckedInView =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const r of rows) next.delete(r.id);
      } else {
        for (const r of rows) next.add(r.id);
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border flex items-start justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight">自動応答</h1>
        <Button
          disabled
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-bold"
        >
          <FontAwesomeIcon icon={faBookOpen} className="size-3.5" />
          マニュアル
        </Button>
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
                disabled
                className="grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground disabled:opacity-40"
                aria-label="並べ替え"
              >
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3.5" />
              </button>
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto px-2 space-y-1">
            {folderList.map((f) => {
              const active = f.id === selectedFolderId;
              return (
                <li key={f.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => selectFolder(f.id)}
                    className={cn(
                      "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0 flex items-center justify-between gap-2",
                      active
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      ({f.itemsCount ?? 0})
                    </span>
                  </button>
                  {!f.isSystem && (
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
        </aside>

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap">
            <Link
              href="/auto-replies/new"
              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              新規作成
            </Link>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled
                className="h-9 bg-zinc-500 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
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
                onClick={handleBulkDelete}
                disabled={selectionCount === 0}
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
                      disabled={rows.length === 0}
                      className="size-4 rounded border-white/30 accent-white bg-white/10"
                      aria-label="すべて選択"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-32">
                    作成日
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-28">
                    稼働状況
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                    タイトル
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                    キーワード
                  </th>
                  <th className="px-3 py-3 text-left font-bold text-primary-foreground w-56">
                    スケジュール
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-12 text-center text-sm text-muted-foreground"
                    >
                      自動応答が登録されていません。
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const checked = selectedIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5",
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(r.id)}
                            className="size-4 rounded border-border accent-primary"
                          />
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(r.created_at)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={r.is_active}
                              onCheckedChange={() => toggleActive(r)}
                              aria-label={r.is_active ? "停止する" : "稼働する"}
                            />
                            <span
                              className={cn(
                                "text-[11px]",
                                r.is_active
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {r.is_active ? "稼働中" : "停止中"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium">
                          <Link
                            href={`/auto-replies/${r.id}/edit`}
                            className={cn(
                              "hover:underline",
                              !r.title?.trim() && "text-muted-foreground italic",
                            )}
                          >
                            {r.title?.trim() ? r.title : "（無題）"}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {keywordSummary(r)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {scheduleSummary(r)}
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

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={refresh}
      />
    </div>
  );
}
