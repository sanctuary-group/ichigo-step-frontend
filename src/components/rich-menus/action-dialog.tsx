"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faCirclePlus,
    faTrash,
    faPlus,
    faChevronDown,
    faFaceSmile,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type RichMenuActionTemplate = {
    id: number;
    name: string;
    folder_id: number | null;
};
export type RichMenuActionTemplateFolder = { id: number; name: string };
export type RichMenuActionTag = {
    id: number;
    name: string;
    color?: string | null;
};
export type RichMenuActionOption = { id: number; name: string };
export type RichMenuActionFieldFolder = {
    id: number;
    name: string;
    fields: { id: number; name: string }[];
};

const ACTION_TYPES: { key: string; label: string }[] = [
    { key: "step", label: "ステップ" },
    { key: "template", label: "テンプレート" },
    { key: "text", label: "テキスト" },
    { key: "remind", label: "リマインド" },
    { key: "tag", label: "タグ" },
    { key: "bookmark", label: "ブックマーク" },
    { key: "friend_field", label: "友だち情報" },
    { key: "chat_status", label: "対応ステータス" },
    { key: "block", label: "ブロック" },
];

const ACTION_TITLE: Record<string, string> = {
    step: "ステップ配信を開始・停止",
    template: "送信するテンプレート",
    text: "送信するテキスト",
    remind: "リマインドを開始・停止",
    tag: "タグを付け・外し",
    bookmark: "ブックマーク",
    friend_field: "友だち情報を更新",
    chat_status: "対応ステータスを変更",
    block: "ブロック",
};

type AddedAction = { id: number; key: string };
export type RichMenuSavedAction = {
    key: string;
    config: Record<string, unknown>;
};

function defaultConfig(key: string): Record<string, unknown> {
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
        case "remind":
            return { op: "start", reminderId: 0, endAt: "" };
        case "bookmark":
            return { mode: "add" };
        default:
            return {};
    }
}

