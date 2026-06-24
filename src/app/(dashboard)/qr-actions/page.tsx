"use client";

import { useMemo, useState } from "react";
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
  faEllipsis,
  faInbox,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_QR_ACTIONS, MOCK_QR_ACTION_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_NAME = 50;
type Audience = "new" | "all";

export default function QrActionsPage() {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string>("qrf_default");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folderVisible, setFolderVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageSize, setPageSize] = useState("100");
  const [viewFilter, setViewFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFolderId, setNewFolderId] = useState<string>("qrf_default");
  const [audience, setAudience] = useState<Audience>("new");

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of MOCK_QR_ACTIONS) {
      map.set(q.folderId, (map.get(q.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    return MOCK_QR_ACTIONS.filter((q) => {
      if (q.folderId !== selectedFolderId) return false;
      if (query.trim()) {
        const s = query.trim().toLowerCase();
        if (!q.name.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [selectedFolderId, query]);

  const allCheckedInView =
    filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const q of filtered) next.delete(q.id);
      } else {
        for (const q of filtered) next.add(q.id);
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
        <h1 className="text-lg font-bold tracking-tight">
          QRコードアクション（流入経路分析）
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          個別の友だち追加URLを発行し、流入経路の分析やそのURLから登録した友だちに対して個別のアクション稼働ができる機能です。
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
              {MOCK_QR_ACTION_FOLDERS.map((f) => {
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
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              新規作成
            </Button>
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
              <Select value={viewFilter} onValueChange={(v) => v && setViewFilter(v)}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全件表示</SelectItem>
                  <SelectItem value="active">稼働中のみ</SelectItem>
                  <SelectItem value="paused">停止中のみ</SelectItem>
                </SelectContent>
              </Select>
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
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label="その他"
              >
                <FontAwesomeIcon
                  icon={faEllipsis}
                  className="size-3.5 text-muted-foreground"
                />
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
                      disabled={filtered.length === 0}
                      className="size-4 rounded border-border accent-primary"
                      aria-label="すべて選択"
                    />
                  </th>
                  <SortableHeader label="稼働状況" className="w-24" />
                  <SortableHeader label="管理名" />
                  <SortableHeader label="稼働対象" className="w-32" />
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    設定済みアクション
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                    URL読み込み人数
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                    友だち追加・ブ
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-28">
                    QRコード表示
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    データ詳細
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
                        <FontAwesomeIcon
                          icon={faInbox}
                          className="size-14 text-muted-foreground/30"
                        />
                        <div className="text-sm">まだデータがありません</div>
                        <div className="text-xs">
                          <a
                            href="#"
                            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                          >
                            新規作成
                          </a>
                          {" "}するとここにデータが表示されます
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => {
                    const checked = selectedIds.has(q.id);
                    return (
                      <tr
                        key={q.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(q.id)}
                            className="size-4 rounded border-border accent-primary"
                          />
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {q.isActive ? "稼働中" : "停止中"}
                        </td>
                        <td className="px-3 py-3 font-medium">{q.name}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {q.audience}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {q.actionLabel}
                        </td>
                        <td className="px-3 py-3 text-xs tabular-nums">
                          {q.scanCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-xs tabular-nums">
                          {q.followCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3"></td>
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
                className="h-9 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                一括削除
              </Button>
              <a
                href="#"
                className="text-sm text-foreground underline hover:no-underline ml-2"
              >
                削除したQRコードアクション
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
                  {newName.length}/{MAX_NAME}
                </span>
              </div>
              <Input
                id="qr-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={MAX_NAME}
                placeholder="管理名"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">フォルダ</Label>
              <Select
                value={newFolderId}
                onValueChange={(v) => v && setNewFolderId(v)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_QR_ACTION_FOLDERS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">
                稼働対象（作成後の変更はできません）
              </Label>
              <RadioGroup
                value={audience}
                onValueChange={(v) => v && setAudience(v as Audience)}
                className="grid grid-cols-2 gap-3"
              >
                <AudienceCard
                  value="new"
                  label="新規友だちのみ"
                  selected={audience === "new"}
                />
                <AudienceCard
                  value="all"
                  label="全ての友だち"
                  selected={audience === "all"}
                />
              </RadioGroup>
            </div>

            <div className="pt-3 flex justify-center">
              <Button
                disabled={newName.length === 0}
                onClick={() => {
                  setCreateOpen(false);
                  router.push("/qr-actions/new");
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white h-11 px-12 font-bold disabled:opacity-50"
              >
                QRコードアクションの新規作成に進む
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
          : "border-border hover:border-blue-200"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} />
        <span
          className={cn(
            "text-sm font-bold",
            selected
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </div>
      <a
        href="#"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
      >
        <FontAwesomeIcon icon={faCircleInfo} className="size-3" />
        説明をみる
      </a>
    </label>
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

