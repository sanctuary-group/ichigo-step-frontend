import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";

import { FriendAvatar } from "@/components/friend-avatar";
import { cn } from "@/lib/utils";
import { friendDisplayName } from "@/lib/friend";
import { formatRelativeShort } from "@/lib/time";
import type { Friend } from "@/types/chat";

export function FriendListItem({
    friend,
    active,
    onClick,
}: {
    friend: Friend;
    active?: boolean;
    onClick?: () => void;
}) {
    const name = friendDisplayName(friend);
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left flex flex-col gap-1.5 px-3 py-3 border-b border-border/60 transition-colors",
                active ? "bg-primary/5" : "hover:bg-muted/50",
            )}
        >
            {friend.chat_status && (
                <span
                    className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                        color: friend.chat_status.color,
                        backgroundColor: `${friend.chat_status.color}1a`,
                    }}
                >
                    <span
                        className="inline-block size-1.5 rounded-full"
                        style={{ backgroundColor: friend.chat_status.color }}
                    />
                    {friend.chat_status.name}
                </span>
            )}
            <div className="flex w-full items-start gap-3">
            <FriendAvatar friend={friend} className="size-11 shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {friend.pinned_at && (
                        <FontAwesomeIcon
                            icon={faBookmark}
                            className="size-3 text-primary shrink-0"
                            aria-label="ピン留め中"
                        />
                    )}
                    <div className="text-sm font-medium truncate flex-1">
                        {name}
                    </div>
                    {friend.last_message_at && (
                        <div className="text-[11px] text-muted-foreground shrink-0">
                            {formatRelativeShort(friend.last_message_at)}
                        </div>
                    )}
                </div>
                {friend.last_message_preview && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {friend.last_message_preview}
                    </div>
                )}
            </div>
            {friend.unread_count > 0 && (
                <span
                    className="size-2.5 rounded-full bg-destructive shrink-0 mt-2"
                    aria-label="未読"
                />
            )}
            </div>
        </button>
    );
}
