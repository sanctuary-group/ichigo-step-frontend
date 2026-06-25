import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faCirclePlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tag, ChatStatus } from "@/types/chat";
import type {
    BroadcastAction,
    ScenarioOption,
    RichMenuOption,
    ReminderOption,
} from "@/types/broadcast";

type FriendFieldFolder = {
    id: number;
    name: string;
    fields: { id: number; name: string }[];
};

type ActionConfig = Record<string, unknown>;

const ACTION_TYPES: { key: string; label: string; ready: boolean }[] = [
    { key: "step", label: "ステップ", ready: true },
    { key: "remind", label: "リマインド", ready: true },
    { key: "tag", label: "タグ", ready: true },
    { key: "rich_menu", label: "リッチメニュー", ready: true },
    { key: "bookmark", label: "ブックマーク", ready: true },
    { key: "friend_field", label: "友だち情報", ready: true },
    { key: "chat_status", label: "対応ステータス", ready: true },
    { key: "block", label: "ブロック", ready: true },
];

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

type Row = { id: number; key: string; config: ActionConfig };

let rowSeq = 1;

function defaultConfig(key: string): ActionConfig {
    switch (key) {
        case "tag":
            return { tagIds: [], op: "add" };
        case "chat_status":
            return { op: "add", statusId: 0 };
        case "friend_field":
            return { fieldId: 0, value: "" };
        case "block":
            return { mode: "block" };
        case "step":
            return { op: "start", scenarioId: 0 };
        case "rich_menu":
            return { op: "show", richMenuId: 0 };
        case "remind":
            return { op: "start", reminderId: 0, endAt: "" };
        case "bookmark":
            return { mode: "add" };
        default:
            return {};
    }
}

