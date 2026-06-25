"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type FriendDetail,
  type ScenarioFolderTree,
  enrollScenario,
  stopScenario,
} from "@/lib/api/friend-detail";

type ScenarioOption = { id: number; name: string };

type StepHistoryRow = {
  id: number;
  delivered_at: string;
  scenario_name: string;
  step_label: string;
  count: number | null;
  preview: string;
};

export function StepDeliveryTab({
  friend,
  scenarioTree,
  onChanged,
}: {
  friend: FriendDetail;
  scenarioTree: ScenarioFolderTree[];
  onChanged: () => void;
}) {
  const scenarioOptions: ScenarioOption[] = scenarioTree.flatMap((f) =>
    f.scenarios.map((s) => ({ id: s.id, name: s.name })),
  );
  // 配信中ステップ / 配信履歴の専用エンドポイントが無いため、
  // 配信中シナリオは active_scenario から、履歴は空で表示する。
  const delivery = friend.active_scenario ?? null;
  const history: StepHistoryRow[] = [];

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [scenarioId, setScenarioId] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const stop = async () => {
    if (!confirm("進行中のステップ配信を強制停止しますか？")) return;
    setProcessing(true);
    try {
      await stopScenario(friend.id);
      onChanged();
    } finally {
      setProcessing(false);
    }
  };

  const enroll = async () => {
    if (!scenarioId) return;
    setProcessing(true);
    try {
      await enrollScenario(friend.id, Number(scenarioId));
      setEnrollOpen(false);
      setScenarioId("");
      onChanged();
    } finally {
      setProcessing(false);
    }
  };

  const stepValue = delivery ? delivery.name : "停止中";
  const nextValue = "停止中";

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold">ステップ配信情報</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEnrollOpen(true)}
              className="h-9 px-4 rounded-md text-sm font-medium bg-amber-400 hover:bg-amber-500 text-white transition-colors"
            >
              手動変更
            </button>
            <button
              type="button"
              onClick={stop}
              disabled={!delivery || processing}
              className="h-9 px-4 rounded-md text-sm font-medium bg-zinc-500 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
            >
              強制停止
            </button>
          </div>
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <th className="w-48 text-left align-top font-medium bg-muted/50 px-4 py-3 border-r border-border">
                  配信中のステップ
                </th>
                <td className="px-4 py-3">{stepValue}</td>
              </tr>
              <tr>
                <th className="w-48 text-left align-top font-medium bg-muted/50 px-4 py-3 border-r border-border">
                  次回配信予定
                </th>
                <td className="px-4 py-3">{nextValue}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold mb-3">配信履歴</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold w-44">
                  配信日時
                </th>
                <th className="px-3 py-2.5 text-left font-bold">ステップ名</th>
                <th className="px-3 py-2.5 text-left font-bold w-20">通数</th>
                <th className="px-3 py-2.5 text-left font-bold w-32">
                  配信ステータス
                </th>
                <th className="px-3 py-2.5 text-left font-bold">メッセージ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  配信履歴はありません。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          全{history.length}件中 1〜{history.length}件を表示中
        </div>
        <div className="flex justify-center mt-3">
          <span className="grid place-items-center size-8 rounded-md bg-primary text-primary-foreground text-sm font-medium">
            1
          </span>
        </div>
      </section>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ステップ配信を手動で開始</DialogTitle>
          </DialogHeader>
          {scenarioOptions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              開始できるシナリオがありません。先に
              <Link
                href="/scenarios"
                className="text-blue-600 dark:text-blue-400 underline mx-1"
              >
                ステップ配信
              </Link>
              でステップ付きのシナリオを作成してください。
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">シナリオ</label>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">選択してください</option>
                  {scenarioOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {delivery && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  既に進行中のステップ配信があります。同じシナリオを選ぶと最初から再開します。
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEnrollOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={enroll} disabled={!scenarioId || processing}>
                  開始する
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
