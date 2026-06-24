"use client";

import { useState } from "react";

import { FriendListPane } from "@/components/chat/friend-list-pane";
import { ChatThreadPane } from "@/components/chat/chat-thread-pane";
import { RightInfoPanel } from "@/components/chat/right-info-panel";
import { MOCK_FRIENDS, getFriend } from "@/mocks/data";

export type ChatMobileView = "list" | "thread" | "info";

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_FRIENDS[1]?.id ?? null
  );
  const [view, setView] = useState<ChatMobileView>("thread");
  const friend = selectedId ? getFriend(selectedId) : undefined;

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
        friendId={selectedId}
        mobileVisible={view === "thread"}
        onBack={() => setView("list")}
        onShowInfo={() => setView("info")}
      />
      {friend && (
        <RightInfoPanel
          friend={friend}
          mobileVisible={view === "info"}
          onBack={() => setView("thread")}
        />
      )}
    </div>
  );
}
