"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  fetchScenarioSubscribers,
  type ScenarioSubscriber,
  type ScenarioSubscriberStatus,
} from "@/lib/api/scenarios";
import type { MockScenario } from "@/mocks/data";

const STATUS_LABEL: Record<ScenarioSubscriberStatus, string> = {
  active: "稼働中",
  terminated: "停止・失敗",
  completed: "完了",
};

export function SubscribersModal({
  scenario,
  status,
  onClose,
}: {
  scenario: MockScenario;
  status: ScenarioSubscriberStatus;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<ScenarioSubscriber[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchScenarioSubscribers(scenario.id, status)
      .then((d) => {
        if (alive) setFriends(d);
      })
      .catch(() => {
        if (alive) setFriends([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [scenario.id, status]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg max-h-[80vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-bold">
            {scenario.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              購読者（{STATUS_LABEL[status]}）
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              読み込み中...
            </p>
          ) : friends.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              該当する購読者はいません
            </p>
          ) : (
            <ul className="space-y-1">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/40"
                >
                  {f.picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.picture_url}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="size-8 rounded-full bg-muted" />
                  )}
                  <span className="flex-1 text-sm">{f.name}</span>
                  {status === "active" && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {f.current_step_order} ステップ目まで配信
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-6 py-3 text-right">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
