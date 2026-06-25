"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  createFriendField,
  updateFriendField,
  FIELD_TYPE_LABELS,
  type FriendFieldType,
  type FriendFieldRunMode,
} from "@/lib/api/friend-fields";
import type { Folder } from "@/lib/api/folders";

const MAX_NAME = 20;

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FriendFieldType[];

export type FriendFieldFormInitial = {
  id: string;
  name: string;
  folderId: number | null;
  fieldType: FriendFieldType;
  runMode: FriendFieldRunMode;
  options: string[];
};

export function FriendFieldForm({
  folders,
  initial,
  defaultFolderId,
}: {
  folders: Folder[];
  /** 編集時は既存値。新規時は undefined。 */
  initial?: FriendFieldFormInitial;
  /** 新規時の既定フォルダ（クエリ ?folder=）。 */
  defaultFolderId?: string | null;
}) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [folderId, setFolderId] = useState<string>(
    initial?.folderId != null
      ? String(initial.folderId)
      : (defaultFolderId ?? ""),
  );
  const [fieldType, setFieldType] = useState<FriendFieldType>(
    initial?.fieldType ?? "choice",
  );
  const [runMode, setRunMode] = useState<FriendFieldRunMode>(
    initial?.runMode ?? "once",
  );
  const [options, setOptions] = useState<string[]>(
    initial && initial.options.length ? initial.options : [""],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveFolderId = folderId || folders[0]?.id || "";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const cleanedOptions =
        fieldType === "choice"
          ? options.map((o) => o.trim()).filter(Boolean)
          : undefined;

      if (isEdit) {
        await updateFriendField(initial!.id, {
          name: name.trim(),
          friend_field_folder_id: Number(effectiveFolderId),
          run_mode: runMode,
          options: cleanedOptions,
        });
      } else {
        await createFriendField({
          name: name.trim(),
          friend_field_folder_id: Number(effectiveFolderId),
          field_type: fieldType,
          run_mode: runMode,
          options: cleanedOptions,
        });
      }
      router.push(
        `/data-management/friend-fields${effectiveFolderId ? `?folder=${effectiveFolderId}` : ""}`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-lg font-bold tracking-tight">
        {isEdit ? "友だち情報編集" : "友だち情報作成"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
        <Section title="友だち情報（管理名）">
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

        <Section title="フォルダ">
          <Select
            value={effectiveFolderId}
            onValueChange={(v) => v && setFolderId(v)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="フォルダを選択" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>

        <div className="lg:col-span-2">
          <SectionHeader>
            <h2 className="text-sm font-bold">
              情報タイプ選択{" "}
              <span className="text-red-600 dark:text-red-400 text-xs font-normal">
                ※保存後の変更不可
              </span>
            </h2>
          </SectionHeader>
          <Select
            value={fieldType}
            onValueChange={(v) => v && setFieldType(v as FriendFieldType)}
            disabled={isEdit}
          >
            <SelectTrigger className="h-10 w-full sm:w-1/2 disabled:opacity-60 disabled:cursor-not-allowed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fieldType === "choice" && (
          <div className="lg:col-span-2">
            <Section title="選択肢">
              <div className="space-y-2">
                {options.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    「追加」で選択肢を登録してください。
                  </p>
                )}
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) =>
                        setOptions((prev) =>
                          prev.map((o, j) => (j === i ? e.target.value : o)),
                        )
                      }
                      placeholder={`選択肢 ${i + 1}`}
                      maxLength={100}
                      className="h-9 max-w-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      aria-label="削除"
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOptions((prev) => [...prev, ""])}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-9 px-5"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-3" />
                  追加
                </Button>
              </div>
            </Section>
          </div>
        )}

        <div className="lg:col-span-2">
          <Section title="稼働設定">
            <RadioGroup
              value={runMode}
              onValueChange={(v) => v && setRunMode(v as FriendFieldRunMode)}
              className="flex items-center gap-6"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="once" />
                一度のみ
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="repeat" />
                何度でも稼働
              </label>
            </RadioGroup>
          </Section>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              `/data-management/friend-fields${effectiveFolderId ? `?folder=${effectiveFolderId}` : ""}`,
            )
          }
          className="h-11 px-8"
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim() || !effectiveFolderId}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-16 font-bold disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </Button>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 border-l-[3px] border-primary pl-2">
      {children}
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
      <SectionHeader>
        <h2 className="text-sm font-bold">{title}</h2>
      </SectionHeader>
      <div>{children}</div>
    </div>
  );
}
