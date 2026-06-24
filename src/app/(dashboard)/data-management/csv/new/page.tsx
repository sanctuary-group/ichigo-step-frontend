"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  MOCK_TAG_FOLDERS,
  MOCK_FRIEND_FIELD_FOLDERS,
} from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_NAME = 50;

type Audience = "active" | "blocked" | "blockedBy";

const SINGLE_FIELDS = [
  { id: "status_message", label: "ステータスメッセージ" },
  { id: "memo", label: "個別メモ" },
  { id: "added_at", label: "友だち追加日" },
  { id: "mark", label: "対応マーク" },
  { id: "last_received_at", label: "最終メッセージ受信日時" },
  { id: "current_step", label: "配信中ステップ" },
  { id: "source", label: "流入経路" },
];

export default function NewExportCsvPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<Audience>("active");
  const [singleSelected, setSingleSelected] = useState<Set<string>>(new Set());
  const [tagFolderId, setTagFolderId] = useState<string>("tagf_default");
  const [fieldFolderId, setFieldFolderId] = useState<string>("fff_default");

  const toggleSingle = (id: string) => {
    setSingleSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="active" />
              有効友だち
            </label>
            {audience === "active" && (
              <Button className="bg-blue-500 hover:bg-blue-600 text-white h-9 px-6">
                絞込み
              </Button>
            )}
          </div>
          {audience === "active" && (
            <div className="rounded-md bg-muted/40 px-4 py-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <div>対象人数（有効友だちのみ）</div>
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                2人
              </a>
              <div>絞り込み条件</div>
              <div></div>
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

      <Section title="単一選択項目">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-6">
          {SINGLE_FIELDS.map((f) => {
            const checked = singleSelected.has(f.id);
            return (
              <label
                key={f.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSingle(f.id)}
                  className="size-4 rounded border-border accent-primary"
                />
                {f.label}
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="複数選択項目">
        <div className="space-y-6">
          <FolderMultiPicker
            label="タグ"
            folders={MOCK_TAG_FOLDERS.map((f) => ({
              id: f.id,
              name: f.name,
              count: 0,
            }))}
            selectedFolderId={tagFolderId}
            onSelectFolder={setTagFolderId}
          />
          <FolderMultiPicker
            label="友だち情報"
            folders={MOCK_FRIEND_FIELD_FOLDERS.map((f) => ({
              id: f.id,
              name: f.name,
              count: f.id === "fff_basic" ? 4 : f.id === "fff_address" ? 5 : 0,
            }))}
            selectedFolderId={fieldFolderId}
            onSelectFolder={setFieldFolderId}
          />
        </div>
      </Section>

      <div className="pt-2">
        <Button
          onClick={() => router.push("/data-management/csv")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-bold"
        >
          この条件でCSVを作成・更新
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          ※データ量によっては、CSVの作成に数時間かかる場合があります。
        </p>
      </div>
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

function FolderMultiPicker({
  label,
  folders,
  selectedFolderId,
  onSelectFolder,
}: {
  label: string;
  folders: { id: string; name: string; count: number }[];
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-8 bg-muted-foreground/20 text-white border-transparent disabled:opacity-60"
        >
          選択クリア
        </Button>
      </div>
      <div className="grid grid-cols-2 rounded-md border border-border bg-muted/20 min-h-40">
        <div className="border-r border-border p-3 space-y-1">
          {folders.map((f) => {
            const active = f.id === selectedFolderId;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFolder(f.id)}
                className={cn(
                  "w-full flex items-center gap-2 text-left px-2 py-1.5 rounded text-sm",
                  active ? "" : "hover:bg-muted/60"
                )}
              >
                {active ? (
                  <span className="size-3 bg-primary rounded-sm shrink-0" />
                ) : (
                  <input
                    type="checkbox"
                    onChange={() => {}}
                    className="size-3.5 rounded border-border accent-primary"
                  />
                )}
                <span>
                  {f.name} ({f.count})
                </span>
              </button>
            );
          })}
        </div>
        <div className="p-3 text-sm text-muted-foreground">
          分類を選択して下さい
        </div>
      </div>
      <div className="text-xs text-muted-foreground">選択した項目</div>
    </div>
  );
}
