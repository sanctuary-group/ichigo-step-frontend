"use client";

import { faUserCheck } from "@fortawesome/free-solid-svg-icons";

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
  badgeLabel: "既存友だち用",
  badgeClass: "bg-sky-500 text-white",
  icon: faUserCheck,
  iconColorClass: "text-sky-500",
  description: (
    <>
      このページで設定したメッセージ・アクションは{" "}
      <span className="font-bold">既存友だち</span>{" "}
      に対する一括送信です。「保存」した後に「既存友だち全員に今すぐ送信」ボタンで配信できます。
    </>
  ),
  sectionTitle: "既存友だち向けメッセージ・アクション設定",
  showSendButton: true,
  testSteps: [
    "友だち詳細ページ\n「削除」より\n友だち情報を削除",
    "友だちのLINE上で\nLINE公式アカウントに\nスタンプを送信",
    "設定した\nアクションが稼働すれば\nテスト成功",
  ],
};

export default function GreetingsExistingPage() {
  const { currentChannelId } = useAuth();
  const { data, isLoading, error } = useResource(
    currentChannelId ? `greeting-form:${currentChannelId}:existing` : null,
    async () => {
      const [greeting, channels, options, tags, chatStatuses] = await Promise.all([
        fetchRawGreeting("existing"),
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
      type="existing"
      theme={theme}
      submitUrl="/greetings/existing"
      sendUrl="/greetings/existing/send"
      greeting={data.greeting}
      channel={channel}
      channels={data.channels}
      tags={data.tags}
      chatStatuses={data.chatStatuses}
      {...data.options}
    />
  );
}
