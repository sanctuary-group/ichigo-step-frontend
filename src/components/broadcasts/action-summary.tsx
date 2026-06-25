import type { BroadcastAction } from "@/types/broadcast";

const LABEL: Record<string, string> = {
    step: "ステップ",
    remind: "リマインド",
    tag: "タグ",
    rich_menu: "リッチメニュー",
    bookmark: "ブックマーク",
    friend_field: "友だち情報",
    chat_status: "対応ステータス",
    block: "ブロック・非表示",
};

/** アクション設定の概要文（名前解決はせず config から簡潔に） */
export function describeAction(a: BroadcastAction): string {
    const c = a.config ?? {};
    switch (a.key) {
        case "tag": {
            const n = Array.isArray(c.tagIds) ? c.tagIds.length : 0;
            return `${c.op === "remove" ? "タグを外す" : "タグをつける"}（${n}件）`;
        }
        case "chat_status":
            return c.op === "remove"
                ? "対応ステータスを外す"
                : "対応ステータスをつける";
        case "friend_field":
            return "友だち情報を設定";
        case "block":
            return (
                {
                    block: "ブロックする",
                    unblock: "ブロック解除",
                    hide: "非表示にする",
                    show: "表示する",
                }[String(c.mode)] ?? "ブロック・非表示"
            );
        case "step":
            return c.op === "stop"
                ? "ステップ配信を停止"
                : "ステップ配信を開始";
        case "rich_menu":
            return c.op === "stop"
                ? "リッチメニュー表示を停止"
                : "リッチメニューを表示";
        case "bookmark":
            return c.mode === "remove"
                ? "ブックマークを外す"
                : "ブックマークする";
        case "remind":
            return c.op === "stop"
                ? "リマインド配信を停止"
                : "リマインド配信を開始";
        default:
            return "";
    }
}

/** プレビュー/確認ダイアログの「アクション」タブ用の一覧表示 */
export function ActionSummaryList({ actions }: { actions: BroadcastAction[] }) {
    if (!actions || actions.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                アクションは設定されていません
            </p>
        );
    }
    return (
        <ul className="space-y-2">
            {actions.map((a, i) => (
                <li
                    key={`${a.key}-${i}`}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                    <span className="font-bold">{LABEL[a.key] ?? a.key}</span>
                    <span className="text-muted-foreground">
                        {describeAction(a)}
                    </span>
                </li>
            ))}
        </ul>
    );
}