export function RichMenuActionDialog({
    open,
    onClose,
    onSave,
    initialKey,
    initialActions,
    templates,
    templateFolders,
    tags,
    scenarios,
    reminders,
    chatStatuses,
    friendFieldFolders,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (actions: RichMenuSavedAction[]) => void;
    initialKey?: string;
    initialActions?: RichMenuSavedAction[];
    templates: RichMenuActionTemplate[];
    templateFolders: RichMenuActionTemplateFolder[];
    tags: RichMenuActionTag[];
    scenarios: RichMenuActionOption[];
    reminders: RichMenuActionOption[];
    chatStatuses: RichMenuActionOption[];
    friendFieldFolders: RichMenuActionFieldFolder[];
}) {
    const [actions, setActions] = useState<AddedAction[]>([]);
    const [configs, setConfigs] = useState<
        Record<number, Record<string, unknown>>
    >({});
    const [seq, setSeq] = useState(1);

    useEffect(() => {
        if (!open) return;
        if (initialActions && initialActions.length > 0) {
            const next = initialActions.map((a, i) => ({ id: i, key: a.key }));
            const cfg: Record<number, Record<string, unknown>> = {};
            initialActions.forEach(
                (a, i) =>
                    (cfg[i] = { ...defaultConfig(a.key), ...(a.config ?? {}) }),
            );
            setActions(next);
            setConfigs(cfg);
            setSeq(initialActions.length);
        } else if (initialKey) {
            setActions([{ id: 0, key: initialKey }]);
            setConfigs({ 0: defaultConfig(initialKey) });
            setSeq(1);
        } else {
            setActions([]);
            setConfigs({});
            setSeq(1);
        }
    }, [open, initialKey, initialActions]);

    if (!open) return null;

    const addAction = (key: string) => {
        setActions((p) => [...p, { id: seq, key }]);
        setConfigs((p) => ({ ...p, [seq]: defaultConfig(key) }));
        setSeq((s) => s + 1);
    };
    const removeAction = (id: number) => {
        setActions((p) => p.filter((a) => a.id !== id));
        setConfigs((p) => {
            const n = { ...p };
            delete n[id];
            return n;
        });
    };
    const setConfig = (id: number, patch: Record<string, unknown>) =>
        setConfigs((p) => ({ ...p, [id]: { ...(p[id] ?? {}), ...patch } }));
    const save = () => {
        onSave(
            actions.map((a) => ({ key: a.key, config: configs[a.id] ?? {} })),
        );
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/40 p-4">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-lg bg-muted/20 shadow-xl">
                {/* ヘッダー */}
                <div className="relative bg-background px-6 py-4 text-center">
                    <h2 className="text-xl font-bold">アクション</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="absolute right-5 top-4 text-muted-foreground hover:text-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-6" />
                    </button>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[280px_1fr]">
                    {/* 左: アクション種別 */}
                    <div className="space-y-3 rounded-lg bg-background p-4">
                        {ACTION_TYPES.map((a) => {
                            const active = actions.some((x) => x.key === a.key);
                            return (
                                <button
                                    key={a.key}
                                    type="button"
                                    onClick={() => addAction(a.key)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-bold transition-colors",
                                        active
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : "border-border hover:bg-muted/50",
                                    )}
                                >
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className={cn(
                                            "size-4",
                                            active
                                                ? "text-white"
                                                : "text-muted-foreground",
                                        )}
                                    />
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* 右: 設定エリア */}
                    <div className="space-y-4 rounded-lg bg-background p-4">
                        {actions.length === 0 ? (
                            <div className="grid h-full place-items-center py-16 text-center text-sm text-muted-foreground">
                                左のアクションを選択してください
                            </div>
                        ) : (
                            actions.map((a) => (
                                <div
                                    key={a.id}
                                    className="rounded-md border-2 border-emerald-500 p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-bold">
                                            {ACTION_TITLE[a.key] ?? a.key}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeAction(a.id)}
                                            aria-label="削除"
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="size-5"
                                            />
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <ActionBody
                                            actionKey={a.key}
                                            config={configs[a.id] ?? {}}
                                            onChange={(patch) =>
                                                setConfig(a.id, patch)
                                            }
                                            templates={templates}
                                            templateFolders={templateFolders}
                                            tags={tags}
                                            scenarios={scenarios}
                                            reminders={reminders}
                                            chatStatuses={chatStatuses}
                                            friendFieldFolders={
                                                friendFieldFolders
                                            }
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* フッター */}
                <div className="bg-muted/20 px-6 py-4">
                    <button
                        type="button"
                        onClick={save}
                        className="mx-auto block w-full max-w-md rounded-md bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}

type Cfg = Record<string, unknown>;

function ActionBody({
    actionKey,
    config,
    onChange,
    templates,
    templateFolders,
    tags,
    scenarios,
    reminders,
    chatStatuses,
    friendFieldFolders,
}: {
    actionKey: string;
    config: Cfg;
    onChange: (patch: Cfg) => void;
    templates: RichMenuActionTemplate[];
    templateFolders: RichMenuActionTemplateFolder[];
    tags: RichMenuActionTag[];
    scenarios: RichMenuActionOption[];
    reminders: RichMenuActionOption[];
    chatStatuses: RichMenuActionOption[];
    friendFieldFolders: RichMenuActionFieldFolder[];
}) {
    switch (actionKey) {
        case "template":
            return (
                <TemplatePicker
                    templates={templates}
                    folders={templateFolders}
                    value={config.templateId as number | null | undefined}
                    onChange={(id) => onChange({ templateId: id })}
                />
            );
        case "text":
            return (
                <TextBody
                    value={(config.text as string) ?? ""}
                    onChange={(text) => onChange({ text })}
                />
            );
        case "tag":
            return (
                <TagBody
                    tags={tags}
                    value={(config.tagIds as number[] | undefined) ?? []}
                    op={(config.op as "add" | "remove") ?? "add"}
                    onChange={(tagIds, op) => onChange({ tagIds, op })}
                />
            );
        case "step":
            return <StepBody config={config} onChange={onChange} scenarios={scenarios} />;
        case "remind":
            return <RemindBody config={config} onChange={onChange} reminders={reminders} />;
        case "bookmark":
            return <BookmarkBody config={config} onChange={onChange} />;
        case "friend_field":
            return (
                <FriendFieldBody
                    config={config}
                    onChange={onChange}
                    friendFieldFolders={friendFieldFolders}
                />
            );
        case "chat_status":
            return <ChatStatusBody config={config} onChange={onChange} chatStatuses={chatStatuses} />;
        case "block":
            return <BlockBody config={config} onChange={onChange} />;
        default:
            return null;
    }
}

const selectClass =
    "h-11 w-full appearance-none rounded-md border border-input bg-background px-4 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-2 text-sm text-muted-foreground">{label}</p>
            {children}
        </div>
    );
}

function Select({
    value,
    onChange,
    children,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("relative", className)}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={selectClass}
            >
                {children}
            </select>
            <FontAwesomeIcon
                icon={faChevronDown}
                className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
        </div>
    );
}

function StepBody({
    config,
    onChange,
    scenarios,
}: {
    config: Cfg;
    onChange: (patch: Cfg) => void;
    scenarios: RichMenuActionOption[];
}) {
    return (
        <div className="space-y-4">
            <Field label="配信設定">
                <Select
                    className="max-w-xs"
                    value={(config.op as string) ?? "start"}
                    onChange={(op) => onChange({ op })}
                >
                    <option value="start">ステップ配信を開始</option>
                    <option value="stop">ステップ配信を停止</option>
                </Select>
            </Field>
            <Field label="シナリオ選択">
                <Select
                    value={String(config.scenarioId ?? 0)}
                    onChange={(v) => onChange({ scenarioId: Number(v) })}
                >
                    <option value="0" disabled>
                        シナリオを選択
                    </option>
                    {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </Select>
                {scenarios.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        シナリオがありません。先に「ステップ配信」を作成してください。
                    </p>
                )}
            </Field>
        </div>
    );
}

function RemindBody({
    config,
    onChange,
    reminders,
}: {
    config: Cfg;
    onChange: (patch: Cfg) => void;
    reminders: RichMenuActionOption[];
}) {
    const op = (config.op as string) ?? "start";
    const endAt = (config.endAt as string) ?? "";
    const [datePart, timePart] = endAt.includes("T")
        ? endAt.split("T")
        : [endAt, ""];
    const setEndAt = (date: string, time: string) =>
        onChange({ endAt: date && time ? `${date}T${time}` : date || "" });

    return (
        <div className="space-y-4">
            <Field label="配信設定">
                <Select
                    className="max-w-xs"
                    value={op}
                    onChange={(v) => onChange({ op: v })}
                >
                    <option value="start">リマインド配信を開始</option>
                    <option value="stop">リマインド配信を停止</option>
                </Select>
            </Field>
            <Field label="リマインド選択">
                <Select
                    value={String(config.reminderId ?? 0)}
                    onChange={(v) => onChange({ reminderId: Number(v) })}
                >
                    <option value="0" disabled>
                        リマインドを選択
                    </option>
                    {reminders.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </Select>
                {reminders.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        リマインドがありません。先に「リマインド配信」を作成してください。
                    </p>
                )}
            </Field>
            {op === "start" && (
                <Field label="配信終了日時">
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="date"
                            value={datePart}
                            onChange={(e) => setEndAt(e.target.value, timePart)}
                            className="h-11 w-44 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                            type="time"
                            value={timePart}
                            onChange={(e) => setEndAt(datePart, e.target.value)}
                            className="h-11 w-32 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <span className="text-sm font-bold text-muted-foreground">
                            に配信終了
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        この日時を締切として、各ステップを「○分前」に逆算配信します。
                    </p>
                </Field>
            )}
        </div>
    );
}

function BookmarkBody({
    config,
    onChange,
}: {
    config: Cfg;
    onChange: (patch: Cfg) => void;
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
                        className="size-4 accent-emerald-500"
                    />
                    ブックマークする
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                        type="radio"
                        checked={mode === "remove"}
                        onChange={() => onChange({ mode: "remove" })}
                        className="size-4 accent-emerald-500"
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
    config: Cfg;
    onChange: (patch: Cfg) => void;
    friendFieldFolders: RichMenuActionFieldFolder[];
}) {
    const fields = friendFieldFolders.flatMap((f) => f.fields);
    return (
        <div className="space-y-4">
            <Field label="友だち情報選択">
                <Select
                    value={String(config.fieldId ?? 0)}
                    onChange={(v) => onChange({ fieldId: Number(v) })}
                >
                    <option value="0" disabled>
                        項目を選択
                    </option>
                    {fields.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.name}
                        </option>
                    ))}
                </Select>
            </Field>
            <Field label="設定する値">
                <input
                    value={(config.value as string) ?? ""}
                    onChange={(e) => onChange({ value: e.target.value })}
                    placeholder="値を入力"
                    className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            </Field>
        </div>
    );
}

