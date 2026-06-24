"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faAddressCard,
  faTag as faTagSolid,
  faNoteSticky,
  faPenToSquare,
  faArrowsRotate,
  faStairs,
  faLayerGroup,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tag-badge";
import {
  MOCK_TAGS,
  type MockFriend,
  getScenarioById,
} from "@/mocks/data";
import { formatDateTime } from "@/lib/time";

export function RightInfoPanel({
  friend,
  mobileVisible = false,
  onBack,
}: {
  friend: MockFriend;
  mobileVisible?: boolean;
  onBack?: () => void;
}) {
  const tags = MOCK_TAGS.filter((t) => friend.tagIds.includes(t.id));
  const scenario = getScenarioById(friend.scenarioId);

  return (
    <aside
      className={`${mobileVisible ? "flex" : "hidden"} xl:flex w-full xl:w-80 shrink-0 flex-col border-l border-border bg-background`}
    >
      <div className="flex items-center gap-2 h-12 px-3 border-b border-border xl:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onBack}
          aria-label="トークに戻る"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-4" />
        </Button>
        <div className="text-sm font-medium">友だち情報</div>
      </div>
      <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-3 grid grid-cols-4 h-9 bg-muted/60 w-auto">
          <TabsTrigger value="basic" aria-label="基本情報">
            <FontAwesomeIcon icon={faDatabase} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="profile" aria-label="友だち情報">
            <FontAwesomeIcon icon={faAddressCard} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="tags" aria-label="タグ">
            <FontAwesomeIcon icon={faTagSolid} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="memo" aria-label="メモ">
            <FontAwesomeIcon icon={faNoteSticky} className="size-3.5" />
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <TabsContent value="basic" className="space-y-5">
            <SectionTitle>基本情報</SectionTitle>

            <InfoRow label="LINE名" action={<RefreshIconBtn />}>
              <div className="text-sm">{friend.displayName}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {formatDateTime(friend.followedAt)} 新規友だち
              </div>
            </InfoRow>

            <InfoRow label="システム表示名" action={<EditIconBtn />}>
              <div className="text-sm text-muted-foreground">—</div>
            </InfoRow>

            <InfoRow label="流入経路">
              <div className="text-sm">{friend.source}</div>
            </InfoRow>

            <InfoRow
              label="ステップ配信"
              icon={faStairs}
              action={<EditIconBtn />}
            >
              <div className="text-sm">
                {scenario ? scenario.name : "配信中のステップなし"}
              </div>
              {friend.scenarioStepLabel && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {friend.scenarioStepLabel}
                </div>
              )}
            </InfoRow>

            <InfoRow
              label="リッチメニュー"
              icon={faLayerGroup}
              action={<EditIconBtn />}
            >
              <div className="text-sm text-muted-foreground">
                MVP 後に対応予定
              </div>
            </InfoRow>
          </TabsContent>

          <TabsContent value="profile" className="space-y-3">
            <SectionTitle>友だち情報</SectionTitle>
            <InfoRow label="フォロー状態">
              <div className="text-sm">
                {friend.isFollowing ? "アクティブ" : "ブロック済み"}
              </div>
            </InfoRow>
            <InfoRow label="LINE userId">
              <div className="text-xs font-mono text-muted-foreground">
                Uxxxx...{friend.id}
              </div>
            </InfoRow>
          </TabsContent>

          <TabsContent value="tags" className="space-y-3">
            <SectionTitle>タグ</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  タグはまだありません
                </div>
              ) : (
                tags.map((t) => <TagBadge key={t.id} tag={t} />)
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              タグを追加
            </Button>
          </TabsContent>

          <TabsContent value="memo" className="space-y-3">
            <SectionTitle>メモ</SectionTitle>
            <div className="text-xs text-muted-foreground italic">
              メモはまだありません
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold text-foreground/90">{children}</div>
  );
}

function InfoRow({
  label,
  icon,
  action,
  children,
}: {
  label: string;
  icon?: typeof faStairs;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            className="size-3 text-muted-foreground"
          />
        )}
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EditIconBtn() {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-foreground"
    >
      <FontAwesomeIcon icon={faPenToSquare} className="size-3" />
    </Button>
  );
}

function RefreshIconBtn() {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-foreground"
    >
      <FontAwesomeIcon icon={faArrowsRotate} className="size-3" />
    </Button>
  );
}
