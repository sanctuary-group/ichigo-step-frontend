"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faUser,
  faList,
  faAngleRight,
  faAngleLeft,
  faPlus,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_SCENARIO_FOLDERS } from "@/mocks/data";
import { cn } from "@/lib/utils";

const MAX_NAME = 20;
type TimingMode = "immediate" | "datetime" | "elapsed";

export default function NewScenarioPage() {
  const [name, setName] = useState("テスト");
  const [folderId, setFolderId] = useState<string>("sfld_default");
  const [pageSize, setPageSize] = useState("50");
  const [timingOpen, setTimingOpen] = useState(false);
  const [timingMode, setTimingMode] = useState<TimingMode>("immediate");
  const [dayOffset, setDayOffset] = useState("0");
  const [timeOfDay, setTimeOfDay] = useState("00:00");
  const [elapsedHours, setElapsedHours] = useState("0");
  const [elapsedMinutes, setElapsedMinutes] = useState("0");

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* トップ: 管理名 + フォルダ + 戻るリンク */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 lg:items-end">
        <div className="space-y-1.5">
          <div className="flex items-end justify-between">
            <Label htmlFor="scenario-name" className="text-sm font-medium">
              管理名
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {name.length}/{MAX_NAME}
            </span>
          </div>
          <Input
            id="scenario-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">フォルダ</Label>
          <Select
            value={folderId}
            onValueChange={(v) => v && setFolderId(v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_SCENARIO_FOLDERS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Link
          href="/scenarios"
          className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline lg:self-center lg:pb-2.5"
        >
          ステップ配信一覧へ戻る
        </Link>
      </div>

      {/* 選択中の配信対象 */}
      <button
        type="button"
        className="inline-flex items-center gap-3 rounded-full bg-muted/40 hover:bg-muted px-1.5 py-1.5 pr-4 transition-colors"
      >
        <span className="grid place-items-center size-8 rounded-full bg-muted-foreground/20">
          <FontAwesomeIcon
            icon={faUser}
            className="size-3.5 text-muted-foreground"
          />
        </span>
        <span className="text-sm text-muted-foreground">選択中の配信対象</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-background border border-border px-3 py-1">
          <span className="text-sm font-bold text-foreground">
            ステップ購読者全員
          </span>
          <FontAwesomeIcon
            icon={faAngleRight}
            className="size-2.5 text-muted-foreground"
          />
        </span>
      </button>

      {/* アクションバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={() => setTimingOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-5"
        >
          <FontAwesomeIcon icon={faClock} className="size-3.5" />
          ＋ 配信タイミング
        </Button>
        <Link
          href="/scenarios/new/preview"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md text-sm font-medium border border-blue-500 text-blue-600 hover:bg-blue-50/40 transition-colors"
        >
          <FontAwesomeIcon icon={faList} className="size-3.5" />
          一括プレビュー
        </Link>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">表示件数:</span>
          <Select value={pageSize} onValueChange={(v) => v && setPageSize(v)}>
            <SelectTrigger className="h-10 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25件</SelectItem>
              <SelectItem value="50">50件</SelectItem>
              <SelectItem value="100">100件</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10">
            一括操作 <FontAwesomeIcon icon={faAngleRight} className="size-2.5 ml-1" />
          </Button>
          <span className="text-muted-foreground tabular-nums">
            0~0/ 1件表示
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="前へ"
          >
            <FontAwesomeIcon icon={faAngleLeft} className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="次へ"
          >
            <FontAwesomeIcon icon={faAngleRight} className="size-3" />
          </Button>
        </div>
      </div>

      <hr className="border-border" />

      {/* 次の配信タイミングを追加 */}
      <Button
        variant="outline"
        onClick={() => setTimingOpen(true)}
        className="h-10 border-blue-500 text-blue-600 hover:text-blue-600 hover:bg-blue-50/40 w-auto"
      >
        <FontAwesomeIcon icon={faPlus} className="size-3" />
        次の配信タイミングを追加
      </Button>

      {/* 余白（配信タイミング未登録の空状態） */}
      <div className="min-h-40" />

      {/* 戻る */}
      <Link
        href="/scenarios"
        className="inline-flex items-center justify-center h-9 px-6 rounded-md border border-border bg-background text-sm text-muted-foreground hover:bg-muted"
      >
        戻る
      </Link>

      <Dialog open={timingOpen} onOpenChange={setTimingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogTitle className="text-center text-lg font-bold">
            配信タイミング選択
          </DialogTitle>
          <div className="text-center -mt-2">
            <a
              href="#"
              className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              配信タイミングの違いがよく分からない方はこちら
            </a>
          </div>

          <RadioGroup
            value={timingMode}
            onValueChange={(v) => v && setTimingMode(v as TimingMode)}
            className="space-y-3 pt-3"
          >
            {/* ステップ開始直後 */}
            <label
              className={cn(
                "block p-4 rounded-lg border-2 cursor-pointer transition-colors",
                timingMode === "immediate"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="immediate" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">
                    ステップ開始直後
                  </div>
                  <p className="text-sm text-foreground mt-1.5">
                    <a
                      href="#"
                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                    >
                      ステップ開始時のトリガー
                    </a>
                    が稼働したらすぐに送信します
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    ※友だち追加時ではありません。友だち追加時にステップを開始する方法は{" "}
                    <a
                      href="#"
                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                    >
                      こちら
                    </a>
                  </p>
                </div>
              </div>
            </label>

            {/* 日時で指定 */}
            <label
              className={cn(
                "block p-4 rounded-lg border-2 cursor-pointer transition-colors",
                timingMode === "datetime"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="datetime" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">
                    日時で指定
                  </div>
                  <p className="text-sm text-foreground mt-1.5">
                    ステップ開始時からの経過日数と時間で配信タイミングを指定します
                  </p>
                  <div className="mt-3 rounded-md bg-muted/60 p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-bold">ステップ開始から</span>
                      <Input
                        type="number"
                        min={0}
                        value={dayOffset}
                        onChange={(e) => setDayOffset(e.target.value)}
                        onClick={() => setTimingMode("datetime")}
                        disabled={timingMode !== "datetime"}
                        className="w-20 h-9 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span>日後の</span>
                      <Input
                        type="time"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                        onClick={() => setTimingMode("datetime")}
                        disabled={timingMode !== "datetime"}
                        className="h-9 w-32"
                      />
                      <span>に配信する</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ※ステップ開始当日に送信する場合は「0日後」を選択してください
                    </div>
                  </div>
                </div>
              </div>
            </label>

            {/* 経過時間で指定 */}
            <label
              className={cn(
                "block p-4 rounded-lg border-2 cursor-pointer transition-colors",
                timingMode === "elapsed"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="elapsed" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">
                    経過時間で指定
                  </div>
                  <p className="text-sm text-foreground mt-1.5">
                    ステップ開始時からの72時間以内の経過時間を指定します
                  </p>
                  <div className="mt-3 rounded-md bg-muted/60 p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-bold">ステップ開始から</span>
                      <Input
                        type="number"
                        min={0}
                        max={72}
                        value={elapsedHours}
                        onChange={(e) => setElapsedHours(e.target.value)}
                        onClick={() => setTimingMode("elapsed")}
                        disabled={timingMode !== "elapsed"}
                        className="w-20 h-9 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="font-bold">時間</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={elapsedMinutes}
                        onChange={(e) => setElapsedMinutes(e.target.value)}
                        onClick={() => setTimingMode("elapsed")}
                        disabled={timingMode !== "elapsed"}
                        className="w-20 h-9 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span>分後に配信する</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ※設定できるのは72時間00分以内です
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </RadioGroup>

          <div className="pt-4 text-center">
            <div className="text-sm text-foreground inline-flex items-center gap-1.5">
              登録できる配信タイミング
              <FontAwesomeIcon
                icon={faCircleQuestion}
                className="size-3.5 text-muted-foreground"
              />
            </div>
            <div className="text-sm text-foreground mt-1">
              残り <span className="text-base font-bold">0</span>/100
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-12 h-11"
              onClick={() => setTimingOpen(false)}
            >
              決定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
