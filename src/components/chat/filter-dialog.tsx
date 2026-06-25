"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faUserGear, faFolder } from "@fortawesome/free-solid-svg-icons";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Tag, ChatStatus } from "@/types/chat";

export type ChatFilterValue = {
    mode: "or" | "and";
    tagIds: number[];
    statusIds: number[];
};

export const EMPTY_FILTER: ChatFilterValue = {
    mode: "or",
    tagIds: [],
    statusIds: [],
};

type Tab = "tag" | "status";

export function ChatFilterDialog({
    open,
    onOpenChange,
    tags,
    chatStatuses,
    initial,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tags: Tag[];
    chatStatuses: ChatStatus[];
    initial: ChatFilterValue;
    onApply: (value: ChatFilterValue) => void;
}) {
    const [mode, setMode] = useState<"or" | "and">(initial.mode);
    const [tagIds, setTagIds] = useState<number[]>(initial.tagIds);
    const [statusIds, setStatusIds] = useState<number[]>(initial.statusIds);
    const [tab, setTab] = useState<Tab>("tag");

    // 開くたびに現在の絞り込み状態へ同期
    useEffect(() => {
        if (open) {
            setMode(initial.mode);
            setTagIds(initial.tagIds);
            setStatusIds(initial.statusIds);
            setTab("tag");
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = (
        list: number[],
        setList: (v: number[]) => void,
        id: number,
    ) => {
        setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    };

    const allTagsSelected =
        tags.length > 0 && tags.every((t) => tagIds.includes(t.id));
    const toggleAllTags = () => {
        setTagIds(allTagsSelected ? [] : tags.map((t) => t.id));
    };

    const selectedTags = tags.filter((t) => tagIds.includes(t.id));
    const selectedStatuses = chatStatuses.filter((s) =>
        statusIds.includes(s.id),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 p-0 sm:max-w-4xl">
                <div className="flex max-h-[80vh] flex-col sm:flex-row">
                    {/* 選択済みの項目 */}
                    <aside className="shrink-0 border-b border-border p-5 sm:w-56 sm:border-r sm:border-b-0">
                        <h3 className="text-center text-sm font-bold">
                            選択済みの項目
                        </h3>
                        <SummaryBlock
                            icon={faTag}
                            label="タグ"
                            items={selectedTags.map((t) => t.name)}
                        />
                        <SummaryBlock
                            icon={faUserGear}
                            label="対応ステータス"
                            items={selectedStatuses.map((s) => s.name)}
                        />
                    </aside>

                    {/* メイン */}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-col gap-4 overflow-y-auto p-5">
                            {/* or / and トグル */}
                            <div className="flex rounded-lg border border-blue-400 p-1">
                                <ModeButton
                                    active={mode === "or"}
                                    onClick={() => setMode("or")}
                                >
                                    「どれか1つ以上満たす(or)」条件
                                </ModeButton>
                                <ModeButton
                                    active={mode === "and"}
                                    onClick={() => setMode("and")}
                                >
                                    「すべて満たす(and)」条件
                                </ModeButton>
                            </div>

                            {/* タブ */}
                            <div className="flex gap-6 border-b border-border">
                                <TabButton
                                    active={tab === "tag"}
                                    onClick={() => setTab("tag")}
                                    icon={faTag}
                                >
                                    タグ
                                </TabButton>
                                <TabButton
                                    active={tab === "status"}
                                    onClick={() => setTab("status")}
                                    icon={faUserGear}
                                >
                                    対応ステータス
                                </TabButton>
                            </div>

                            {tab === "tag" ? (
                                <div className="grid min-h-72 grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
                                    {/* フォルダ（タグはフォルダ概念がないため未分類のみ） */}
                                    <div>
                                        <div className="flex items-center gap-2 rounded-md bg-blue-400 px-3 py-2.5 text-sm font-bold text-white">
                                            <FontAwesomeIcon
                                                icon={faFolder}
                                                className="size-3.5"
                                            />
                                            未分類 ({tags.length})
                                        </div>
                                    </div>
                                    {/* タグ一覧 */}
                                    <div className="space-y-2">
                                        {tags.length === 0 ? (
                                            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                                                タグがありません
                                            </p>
                                        ) : (
                                            <>
                                                <CheckRow
                                                    checked={allTagsSelected}
                                                    onChange={toggleAllTags}
                                                >
                                                    以下を全選択
                                                </CheckRow>
                                                {tags.map((t) => (
                                                    <CheckRow
                                                        key={t.id}
                                                        checked={tagIds.includes(
                                                            t.id,
                                                        )}
                                                        onChange={() =>
                                                            toggle(
                                                                tagIds,
                                                                setTagIds,
                                                                t.id,
                                                            )
                                                        }
                                                    >
                                                        <ColorPill
                                                            name={t.name}
                                                            color={t.color}
                                                        />
                                                    </CheckRow>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="min-h-72">
                                    {chatStatuses.length === 0 ? (
                                        <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                                            対応ステータスがありません
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            {chatStatuses.map((s) => (
                                                <RadioRow
                                                    key={s.id}
                                                    checked={statusIds.includes(
                                                        s.id,
                                                    )}
                                                    onChange={() =>
                                                        toggle(
                                                            statusIds,
                                                            setStatusIds,
                                                            s.id,
                                                        )
                                                    }
                                                >
                                                    <ColorPill
                                                        name={s.name}
                                                        color={s.color}
                                                    />
                                                </RadioRow>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* フッター */}
                        <div className="flex justify-center border-t border-border p-4">
                            <button
                                type="button"
                                onClick={() =>
                                    onApply({ mode, tagIds, statusIds })
                                }
                                className="inline-flex h-11 min-w-64 items-center justify-center rounded-md bg-blue-500 px-8 text-sm font-bold text-white transition-colors hover:bg-blue-600"
                            >
                                絞り込み表示
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SummaryBlock({
    icon,
    label,
    items,
}: {
    icon: typeof faTag;
    label: string;
    items: string[];
}) {
    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 border-b border-border pb-1 text-sm font-medium">
                <FontAwesomeIcon
                    icon={icon}
                    className="size-3.5 text-muted-foreground"
                />
                {label}
            </div>
            {items.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                    選択されていません
                </p>
            ) : (
                <ul className="mt-2 space-y-1">
                    {items.map((name) => (
                        <li key={name} className="text-xs">
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex-1 rounded-md px-4 py-2.5 text-sm font-bold transition-colors",
                active ? "bg-blue-400 text-white" : "text-blue-500",
            )}
        >
            {children}
        </button>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: typeof faTag;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
                active
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground",
            )}
        >
            <FontAwesomeIcon icon={icon} className="size-3.5" />
            {children}
        </button>
    );
}

function CheckRow({
    checked,
    onChange,
    children,
}: {
    checked: boolean;
    onChange: () => void;
    children: React.ReactNode;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="size-4 accent-blue-500"
            />
            <span className="min-w-0 truncate text-sm">{children}</span>
        </label>
    );
}

function RadioRow({
    checked,
    onChange,
    children,
}: {
    checked: boolean;
    onChange: () => void;
    children: React.ReactNode;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5">
            <span
                onClick={onChange}
                className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border",
                    checked ? "border-blue-500" : "border-muted-foreground/40",
                )}
            >
                {checked && (
                    <span className="size-2.5 rounded-full bg-blue-500" />
                )}
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only"
            />
            <span className="min-w-0 truncate">{children}</span>
        </label>
    );
}

function ColorPill({ name, color }: { name: string; color?: string | null }) {
    const c = color || "#6b7280";
    return (
        <span
            className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm font-bold"
            style={{ borderColor: c, color: c }}
        >
            {name}
        </span>
    );
}
