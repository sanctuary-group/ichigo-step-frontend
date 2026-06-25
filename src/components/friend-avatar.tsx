import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

import { friendDisplayName } from "@/lib/friend";
import { cn } from "@/lib/utils";
import type { Friend } from "@/types/chat";

export function FriendAvatar({
    friend,
    className,
}: {
    friend: Friend;
    className?: string;
}) {
    const name = friendDisplayName(friend);

    return (
        <div
            className={cn(
                "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full size-8",
                className,
            )}
        >
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
    );
}
