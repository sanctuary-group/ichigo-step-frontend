"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  faInbox,
  faQrcode,
  faCircleInfo,
  faDownload,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { GuideButton } from "@/components/guide-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QrCodeDialog } from "@/components/qr-actions/qr-code-dialog";
import { cn } from "@/lib/utils";
import {
  fetchQrActionList,
  bulkDeleteQrActions,
  deleteQrAction,
  toggleQrAction,
} from "@/lib/api/qr-actions";
import { fetchFolders, createFolder, deleteFolder } from "@/lib/api/folders";
import type { Folder } from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import type { QrAction, QrAudience } from "@/types/qr-action";

const MAX_NAME = 50;

function audienceLabel(a: QrAudience): string {
  return a === "new" ? "新規友だちのみ" : "全ての友だち";
}

function actionLabel(q: QrAction): string {
  const parts: string[] = [];
  if (q.message && q.message.trim() !== "") {
    parts.push("メッセージ送信");
  }
  if (q.actions && q.actions.length > 0) {
    parts.push(`アクション${q.actions.length}件`);
  }
  // 旧形式（action_type）も併記
  if (q.action_type === "add_tag") {
    parts.push(`タグ付与: ${q.action_tag?.name ?? "—"}`);
  } else if (q.action_type === "start_scenario") {
    parts.push(`シナリオ開始: ${q.action_scenario?.name ?? "—"}`);
  } else if (q.action_type === "track_source" && parts.length === 0) {
    parts.push("流入計測のみ");
  }
  return parts.length > 0 ? parts.join(" / ") : "アクション未設定";
}