function ChatStatusBody({
    config,
    onChange,
    chatStatuses,
}: {
    config: Cfg;
    onChange: (patch: Cfg) => void;
    chatStatuses: RichMenuActionOption[];
}) {
    return (
        <div className="space-y-4">
            <Field label="対応ステータス設定">
                <Select
                    className="max-w-xs"
                    value={(config.op as string) ?? "add"}
                    onChange={(v) => onChange({ op: v })}
                >
                    <option value="add">ステータスをつける</option>
                    <option value="remove">ステータスを外す</option>
                </Select>
            </Field>
            <Field label="対応ステータス選択">
                <Select
                    value={String(config.statusId ?? 0)}
                    onChange={(v) => onChange({ statusId: Number(v) })}
                >
                    <option value="0" disabled>
                        ステータスを選択
                    </option>
                    {chatStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </Select>
            </Field>
        </div>
    );
}

function BlockBody({
    config,
    onChange,
}: {
    config: Cfg;
    onChange: (patch: Cfg) => void;
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
                        className="size-4 accent-emerald-500"
                    />
                    {o.label}
                </label>
            ))}
        </div>
    );
}

function TagBody({
    tags,
    value,
    op,
    onChange,
}: {
    tags: RichMenuActionTag[];
    value: number[];
    op: "add" | "remove";
    onChange: (ids: number[], op: "add" | "remove") => void;
}) {
    const checked = new Set(value);
    const allChecked = tags.length > 0 && checked.size === tags.length;
    const toggleAll = () =>
        onChange(allChecked ? [] : tags.map((t) => t.id), op);
    const toggle = (id: number) => {
        const n = new Set(checked);
        n.has(id) ? n.delete(id) : n.add(id);
        onChange([...n], op);
    };
    const setOp = (next: "add" | "remove") => onChange([...checked], next);

    const selectedNames = tags
        .filter((t) => checked.has(t.id))
        .map((t) => t.name);

    return (
        <div>
            <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border">
                <div className="border-r border-border bg-muted/20 p-2">
                    <button
                        type="button"
                        className="block w-full rounded-md bg-emerald-500 px-4 py-3 text-left text-sm font-bold text-white"
                    >
                        未分類({tags.length})
                    </button>
                </div>
                <div className="min-h-[180px] p-2">
                    <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold hover:bg-muted/40">
                        <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={toggleAll}
                            disabled={tags.length === 0}
                            className="size-4 accent-emerald-500"
                        />
                        以下を全選択
                    </label>
                    {tags.length === 0 ? (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                            タグがありません
                        </p>
                    ) : (
                        tags.map((t) => (
                            <label
                                key={t.id}
                                className="mb-2 flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold hover:bg-muted/40"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked.has(t.id)}
                                    onChange={() => toggle(t.id)}
                                    className="size-4 accent-emerald-500"
                                />
                                {t.name}
                            </label>
                        ))
                    )}
                </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">選択したタグ</p>
            {selectedNames.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                    {selectedNames.map((n) => (
                        <span
                            key={n}
                            className="rounded-full bg-muted px-3 py-1 text-xs font-bold"
                        >
                            {n}
                        </span>
                    ))}
                </div>
            )}

            <p className="mt-3 text-sm text-muted-foreground">タグ操作</p>
            <div className="relative mt-1 w-40">
                <select
                    value={op}
                    onChange={(e) => setOp(e.target.value as "add" | "remove")}
                    className="h-11 w-full appearance-none rounded-md border border-input bg-background px-4 text-center text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    <option value="add">つける</option>
                    <option value="remove">外す</option>
                </select>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
            </div>
        </div>
    );
}

