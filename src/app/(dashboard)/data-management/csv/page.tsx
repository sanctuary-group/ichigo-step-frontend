"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowsUpDown,
  faTrashCan,
  faDownload,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  fetchCsvJobs,
  deleteCsvJob,
  downloadCsvJob,
  type CsvJobRow,
} from "@/lib/api/csv-jobs";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { ImportDialog } from "@/components/data-management/import-dialog";

export default function CsvPage() {
  const { currentChannelId } = useAuth();
  const exportJobs = useResource(
    currentChannelId ? `csv-jobs:${currentChannelId}:export` : null,
    () => fetchCsvJobs("export"),
  );
  const importJobs = useResource(
    currentChannelId ? `csv-jobs:${currentChannelId}:import` : null,
    () => fetchCsvJobs("import"),
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">CSV管理</h1>
      </div>

      <Tabs
        defaultValue="export"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList
          variant="line"
          className="border-b border-border justify-start gap-2 h-auto rounded-none p-0 px-6 self-stretch"
        >
          <TabsTrigger
            value="export"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            エクスポート
          </TabsTrigger>
          <TabsTrigger
            value="import"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            インポート
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="export"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <ExportTable
            rows={exportJobs.data ?? []}
            onDelete={async (ids) => {
              await Promise.all(ids.map((id) => deleteCsvJob(id)));
              exportJobs.mutate();
            }}
          />
        </TabsContent>

        <TabsContent
          value="import"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <ImportTable
            rows={importJobs.data ?? []}
            onDelete={async (id) => {
              await deleteCsvJob(id);
              importJobs.mutate();
            }}
            onImported={() => importJobs.mutate()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportTable({
  rows,
  onDelete,
}: {
  rows: CsvJobRow[];
  onDelete: (ids: string[]) => void | Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allChecked =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const toggleAll = () =>
    setSelectedIds(allChecked ? new Set() : new Set(rows.map((r) => r.id)));

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteRow = async (r: CsvJobRow) => {
    if (!confirm(`「${r.name}」を削除しますか？`)) return;
    await onDelete([r.id]);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(r.id);
      return next;
    });
  };

  const download = async (r: CsvJobRow) => {
    try {
      await downloadCsvJob(r.id, r.name);
    } catch {
      alert("ダウンロードに失敗しました");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap">
        <Link
          href="/data-management/csv/new"
          className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="size-3" />
          新規作成
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled
            className="h-9 bg-zinc-500 text-white opacity-50"
          >
            <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
            並べ替え
          </Button>
          <Button
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={async () => {
              if (!confirm(`${selectedIds.size} 件を削除しますか？`)) return;
              await onDelete([...selectedIds]);
              setSelectedIds(new Set());
            }}
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
                  checked={allChecked}
                  onChange={toggleAll}
                  disabled={rows.length === 0}
                  className="size-4 rounded border-white/30 accent-white bg-white/10"
                  aria-label="すべて選択"
                />
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-44">
                作成日
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                管理名
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-28">
                対象人数
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-40">
                最終条件設定
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-28">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-sm text-center text-muted-foreground"
                >
                  データがありません。
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
                      {r.createdAt}
                    </td>
                    <td className="px-3 py-3 font-medium">{r.name}</td>
                    <td className="px-3 py-3 text-xs tabular-nums">
                      {r.targetCount}
                    </td>
                    <td className="px-3 py-3 text-xs">{r.conditionLabel}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => download(r)}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <FontAwesomeIcon icon={faDownload} className="size-3" />
                        DL
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(r)}
                        className="ml-1 grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground hover:text-destructive inline-grid align-middle"
                        aria-label="削除"
                      >
                        <FontAwesomeIcon
                          icon={faTrashCan}
                          className="size-3.5"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportTable({
  rows,
  onDelete,
  onImported,
}: {
  rows: CsvJobRow[];
  onDelete: (id: string) => void | Promise<void>;
  onImported: () => void;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const deleteRow = async (r: CsvJobRow) => {
    if (!confirm(`「${r.name}」を削除しますか？`)) return;
    await onDelete(r.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap">
        <Button
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <FontAwesomeIcon icon={faUpload} className="size-3" />
          新規取り込み
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full text-sm">
          <thead className="bg-primary sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-44">
                取込日
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                管理名
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                ファイル名
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-28">
                件数
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-20">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-sm text-center text-muted-foreground"
                >
                  データがありません。
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border hover:bg-muted/30"
                >
                  <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                    {r.createdAt}
                  </td>
                  <td className="px-3 py-3 font-medium">{r.name}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-xs">
                    {r.originalFilename}
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums">
                    {r.rowCount}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => deleteRow(r)}
                      className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      aria-label="削除"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ImportDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={onImported}
      />
    </div>
  );
}
