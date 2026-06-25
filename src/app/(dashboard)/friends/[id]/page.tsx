"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faBan, faTrashCan, faUser } from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchTags } from "@/lib/api/tags";
import {
  fetchFriendDetail,
  fetchFriendFieldDefs,
  fetchFriendFieldValues,
  fetchFriendMessageCount,
  fetchScenarioTree,
  deleteFriend,
} from "@/lib/api/friend-detail";
import { toggleFriendHidden } from "@/lib/api/friends";
import { BasicInfoTab } from "@/components/friends/basic-info-tab";
import { StepDeliveryTab } from "@/components/friends/step-delivery-tab";
import { TagsTab } from "@/components/friends/tags-tab";
import { friendDisplayName } from "@/components/friends/friend-show-helpers";

const TABS = [
  "基本情報",
  "ステップ配信",
  "リマインド配信",
  "タグ",
  "イベント予約",
  "購入履歴",
  "フォーム回答",
] as const;
type TabKey = (typeof TABS)[number];

export default function FriendShowPage() {
  const params = useParams();
  const id = String(params.id);
  const friendId = Number(id);
  const router = useRouter();
  const { currentChannelId } = useAuth();

  const [tab, setTab] = useState<TabKey>("基本情報");

  const {
    data: friend,
    isLoading,
    error,
    mutate: refreshFriend,
  } = useResource(
    currentChannelId ? `friend-show:${currentChannelId}:${friendId}` : `friend-show:${friendId}`,
    () => fetchFriendDetail(friendId),
  );

  const { data: fieldDefs } = useResource(
    currentChannelId ? `friend-fields:${currentChannelId}` : "friend-fields",
    () => fetchFriendFieldDefs(),
  );
  const { data: fieldValues, mutate: refreshValues } = useResource(
    `friend-field-values:${friendId}`,
    () => fetchFriendFieldValues(friendId),
  );
  const { data: messageCount } = useResource(
    `friend-message-count:${friendId}`,
    () => fetchFriendMessageCount(friendId),
  );
  const { data: allTags } = useResource(
    currentChannelId ? `tags:${currentChannelId}` : "tags",
    () => fetchTags(),
  );
  const { data: scenarioTree } = useResource("scenario-tree", () =>
    fetchScenarioTree(),
  );

  if (isLoading || !friend) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
        {error ? "読み込みに失敗しました" : "読み込み中..."}
      </div>
    );
  }

  const name = friendDisplayName(friend);

  const block = async () => {
    const msg = friend.is_hidden
      ? "この友だちを再表示しますか？"
      : "この友だちをブロック（非表示）しますか？";
    if (!confirm(msg)) return;
    await toggleFriendHidden(id);
    refreshFriend();
  };

  const remove = async () => {
    if (
      !confirm(
        `「${name}」を削除しますか？\nトーク履歴・友だち情報もすべて削除され、元に戻せません。`,
      )
    )
      return;
    await deleteFriend(friendId);
    router.push("/friends");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      <h1 className="text-xl font-bold tracking-tight">友だち情報詳細</h1>

      {/* ヘッダーカード */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 sm:px-6 py-4 flex items-center gap-4">
        <div className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full size-12">
          {friend.picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={friend.picture_url}
              alt={name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="size-full bg-zinc-400 bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faUser} className="size-1/2" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold truncate">{name}</div>
          {friend.is_hidden && (
            <span className="text-[11px] text-muted-foreground">非表示中</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/chat?friend=${friend.id}`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
          >
            <FontAwesomeIcon icon={faComments} className="size-3.5" />
            チャット
          </Link>
          <button
            type="button"
            onClick={block}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-zinc-500 hover:bg-zinc-600 text-white transition-colors"
          >
            <FontAwesomeIcon icon={faBan} className="size-3.5" />
            {friend.is_hidden ? "再表示" : "ブロック"}
          </button>
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
            削除
          </button>
        </div>
      </div>

      {/* タブバー */}
      <div className="border-b border-border flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "基本情報" && (
        <BasicInfoTab
          friend={friend}
          fields={fieldDefs ?? []}
          values={fieldValues ?? []}
          messageCount={messageCount ?? 0}
          onSaved={() => {
            refreshFriend();
            refreshValues();
          }}
        />
      )}

      {tab === "ステップ配信" && (
        <StepDeliveryTab
          friend={friend}
          scenarioTree={scenarioTree ?? []}
          onChanged={refreshFriend}
        />
      )}

      {tab === "タグ" && (
        <TagsTab friend={friend} allTags={allTags ?? []} onChanged={refreshFriend} />
      )}

      {tab !== "基本情報" && tab !== "タグ" && tab !== "ステップ配信" && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          「{tab}」は準備中です。
        </div>
      )}
    </div>
  );
}
