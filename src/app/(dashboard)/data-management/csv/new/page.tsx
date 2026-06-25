"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  fetchCsvExportOptions,
  createCsvExport,
} from "@/lib/api/csv-jobs";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

const MAX_NAME = 50;

type Audience = "active" | "blocked" | "blockedBy";

export default function NewExportCsvPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();

  const { data: options } = useResource(
    currentChannelId ? `csv-export-options:${currentChannelId}` : null,
    () => fetchCsvExportOptions(),
  );
  const singleFields = options?.singleFields ?? [];
  const fieldFolders = options?.fieldFolders ?? [];
  const audienceCounts = options?.audienceCounts ?? {
    active: 0,
    blocked: 0,
    blockedBy: 0,
  };

  const [name, setName] = useState("");
  const [audience, setAudience] = useState<Audience>("active");
  const [columns, setColumns] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleColumn = (id: string) =>
    setColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await createCsvExport({
        name: name.trim(),
        audience,
        columns: [...columns],
      });
      router.push("/data-management/csv");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "作成に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-lg font-bold tracking-tight">エクスポートデータ作成</h1>

      <Section title="書き出し名（管理用）">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
            maxLength={MAX_NAME}
            className="h-10"
          />
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {name.length}/{MAX_NAME}文字
          </span>
        </div>
      </Section>

      <Section title="エクスポート対象絞り込み">
        <RadioGroup
          value={audience}
          onValueChange={(v) => v && setAudience(v as Audience)}
          className="space-y-2"
        >
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="active" />
            有効友だち
          </label>
          {audience === "active" && (
            <div className="rounded-md bg-muted/40 px-4 py-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <div>対象人数（有効友だちのみ）</div>
              <div className="text-blue-600 dark:text-blue-400 tabular-nums">
                {audienceCounts.active}人
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="blocked" />
            ブロックした友だち
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="blockedBy" />
            ブロックされた友だち
          </label>
        </RadioGroup>
      </Section>

      <Section title="出力する項目（単一）">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-6">
          {singleFields.map((f) => {
            const checked = columns.has(f.id);
            return (
              <label
                key={f.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleColumn(f.id)}
                  className="size-4 rounded border-border accent-primary"
                />
                {f.label}
              </label>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ※
          LINEユーザーID・表示名・タグは常に出力されます。チェックした項目が追加で列に含まれます。
        </p>
      </Section>

      {fieldFolders.length > 0 && (
        <Section title="友だち情報フォルダ">
          <div className="flex flex-wrap gap-2">
            {fieldFolders.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs"
              >
                {f.name}
                <span className="text-muted-foreground tabular-nums">
                  ({f.count})
                </span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="pt-2 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/data-management/csv")}
          className="h-10 px-6"
        >
          キャンセル
        </Button>
        <Button
          onClick={submit}
          disabled={saving || name.trim().length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-bold disabled:opacity-50"
        >
          {saving ? "作成中..." : "この条件でCSVを作成・更新"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        ※データ量によっては、CSVの作成に時間がかかる場合があります。
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 border-l-[3px] border-primary pl-2">
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