export default function QrActionsPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [folderVisible, setFolderVisible] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [qrDialog, setQrDialog] = useState<QrAction | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: folders, mutate: mutateFolders } = useResource(
    currentChannelId ? `qr-action-folders:${currentChannelId}` : null,
    () => fetchFolders("qr-action-folders"),
  );
  const folderList = useMemo(() => folders ?? [], [folders]);

  const { data: qrActions, mutate } = useResource(
    currentChannelId
      ? `qr-actions:${currentChannelId}:${selectedFolderId ?? ""}:${appliedQuery}`
      : null,
    () =>
      fetchQrActionList({
        folder: selectedFolderId ?? undefined,
        q: appliedQuery || undefined,
      }),
  );
  const rows = useMemo(() => qrActions ?? [], [qrActions]);

  const selectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedIds(new Set());
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
  };

  const toggleActive = async (q: QrAction) => {
    await toggleQrAction(String(q.id));
    mutate();
  };

  const deleteQr = async (q: QrAction) => {
    if (!confirm(`「${q.name}」を削除しますか？`)) return;
    await deleteQrAction(q.id);
    mutate();
    mutateFolders();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件のQRコードアクションを削除しますか？`)) return;
    await bulkDeleteQrActions(Array.from(selectedIds).map(String));
    setSelectedIds(new Set());
    mutate();
    mutateFolders();
  };

  const onDeleteFolder = async (f: Folder) => {
    if (f.isSystem) return;
    const count = f.itemsCount ?? 0;
    const msg =
      count > 0
        ? `「${f.name}」を削除します。${count} 件のQRコードアクションも一緒に削除されます。`
        : `「${f.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    await deleteFolder("qr-action-folders", f.id);
    if (selectedFolderId === f.id) setSelectedFolderId(null);
    mutateFolders();
    mutate();
  };

  const allCheckedInView = rows.length > 0 && rows.every((q) => selectedIds.has(q.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const q of rows) next.delete(q.id);
      } else {
        for (const q of rows) next.add(q.id);
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
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-bold tracking-tight">
            QRコードアクション（流入経路分析）
          </h1>
          <GuideButton topic="qr" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          個別の友だち追加URLを発行し、流入経路の分析やそのURLから登録した友だちに対して個別のアクション稼働ができる機能です。
        </p>
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
              <Button variant="outline" size="sm" className="flex-1 h-9 px-2" disabled>
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
                並べ替え
              </Button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
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
                        onClick={() => onDeleteFolder(f)}
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
              <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
              フォルダを非表示
            </button>
          </aside>
        )}

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border flex-wrap">
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              新規作成
            </button>
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
                <form onSubmit={onSearch} className="relative w-56">
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
                  <SortableHeader label="稼働状況" className="w-28" />
                  <SortableHeader label="管理名" />
                  <SortableHeader label="稼働対象" className="w-36" />
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    設定済みアクション
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-foreground w-32">
                    URL読み込み人数
                  </th>
                  <th className="px-3 py-2 text-center font-bold text-foreground w-44">
                    QRコード表示
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-40">
                    データ詳細
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
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
                  rows.map((q) => {
                    const checked = selectedIds.has(q.id);
                    return (
                      <tr
                        key={q.id}
                        onClick={() => router.push(`/qr-actions/${q.id}/edit`)}
                        className={cn(
                          "border-b border-border hover:bg-muted/30 cursor-pointer",
                          checked && "bg-primary/5",
                        )}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(q.id)}
                            className="size-4 rounded border-border accent-primary"
                          />
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-bold w-7",
                                q.is_active
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground",
                              )}
                            >
                              {q.is_active ? "ON" : "OFF"}
                            </span>
                            <Switch
                              checked={q.is_active}
                              onCheckedChange={() => toggleActive(q)}
                              aria-label={q.is_active ? "停止する" : "稼働する"}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-bold text-primary">{q.name}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            {audienceLabel(q.audience)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {actionLabel(q)}
                        </td>
                        <td className="px-3 py-3 text-right text-xs tabular-nums">
                          {q.scan_count.toLocaleString()}人
                        </td>
                        <td
                          className="px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setQrDialog(q)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          >
                            <FontAwesomeIcon icon={faQrcode} className="size-3.5" />
                            QRコードを表示
                          </button>
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/qr-actions/${q.id}/data`}
                              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                            >
                              データ詳細
                            </Link>
                            {q.image_url && (
                              <a
                                href={q.image_url}
                                download={`qr-${q.token}.png`}
                                className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                                aria-label="QR画像をダウンロード"
                              >
                                <FontAwesomeIcon icon={faDownload} className="size-3.5" />
                              </a>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground"
                                    aria-label="その他"
                                  />
                                }
                              >
                                <FontAwesomeIcon icon={faEllipsis} className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => deleteQr(q)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                                  削除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
              onClick={bulkDelete}
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
        onCreated={() => mutateFolders()}
      />
      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folders={folderList}
        defaultFolderId={selectedFolderId ?? folderList[0]?.id ?? null}
      />
      <QrCodeDialog
        qr={
          qrDialog
            ? {
                name: qrDialog.name,
                token: qrDialog.token,
                public_url: qrDialog.public_url ?? "",
                image_url: qrDialog.image_url,
                scan_count: qrDialog.scan_count,
                follow_count: qrDialog.follow_count,
              }
            : null
        }
        accountName={qrDialog?.account_name ?? "あなたのLINE公式アカウント"}
        onClose={() => setQrDialog(null)}
      />
    </div>
  );
}

function SortableHeader({ label, className }: { label: string; className?: string }) {
  return (
    <th className={cn("px-3 py-2 text-left font-bold text-foreground", className)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <FontAwesomeIcon icon={faSort} className="size-2.5 text-muted-foreground" />
      </span>
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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      await createFolder("qr-action-folders", name.trim());
      onCreated();
      setName("");
      onClose();
    } catch {
      setError("作成に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setName("");
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォルダを追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qrf-name">名前</Label>
            <Input
              id="qrf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
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
  const [audience, setAudience] = useState<QrAudience>("new");

  const onSubmit = () => {
    const params = new URLSearchParams({ name, folder: folderId, audience });
    router.push(`/qr-actions/new?${params.toString()}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setName("");
          setFolderId(defaultFolderId ?? folders[0]?.id ?? "");
          setAudience("new");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-center text-lg font-bold">
          QRコードアクション 新規作成
        </DialogTitle>
        <div className="space-y-5 pt-4">
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <Label htmlFor="qr-name" className="text-sm font-bold">
                管理名
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {name.length}/{MAX_NAME}
              </span>
            </div>
            <Input
              id="qr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              placeholder="管理名"
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

          <div className="space-y-2">
            <Label className="text-sm font-bold">
              稼働対象（作成後の変更はできません）
            </Label>
            <RadioGroup
              value={audience}
              onValueChange={(v) => v && setAudience(v as QrAudience)}
              className="grid grid-cols-2 gap-3"
            >
              <AudienceCard value="new" label="新規友だちのみ" selected={audience === "new"} />
              <AudienceCard value="all" label="全ての友だち" selected={audience === "all"} />
            </RadioGroup>
          </div>

          <div className="pt-3 flex justify-center">
            <button
              disabled={name.length === 0}
              onClick={onSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white h-11 px-12 rounded-md font-bold disabled:opacity-50 transition-colors"
            >
              QRコードアクションの作成に進む
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AudienceCard({
  value,
  label,
  selected,
}: {
  value: string;
  label: string;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border-2 cursor-pointer transition-colors px-4 py-3",
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-border hover:border-blue-200",
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} />
        <span
          className={cn(
            "text-sm font-bold",
            selected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>
      <FontAwesomeIcon icon={faCircleInfo} className="size-3.5 text-muted-foreground" />
    </label>
  );
}
