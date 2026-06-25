"use client";

import { faUserSlash } from "@fortawesome/free-solid-svg-icons";

import { GreetingForm, type GreetingTheme } from "@/components/greetings/greeting-form";
import { fetchRawGreeting } from "@/lib/api/greetings";
import { fetchFormChannels } from "@/lib/api/broadcast-form-data";
import {
  fetchBuilderOptions,
  fetchTags,
  fetchChatStatuses,
} from "@/lib/api/builder-options";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

const theme: GreetingTheme = {
  badgeLabel: "ブロック解除時用",
  badgeClass: "bg-orange-500 text-white",
  icon: faUserSlash,
  iconColorClass: "text-orange-500",
  description: (
    <>
      このページで設定したメッセージ・アクションは{" "}
      <span className="font-bold">友だちのブロック解除時のみ</span> 稼働します。
    </>
  ),
  sectionTitle: "ブロック解除時のメッセージ・アクション設定",
  testSteps: [
    "友だち詳細ページ\n「削除」より\n友だち情報を削除",
    "スマホのLINE上で\nLINE公式アカウントを\nブロック",
    "スマホのLINE上で\nLINE公式アカウントを\nブロック解除",
    "設定したアクションが\n稼働すれば\nテスト成功",
  ],
};

export default function GreetingsUnblockPage() {
  const { currentChannelId } = useAuth();
  const { data, isLoading, error } = useResource(
    currentChannelId ? `greeting-form:${currentChannelId}:unblock` : null,
    async () => {
      const [greeting, channels, options, tags, chatStatuses] = await Promise.all([
        fetchRawGreeting("unblock"),
        fetchFormChannels(),
        fetchBuilderOptions(),
        fetchTags(),
        fetchChatStatuses(),
      ]);
      return { greeting, channels, options, tags, chatStatuses };
    },
  );

  if (isLoading || !data) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
        {error ? "読み込みに失敗しました" : "読み込み中..."}
      </div>
    );
  }

  const channel =
    data.channels.find((c) => String(c.id) === currentChannelId) ??
    data.channels[0] ??
    null;

  return (
    <GreetingForm
      type="unblock"
      theme={theme}
      submitUrl="/greetings/unblock"
      greeting={data.greeting}
      channel={channel}
      channels={data.channels}
      tags={data.tags}
      chatStatuses={data.chatStatuses}
      {...data.options}
    />
  );
}
