import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserPlus,
  faUserSlash,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { MiniBarChart, MiniLineChart } from "@/components/dashboard/mini-chart";
import { TagBadge } from "@/components/tag-badge";
import { BroadcastStatusBadge } from "@/components/broadcasts/status-badge";
import { KPIS, LAST_30_DAYS } from "@/mocks/timeseries";
import { MOCK_BROADCASTS, MOCK_SCENARIOS, MOCK_TAGS } from "@/mocks/data";

const KPI_ICONS = [faUsers, faUserPlus, faUserSlash, faPaperPlane];

export default function DashboardPage() {
  const recentBroadcasts = [...MOCK_BROADCASTS]
    .sort((a, b) => (b.sentAt ?? b.scheduledAt ?? "").localeCompare(a.sentAt ?? a.scheduledAt ?? ""))
    .slice(0, 4);
  const activeScenarios = MOCK_SCENARIOS.filter((s) => s.isActive);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground mt-1">
          直近 30 日のサマリ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            diff={kpi.diff}
            icon={KPI_ICONS[i]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>友だち増減（直近30日）</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniLineChart
              series={[
                {
                  label: "新規追加",
                  color: "oklch(0.62 0.17 152)",
                  data: LAST_30_DAYS.map((d) => ({
                    date: d.date,
                    value: d.followers,
                  })),
                },
                {
                  label: "ブロック",
                  color: "oklch(0.7 0.18 22)",
                  data: LAST_30_DAYS.map((d) => ({
                    date: d.date,
                    value: d.blocks,
                  })),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>送信メッセージ数</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              color="oklch(0.62 0.17 152)"
              data={LAST_30_DAYS.map((d) => ({
                date: d.date,
                value: d.messages,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>最近の配信</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBroadcasts.map((b) => {
              const tag = MOCK_TAGS.find((t) => t.id === b.targetTagId);
              return (
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
                    {tag && <TagBadge tag={tag} size="sm" />}
                    <BroadcastStatusBadge status={b.status} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>進行中のステップ配信</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeScenarios.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.steps.length} ステップ・配信中 {s.enrolledCount} 人
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 h-5 rounded-full bg-primary/10 text-primary font-medium">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Active
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

