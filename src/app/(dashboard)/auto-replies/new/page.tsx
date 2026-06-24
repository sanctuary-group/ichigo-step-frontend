"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_AUTO_REPLY_FOLDERS } from "@/mocks/data";

type AudienceMode = "active" | "blocked";
type ActionMode = "once" | "repeat";

export default function NewAutoReplyPage() {
  const router = useRouter();
  const [audience, setAudience] = useState<AudienceMode>("active");
  const [folderId, setFolderId] = useState<string>("arf_default");
  const [keywordMode, setKeywordMode] = useState<string>("all");
  const [excludeBracket, setExcludeBracket] = useState(false);
  const [schedule, setSchedule] = useState<string>("always");
  const [action, setAction] = useState<ActionMode>("repeat");

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-lg font-bold tracking-tight">自動応答</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
        <Section title="アクション稼働対象絞り込み">
          <div className="flex items-center gap-6 flex-wrap">
            <RadioGroup
              value={audience}
              onValueChange={(v) => v && setAudience(v as AudienceMode)}
              className="flex items-center gap-6"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="active" />
                有効友だち
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="blocked" />
                ブロックした友だち
              </label>
            </RadioGroup>
            <Button className="ml-auto bg-blue-500 hover:bg-blue-600 text-white h-9 px-6">
              絞込み
            </Button>
          </div>
          <div className="mt-4 rounded-md bg-muted/40 px-4 py-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <div className="text-foreground">対象人数</div>
            <a
              href="#"
              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              2人
            </a>
            <div className="text-foreground">対象条件</div>
            <div></div>
          </div>
        </Section>

        <Section title="フォルダ">
          <Select value={folderId} onValueChange={(v) => v && setFolderId(v)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_AUTO_REPLY_FOLDERS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>

        <Section title="キーワード設定">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
            <Label className="text-sm bg-muted px-3 py-2 rounded-md">
              利用設定
            </Label>
            <Select
              value={keywordMode}
              onValueChange={(v) => v && setKeywordMode(v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのメッセージに反応</SelectItem>
                <SelectItem value="keyword">特定キーワードに反応</SelectItem>
                <SelectItem value="follow">友だち追加時のみ反応</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={excludeBracket}
              onChange={(e) => setExcludeBracket(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            【〇〇】のメッセージには反応させない
          </label>
        </Section>

        <Section title="スケジュール設定">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
            <Label className="text-sm bg-muted px-3 py-2 rounded-md">
              反応設定
            </Label>
            <Select value={schedule} onValueChange={(v) => v && setSchedule(v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">
                  常に（24時間/365日）反応する
                </SelectItem>
                <SelectItem value="business">
                  営業時間内のみ反応する
                </SelectItem>
                <SelectItem value="custom">期間指定で反応する</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title="アクション設定">
          <RadioGroup
            value={action}
            onValueChange={(v) => v && setAction(v as ActionMode)}
            className="flex items-center gap-6 flex-wrap"
          >
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="once" />
              1度のみアクション稼働
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="repeat" />
              何度でもアクション稼働
            </label>
          </RadioGroup>
          <div className="mt-4">
            <Button className="bg-amber-400 hover:bg-amber-500 text-white h-9 px-6 font-bold">
              設定する
            </Button>
          </div>
        </Section>
      </div>

      <div className="flex items-center justify-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => router.push("/auto-replies")}
          className="h-11 px-12"
        >
          戻る
        </Button>
        <Button
          onClick={() => router.push("/auto-replies")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-12 font-bold"
        >
          登録
        </Button>
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
