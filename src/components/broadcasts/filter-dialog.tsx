import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/chat";

export type FilterCondition = Record<string, any> & { type: string };
export type TargetFilter = {
    and: FilterCondition[];
    or: FilterCondition[];
};

export type ChatStatus = { id: number; name: string; color?: string };
export type FriendFieldFolder = {
    id: number;
    name: string;
    fields: { id: number; name: string }[];
};

type Group = "and" | "or";

const COND_TYPES: { type: string; label: string; enabled: boolean }[] = [
    { type: "tag", label: "タグ", enabled: true },
    { type: "name", label: "友だち名", enabled: true },
    { type: "added_at", label: "友だち追加日", enabled: true },
    { type: "step", label: "ステップ購読状況", enabled: false },
    { type: "qr", label: "QRコードアクション", enabled: false },
    { type: "conversion", label: "コンバージョン", enabled: false },
    { type: "confirm", label: "確認状況", enabled: false },
    { type: "friend_field", label: "友だち情報", enabled: true },
    { type: "chat_status", label: "対応ステータス", enabled: true },
    { type: "affiliate", label: "アフィリエイター", enabled: false },
    { type: "new_existing", label: "新規・既存 友だち", enabled: true },
];

const LABEL: Record<string, string> = Object.fromEntries(
    COND_TYPES.map((c) => [c.type, c.label]),
);

