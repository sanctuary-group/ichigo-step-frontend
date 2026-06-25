"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateRight,
  faShieldHalved,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RiskBadge } from "@/components/ban-detection/risk-badge";
import { cn } from "@/lib/utils";
import { runHealthCheck, setFallbackChannel } from "@/lib/api/ban-detection";
import type { ChannelHealth, ChannelHealthLog } from "@/types/ban-detection";

export function ChannelHealthCard({
  channel,
  logs,
  candidates,
  fallbackOptions,
  onOpenSwitch,
  onMutate,
}: {
  channel: ChannelHealth;
  logs: ChannelHealthLog[];
  candidates: ChannelHealth[];
  fallbackOptions: ChannelHealth[];
  onOpenSwitch: (from: ChannelHealth) => void;
  onMutate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const runCheck = () => {
    void runHealthCheck(channel.id).then(onMutate);
  };

  const setFallback = (fallbackId: number | null) => {
    void setFallbackChannel(channel.id, fallbackId).then(onMutate);
  };

  const toggleActive = () => {
    // 単純な activate/deactivate は ChannelController.update を使う想定だが、
    // /ban-detection からは「切替」フローで対応するため is_active を反転するエンドポイントは設けない。
    // 代わりに「切替」ボタンを推奨。スイッチ操作時は警告のみ。
    if (!channel.is_active && candidates.length === 0) {
      alert("有効化するには別のチャネルが必要です");
      return;
    }
    if (channel.is_active) {
      alert(
        "「切替」ボタンから予備チャネルに移行してください (BAN 検知では単独の停止操作はサポート外)",
      );
      return;
    }
    // 予備 → アクティブ化 だけ許可 (切替 from は別途指定)
    onOpenSwitch(channel);
  };

  const lastChecked = channel.last_health_checked_at
    ? new Date(channel.last_health_checked_at).toLocaleString("ja-JP")
    : "未チェック";

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="size-4 text-muted-foreground"
              />
              <span className="font-bold text-sm truncate">
                {channel.name}
              </span>
              <RiskBadge risk={channel.risk_level} />
              {channel.is_active ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  アクティブ
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold bg-muted text-muted-foreground border-border">
                  予備
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {channel.basic_id || channel.channel_id}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={channel.is_active}
              onCheckedChange={toggleActive}
              aria-label="アクティブ切替"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          最終チェック: <span className="tabular-nums">{lastChecked}</span>
        </div>

        {channel.last_health_error && (
          <div className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-md">
            {channel.last_health_error}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runCheck}
            className="h-9"
          >
            <FontAwesomeIcon icon={faRotateRight} className="size-3" />
            今すぐチェック
          </Button>
          {channel.is_active && candidates.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenSwitch(channel)}
              className="h-9 bg-blue-500 hover:bg-blue-600 text-white"
            >
              予備チャネルに切替...
            </Button>
          )}
        </div>

        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
          <div className="text-xs font-bold flex items-center gap-1.5">
            <FontAwesomeIcon
              icon={faShieldHalved}
              className="size-3 text-muted-foreground"
            />
            BAN時の自動切替先（予備チャネル）
          </div>
          <select
            value={channel.fallback_channel_id ?? ""}
            onChange={(e) =>
              setFallback(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">未設定（自動切替しない）</option>
            {fallbackOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.basic_id ? ` (${c.basic_id})` : ""}
              </option>
            ))}
          </select>
          {channel.friend_add_url && (
            <p className="text-[11px] text-muted-foreground break-all">
              配布用URL:{" "}
              <span className="font-mono">{channel.friend_add_url}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <FontAwesomeIcon
            icon={expanded ? faChevronUp : faChevronDown}
            className="size-2.5"
          />
          直近 10 件のヘルスログ ({logs.length})
        </button>

        {expanded && (
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">時刻</th>
                  <th className="px-3 py-2 text-center font-bold w-16">HTTP</th>
                  <th className="px-3 py-2 text-center font-bold w-20">
                    リスク
                  </th>
                  <th className="px-3 py-2 text-left font-bold">エラー</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-muted-foreground"
                    >
                      ログがありません
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className={cn(
                        "border-t border-border",
                        log.risk_level === "danger" && "bg-destructive/5",
                      )}
                    >
                      <td className="px-3 py-2 tabular-nums">
                        {new Date(log.checked_at).toLocaleString("ja-JP")}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        {log.http_status ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <RiskBadge risk={log.risk_level} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {log.error_message ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
