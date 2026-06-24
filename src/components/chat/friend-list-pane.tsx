"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faSliders,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FriendListItem } from "@/components/chat/friend-list-item";
import { EmptyState } from "@/components/empty-state";
import { MOCK_FRIENDS, type MockFriend } from "@/mocks/data";

const FILTER_LABELS: Record<string, string> = {
  all: "全ての友だち（非表示除く）",
  unread: "未読のみ",
  following: "フォロー中のみ",
};

export function FriendListPane({
  selectedId,
  onSelect,
  mobileVisible = true,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  mobileVisible?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "following">("all");

  const friends = useMemo<MockFriend[]>(() => {
    let list = MOCK_FRIENDS;
    if (filter === "unread") list = list.filter((f) => f.unreadCount > 0);
    if (filter === "following") list = list.filter((f) => f.isFollowing);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) => f.displayName.toLowerCase().includes(q));
    }
    return list;
  }, [query, filter]);

  return (
    <div
      className={`${mobileVisible ? "flex" : "hidden"} lg:flex w-full lg:w-80 shrink-0 flex-col border-r border-border bg-background`}
    >
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-between h-9 rounded-full"
            onClick={() => {
              setFilter(
                filter === "all"
                  ? "unread"
                  : filter === "unread"
                    ? "following"
                    : "all"
              );
            }}
          >
            <span className="truncate text-xs">{FILTER_LABELS[filter]}</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="size-3 text-muted-foreground"
            />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full size-9 shrink-0"
            aria-label="絞り込み"
          >
            <FontAwesomeIcon icon={faSliders} className="size-3.5" />
          </Button>
        </div>
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="LINE名 / システム表示名"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 rounded-full bg-muted/40 border-transparent"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {friends.length === 0 ? (
          <EmptyState
            title="該当する友だちがいません"
            description="検索条件やフィルタを変えてみてください"
          />
        ) : (
          friends.map((f) => (
            <FriendListItem
              key={f.id}
              friend={f}
              active={f.id === selectedId}
              onClick={() => onSelect(f.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
