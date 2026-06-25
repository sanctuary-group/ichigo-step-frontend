"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrashCan,
    faPenToSquare,
    faChevronLeft,
    faClock,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    MessageComposer,
    composerValid,
    defaultComposerValue,
    normalizeComposerValue,
    type ComposerValue,
} from "@/components/templates/message-composer";
import { ApiError } from "@/lib/api/client";
import { saveReminder } from "@/lib/api/reminders";
import type { Reminder } from "@/types/reminder";

export type ChannelOption = { id: number; name: string };

type StepData = {
    offset_minutes: number;
    messages: ComposerValue[];
};

type FormData = {
    name: string;
    description: string;
    line_channel_id: number;
    is_active: boolean;
    steps: StepData[];
};

function splitOffset(total: number) {
    return {
        days: Math.floor(total / 1440),
        hours: Math.floor((total % 1440) / 60),
        minutes: total % 60,
    };
}

function offsetLabel(total: number): string {
    if (total === 0) return "締切ちょうど";
    const { days, hours, minutes } = splitOffset(total);
    const parts: string[] = [];
    if (days) parts.push(`${days}日`);
    if (hours) parts.push(`${hours}時間`);
    if (minutes) parts.push(`${minutes}分`);
    return `締切の ${parts.join("")} 前`;
}

function toStepData(reminder: Reminder | null): StepData[] {
    if (!reminder?.steps?.length) {
        return [{ offset_minutes: 1440, messages: [defaultComposerValue()] }];
    }
    return reminder.steps.map((s) => ({
        offset_minutes: s.offset_minutes,
        messages:
            s.messages && s.messages.length
                ? s.messages.map((m) => defaultComposerValue(m))
                : [defaultComposerValue()],
    }));
}

