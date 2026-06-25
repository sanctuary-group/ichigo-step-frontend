"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchFolders } from "@/lib/api/folders";
import { createFriendField } from "@/lib/api/friend-fields";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

const MAX_NAME = 20;
type RunMode = "once" | "repeat";
type FieldType = "choice" | "text" | "number" | "date" | "phone" | "email";

export default function NewFriendFieldPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();
  const { data: folders } = useResource(
    currentChannelId ? "friend-field-folders" : null,
    () => fetchFolders("friend-field-folders"),
  );
  const folderList = folders ?? [];

  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [fieldType, setFieldType] = useState<FieldType>("choice");
  const [runMode, setRunMode] = useState<RunMode>("once");
  const [options, setOptions] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 取得したフォルダの先頭（通常は未分類）を既定選択にする。
  const effectiveFolderId = folderId || folderList[0]?.id || "";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await createFriendField({
        name: name.trim(),
        friend_field_folder_id: Number(effectiveFolderId),
        field_type: fieldType,
        run_mode: runMode,
        options:
          fieldType === "choice"
            ? options.map((o) => o.trim()).filter(Boolean)
            : undefined,
      });
      router.push("/data-management/friend-fields");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-lg font-bold tracking-tight">友だち情報作成</h1>

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
              {folderList.map((f) => (
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
            onValueChange={(v) => v && setFieldType(v as FieldType)}
          >
            <SelectTrigger className="h-10 w-1/2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="choice">選択肢</SelectItem>
              <SelectItem value="text">テキスト</SelectItem>
              <SelectItem value="number">数値</SelectItem>
              <SelectItem value="date">日付</SelectItem>
              <SelectItem value="phone">電話番号</SelectItem>
              <SelectItem value="email">メール</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Section title="選択肢・アクション">
            {fieldType === "choice" && (
              <div className="space-y-2 mb-4">
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
                      className="h-9 max-w-xs"
                    />
                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setOptions((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="text-muted-foreground hover:text-destructive text-sm"
                        aria-label="選択肢を削除"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-6 flex-wrap">
              <Button
                size="sm"
                onClick={() => setOptions((prev) => [...prev, ""])}
                disabled={fieldType !== "choice"}
                className="bg-blue-500 hover:bg-blue-600 text-white h-9 px-5 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                追加
              </Button>
              <Label className="text-sm bg-muted px-3 py-1.5 rounded-md">
                稼働設定
              </Label>
              <RadioGroup
                value={runMode}
                onValueChange={(v) => v && setRunMode(v as RunMode)}
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
            </div>
          </Section>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center pt-4">
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
