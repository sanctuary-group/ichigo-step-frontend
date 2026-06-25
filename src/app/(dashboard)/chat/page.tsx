"use client";

import { useState } from "react";

import { FriendListPane } from "@/components/chat/friend-list-pane";
import { ChatThreadPane } from "@/components/chat/chat-thread-pane";
import { RightInfoPanel } from "@/components/chat/right-info-panel";
import { fetchFriend } from "@/lib/api/friends";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

export type ChatMobileView = "list" | "thread" | "info";

export default function ChatPage() {
  const { currentChannelId } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ChatMobileView>("thread");

  const { data: friend, mutate: refreshFriend } = useResource(
    selectedId && currentChannelId ? `friend:${currentChannelId}:${selectedId}` : null,
    () => fetchFriend(selectedId!),
  );

  return (
    <div className="flex h-full min-h-0">
      <FriendListPane
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setView("thread");
        }}
        mobileVisible={view === "list"}
      />
      <ChatThreadPane
        friend={friend}
        mobileVisible={view === "thread"}
        onBack={() => setView("list")}
        onShowInfo={() => setView("info")}
        onSent={refreshFriend}
        onChanged={refreshFriend}
      />
      {friend && (
        <RightInfoPanel
          friend={friend}
          mobileVisible={view === "info"}
          onBack={() => setView("thread")}
          onChanged={refreshFriend}
        />
      )}
    </div>
  );
}
