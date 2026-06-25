import type { Friend, FriendSource } from "@/types/chat";

export function friendDisplayName(friend: Friend | null | undefined): string {
    if (!friend) return "(名前未取得)";
    return (
        friend.system_display_name?.trim() ||
        friend.display_name?.trim() ||
        "(名前未取得)"
    );
}

export const SOURCE_LABELS: Record<Exclude<FriendSource, null>, string> = {
    qr: "QR コード",
    card: "名刺",
    web: "Web",
    manual: "手動追加",
    other: "その他",
};

export function sourceLabel(source: FriendSource): string {
    if (!source) return "未設定";
    return SOURCE_LABELS[source] ?? source;
}
