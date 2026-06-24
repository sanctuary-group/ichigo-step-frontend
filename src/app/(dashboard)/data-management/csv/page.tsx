"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowsUpDown,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type CsvRow = {
  id: string;
  createdAt: string;
  name: string;
  targetCount: number;
  conditionLabel: string;
};

const EXPORT_ROWS: CsvRow[] = [];
const IMPORT_ROWS: CsvRow[] = [];

export default function CsvPage() {
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
          <CsvTable rows={EXPORT_ROWS} newHref="/data-management/csv/new" />
        </TabsContent>

        <TabsContent
          value="import"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <CsvTable rows={IMPORT_ROWS} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CsvTable({
  rows,
  newHref,
}: {
  rows: CsvRow[];
  newHref?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-3 flex-wrap">
        {newHref ? (
          <Link
            href={newHref}
            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3" />
            新規作成
          </Link>
        ) : (
          <Button
            size="sm"
            className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <FontAwesomeIcon icon={faPlus} className="size-3" />
            新規作成
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 bg-zinc-500 hover:bg-zinc-600 text-white"
          >
            <FontAwesomeIcon icon={faArrowsUpDown} className="size-3" />
            並べ替え
          </Button>
          <Button
            size="sm"
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
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-40">
                作成日
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground">
                管理名
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-40">
                対象人数
              </th>
              <th className="px-3 py-3 text-left font-bold text-primary-foreground w-48">
                最終条件設定
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? null : (
              rows.map((r) => {
                const checked = selectedIds.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border hover:bg-muted/30"
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
