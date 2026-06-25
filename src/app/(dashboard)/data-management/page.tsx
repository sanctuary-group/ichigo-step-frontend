"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAddressBook,
  faTag,
  faChartLine,
  faArrowRight,
  faUsers,
  faUserCheck,
  faPaperPlane,
  faRectangleList,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Card, CardContent } from "@/components/ui/card";
import { fetchDataManagementStats } from "@/lib/api/data-management";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

export default function DataManagementPage() {
  const { currentChannelId } = useAuth();
  const { data: stats } = useResource(
    currentChannelId ? `data-management-stats:${currentChannelId}` : null,
    () => fetchDataManagementStats(),
  );

  const friendsTotal = stats?.friendsTotal ?? 0;
  const friendsActive = stats?.friendsActive ?? 0;
  const tags = stats?.tags ?? 0;
  const broadcastSuccess = stats?.broadcastSuccess ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">データ管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          友だち情報・タグ・分析データへのハブ
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          icon={faUsers}
          label="友だち合計"
          value={friendsTotal.toLocaleString()}
        />
        <Stat
          icon={faUserCheck}
          label="アクティブ友だち"
          value={friendsActive.toLocaleString()}
        />
        <Stat icon={faTag} label="タグ" value={tags.toString()} />
        <Stat
          icon={faPaperPlane}
          label="配信成功"
          value={broadcastSuccess.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <HubCard
          href="/dashboard"
          icon={faChartLine}
          title="ダッシュボード"
          description="友だち増減・配信数の推移グラフを確認"
          subStat="直近 30 日のサマリ"
        />
        <HubCard
          href="/friends"
          icon={faAddressBook}
          title="友だち一覧"
          description="登録された友だちの検索・フィルタ・タグ付与"
          subStat={`${friendsTotal} 名が登録中`}
        />
        <HubCard
          href="/tags"
          icon={faTag}
          title="タグ管理"
          description="タグの作成・編集・削除と色の管理"
          subStat={`${tags} 件のタグ`}
        />
        <HubCard
          href="/data-management/friend-fields"
          icon={faRectangleList}
          title="友だち情報管理"
          description="友だち情報ページや1:1チャットに表示する独自項目を追加"
          subStat="カスタム項目の管理"
        />
      </div>

      <Link href="/data-management/csv" className="block">
        <Card className="p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
              <FontAwesomeIcon icon={faFileCsv} className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">CSV管理</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                友だち・タグ・友だち情報を CSV でエクスポート / インポート
              </div>
            </div>
            <span className="text-xs text-primary flex items-center gap-1">
              CSV管理画面へ
              <FontAwesomeIcon icon={faArrowRight} className="size-3" />
            </span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
          <FontAwesomeIcon icon={icon} className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">{label}</div>
          <div className="text-lg font-bold tabular-nums truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function HubCard({
  href,
  icon,
  title,
  description,
  subStat,
}: {
  href: string;
  icon: IconDefinition;
  title: string;
  description: string;
  subStat: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary">
          <FontAwesomeIcon icon={icon} className="size-5" />
        </div>
        <FontAwesomeIcon
          icon={faArrowRight}
          className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <div className="mt-3 text-base font-bold tracking-tight">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
        {description}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
        {subStat}
      </div>
    </Link>
  );
}