function todayDate(): string {
    const d = new Date();
    const p = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function newCondition(
    type: string,
    folders: FriendFieldFolder[],
): FilterCondition {
    switch (type) {
        case "tag":
            return { type, mode: "has", match: "any", tag_ids: [] };
        case "name":
            return { type, value: "" };
        case "added_at":
            return { type, from: "", to: "" };
        case "chat_status":
            return { type, status_ids: [] };
        case "friend_field":
            return {
                type,
                field_id: folders[0]?.fields[0]?.id ?? 0,
                value: "",
            };
        case "new_existing":
            return { type, value: "new", date: todayDate() };
        default:
            return { type };
    }
}

export function FilterDialog({
    open,
    onClose,
    value,
    onApply,
    tags,
    chatStatuses,
    friendFieldFolders,
}: {
    open: boolean;
    onClose: () => void;
    value: TargetFilter | null;
    onApply: (filter: TargetFilter) => void;
    tags: Tag[];
    chatStatuses: ChatStatus[];
    friendFieldFolders: FriendFieldFolder[];
}) {
    const [filter, setFilter] = useState<TargetFilter>({ and: [], or: [] });
    const [group, setGroup] = useState<Group>("and");
    const [wasOpen, setWasOpen] = useState(false);

    if (open && !wasOpen) {
        setFilter({
            and: value?.and ? [...value.and] : [],
            or: value?.or ? [...value.or] : [],
        });
        setGroup("and");
        setWasOpen(true);
    }
    if (!open && wasOpen) setWasOpen(false);
    if (!open) return null;

    const addCondition = (type: string) => {
        setFilter((f) => ({
            ...f,
            [group]: [...f[group], newCondition(type, friendFieldFolders)],
        }));
    };

    const updateCondition = (g: Group, i: number, patch: Partial<FilterCondition>) => {
        setFilter((f) => ({
            ...f,
            [g]: f[g].map((c, j) => (j === i ? { ...c, ...patch } : c)),
        }));
    };

    const removeCondition = (g: Group, i: number) => {
        setFilter((f) => ({ ...f, [g]: f[g].filter((_, j) => j !== i) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="w-full max-w-4xl rounded-lg bg-background shadow-xl my-4">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-lg font-bold flex-1 text-center">
                        絞り込み
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* グループ選択 */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setGroup("and")}
                            className={cn(
                                "rounded-lg border px-4 py-3 text-sm font-bold transition-colors",
                                group === "and"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:bg-muted/50",
                            )}
                        >
                            「全て満たす」必要がある条件 (and条件)を追加
                        </button>
                        <button
                            type="button"
                            onClick={() => setGroup("or")}
                            className={cn(
                                "rounded-lg border px-4 py-3 text-sm font-bold transition-colors",
                                group === "or"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:bg-muted/50",
                            )}
                        >
                            「どれか1つ以上満たす」必要がある条件 (or条件)を追加
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                        {/* 条件タイプ一覧 */}
                        <ul className="space-y-2">
                            {COND_TYPES.map((c) => (
                                <li key={c.type}>
                                    <button
                                        type="button"
                                        disabled={!c.enabled}
                                        onClick={() => addCondition(c.type)}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                                            !c.enabled
                                                ? "border-border bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                                                : "border-border hover:border-primary hover:bg-primary/5",
                                        )}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            className="size-3 text-primary"
                                        />
                                        {c.label}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* 条件リスト */}
                        <div className="space-y-4">
                            <ConditionGroup
                                title="「全て満たす」必要がある条件 (and条件)"
                                conditions={filter.and}
                                onUpdate={(i, p) => updateCondition("and", i, p)}
                                onRemove={(i) => removeCondition("and", i)}
                                tags={tags}
                                chatStatuses={chatStatuses}
                                friendFieldFolders={friendFieldFolders}
                            />
                            <ConditionGroup
                                title="「どれか1つ以上満たす」必要がある条件 (or条件)"
                                conditions={filter.or}
                                onUpdate={(i, p) => updateCondition("or", i, p)}
                                onRemove={(i) => removeCondition("or", i)}
                                tags={tags}
                                chatStatuses={chatStatuses}
                                friendFieldFolders={friendFieldFolders}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => {
                            onApply(filter);
                            onClose();
                        }}
                    >
                        適用
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ConditionGroup({
    title,
    conditions,
    onUpdate,
    onRemove,
    tags,
    chatStatuses,
    friendFieldFolders,
}: {
    title: string;
    conditions: FilterCondition[];
    onUpdate: (i: number, patch: Partial<FilterCondition>) => void;
    onRemove: (i: number) => void;
    tags: Tag[];
    chatStatuses: ChatStatus[];
    friendFieldFolders: FriendFieldFolder[];
}) {
    return (
        <div className="rounded-lg border border-border">
            <div className="bg-muted/40 px-3 py-2 text-center text-sm font-bold">
                {title}
            </div>
            {conditions.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    条件が追加されていません
                </p>
            ) : (
                <ul className="divide-y divide-border">
                    {conditions.map((c, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-3 px-3 py-3"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="text-sm font-bold">
                                    {LABEL[c.type] ?? c.type}
                                </div>
                                <ConditionEditor
                                    condition={c}
                                    onChange={(p) => onUpdate(i, p)}
                                    tags={tags}
                                    chatStatuses={chatStatuses}
                                    friendFieldFolders={friendFieldFolders}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemove(i)}
                                aria-label="削除"
                                className="mt-0.5 text-muted-foreground hover:text-destructive"
                            >
                                <FontAwesomeIcon
                                    icon={faTrash}
                                    className="size-4"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ConditionEditor({
    condition: c,
    onChange,
    tags,
    chatStatuses,
    friendFieldFolders,
}: {
    condition: FilterCondition;
    onChange: (patch: Partial<FilterCondition>) => void;
    tags: Tag[];
    chatStatuses: ChatStatus[];
    friendFieldFolders: FriendFieldFolder[];
}) {
    if (c.type === "tag") {
        const ids: number[] = c.tag_ids ?? [];
        const toggle = (id: number) =>
            onChange({
                tag_ids: ids.includes(id)
                    ? ids.filter((x) => x !== id)
                    : [...ids, id],
            });
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                    <Seg
                        options={[
                            { v: "has", l: "保有" },
                            { v: "not", l: "未保有" },
                        ]}
                        value={c.mode}
                        onChange={(v) => onChange({ mode: v })}
                    />
                    <Seg
                        options={[
                            { v: "any", l: "いずれか" },
                            { v: "all", l: "すべて" },
                        ]}
                        value={c.match}
                        onChange={(v) => onChange({ match: v })}
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => toggle(t.id)}
                            className={cn(
                                "rounded-full border px-2.5 py-1 text-xs",
                                ids.includes(t.id)
                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                    : "border-border text-muted-foreground hover:bg-muted/50",
                            )}
                        >
                            {t.name}
                        </button>
                    ))}
                    {tags.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                            タグがありません
                        </span>
                    )}
                </div>
            </div>
        );
    }

    if (c.type === "name") {
        return (
            <Input
                value={c.value ?? ""}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="名前に含まれる文字"
                className="h-9 max-w-xs"
            />
        );
    }

    if (c.type === "added_at") {
        return (
            <div className="flex items-center gap-2 text-xs">
                <Input
                    type="date"
                    value={c.from ?? ""}
                    onChange={(e) => onChange({ from: e.target.value })}
                    className="h-9 w-40"
                />
                <span>〜</span>
                <Input
                    type="date"
                    value={c.to ?? ""}
                    onChange={(e) => onChange({ to: e.target.value })}
                    className="h-9 w-40"
                />
            </div>
        );
    }

    if (c.type === "chat_status") {
        const ids: number[] = c.status_ids ?? [];
        const toggle = (id: number) =>
            onChange({
                status_ids: ids.includes(id)
                    ? ids.filter((x) => x !== id)
                    : [...ids, id],
            });
        return (
            <div className="flex flex-wrap gap-1.5">
                {chatStatuses.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => toggle(s.id)}
                        className={cn(
                            "rounded-full border px-2.5 py-1 text-xs",
                            ids.includes(s.id)
                                ? "border-primary bg-primary/10 text-primary font-bold"
                                : "border-border text-muted-foreground hover:bg-muted/50",
                        )}
                    >
                        {s.name}
                    </button>
                ))}
                {chatStatuses.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                        対応ステータスがありません
                    </span>
                )}
            </div>
        );
    }

    if (c.type === "friend_field") {
        return (
            <div className="flex items-center gap-2">
                <select
                    value={c.field_id ?? 0}
                    onChange={(e) =>
                        onChange({ field_id: Number(e.target.value) })
                    }
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                    {friendFieldFolders.map((folder) => (
                        <optgroup key={folder.id} label={folder.name}>
                            {folder.fields.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <Input
                    value={c.value ?? ""}
                    onChange={(e) => onChange({ value: e.target.value })}
                    placeholder="含まれる値"
                    className="h-9 max-w-[12rem]"
                />
            </div>
        );
    }

    if (c.type === "new_existing") {
        return (
            <div className="flex items-center gap-3 text-xs">
                <Seg
                    options={[
                        { v: "new", l: "新規" },
                        { v: "existing", l: "既存" },
                    ]}
                    value={c.value}
                    onChange={(v) => onChange({ value: v })}
                />
                <span>基準日</span>
                <Input
                    type="date"
                    value={c.date ?? ""}
                    onChange={(e) => onChange({ date: e.target.value })}
                    className="h-9 w-40"
                />
            </div>
        );
    }

    return null;
}

function Seg({
    options,
    value,
    onChange,
}: {
    options: { v: string; l: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="inline-flex rounded-md border border-border overflow-hidden">
            {options.map((o) => (
                <button
                    key={o.v}
                    type="button"
                    onClick={() => onChange(o.v)}
                    className={cn(
                        "px-2.5 py-1",
                        value === o.v
                            ? "bg-primary text-primary-foreground font-bold"
                            : "bg-background text-muted-foreground hover:bg-muted/50",
                    )}
                >
                    {o.l}
                </button>
            ))}
        </div>
    );
}
