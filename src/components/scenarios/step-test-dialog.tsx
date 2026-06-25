"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import {
    api,
    MessageBubble,
    TestUserPanel,
} from "@/components/templates/preview-test-dialog";
import type { TemplateMessage } from "@/types/template";

export function ScenarioStepTestDialog({
    open,
    onClose,
    messages,
    linkedTemplateId,
}: {
    open: boolean;
    onClose: () => void;
    messages: unknown[];
    linkedTemplateId: number | null;
}) {
    if (!open) return null;

    const bubbleMessages = messages as TemplateMessage[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-lg font-bold">プレビュー・テスト送信</h2>
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
                    {/* 左: メッセージプレビュー */}
                    <div className="overflow-y-auto p-6">
                        {bubbleMessages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                メッセージがありません
                            </p>
                        ) : (
                            <div className="flex max-w-sm flex-col gap-3">
                                {bubbleMessages.map((m, i) => (
                                    <MessageBubble key={i} message={m} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 右: テストユーザー */}
                    <TestUserPanel
                        open={open}
                        send={(friendIds) =>
                            api("/scenarios/test-send", "POST", {
                                friend_ids: friendIds,
                                messages: linkedTemplateId ? null : messages,
                                linked_template_id: linkedTemplateId,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    );
}