export function ActionDialog({
    open,
    onClose,
    onSave,
    initial,
    tags,
    chatStatuses,
    friendFieldFolders,
    scenarios,
    richMenus,
    reminders,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (actions: BroadcastAction[]) => void;
    initial: BroadcastAction[];
    tags: Tag[];
    chatStatuses: ChatStatus[];
    friendFieldFolders: FriendFieldFolder[];
    scenarios: ScenarioOption[];
    richMenus: RichMenuOption[];
    reminders: ReminderOption[];
}) {
    const [rows, setRows] = useState<Row[]>([]);

    useEffect(() => {
        if (open) {
            setRows(
                initial.map((a) => ({
                    id: rowSeq++,
                    key: a.key,
                    config: { ...defaultConfig(a.key), ...(a.config ?? {}) },
                })),
            );
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!open) return null;

    const addedKeys = new Set(rows.map((r) => r.key));

    const addAction = (key: string) => {
        // 同種は 1 つだけ（トグル）
        setRows((prev) =>
            prev.some((r) => r.key === key)
                ? prev.filter((r) => r.key !== key)
                : [...prev, { id: rowSeq++, key, config: defaultConfig(key) }],
        );
    };
    const removeRow = (id: number) =>
        setRows((prev) => prev.filter((r) => r.id !== id));
    const patchRow = (id: number, patch: ActionConfig) =>
        setRows((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, config: { ...r.config, ...patch } } : r,
            ),
        );

    const save = () => {
        onSave(rows.map((r) => ({ key: r.key, config: r.config })));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
                    <h2 className="flex-1 text-center text-lg font-bold">
                        アクション
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="閉じる"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-5" />
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-[280px_1fr]">
                    {/* 左: アクション種別 */}
                    <ul className="space-y-3">
                        {ACTION_TYPES.map((a) => {
                            const active = addedKeys.has(a.key);
                            return (
                                <li key={a.key}>
                                    <button
                                        type="button"
                                        onClick={() => addAction(a.key)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-bold transition-colors",
                                            active
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border hover:bg-muted/50",
                                        )}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCirclePlus}
                                            className={cn(
                                                "size-4",
                                                active
                                                    ? "text-primary-foreground"
                                                    : "text-muted-foreground",
                                            )}
                                        />
                                        <span className="flex-1">{a.label}</span>
                                        {!a.ready && (
                                            <span
                                                className={cn(
                                                    "rounded px-1.5 py-0.5 text-[10px] font-bold",
                                                    active
                                                        ? "bg-primary-foreground/20"
                                                        : "bg-muted text-muted-foreground",
                                                )}
                                            >
                                                準備中
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* 右: 設定 */}
                    <div className="space-y-4">
                        {rows.length === 0 ? (
                            <div className="grid min-h-[400px] place-items-center rounded-md border border-border bg-card text-sm text-muted-foreground">
                                左からアクションを選択してください
                            </div>
                        ) : (
                            rows.map((r) => (
                                <ActionCard
                                    key={r.id}
                                    row={r}
                                    onRemove={() => removeRow(r.id)}
                                    onChange={(patch) => patchRow(r.id, patch)}
                                    tags={tags}
                                    chatStatuses={chatStatuses}
                                    friendFieldFolders={friendFieldFolders}
                                    scenarios={scenarios}
                                    richMenus={richMenus}
                                    reminders={reminders}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 border-t border-border bg-muted/40 px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="min-w-32"
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        onClick={save}
                        className="min-w-48 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        保存
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ActionCard({
    row,
    onRemove,
    onChange,
    tags,
    chatStatuses,
    friendFieldFolders,
    scenarios,
    richMenus,
    reminders,
}: {
    row: Row;
    onRemove: () => void;
    onChange: (patch: ActionConfig) => void;
    tags: Tag[];
    chatStatuses: ChatStatus[];
    friendFieldFolders: FriendFieldFolder[];
    scenarios: ScenarioOption[];
    richMenus: RichMenuOption[];
    reminders: ReminderOption[];
}) {
    const ready = ACTION_TYPES.find((a) => a.key === row.key)?.ready ?? true;
    return (
        <div className="rounded-md border-2 border-primary p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold">
                    {LABEL[row.key]}
                    {!ready && (
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                            準備中（保存のみ・配信時は未実行）
                        </span>
                    )}
                </h3>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="削除"
                >
                    <FontAwesomeIcon icon={faTrash} className="size-4" />
                </button>
            </div>

            <div className="mt-4">
                {row.key === "step" && (
                    <StepBody
                        config={row.config}
                        onChange={onChange}
                        scenarios={scenarios}
                    />
                )}
                {row.key === "remind" && (
                    <RemindBody
                        config={row.config}
                        onChange={onChange}
                        reminders={reminders}
                    />
                )}
                {row.key === "tag" && (
                    <TagBody config={row.config} onChange={onChange} tags={tags} />
                )}
                {row.key === "rich_menu" && (
                    <RichMenuBody
                        config={row.config}
                        onChange={onChange}
                        richMenus={richMenus}
                    />
                )}
                {row.key === "bookmark" && (
                    <BookmarkBody config={row.config} onChange={onChange} />
                )}
                {row.key === "friend_field" && (
                    <FriendFieldBody
                        config={row.config}
                        onChange={onChange}
                        friendFieldFolders={friendFieldFolders}
                    />
                )}
                {row.key === "chat_status" && (
                    <ChatStatusBody
                        config={row.config}
                        onChange={onChange}
                        chatStatuses={chatStatuses}
                    />
                )}
                {row.key === "block" && (
                    <BlockBody config={row.config} onChange={onChange} />
                )}
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="mb-1.5 block text-sm font-bold text-muted-foreground">
            {children}
        </span>
    );
}

const selectClass =
    "h-10 rounded-md border border-border bg-background px-3 text-sm font-bold";

function StepBody({
    config,
    onChange,
    scenarios,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
    scenarios: ScenarioOption[];
}) {
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>配信設定</FieldLabel>
                <select
                    className={cn(selectClass, "w-64")}
                    value={(config.op as string) ?? "start"}
                    onChange={(e) => onChange({ op: e.target.value })}
                >
                    <option value="start">ステップ配信を開始</option>
                    <option value="stop">ステップ配信を停止</option>
                </select>
            </div>
            <div>
                <FieldLabel>シナリオ選択</FieldLabel>
                <select
                    className={cn(selectClass, "w-full")}
                    value={String(config.scenarioId ?? 0)}
                    onChange={(e) =>
                        onChange({ scenarioId: Number(e.target.value) })
                    }
                >
                    <option value="0" disabled>
                        シナリオを選択
                    </option>
                    {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function RemindBody({
    config,
    onChange,
    reminders,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
    reminders: ReminderOption[];
}) {
    const op = (config.op as string) ?? "start";
    const endAt = (config.endAt as string) ?? "";
    const [datePart, timePart] = endAt.includes("T")
        ? endAt.split("T")
        : [endAt, ""];

    const setEndAt = (date: string, time: string) => {
        onChange({ endAt: date && time ? `${date}T${time}` : date || "" });
    };

    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>配信設定</FieldLabel>
                <select
                    className={cn(selectClass, "w-64 text-center")}
                    value={op}
                    onChange={(e) => onChange({ op: e.target.value })}
                >
                    <option value="start">リマインド配信を開始</option>
                    <option value="stop">リマインド配信を停止</option>
                </select>
            </div>
            <div>
                <FieldLabel>リマインド選択</FieldLabel>
                <select
                    className={cn(selectClass, "w-full")}
                    value={String(config.reminderId ?? 0)}
                    onChange={(e) =>
                        onChange({ reminderId: Number(e.target.value) })
                    }
                >
                    <option value="0" disabled>
                        リマインドを選択
                    </option>
                    {reminders.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </select>
                {reminders.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        リマインドがありません。先に「リマインド配信」を作成してください。
                    </p>
                )}
            </div>
            {op === "start" && (
                <div>
                    <FieldLabel>配信終了日時</FieldLabel>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="date"
                            value={datePart}
                            onChange={(e) => setEndAt(e.target.value, timePart)}
                            className="h-10 w-44 rounded-md border border-border bg-background px-3 text-sm"
                        />
                        <input
                            type="time"
                            value={timePart}
                            onChange={(e) => setEndAt(datePart, e.target.value)}
                            className="h-10 w-32 rounded-md border border-border bg-background px-3 text-sm"
                        />
                        <span className="text-sm font-bold text-muted-foreground">
                            に配信終了
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        この日時を締切として、各ステップを「○分前」に逆算配信します。
                    </p>
                </div>
            )}
        </div>
    );
}

function TagBody({
    config,
    onChange,
    tags,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
    tags: Tag[];
}) {
    const selected = new Set((config.tagIds as number[]) ?? []);
    const toggle = (id: number) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange({ tagIds: [...next] });
    };
    return (
        <div className="space-y-3">
            <div className="space-y-2 rounded-md border border-border p-2">
                {tags.length === 0 ? (
                    <p className="px-1 py-2 text-xs text-muted-foreground">
                        タグがありません
                    </p>
                ) : (
                    tags.map((t) => (
                        <label
                            key={t.id}
                            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-bold"
                        >
                            <input
                                type="checkbox"
                                className="size-4 accent-primary"
                                checked={selected.has(t.id)}
                                onChange={() => toggle(t.id)}
                            />
                            {t.name}
                        </label>
                    ))
                )}
            </div>
            <div>
                <FieldLabel>タグ操作</FieldLabel>
                <select
                    className={cn(selectClass, "w-32 text-center")}
                    value={(config.op as string) ?? "add"}
                    onChange={(e) => onChange({ op: e.target.value })}
                >
                    <option value="add">つける</option>
                    <option value="remove">外す</option>
                </select>
            </div>
        </div>
    );
}

function RichMenuBody({
    config,
    onChange,
    richMenus,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
    richMenus: RichMenuOption[];
}) {
    const published = richMenus.filter((m) => m.is_published);
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>表示設定</FieldLabel>
                <select
                    className={cn(selectClass, "w-64")}
                    value={(config.op as string) ?? "show"}
                    onChange={(e) => onChange({ op: e.target.value })}
                >
                    <option value="show">表示する</option>
                    <option value="stop">表示を停止</option>
                </select>
            </div>
            {(config.op ?? "show") === "show" && (
                <div>
                    <FieldLabel>リッチメニュー選択（公開済みのみ）</FieldLabel>
                    <select
                        className={cn(selectClass, "w-full")}
                        value={String(config.richMenuId ?? 0)}
                        onChange={(e) =>
                            onChange({ richMenuId: Number(e.target.value) })
                        }
                    >
                        <option value="0" disabled>
                            メニューを選択
                        </option>
                        {published.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    {published.length === 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            公開済みのリッチメニューがありません。先にリッチメニューを公開してください。
                        </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                        ※「表示を停止」は LINE の個別解除に未対応のため、配信時は実行されません。
                    </p>
                </div>
            )}
        </div>
    );
}

function BookmarkBody({
    config,
    onChange,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
}) {
    const mode = (config.mode as string) ?? "add";
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-8">
                <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                        type="radio"
                        checked={mode === "add"}
                        onChange={() => onChange({ mode: "add" })}
                        className="size-4 accent-primary"
                    />
                    ブックマークする
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                        type="radio"
                        checked={mode === "remove"}
                        onChange={() => onChange({ mode: "remove" })}
                        className="size-4 accent-primary"
                    />
                    ブックマークを外す
                </label>
            </div>
            <p className="text-xs text-muted-foreground">
                チャット画面のピン留め（⭐）の付け外しと同じです。
            </p>
        </div>
    );
}

function FriendFieldBody({
    config,
    onChange,
    friendFieldFolders,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
    friendFieldFolders: FriendFieldFolder[];
}) {
    const fields = friendFieldFolders.flatMap((f) => f.fields);
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>友だち情報選択</FieldLabel>
                <select
                    className={cn(selectClass, "w-full")}
                    value={String(config.fieldId ?? 0)}
                    onChange={(e) =>
                        onChange({ fieldId: Number(e.target.value) })
                    }
                >
                    <option value="0" disabled>
                        項目を選択
                    </option>
                    {fields.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <FieldLabel>設定する値</FieldLabel>
                <Input
                    value={(config.value as string) ?? ""}
                    onChange={(e) => onChange({ value: e.target.value })}
                    placeholder="値を入力"
                    className="h-10"
                />
            </div>
        </div>
    );
}

function ChatStatusBody({
    config,
    onChange,
    chatStatuses,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
    chatStatuses: ChatStatus[];
}) {
    return (
        <div className="space-y-4">
            <div>
                <FieldLabel>対応ステータス設定</FieldLabel>
                <select
                    className={cn(selectClass, "w-64")}
                    value={(config.op as string) ?? "add"}
                    onChange={(e) => onChange({ op: e.target.value })}
                >
                    <option value="add">ステータスをつける</option>
                    <option value="remove">ステータスを外す</option>
                </select>
            </div>
            <div>
                <FieldLabel>対応ステータス選択</FieldLabel>
                <select
                    className={cn(selectClass, "w-full")}
                    value={String(config.statusId ?? 0)}
                    onChange={(e) =>
                        onChange({ statusId: Number(e.target.value) })
                    }
                >
                    <option value="0" disabled>
                        ステータスを選択
                    </option>
                    {chatStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function BlockBody({
    config,
    onChange,
}: {
    config: ActionConfig;
    onChange: (patch: ActionConfig) => void;
}) {
    const mode = (config.mode as string) ?? "block";
    const opts = [
        { value: "block", label: "ブロックする" },
        { value: "unblock", label: "ブロック解除" },
        { value: "hide", label: "非表示" },
        { value: "show", label: "表示" },
    ];
    return (
        <div className="flex flex-wrap items-center gap-6">
            {opts.map((o) => (
                <label
                    key={o.value}
                    className="flex items-center gap-2 text-sm font-bold"
                >
                    <input
                        type="radio"
                        checked={mode === o.value}
                        onChange={() => onChange({ mode: o.value })}
                        className="size-4 accent-primary"
                    />
                    {o.label}
                </label>
            ))}
        </div>
    );
}
