import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeShort } from "@/lib/time";
import type { MockFriend } from "@/mocks/data";

export function FriendListItem({
  friend,
  active,
  onClick,
}: {
  friend: MockFriend;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-3 py-3 border-b border-border/60 transition-colors",
        active ? "bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      <Avatar className="size-11 shrink-0">
        <AvatarImage src={friend.pictureUrl} alt={friend.displayName} />
        <AvatarFallback>{friend.displayName.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate flex-1">
            {friend.displayName}
          </div>
          {friend.lastMessageAt && (
            <div className="text-[11px] text-muted-foreground shrink-0">
              {formatRelativeShort(friend.lastMessageAt)}
            </div>
          )}
        </div>
        {friend.lastMessagePreview && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {friend.lastMessagePreview}
          </div>
        )}
      </div>
      {friend.unreadCount > 0 && (
        <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold shrink-0 mt-1">
          {friend.unreadCount}
        </span>
      )}
    </button>
  );
}
