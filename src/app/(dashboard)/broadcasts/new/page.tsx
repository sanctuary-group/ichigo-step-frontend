"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faClock,
  faCircleQuestion,
  faPlus,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_CHANNELS, MOCK_FRIENDS } from "@/mocks/data";
import { cn } from "@/lib/utils";

type SendTiming = "immediate" | "scheduled";
type TargetMode = "all" | "filter";

const MAX_TITLE = 20;
const ACTIVE_FRIENDS = MOCK_FRIENDS.filter((f) => f.isFollowing).length;

export default function NewBroadcastPage() {
  const [title, setTitle] = useState("");
  const [timing, setTiming] = useState<SendTiming>("scheduled");
  const [date, setDate] = useState("2026-05-26");
  const [time, setTime] = useState("00:48");
  const [target, setTarget] = useState<TargetMode>("all");

  const sender = MOCK_CHANNELS[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* タイトル */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold tracking-tight">メッセージ登録</h1>
        <Link
          href="/broadcasts"
          className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
        >
          メッセージ配信一覧に戻る
        </Link>
      </div>

      <hr className="border-border" />

      {/* 2x2 カードグリッド */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 管理用タイトル */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <Label className="text-sm font-bold">
                管理用タイトル
                <span className="font-normal text-muted-foreground">
                  （友だちには公開されません）
                </span>
                <span className="text-destructive ml-1">*</span>
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {title.length}/{MAX_TITLE}
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE}
              className="mt-3 h-11"
            />
          </CardContent>
        </Card>

        {/* 送信者名 */}
        <Card>
          <CardContent className="p-5">
            <Label className="text-sm font-bold">送信者名</Label>
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={sender.pictureUrl} />
                <AvatarFallback>{sender.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="text-sm flex-1 truncate">{sender.name}</span>
              <Button
                size="sm"
                className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
              >
                設定
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 配信タイミング設定 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <Label className="text-sm font-bold">配信タイミング設定</Label>

            <RadioGroup
              value={timing}
              onValueChange={(v) => v && setTiming(v as SendTiming)}
              className="space-y-3"
            >
              <Label
                className={cn(
                  "flex items-center gap-3 cursor-pointer text-sm",
                  timing === "immediate"
                    ? "text-primary font-bold"
                    : "text-foreground font-normal"
                )}
              >
                <RadioGroupItem value="immediate" />
                メッセージ登録後すぐに配信
              </Label>
              <div className="flex items-center gap-3 flex-wrap">
                <Label
                  className={cn(
                    "flex items-center gap-3 cursor-pointer text-sm",
                    timing === "scheduled"
                      ? "text-primary font-bold"
                      : "text-foreground font-normal"
                  )}
                >
                  <RadioGroupItem value="scheduled" />
                  配信予約
                </Label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={timing !== "scheduled"}
                    className="pl-9 h-10 w-44"
                  />
                </div>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={timing !== "scheduled"}
                    className="pl-9 h-10 w-28"
                  />
                </div>
                <span className="text-sm text-foreground">に配信</span>
              </div>
            </RadioGroup>

            <div className="bg-muted/60 rounded-md px-3 py-2 text-xs text-foreground">
              配信日時は複数登録ができます。最大10個の日時まで登録可能です。
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              配信日時追加
            </button>
          </CardContent>
        </Card>

        {/* 配信先絞込み */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <Label className="text-sm font-bold">配信先絞込み</Label>
              <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                配信数
                <FontAwesomeIcon
                  icon={faCircleQuestion}
                  className="size-3 text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <RadioGroup
                value={target}
                onValueChange={(v) => v && setTarget(v as TargetMode)}
                className="flex items-center gap-4"
              >
                <Label
                  className={cn(
                    "flex items-center gap-2 cursor-pointer text-sm",
                    target === "all"
                      ? "text-primary font-bold"
                      : "text-foreground font-normal"
                  )}
                >
                  <RadioGroupItem value="all" />
                  すべての友だち
                </Label>
                <Label
                  className={cn(
                    "flex items-center gap-2 cursor-pointer text-sm",
                    target === "filter"
                      ? "text-primary font-bold"
                      : "text-foreground font-normal"
                  )}
                >
                  <RadioGroupItem value="filter" />
                  絞り込み
                </Label>
              </RadioGroup>
              <Button
                size="sm"
                disabled={target !== "filter"}
                className="h-9 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
              >
                設定
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline tabular-nums"
                >
                  {ACTIVE_FRIENDS}人(予定)
                </button>
                <Button
                  size="sm"
                  className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  再計算
                </Button>
              </div>
            </div>

            <div className="bg-muted/60 rounded-md px-3 py-3 text-sm text-foreground min-h-20">
              {target === "all" ? "未設定(全員)" : "絞り込み条件を設定してください"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 次へ */}
      <div className="pt-2">
        <Button
          variant="outline"
          disabled={title.length === 0}
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-8 disabled:opacity-50"
        >
          メッセージの登録に進む
          <FontAwesomeIcon icon={faChevronDown} className="size-3 ml-1" />
        </Button>
      </div>

      <Link
        href="/broadcasts"
        className="inline-block text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
      >
        戻る
      </Link>
    </div>
  );
}
