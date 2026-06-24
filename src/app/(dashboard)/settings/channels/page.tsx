"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faPlus,
  faPenToSquare,
  faTrash,
  faEye,
  faEyeSlash,
  faPlug,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_CHANNELS } from "@/mocks/data";

export default function ChannelsSettingsPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">LINE チャネル</h2>
          <p className="text-xs text-muted-foreground mt-1">
            複数の LINE 公式アカウントを束ねて管理できます
          </p>
        </div>
        <Button onClick={() => setShowAdd((v) => !v)}>
          <FontAwesomeIcon icon={faPlus} className="size-3.5" />
          チャネルを追加
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_CHANNELS.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary font-bold">
                {c.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.basicId}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary">
                <FontAwesomeIcon icon={faCircleCheck} className="size-3.5" />
                接続中
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="編集"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="削除"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAdd && <AddChannelCard onClose={() => setShowAdd(false)} />}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <div className="font-medium text-foreground">
            Webhook URL（Phase B で本物の API を実装後に有効化）
          </div>
          <code className="block bg-muted/60 rounded p-2 font-mono text-[11px]">
            POST https://api.ichigo-step.com/v1/line/webhook/{"{channelId}"}
          </code>
          <p>
            LINE Developers の Messaging API 設定で上記 URL を Webhook URL として登録します
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AddChannelCard({ onClose }: { onClose: () => void }) {
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>新しいチャネルを追加</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ch-name">表示名（社内管理用）</Label>
          <Input id="ch-name" placeholder="例: 株式会社サンプル 公式LINE" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ch-id">Channel ID</Label>
            <Input id="ch-id" placeholder="1234567890" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ch-basic">Basic ID（@xxx）</Label>
            <Input id="ch-basic" placeholder="@example" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ch-secret">Channel Secret</Label>
          <div className="relative">
            <Input
              id="ch-secret"
              type={showSecret ? "text" : "password"}
              placeholder="LINE Developers Console から取得"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="表示切替"
            >
              <FontAwesomeIcon
                icon={showSecret ? faEyeSlash : faEye}
                className="size-3.5"
              />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ch-token">Channel Access Token</Label>
          <div className="relative">
            <Input
              id="ch-token"
              type={showToken ? "text" : "password"}
              placeholder="長期トークン"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="表示切替"
            >
              <FontAwesomeIcon
                icon={showToken ? faEyeSlash : faEye}
                className="size-3.5"
              />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ch-liff">LIFF ID（任意）</Label>
          <Input id="ch-liff" placeholder="2000xxxxxx-xxxxxxxx" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="outline" disabled>
            <FontAwesomeIcon icon={faPlug} className="size-3.5" />
            接続テスト（モック）
          </Button>
          <Button onClick={onClose}>登録</Button>
        </div>
      </CardContent>
    </Card>
  );
}