function TextBody({
    value,
    onChange,
}: {
    value: string;
    onChange: (text: string) => void;
}) {
    const text = value;
    const setText = onChange;
    const ref = useRef<HTMLTextAreaElement>(null);

    const insert = (token: string) => {
        const el = ref.current;
        if (!el) {
            setText(text + token);
            return;
        }
        const start = el.selectionStart;
        const end = el.selectionEnd;
        setText(text.slice(0, start) + token + text.slice(end));
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + token.length;
            el.setSelectionRange(pos, pos);
        });
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    自動情報挿入
                </span>
                <button
                    type="button"
                    onClick={() => insert("{{LINE名}}")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-bold hover:bg-muted/50"
                >
                    <FontAwesomeIcon icon={faPlus} className="size-3" />
                    LINE名
                </button>
                <button
                    type="button"
                    aria-label="絵文字"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted/50"
                >
                    <FontAwesomeIcon icon={faFaceSmile} className="size-4" />
                </button>
            </div>

            <div className="relative mt-3">
                <textarea
                    ref={ref}
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 5000))}
                    rows={6}
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-bold text-muted-foreground tabular-nums">
                    {text.length}/5,000
                </span>
            </div>
        </div>
    );
}

function TemplatePicker({
    templates,
    folders,
    value,
    onChange,
}: {
    templates: RichMenuActionTemplate[];
    folders: RichMenuActionTemplateFolder[];
    value: number | null | undefined;
    onChange: (id: number) => void;
}) {
    const folderList =
        folders.length > 0 ? folders : [{ id: 0, name: "未分類" }];
    const [folderId, setFolderId] = useState<number>(folderList[0].id);
    const selectedId = value ?? null;
    const setSelectedId = onChange;

    const inFolder = templates.filter((t) =>
        folderId === 0 ? t.folder_id == null : t.folder_id === folderId,
    );

    return (
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border">
            <div className="border-r border-border bg-muted/20 p-2">
                {folderList.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setFolderId(f.id)}
                        className={cn(
                            "mb-2 block w-full rounded-md px-4 py-3 text-left text-sm font-bold transition-colors",
                            f.id === folderId
                                ? "bg-emerald-500 text-white"
                                : "hover:bg-muted/50",
                        )}
                    >
                        {f.name}
                    </button>
                ))}
            </div>

            <div className="min-h-[180px] p-2">
                {inFolder.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        テンプレートがありません
                    </p>
                ) : (
                    inFolder.map((t) => (
                        <label
                            key={t.id}
                            className="mb-2 flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold hover:bg-muted/40"
                        >
                            <input
                                type="radio"
                                name="rm-template"
                                checked={selectedId === t.id}
                                onChange={() => setSelectedId(t.id)}
                                className="size-4 accent-emerald-500"
                            />
                            {t.name}
                        </label>
                    ))
                )}
            </div>
        </div>
    );
}
