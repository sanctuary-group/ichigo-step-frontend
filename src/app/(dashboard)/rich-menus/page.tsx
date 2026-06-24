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
  faClockRotateLeft,
  faTrashCan,
  faFolderTree,
  faEyeSlash,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_RICH_MENUS, MOCK_RICH_MENU_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_NAME = 50;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatYmd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export default function RichMenusPage() {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string>("rmf_default");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState("100");
  const [folderVisible, setFolderVisible] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFolderId, setNewFolderId] = useState<string>("rmf_default");
  const [addToTop, setAddToTop] = useState(false);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of MOCK_RICH_MENUS) {
      map.set(m.folderId, (map.get(m.folderId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    return MOCK_RICH_MENUS.filter((m) => {
      if (m.folderId !== selectedFolderId) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!m.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedFolderId, query]);

  const allCheckedInView =
    filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInView) {
        for (const m of filtered) next.delete(m.id);
      } else {
        for (const m of filtered) next.add(m.id);
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
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-muted/30">
        <h1 className="text-lg font-bold tracking-tight">リッチメニュー</h1>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 font-bold"
        >
          <FontAwesomeIcon icon={faPlus} className="size-3.5" />
          新規作成
        </Button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {folderVisible && (
          <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-[40vh] md:max-h-none">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-bold">フォルダ</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground"
                  aria-label="フォルダ追加"
                >
                  <FontAwesomeIcon icon={faFolderPlus} className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground"
                  aria-label="並べ替え"
                >
                  <FontAwesomeIcon icon={faArrowsUpDown} className="size-3.5" />
                </button>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-2 space-y-1">
              {MOCK_RICH_MENU_FOLDERS.map((f) => {
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
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2",
                        active
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        ({count})
                      </span>
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
              <FontAwesomeIcon icon={faEyeSlash} className="size-3.5" />
              フォルダを非表示
            </button>
          </aside>
        )}

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border flex-wrap">
            <div className="relative w-72 max-w-full">
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
            </div>
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
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faClockRotateLeft} className="size-3.5" />
                操作予約・履歴
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <FontAwesomeIcon icon={faArrowsUpDown} className="size-3.5" />
                並べ替え
              </Button>
              <Button variant="outline" size="sm" className="h-9">
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
                      disabled={filtered.length === 0}
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
                  <th className="px-3 py-2 text-left font-bold text-foreground w-24">
                    操作
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-20">
                    表示中
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
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
                  filtered.map((m) => {
                    const checked = selectedIds.has(m.id);
                    return (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30",
                          checked && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(m.id)}
                            className="size-4 rounded border-border accent-primary"
                            aria-label={`${m.name} を選択`}
                          />
                        </td>
                        <td className="px-3 py-3 font-medium">{m.name}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {m.tapAreas.length} 件
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(m.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatYmd(m.updatedAt)}
                        </td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3 text-xs">
                          {m.isPublished ? "公開中" : "—"}
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
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Select
                value={pageSize}
                onValueChange={(v) => v && setPageSize(v)}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50件 / ページ</SelectItem>
                  <SelectItem value="100">100件 / ページ</SelectItem>
                  <SelectItem value="200">200件 / ページ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                  {newName.length}/{MAX_NAME}
                </span>
              </div>
              <Input
                id="rm-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={MAX_NAME}
                placeholder="管理名を入力して下さい"
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
                  {MOCK_RICH_MENU_FOLDERS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button
                disabled={newName.length === 0}
                onClick={() => {
                  setCreateOpen(false);
                  router.push("/rich-menus/new");
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 font-bold disabled:opacity-50"
              >
                リッチメニューの登録に進む
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
