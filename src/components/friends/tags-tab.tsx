"use client";

import Link from "next/link";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagBadge } from "@/components/tag-badge";
import type { MockTag } from "@/mocks/data";
import type { FriendDetail } from "@/lib/api/friend-detail";
import { attachFriendTag, detachFriendTag } from "@/lib/api/friends";
import { toMockTag } from "./friend-show-helpers";

export function TagsTab({
  friend,
  allTags,
  onChanged,
}: {
  friend: FriendDetail;
  allTags: MockTag[];
  onChanged: () => void;
}) {
  const attached = (friend.tags ?? []).map(toMockTag);
  const attachedIds = new Set(attached.map((t) => t.id));
  const available = allTags.filter((t) => !attachedIds.has(t.id));
  const [open, setOpen] = useState(false);

  const attach = async (t: MockTag) => {
    await attachFriendTag(String(friend.id), t.id);
    setOpen(false);
    onChanged();
  };
  const detach = async (t: MockTag) => {
    await detachFriendTag(String(friend.id), t.id);
    onChanged();
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">タグ</h2>
      <div className="flex flex-wrap gap-1.5">
        {attached.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            タグはまだありません
          </div>
        ) : (
          attached.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => detach(t)}
              className="group inline-flex items-center gap-1"
              aria-label={`タグ ${t.name} を外す`}
            >
              <TagBadge tag={t} />
              <FontAwesomeIcon
                icon={faXmark}
                className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          ))
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faPlus} className="size-3" />
        タグを追加
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを追加</DialogTitle>
          </DialogHeader>
          {allTags.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              タグがまだ作成されていません。先に
              <Link
                href="/tags"
                className="text-blue-600 dark:text-blue-400 underline mx-1"
              >
                タグ管理
              </Link>
              で作成してください。
            </div>
          ) : available.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              すべてのタグが付与済みです。
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => attach(t)}
                  className="hover:opacity-80 transition-opacity"
                >
                  <TagBadge tag={t} />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
