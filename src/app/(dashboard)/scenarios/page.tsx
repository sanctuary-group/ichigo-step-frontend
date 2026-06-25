"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faFolder,
  faFolderPlus,
  faArrowsUpDown,
  faMagnifyingGlass,
  faAngleDoubleLeft,
  faEllipsis,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  fetchScenarios,
  deleteScenario,
  duplicateScenario,
  bulkDeleteScenarios,
  type ScenarioSubscriberStatus,
} from "@/lib/api/scenarios";
import {
  fetchFolders,
  deleteFolder as deleteFolderApi,
  type Folder,
} from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockScenario } from "@/mocks/data";
import { SubscribersModal } from "@/components/scenarios/subscribers-modal";
import { FolderDialog } from "@/components/scenarios/folder-dialog";
import { BulkMoveDialog } from "@/components/scenarios/bulk-move-dialog";

const MAX_SCENARIO_NAME = 100;

export default function ScenariosPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFolderPane, setShowFolderPane] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [subscriberView, setSubscriberView] = useState<{
    scenario: MockScenario;
    status: ScenarioSubscriberStatus;
  } | null>(null);

  const { data: folders, mutate: mutateFolders } = useResource(
    currentChannelId ? `scenario-folders:${currentChannelId}` : null,
    () => fetchFolders("scenario-folders"),
  );
  const folderList = useMemo(() => folders ?? [], [folders]);

  // 既定の選択フォルダ（先頭フォルダ）を初期化。
  useEffect(() => {
    if (selectedFolderId === null && folderList.length > 0) {
      setSelectedFolderId(folderList[0].id);
    }
  }, [folderList, selectedFolderId]);

  const { data: scenarios, mutate } = useResource(
    currentChannelId
      ? `scenarios:${currentChannelId}:${selectedFolderId ?? ""}:${appliedQuery}`
      : null,
    () =>
      fetchScenarios({
        folder: selectedFolderId ?? undefined,
        q: appliedQuery || undefined,
      }),
  );
  const rows = useMemo(() => scenarios ?? [], [scenarios]);

  const refresh = () => {
    mutate();
    mutateFolders();
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
  };

  const selectFolder = (id: string) => {
    setSelectedFolderId(id);
    setSelectedIds(new Set());
  };

  const handleDelete = async (s: MockScenario) => {
    if (!confirm(`「${s.name}」を削除しますか？`)) return;
    await deleteScenario(s.id);
    refresh();
  };

  const handleDuplicate = async (s: MockScenario) => {
    await duplicateScenario(s.id);
    refresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`選択した ${selectedIds.size} 件のシナリオを削除しますか？`))
      return;
    await bulkDeleteScenarios([...selectedIds]);
    setSelectedIds(new Set());
    refresh();
  };

  const handleDeleteFolder = async (f: Folder) => {
    if (f.isSystem) return;
    const count = f.itemsCount ?? 0;
    const msg =
      count > 0
        ? `「${f.name}」を削除します。${count} 件のシナリオも一緒に削除されます。`
        : `「${f.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await deleteFolderApi("scenario-folders", f.id);
    if (selectedFolderId === f.id) setSelectedFolderId(folderList[0]?.id ?? null);
    refresh();
  };

  const allCheckedInView =
    rows.length > 0 && rows.every((s) => selectedIds.has(s.id));
  const hasSelection = selectedIds.size > 0;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const s of rows) next.delete(s.id);
      } else {
        for (const s of rows) next.add(s.id);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ステップ配信</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ステップ配信とは、友だちに対し事前に準備したメッセージを、設定した順番と間隔で自動的に配信する機能です。
        </p>
      </div>

      <hr className="border-border" />

      <div className="flex-1 flex overflow-hidden gap-6">
        {showFolderPane && (
          <aside className="w-56 shrink-0 flex flex-col gap-3 overflow-hidden">
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
              <Button variant="outline" size="sm" className="h-9" disabled>
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>

            <ul className="flex-1 overflow-y-auto space-y-1">
              {folderList.map((f) => {
                const active = f.id === selectedFolderId;
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
                        {f.name} ({f.itemsCount ?? 0})
                      </span>
                    </button>
                    {!f.isSystem && (
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
              onClick={() => setShowFolderPane(false)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} className="size-3" />
              フォルダを非表示
            </button>
          </aside>
        )}

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
              <Button variant="outline" size="sm" className="h-9" disabled>
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>

            {searchOpen ? (
              <form onSubmit={onSearch} className="relative w-64">
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
              </form>
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
                      disabled={rows.length === 0}
                      className="size-4 rounded border-border accent-primary"
                      aria-label="すべて選択"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    管理名
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-44">
                    購読中の友だち
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-44">
                    途中で終了した友だち
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-44">
                    読了済の友だち
                  </th>
                  <th className="px-3 py-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="border-b border-border">
                    <td
                      colSpan={6}
                      className="px-3 py-12 text-center text-sm text-muted-foreground"
                    >
                      データがありません。
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => {
                    const checked = selectedIds.has(s.id);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => router.push(`/scenarios/${s.id}/edit`)}
                        className={cn(
                          "border-b border-border hover:bg-muted/30 cursor-pointer",
                          checked && "bg-primary/5",
                        )}
                      >
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                            href={`/scenarios/${s.id}/edit`}
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
                        <CountCell
                          count={s.enrolledCount}
                          onShow={() =>
                            setSubscriberView({ scenario: s, status: "active" })
                          }
                        />
                        <CountCell
                          count={s.terminatedCount}
                          onShow={() =>
                            setSubscriberView({
                              scenario: s,
                              status: "terminated",
                            })
                          }
                        />
                        <CountCell
                          count={s.completedCount}
                          onShow={() =>
                            setSubscriberView({
                              scenario: s,
                              status: "completed",
                            })
                          }
                        />
                        <td
                          className="px-3 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActionsMenu
                            onCopy={() => handleDuplicate(s)}
                            onDelete={() => handleDelete(s)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 mt-auto">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                onClick={() => setBulkMoveOpen(true)}
                className="h-9"
              >
                <FontAwesomeIcon icon={faFolder} className="size-3" />
                一括フォルダ変更
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                onClick={handleBulkDelete}
                className="h-9 text-destructive hover:text-destructive"
              >
                <FontAwesomeIcon icon={faTrash} className="size-3" />
                一括削除
              </Button>
            </div>

            <span className="text-xs text-muted-foreground tabular-nums">
              全 {rows.length} 件
            </span>
          </div>
        </section>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={mutateFolders}
      />
      <CreateScenarioDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <BulkMoveDialog
        open={bulkMoveOpen}
        onClose={() => setBulkMoveOpen(false)}
        folders={folderList}
        ids={[...selectedIds]}
        onDone={() => {
          setBulkMoveOpen(false);
          setSelectedIds(new Set());
          refresh();
        }}
      />
      {subscriberView && (
        <SubscribersModal
          scenario={subscriberView.scenario}
          status={subscriberView.status}
          onClose={() => setSubscriberView(null)}
        />
      )}
    </div>
  );
}

function CountCell({
  count,
  onShow,
}: {
  count: number;
  onShow: () => void;
}) {
  return (
    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums">{count.toLocaleString()}人</span>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={count === 0}
          onClick={onShow}
        >
          表示
        </Button>
      </div>
    </td>
  );
}

function RowActionsMenu({
  onCopy,
  onDelete,
}: {
  onCopy: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="操作メニュー"
        className="inline-flex items-center justify-center size-9 rounded-md hover:bg-muted text-muted-foreground"
      >
        <FontAwesomeIcon icon={faEllipsis} className="size-4" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-50 min-w-36 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg"
            style={{ top: pos.top, right: pos.right }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCopy();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted"
            >
              <FontAwesomeIcon
                icon={faCopy}
                className="size-4 text-muted-foreground"
              />
              コピー
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted"
            >
              <FontAwesomeIcon
                icon={faTrash}
                className="size-4 text-muted-foreground"
              />
              削除
            </button>
          </div>
        </>
      )}
    </>
  );
}

function CreateScenarioDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const onSubmit = () => {
    onClose();
    router.push("/scenarios/new");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
                {name.length}/{MAX_SCENARIO_NAME}
              </span>
            </div>
            <Input
              id="sc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_SCENARIO_NAME}
              className="h-11"
              autoFocus
            />
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              disabled={name.length === 0}
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-11 disabled:opacity-50"
              onClick={onSubmit}
            >
              メッセージの登録に進む
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
