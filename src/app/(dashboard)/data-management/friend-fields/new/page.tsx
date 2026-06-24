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
import { MOCK_FRIEND_FIELD_FOLDERS } from "@/mocks/data";

const MAX_NAME = 20;
type RunMode = "once" | "repeat";

export default function NewFriendFieldPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>("fff_default");
  const [fieldType, setFieldType] = useState<string>("choice");
  const [runMode, setRunMode] = useState<RunMode>("once");

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
          <Select value={folderId} onValueChange={(v) => v && setFolderId(v)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_FRIEND_FIELD_FOLDERS.map((f) => (
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
            onValueChange={(v) => v && setFieldType(v)}
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
            <div className="flex items-center gap-6 flex-wrap">
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white h-9 px-5"
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

      <div className="flex justify-center pt-4">
        <Button
          onClick={() => router.push("/data-management/friend-fields")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-16 font-bold"
        >
          保存
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
