import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/templates/preview-test-dialog";
import { ActionSummaryList } from "@/components/broadcasts/action-summary";
import type { TemplateMessage } from "@/types/template";
import type { BroadcastAction } from "@/types/broadcast";

type Tab = "message" | "action";

export function BroadcastConfirmDialog({
    open,
    onClose,
    onConfirm,
    processing,
    title,
    scheduledLabel,
    targetLabel,
    recipientCount,
    channelName,
    messages,
    actions = [],
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    processing: boolean;
    title: string;
    scheduledLabel: string;
    targetLabel: string;
    recipientCount: number | null;
    channelName: string;
    messages: unknown[];
    actions?: BroadcastAction[];
}) {
    const [tab, setTab] = useState<Tab>("message");
    if (!open) return null;

    const bubbleMessages = messages as TemplateMessage[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-lg font-bold">配信内容確認</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="閉じる"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-5" />
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 divide-x divide-border">
                    {/* 左: メッセージ / アクション */}
                    <div className="overflow-y-auto p-6">
                        <div className="inline-flex rounded-md border border-border p-1">
                            {(
                                [
                                    { id: "message", label: "メッセージ" },
                                    { id: "action", label: "アクション" },
                                ] as const
                            ).map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTab(t.id)}
                                    className={cn(
                                        "rounded px-6 py-2 text-sm font-bold transition-colors",
                                        tab === t.id
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground hover:bg-muted/50",
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-5">
                            {tab === "message" ? (
                                bubbleMessages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        メッセージがありません
                                    </p>
                                ) : (
                                    <div className="rounded-md border border-border p-4">
                                        <div className="flex max-w-sm flex-col gap-3">
                                            {bubbleMessages.map((m, i) => (
                                                <MessageBubble
                                                    key={i}
                                                    message={m}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <ActionSummaryList actions={actions} />
                            )}
                        </div>
                    </div>

                    {/* 右: 概要 */}
                    <div className="overflow-y-auto p-6">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-border">
                                <SummaryRow label="タイトル" value={title} />
                                <SummaryRow
                                    label="配信日時"
                                    value={scheduledLabel}
                                />
                                <SummaryRow label="絞込み" value={targetLabel} />
                                <SummaryRow
                                    label="配信数"
                                    value={
                                        recipientCount != null
                                            ? `${recipientCount.toLocaleString()}人`
                                            : "—"
                                    }
                                />
                                <SummaryRow label="送信者名" value={channelName} />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* フッター */}
                <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        修正する
                    </button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onConfirm}
                        disabled={processing}
                        className="border-primary px-6 font-bold text-primary hover:bg-primary/10"
                    >
                        この内容で配信登録
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <tr>
            <td className="w-32 bg-muted/40 px-3 py-3 font-bold whitespace-nowrap">
                {label}
            </td>
            <td className="px-3 py-3">{value}</td>
        </tr>
    );
}
