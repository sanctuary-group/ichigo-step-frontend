"use client";

import {
  faUsers,
  faUserPlus,
  faUserSlash,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { MiniBarChart, MiniLineChart } from "@/components/dashboard/mini-chart";
import { TagBadge } from "@/components/tag-badge";
import { BroadcastStatusBadge } from "@/components/broadcasts/status-badge";
import { fetchDashboardStats } from "@/lib/api/dashboard";
import { useResource } from "@/lib/api/use-resource";

const KPI_ICONS: IconDefinition[] = [
  faUsers,
  faUserPlus,
  faUserSlash,
  faPaperPlane,
];

const PRIMARY = "oklch(0.62 0.17 152)";
const DANGER = "oklch(0.7 0.18 22)";

export default function DashboardPage() {
  const { data } = useResource("dashboard-stats", fetchDashboardStats);
  const kpis = data?.kpis ?? [];
  const followerSeries = data?.followerSeries ?? [];
  const blockSeries = data?.blockSeries ?? [];
  const messageSeries = data?.messageSeries ?? [];
  const recentBroadcasts = data?.recentBroadcasts ?? [];
  const activeScenarios = data?.activeScenarios ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground mt-1">直近 30 日のサマリ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            diff={kpi.diff ?? undefined}
            icon={KPI_ICONS[i]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle>友だち増減（直近30日）</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniLineChart
              series={[
                { label: "新規追加", color: PRIMARY, data: followerSeries },
                { label: "ブロック", color: DANGER, data: blockSeries },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>送信メッセージ数</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart color={PRIMARY} data={messageSeries} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>最近の配信</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBroadcasts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                配信履歴がありません。
              </p>
            ) : (
              recentBroadcasts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {b.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {b.preview}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.tag && <TagBadge tag={b.tag} size="sm" />}
                    <BroadcastStatusBadge status={b.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>進行中のステップ配信</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeScenarios.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                稼働中のシナリオがありません。
              </p>
            ) : (
              activeScenarios.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.steps_count} ステップ・配信中 {s.enrolled_count} 人
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 h-5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Active
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
