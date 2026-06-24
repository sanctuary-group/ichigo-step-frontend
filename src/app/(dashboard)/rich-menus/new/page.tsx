"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faCloudArrowUp,
  faImage,
  faLightbulb,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_RICH_MENU_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_NAME = 50;

type StepId = 1 | 2 | 3 | 4;
const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: "画像設定" },
  { id: 2, label: "タップエリア" },
  { id: 3, label: "タップ時アクション" },
  { id: 4, label: "詳細設定" },
];

export default function NewRichMenuPage() {
  const [name, setName] = useState("テスト");
  const [folderId, setFolderId] = useState<string>("rmf_default");
  const [currentStep] = useState<StepId>(1);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 bg-background border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_320px] gap-6 items-end">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Link
                href="/rich-menus"
                className="hover:text-foreground hover:underline"
              >
                TOP
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
              <span>リッチメニュー 編集</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-1">
              リッチメニュー 編集
            </h1>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-end justify-between">
              <Label htmlFor="rm-edit-name" className="text-xs font-bold">
                管理名
              </Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {name.length} / {MAX_NAME}
              </span>
            </div>
            <Input
              id="rm-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">フォルダ</Label>
            <Select
              value={folderId}
              onValueChange={(v) => v && setFolderId(v)}
            >
              <SelectTrigger className="h-10 w-full">
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
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-border bg-background py-8 px-6">
          <ol className="space-y-0">
            {STEPS.map((step, i) => {
              const active = step.id === currentStep;
              const done = step.id < currentStep;
              const last = i === STEPS.length - 1;
              return (
                <li key={step.id} className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-7 rounded-full grid place-items-center text-xs font-bold shrink-0 tabular-nums",
                        active && "bg-primary text-primary-foreground",
                        done && "bg-primary/80 text-primary-foreground",
                        !active && !done && "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.id}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        active && "font-bold",
                        !active && !done && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!last && (
                    <div className="ml-3 my-1 h-6 w-px bg-border" />
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="flex-1 overflow-y-auto bg-background">
          <div className="px-8 py-6 bg-muted/40 border-b border-border">
            <h2 className="text-sm font-bold">
              STEP① リッチメニュー画像の登録・変更
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 px-8 py-8">
            <PhonePreview />

            <div className="space-y-5">
              <p className="text-center text-sm font-medium">
                リッチメニューとして表示する画像を設定します
              </p>

              <div className="rounded-md border-2 border-dashed border-border bg-muted/20 p-8 text-center hover:bg-muted/40 transition-colors cursor-pointer">
                <FontAwesomeIcon
                  icon={faCloudArrowUp}
                  className="size-10 text-muted-foreground/70 mb-3"
                />
                <div className="text-sm">
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    クリック
                  </a>
                  {" "}または ファイルをドラッグ＆ドロップ
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  ファイル形式 : .jpg .png
                </div>
              </div>

              <div className="relative rounded-md border-2 border-primary/60 p-5">
                <div className="absolute -top-3 left-4 inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-bold">
                  <FontAwesomeIcon icon={faLightbulb} className="size-3" />
                  ヒント
                </div>
                <p className="text-sm mt-1">
                  アップロードできる画像のサイズは
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    以下の2パターンのみ
                  </span>
                  です。
                </p>
                <p className="text-sm">
                  画像は
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline mx-1"
                  >
                    Canva©
                  </a>
                  などのサービスで簡単に作成ができます。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
                  <SizePreview cols={3} rows={2} label="横) 2,500px　縦)1,686px" />
                  <SizePreview cols={3} rows={1} label="横) 2,500px　縦)843px" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border gap-3">
        <div className="text-sm flex items-center gap-1.5">
          編集内容の友だちへの反映タイミング
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="size-3.5 text-muted-foreground"
          />
        </div>
        <Button
          variant="outline"
          disabled
          className="h-10 px-10 disabled:opacity-50"
        >
          次へ &gt;
        </Button>
      </div>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="mx-auto w-[260px] rounded-[2.5rem] border-[10px] border-foreground/90 bg-background overflow-hidden shadow-xl">
      <div className="text-center text-[10px] text-muted-foreground py-1 bg-foreground/90 text-background">
        プレビュー
      </div>
      <div className="aspect-[9/16] bg-sky-200/60 relative grid grid-rows-[1fr_auto]">
        <div></div>
        <div className="bg-muted/80 px-2 py-4">
          <div className="grid place-items-center text-muted-foreground gap-2">
            <FontAwesomeIcon icon={faImage} className="size-7 opacity-50" />
            <div className="text-[11px]">画像が設定されていません</div>
          </div>
          <div className="text-[10px] text-center mt-3 text-muted-foreground">
            ◀ お問合せ　/　メニュー ▲
          </div>
        </div>
      </div>
    </div>
  );
}

function SizePreview({
  cols,
  rows,
  label,
}: {
  cols: number;
  rows: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div
        className="grid gap-1 aspect-[5/3]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div
            key={i}
            className="bg-primary/15 grid place-items-center text-[9px] text-primary"
          >
            <FontAwesomeIcon icon={faImage} className="size-4 opacity-70" />
          </div>
        ))}
      </div>
      <div className="text-xs font-bold text-center">{label}</div>
    </div>
  );
}
