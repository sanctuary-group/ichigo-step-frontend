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
  faFileExport,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Card, CardContent } from "@/components/ui/card";
import { MOCK_FRIENDS, MOCK_TAGS, MOCK_BROADCASTS } from "@/mocks/data";

export default function DataManagementPage() {
  const activeFriends = MOCK_FRIENDS.filter((f) => f.isFollowing).length;
  const monthlyMessages = MOCK_BROADCASTS.reduce(
    (s, b) => s + b.successCount,
    0
  );

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
          value={MOCK_FRIENDS.length.toLocaleString()}
        />
        <Stat
          icon={faUserCheck}
          label="アクティブ友だち"
          value={activeFriends.toLocaleString()}
        />
        <Stat icon={faTag} label="タグ" value={MOCK_TAGS.length.toString()} />
        <Stat
          icon={faPaperPlane}
          label="配信成功"
          value={monthlyMessages.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HubCard
          href="/friends"
          icon={faAddressBook}
          title="友だち一覧"
          description="登録された友だちの検索・フィルタ・タグ付与"
          subStat={`${MOCK_FRIENDS.length} 名が登録中`}
        />
        <HubCard
          href="/tags"
          icon={faTag}
          title="タグ管理"
          description="タグの作成・編集・削除と色の管理"
          subStat={`${MOCK_TAGS.length} 件のタグ`}
        />
        <HubCard
          href="/dashboard"
          icon={faChartLine}
          title="ダッシュボード"
          description="友だち増減・配信数の推移グラフを確認"
          subStat="直近 30 日のサマリ"
        />
      </div>

      <Card className="p-4">
        <CardContent className="p-0 flex items-center gap-4">
          <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <FontAwesomeIcon icon={faFileExport} className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">データエクスポート</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              友だち・タグ・配信ログを CSV でダウンロード（モック）
            </div>
          </div>
          <button
            type="button"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            エクスポート画面へ
            <FontAwesomeIcon icon={faArrowRight} className="size-3" />
          </button>
        </CardContent>
      </Card>
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