export function ReminderFormInner({
    reminder,
    editId,
    channels,
}: {
    reminder: Reminder | null;
    editId?: string;
    channels: ChannelOption[];
}) {
    const router = useRouter();
    const isEdit = !!editId;

    const [data, setDataState] = useState<FormData>({
        name: reminder?.name ?? "",
        description: reminder?.description ?? "",
        line_channel_id: reminder?.line_channel_id ?? channels[0]?.id ?? 0,
        is_active: reminder?.is_active ?? true,
        steps: toStepData(reminder),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setData = <K extends keyof FormData>(key: K, value: FormData[K]) =>
        setDataState((d) => ({ ...d, [key]: value }));

    // メッセージエディタ
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerValue, setComposerValue] = useState<ComposerValue>(() =>
        defaultComposerValue(),
    );
    const [target, setTarget] = useState<{
        stepIdx: number;
        msgIdx: number | null;
    } | null>(null);

    const updateStep = (idx: number, patch: Partial<StepData>) => {
        setData(
            "steps",
            data.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
        );
    };

    const setOffsetPart = (
        idx: number,
        part: "days" | "hours" | "minutes",
        val: number,
    ) => {
        const cur = splitOffset(data.steps[idx].offset_minutes);
        cur[part] = Math.max(0, val || 0);
        updateStep(idx, {
            offset_minutes: cur.days * 1440 + cur.hours * 60 + cur.minutes,
        });
    };

    const addStep = () => {
        setData("steps", [
            ...data.steps,
            { offset_minutes: 60, messages: [defaultComposerValue()] },
        ]);
    };
    const removeStep = (idx: number) => {
        if (data.steps.length <= 1) return;
        setData(
            "steps",
            data.steps.filter((_, i) => i !== idx),
        );
    };

    const openAddMessage = (stepIdx: number) => {
        setTarget({ stepIdx, msgIdx: null });
        setComposerValue(defaultComposerValue());
        setComposerOpen(true);
    };
    const openEditMessage = (stepIdx: number, msgIdx: number) => {
        setTarget({ stepIdx, msgIdx });
        setComposerValue(data.steps[stepIdx].messages[msgIdx]);
        setComposerOpen(true);
    };
    const saveComposer = () => {
        if (!target || !composerValid(composerValue)) return;
        const v = normalizeComposerValue(composerValue);
        const step = data.steps[target.stepIdx];
        const messages =
            target.msgIdx === null
                ? [...step.messages, v]
                : step.messages.map((m, i) => (i === target.msgIdx ? v : m));
        updateStep(target.stepIdx, { messages });
        setComposerOpen(false);
        setTarget(null);
    };
    const removeMessage = (stepIdx: number, msgIdx: number) => {
        const step = data.steps[stepIdx];
        if (step.messages.length <= 1) return;
        updateStep(stepIdx, {
            messages: step.messages.filter((_, i) => i !== msgIdx),
        });
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            await saveReminder(
                {
                    name: data.name,
                    description: data.description || null,
                    line_channel_id: data.line_channel_id,
                    is_active: data.is_active,
                    steps: data.steps.map((s) => ({
                        offset_minutes: s.offset_minutes,
                        messages: s.messages.map(
                            (m) => ({ ...m }) as Record<string, unknown>,
                        ),
                    })),
                },
                editId,
            );
            router.push("/reminders");
        } catch (err) {
            if (err instanceof ApiError) setErrors(err.fieldErrors());
            setProcessing(false);
        }
    };

    return (
        <>
            <form
                onSubmit={onSubmit}
                className="flex-1 flex flex-col h-full overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/reminders"
                            className="grid place-items-center size-9 rounded-md hover:bg-muted text-muted-foreground"
                            aria-label="戻る"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="size-4" />
                        </Link>
                        <h1 className="text-lg font-bold tracking-tight">
                            {isEdit ? "リマインド編集" : "リマインド作成"}
                        </h1>
                    </div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {processing ? "保存中..." : "保存"}
                    </Button>
                </div>

                <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-3xl">
                    {/* 基本情報 */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="rm-name" className="text-sm font-bold">
                                リマインド名
                            </Label>
                            <Input
                                id="rm-name"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                maxLength={100}
                                placeholder="例: イベント前日リマインド"
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="rm-desc" className="text-sm font-bold">
                                説明（任意）
                            </Label>
                            <Input
                                id="rm-desc"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                maxLength={500}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold">配信 LINE チャネル</Label>
                            {channels.length === 0 ? (
                                <Link
                                    href="/settings/channels"
                                    className="block text-sm text-blue-600 dark:text-blue-400 underline"
                                >
                                    先に LINE チャネルを登録してください
                                </Link>
                            ) : (
                                <select
                                    value={data.line_channel_id}
                                    onChange={(e) =>
                                        setData(
                                            "line_channel_id",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {channels.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <label className="flex items-center gap-3 text-sm font-bold">
                            <Switch
                                checked={data.is_active}
                                onCheckedChange={(v) => setData("is_active", v)}
                            />
                            稼働中にする
                        </label>
                    </div>

                    {/* ステップ */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold">
                                リマインドステップ（締切から逆算して配信）
                            </h2>
                        </div>
                        {errors.steps && (
                            <p className="text-xs text-destructive">
                                {errors.steps}
                            </p>
                        )}

                        {data.steps.map((step, stepIdx) => {
                            const { days, hours, minutes } = splitOffset(
                                step.offset_minutes,
                            );
                            return (
                                <div
                                    key={stepIdx}
                                    className="rounded-lg border border-border p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <FontAwesomeIcon
                                                icon={faClock}
                                                className="size-3.5 text-primary"
                                            />
                                            {offsetLabel(step.offset_minutes)}
                                        </div>
                                        {data.steps.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStep(stepIdx)}
                                                className="text-muted-foreground hover:text-destructive"
                                                aria-label="ステップ削除"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrashCan}
                                                    className="size-3.5"
                                                />
                                            </button>
                                        )}
                                    </div>

                                    {/* オフセット入力 */}
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">締切の</span>
                                        <OffsetInput
                                            value={days}
                                            onChange={(v) =>
                                                setOffsetPart(stepIdx, "days", v)
                                            }
                                            unit="日"
                                        />
                                        <OffsetInput
                                            value={hours}
                                            onChange={(v) =>
                                                setOffsetPart(stepIdx, "hours", v)
                                            }
                                            unit="時間"
                                        />
                                        <OffsetInput
                                            value={minutes}
                                            onChange={(v) =>
                                                setOffsetPart(stepIdx, "minutes", v)
                                            }
                                            unit="分"
                                        />
                                        <span className="text-muted-foreground">前に配信</span>
                                    </div>

                                    {/* メッセージ */}
                                    <div className="space-y-2">
                                        {step.messages.map((m, msgIdx) => (
                                            <div
                                                key={msgIdx}
                                                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                                            >
                                                <span className="truncate">
                                                    {m.message_type === "text"
                                                        ? m.text_content || "(空のテキスト)"
                                                        : `[${m.message_type}]`}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditMessage(
                                                                stepIdx,
                                                                msgIdx,
                                                            )
                                                        }
                                                        className="text-muted-foreground hover:text-foreground"
                                                        aria-label="編集"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faPenToSquare}
                                                            className="size-3.5"
                                                        />
                                                    </button>
                                                    {step.messages.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeMessage(
                                                                    stepIdx,
                                                                    msgIdx,
                                                                )
                                                            }
                                                            className="text-muted-foreground hover:text-destructive"
                                                            aria-label="削除"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrashCan}
                                                                className="size-3.5"
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {step.messages.length < 5 && (
                                            <button
                                                type="button"
                                                onClick={() => openAddMessage(stepIdx)}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                ＋ メッセージを追加
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addStep}
                            className="w-full"
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3" />
                            ステップを追加
                        </Button>
                    </div>
                </div>
            </form>

            {/* メッセージエディタ モーダル */}
            {composerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl">
                        <div className="border-b border-border px-6 py-4">
                            <h2 className="text-base font-bold">メッセージ</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <MessageComposer
                                value={composerValue}
                                onChange={(patch) =>
                                    setComposerValue((v) => ({ ...v, ...patch }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setComposerOpen(false)}
                            >
                                キャンセル
                            </Button>
                            <Button
                                type="button"
                                onClick={saveComposer}
                                disabled={!composerValid(composerValue)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                確定
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function OffsetInput({
    value,
    onChange,
    unit,
}: {
    value: number;
    onChange: (v: number) => void;
    unit: string;
}) {
    return (
        <span className="inline-flex items-center gap-1">
            <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm text-center tabular-nums"
            />
            <span className="text-muted-foreground">{unit}</span>
        </span>
    );
}
