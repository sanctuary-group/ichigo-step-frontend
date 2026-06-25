"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChannelHealthCard } from "@/components/ban-detection/channel-health-card";
import { RiskBadge } from "@/components/ban-detection/risk-badge";
import {
  fetchBanDetection,
  runHealthCheck,
  switchActiveChannel,
} from "@/lib/api/ban-detection";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import type { ChannelHealth, ChannelHealthLog } from "@/types/ban-detection";

export default function BanDetectionPage() {
  const { currentChannelId } = useAuth();
  const [switchDialog, setSwitchDialog] = useState<ChannelHealth | null>(null);

  const { data, mutate } = useResource(
    currentChannelId ? `ban-detection:${currentChannelId}` : null,
    fetchBanDetection,
  );

  const channelHealth = data?.channels ?? [];
  const logsByChannel = data?.logsByChannel ?? {};
  const autoSwitch = data?.autoSwitch ?? { enabled: false, danger_streak: 2 };

  const runCheckAll = () => {
    void runHealthCheck().then(mutate);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              BAN 検知 & 自動アカウント切替
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              各 LINE
              チャネルの健全性を毎分監視し、BAN
              検知時にはあらかじめ設定した予備チャネルへ自動で切り替えます。
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={runCheckAll}
            className="h-10"
          >
            <FontAwesomeIcon icon={faRotateRight} className="size-3.5" />
            今すぐ全部チェック
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          <span>凡例:</span>
          <span className="inline-flex items-center gap-1.5">
            <RiskBadge risk="normal" />
            正常
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RiskBadge risk="warning" />
            レートリミット / 一時エラー
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RiskBadge risk="danger" />
            BAN / トークン無効
          </span>
        </div>

        <div
          className={
            autoSwitch.enabled
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40"
              : "rounded-md border border-border bg-muted/40 px-4 py-3 text-sm"
          }
        >
          {autoSwitch.enabled ? (
            <span className="text-emerald-800 dark:text-emerald-200">
              <span className="font-bold">自動切替: 有効</span> — danger を{" "}
              <span className="font-bold tabular-nums">
                {autoSwitch.danger_streak}
              </span>{" "}
              回連続で検知すると、各チャネルに設定した予備チャネルへ自動で切り替えます。配布済みの友だち追加URL / QR
              は予備アカウントへ自動で誘導されます。
            </span>
          ) : (
            <span className="text-muted-foreground">
              <span className="font-bold">自動切替: 無効</span> — danger
              検知時は通知のみ。下の「予備チャネルに切替」ボタンから手動で切り替えてください。
            </span>
          )}
        </div>

        <hr className="border-border" />

        {channelHealth.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            LINE
            チャネルが登録されていません。設定 → LINE
            チャネルから登録してください。
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {channelHealth.map((c) => {
              const candidates = channelHealth.filter(
                (other) => other.id !== c.id && !other.is_active,
              );
              const logs = (logsByChannel[String(c.id)] ??
                []) as ChannelHealthLog[];
              const fallbackOptions = channelHealth.filter(
                (other) => other.id !== c.id,
              );
              return (
                <ChannelHealthCard
                  key={c.id}
                  channel={c}
                  logs={logs}
                  candidates={candidates}
                  fallbackOptions={fallbackOptions}
                  onOpenSwitch={(from) => setSwitchDialog(from)}
                  onMutate={mutate}
                />
              );
            })}
          </div>
        )}
      </div>

      <SwitchDialog
        channel={switchDialog}
        candidates={
          switchDialog
            ? channelHealth.filter(
                (c) => c.id !== switchDialog.id && !c.is_active,
              )
            : []
        }
        onClose={() => setSwitchDialog(null)}
        onMutate={mutate}
      />
    </>
  );
}

function SwitchDialog({
  channel,
  candidates,
  onClose,
  onMutate,
}: {
  channel: ChannelHealth | null;
  candidates: ChannelHealth[];
  onClose: () => void;
  onMutate: () => void;
}) {
  const [targetId, setTargetId] = useState<number | null>(
    candidates[0]?.id ?? null,
  );
  const [submitting, setSubmitting] = useState(false);

  if (!channel) return null;

  const submit = () => {
    if (!targetId) return;
    setSubmitting(true);
    switchActiveChannel(channel.id, targetId)
      .then(() => {
        onMutate();
        onClose();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>アクティブチャネル切替</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground">
              現在のアクティブチャネル:
            </span>
            <div className="font-bold">{channel.name}</div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold">切替先</Label>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                予備のチャネルがありません。設定 → LINE
                チャネルから先に登録してください。
              </p>
            ) : (
              <select
                value={targetId ?? ""}
                onChange={(e) => setTargetId(Number(e.target.value))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.basic_id ? ` (${c.basic_id})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            実行すると「{channel.name}」を停止し、選択したチャネルを有効化します。新規の配信・シナリオ・あいさつメッセージは有効化されたチャネルから送信されるようになります。既存友だち情報はそのまま残ります。
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!targetId || submitting}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {submitting ? "実行中..." : "切替を実行"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
