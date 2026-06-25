"use client";

import { useEffect, useState } from "react";

import { FriendListPane } from "@/components/chat/friend-list-pane";
import { ChatThreadPane } from "@/components/chat/chat-thread-pane";
import { RightInfoPanel } from "@/components/chat/right-info-panel";
import { fetchFriend, fetchFriendsRaw } from "@/lib/api/friends";
import { fetchTags, fetchChatStatuses } from "@/lib/api/builder-options";
import { fetchChatSettings, bulkUpdateRead } from "@/lib/api/chat-settings";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

export type ChatMobileView = "list" | "thread" | "info";

export default function ChatPage() {
  const { currentChannelId } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<ChatMobileView>("thread");

  // 左ペイン用の友だち一覧（生 Friend[]）
  const { data: friendList, mutate: refreshList } = useResource(
    currentChannelId ? `chat-friends:${currentChannelId}` : null,
    () => fetchFriendsRaw({ sort: "last_message_at", dir: "desc" }),
  );

  // 選択中の友だち詳細（MockFriend）— thread / right パネル用
  const { data: friend, mutate: refreshFriend } = useResource(
    selectedId && currentChannelId
      ? `friend:${currentChannelId}:${selectedId}`
      : null,
    () => fetchFriend(String(selectedId!)),
  );

  // フィルタ用のタグ / 対応ステータス
  const { data: tags } = useResource(
    currentChannelId ? `chat-tags:${currentChannelId}` : null,
    () => fetchTags(),
  );
  const { data: chatStatuses } = useResource(
    currentChannelId ? `chat-statuses:${currentChannelId}` : null,
    () => fetchChatStatuses(),
  );
  const { data: chatSettings } = useResource(
    currentChannelId ? `chat-settings:${currentChannelId}` : null,
    () => fetchChatSettings(),
  );

  // monolith 同様に一定間隔で一覧/選択中の友だちを再取得（簡易ポーリング）
  useEffect(() => {
    if (!currentChannelId) return;
    const timer = setInterval(() => {
      refreshList();
      if (selectedId) refreshFriend();
    }, 15000);
    return () => clearInterval(timer);
  }, [currentChannelId, selectedId, refreshList, refreshFriend]);

  const handleMarkAllRead = async () => {
    const ids = (friendList?.friends ?? [])
      .filter((f) => f.unread_count > 0)
      .map((f) => String(f.id));
    if (ids.length === 0) return;
    await bulkUpdateRead(ids, "read");
    refreshList();
  };

  return (
    <div className="flex h-full min-h-0">
      <FriendListPane
        friends={friendList?.friends ?? []}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setView("thread");
        }}
        mobileVisible={view === "list"}
        tags={tags ?? []}
        chatStatuses={chatStatuses ?? []}
        onMarkAllRead={handleMarkAllRead}
      />
      <ChatThreadPane
        friend={friend}
        mobileVisible={view === "thread"}
        onBack={() => setView("list")}
        onShowInfo={() => setView("info")}
        onSent={() => {
          refreshFriend();
          refreshList();
        }}
        onChanged={() => {
          refreshFriend();
          refreshList();
        }}
        chatSettings={
          chatSettings
            ? {
                send_shortcut: chatSettings.send_shortcut,
                send_preview: chatSettings.send_preview,
              }
            : undefined
        }
      />
      {friend && (
        <RightInfoPanel
          friend={friend}
          mobileVisible={view === "info"}
          onBack={() => setView("thread")}
          onChanged={() => {
            refreshFriend();
            refreshList();
          }}
        />
      )}
    </div>
  );
}
