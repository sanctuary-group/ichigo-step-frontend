"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPaperPlane,
    faSave,
    faImage,
    faXmark,
    faSpinner,
    faPlus,
    faTrash,
    faRotate,
    faCircleQuestion,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faChevronDown,
    faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
    FilterDialog,
    type TargetFilter,
    type FriendFieldFolder,
} from "@/components/broadcasts/filter-dialog";
import {
    MessageComposer,
    composerValid,
    defaultComposerValue,
    normalizeComposerValue,
    type ComposerValue,
} from "@/components/templates/message-composer";
import { BroadcastPreviewTestDialog } from "@/components/broadcasts/preview-test-dialog";
import { ActionDialog } from "@/components/broadcasts/action-dialog";
import { BroadcastConfirmDialog } from "@/components/broadcasts/confirm-dialog";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { uploadImage } from "@/lib/api/uploads";
import {
    fetchFormChannels,
    fetchFormTags,
    fetchFormChatStatuses,
    fetchFormTemplates,
    fetchFormScenarios,
    fetchFormRichMenus,
    fetchFormReminders,
    fetchFormFriendFieldFolders,
    fetchRawBroadcast,
    submitBroadcast,
    fetchRecipientCount,
} from "@/lib/api/broadcast-form-data";
import type { Tag, ChatStatus } from "@/types/chat";
import type {
    Broadcast,
    BroadcastAction,
    BroadcastMessageType,
    BroadcastTargetType,
    LineChannel,
    ScenarioOption,
    RichMenuOption,
    ReminderOption,
} from "@/types/broadcast";

const MAX_TITLE = 20;
const MAX_TEXT = 5000;
const MAX_SCHEDULES = 10;

const ACTION_LABEL: Record<string, string> = {
    step: "ステップ",
    remind: "リマインド",
    tag: "タグ",
    rich_menu: "リッチメニュー",
    bookmark: "ブックマーク",
    friend_field: "友だち情報",
    chat_status: "対応ステータス",
    block: "ブロック・非表示",
};

type ImportTemplate = { id: number; name: string; messages: BMessage[] };

type InnerProps = {
    channels: LineChannel[];
    tags: Tag[];
    chatStatuses: ChatStatus[];
    broadcast: Broadcast | null;
    activeFriendsCount: number;
    friendFieldFolders: FriendFieldFolder[];
    templates: ImportTemplate[];
    scenarioOptions: ScenarioOption[];
    richMenuOptions: RichMenuOption[];
    reminderOptions: ReminderOption[];
    editId?: string;
};

type BMessageType =
    | "text"
    | "image"
    | "video"
    | "audio"
    | "sticker"
    | "location"
    | "panel";

type BMessage = {
    message_type: BMessageType;
    text_content?: string;
    image_url?: string;
    image_preview_url?: string;
    media_duration?: number | null;
    sticker_package_id?: number | null;
    sticker_id?: number | null;
    location_title?: string | null;
    location_address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    panel_content?: unknown;
};

type FormData = {
    title: string;
    line_channel_id: number;
    target_type: BroadcastTargetType;
    target_tag_id: number | null;
    target_filter: TargetFilter | null;
    linked_template_id: number | null;
    messages: BMessage[];
    actions: BroadcastAction[];
    scheduled_ats: string[];
    action: "draft" | "schedule" | "send_now";
};

type SendTiming = "immediate" | "scheduled";

function pad(n: number) {
    return n.toString().padStart(2, "0");
}

function toLocalInput(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSchedule(): string {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function splitDt(s: string) {
    const [date, time] = (s || "T").split("T");
    return { date: date ?? "", time: time ?? "" };
}

// Inertia useForm の最小互換 shim（data/setData/errors/processing）。
function useFormState<T extends Record<string, unknown>>(initial: T) {
    const [data, setDataState] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    function setData<K extends keyof T>(keyOrObj: K | T, value?: T[K]) {
        if (typeof keyOrObj === "string") {
            setDataState((d) => ({ ...d, [keyOrObj]: value }));
        } else {
            setDataState(keyOrObj as T);
        }
    }
    return { data, setData, setDataState, errors, setErrors, processing, setProcessing };
}

function BroadcastsFormInner({
    channels,
    tags,
    chatStatuses,
    broadcast,
    activeFriendsCount,
    friendFieldFolders,
    templates,
    scenarioOptions,
    richMenuOptions,
    reminderOptions,
    editId,
}: InnerProps) {
    const router = useRouter();
    const [filterOpen, setFilterOpen] = useState(false);

    const isEdit = !!broadcast;

    const form = useFormState<FormData>({
        title: broadcast?.title ?? "",
        line_channel_id: broadcast?.line_channel_id ?? channels[0]?.id ?? 0,
        messages:
            ((broadcast as unknown as { messages?: BMessage[] })?.messages ??
                []) as BMessage[],
        target_type: broadcast?.target_type ?? "all",
        target_tag_id: broadcast?.target_tag_id ?? null,
        target_filter:
            (broadcast?.target_filter as TargetFilter | null) ?? null,
        linked_template_id:
            (broadcast as unknown as { linked_template_id?: number | null })
                ?.linked_template_id ?? null,
        actions: (broadcast?.actions as BroadcastAction[] | undefined) ?? [],
        scheduled_ats: broadcast?.scheduled_at
            ? [toLocalInput(broadcast.scheduled_at)]
            : [defaultSchedule()],
        action: "draft",
    });

    const [step, setStep] = useState<1 | 2>(1);
    const [timing, setTiming] = useState<SendTiming>(
        broadcast?.scheduled_at || !isEdit ? "scheduled" : "immediate",
    );
    const [recipientCount, setRecipientCount] = useState<number | null>(
        activeFriendsCount,
    );
    const [recalculating, setRecalculating] = useState(false);
    const [templateOpen, setTemplateOpen] = useState(false);
    const [modeOpen, setModeOpen] = useState(false);
    const [templateMode, setTemplateMode] = useState<"copy" | "link">("link");
    const [previewTestOpen, setPreviewTestOpen] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerValue, setComposerValue] = useState<ComposerValue>(() =>
        defaultComposerValue(),
    );
    const [composerIndex, setComposerIndex] = useState<number | null>(null);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const openAddMessage = () => {
        if (form.data.messages.length >= 5) return;
        setComposerValue(defaultComposerValue());
        setComposerIndex(null);
        setComposerOpen(true);
    };
    const openEditMessage = (i: number) => {
        setComposerValue(
            defaultComposerValue(
                form.data.messages[
                    i
                ] as Parameters<typeof defaultComposerValue>[0],
            ),
        );
        setComposerIndex(i);
        setComposerOpen(true);
    };
    const saveComposer = () => {
        const msg = normalizeComposerValue(composerValue) as BMessage;
        if (composerIndex === null) {
            form.setData("messages", [...form.data.messages, msg]);
        } else {
            form.setData(
                "messages",
                form.data.messages.map((m, j) =>
                    j === composerIndex ? msg : m,
                ),
            );
        }
        setComposerOpen(false);
    };
    const removeMessage = (i: number) => {
        form.setData(
            "messages",
            form.data.messages.filter((_, j) => j !== i),
        );
    };
    const onPickTemplate = (t: ImportTemplate) => {
        if (templateMode === "link") {
            // テンプレートをそのまま利用（リンク・自動更新）。内容はテンプレートに従う
            form.setData({
                ...form.data,
                linked_template_id: t.id,
                messages: t.messages,
            });
        } else {
            // 引用してコピー（独立編集）
            const remaining = 5 - form.data.messages.length;
            if (remaining <= 0) return;
            form.setData("messages", [
                ...form.data.messages,
                ...t.messages.slice(0, remaining),
            ]);
        }
    };
    const unlinkTemplate = () =>
        form.setData({ ...form.data, linked_template_id: null, messages: [] });

    const linked = form.data.linked_template_id != null;
    const linkedTemplateName = templates.find(
        (t) => t.id === form.data.linked_template_id,
    )?.name;

    useEffect(() => {
        if (channels.length > 0 && form.data.line_channel_id === 0) {
            form.setData("line_channel_id", channels[0].id);
        }
    }, [channels.length]);

    const selectedChannel =
        channels.find((c) => c.id === form.data.line_channel_id) ?? channels[0];

    const recalc = () => {
        setRecalculating(true);
        fetchRecipientCount({
            target_type: form.data.target_type,
            target_filter: form.data.target_filter,
        })
            .then((count) => setRecipientCount(count))
            .catch(() => setRecipientCount(null))
            .finally(() => setRecalculating(false));
    };

    // 配信先が変わったら配信数を未確定にする
    useEffect(() => {
        if (form.data.target_type === "all") {
            setRecipientCount(activeFriendsCount);
        } else {
            setRecipientCount(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.target_type, form.data.target_filter]);

    // 日時操作
    const setScheduleAt = (i: number, value: string) => {
        const next = [...form.data.scheduled_ats];
        next[i] = value;
        form.setData("scheduled_ats", next);
    };
    const addSchedule = () => {
        if (form.data.scheduled_ats.length >= MAX_SCHEDULES) return;
        form.setData("scheduled_ats", [
            ...form.data.scheduled_ats,
            defaultSchedule(),
        ]);
    };
    const removeSchedule = (i: number) => {
        const next = form.data.scheduled_ats.filter((_, j) => j !== i);
        form.setData("scheduled_ats", next.length ? next : [defaultSchedule()]);
    };

    const step1Valid =
        form.data.title.trim().length > 0 &&
        (timing === "immediate" ||
            form.data.scheduled_ats.every((s) => {
                const { date, time } = splitDt(s);
                return date && time;
            })) &&
        !!selectedChannel;

    const submit = async (action: FormData["action"]) => {
        form.setProcessing(true);
        form.setErrors({});
        try {
            await submitBroadcast({ ...form.data, action }, editId);
            router.push("/broadcasts");
        } catch (e) {
            if (e instanceof ApiError) form.setErrors(e.fieldErrors());
            form.setProcessing(false);
        }
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit(timing === "immediate" ? "send_now" : "schedule");
    };

    return (
        <>
            <form
                onSubmit={onSubmit}
                className={cn(
                    "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5",
                    composerOpen && "hidden",
                )}
            >
                <div className="flex items-start justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEdit ? "メッセージ編集" : "メッセージ登録"}
                    </h1>
                    <Link
                        href="/broadcasts"
                        className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
                    >
                        メッセージ配信一覧に戻る
                    </Link>
                </div>

                <hr className="border-border" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* 管理用タイトル */}
                            <Card>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <Label className="text-sm font-bold">
                                            管理用タイトル
                                            <span className="font-normal text-muted-foreground">
                                                （友だちには公開されません）
                                            </span>
                                            <span className="text-destructive ml-1">
                                                *
                                            </span>
                                        </Label>
                                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                            {form.data.title.length}/{MAX_TITLE}
                                        </span>
                                    </div>
                                    <Input
                                        value={form.data.title}
                                        onChange={(e) =>
                                            form.setData("title", e.target.value)
                                        }
                                        maxLength={MAX_TITLE}
                                        className="mt-3 h-11"
                                    />
                                    {form.errors.title && (
                                        <p className="text-xs text-destructive mt-1">
                                            {form.errors.title}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 送信者名 */}
                            <Card>
                                <CardContent className="p-5">
                                    <Label className="text-sm font-bold">
                                        送信者名
                                    </Label>
                                    {channels.length === 0 ? (
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            アクティブな LINE
                                            アカウントがありません。{" "}
                                            <Link
                                                href="/settings/channels"
                                                className="text-blue-600 dark:text-blue-400 underline"
                                            >
                                                設定
                                            </Link>
                                        </p>
                                    ) : (
                                        <div className="mt-3 flex items-center gap-3">
                                            <ChannelAvatar
                                                name={selectedChannel?.name ?? ""}
                                            />
                                            <span className="text-sm font-medium">
                                                {selectedChannel?.name}
                                            </span>
                                            {channels.length > 1 ? (
                                                <select
                                                    value={
                                                        form.data.line_channel_id
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "line_channel_id",
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="ml-auto h-9 rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    {channels.map((c) => (
                                                        <option
                                                            key={c.id}
                                                            value={c.id}
                                                        >
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="ml-auto bg-blue-500 hover:bg-blue-600 text-white"
                                                    disabled
                                                    title="送信者名はアカウント設定から変更します"
                                                >
                                                    設定
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 配信タイミング設定 */}
                            <Card>
                                <CardContent className="p-5 space-y-4">
                                    <Label className="text-sm font-bold">
                                        配信タイミング設定
                                    </Label>
                                    <RadioGroup
                                        value={timing}
                                        onValueChange={(v) =>
                                            v && setTiming(v as SendTiming)
                                        }
                                        className="space-y-3"
                                    >
                                        <Label
                                            className={cn(
                                                "flex items-center gap-3 cursor-pointer text-sm",
                                                timing === "immediate"
                                                    ? "text-primary font-bold"
                                                    : "text-foreground font-normal",
                                            )}
                                        >
                                            <RadioGroupItem value="immediate" />
                                            メッセージ登録後すぐに配信
                                        </Label>

                                        <div className="space-y-2">
                                            <Label
                                                className={cn(
                                                    "flex items-center gap-3 cursor-pointer text-sm",
                                                    timing === "scheduled"
                                                        ? "text-primary font-bold"
                                                        : "text-foreground font-normal",
                                                )}
                                            >
                                                <RadioGroupItem value="scheduled" />
                                                配信予約
                                            </Label>

                                            {timing === "scheduled" && (
                                                <div className="space-y-2 pl-7">
                                                    {form.data.scheduled_ats.map(
                                                        (s, i) => {
                                                            const { date, time } =
                                                                splitDt(s);
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center gap-2 flex-wrap"
                                                                >
                                                                    <Input
                                                                        type="date"
                                                                        value={
                                                                            date
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setScheduleAt(
                                                                                i,
                                                                                `${e.target.value}T${time || "00:00"}`,
                                                                            )
                                                                        }
                                                                        className="h-10 w-44"
                                                                    />
                                                                    <Input
                                                                        type="time"
                                                                        value={
                                                                            time
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setScheduleAt(
                                                                                i,
                                                                                `${date}T${e.target.value}`,
                                                                            )
                                                                        }
                                                                        className="h-10 w-28"
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">
                                                                        に配信
                                                                    </span>
                                                                    {form.data
                                                                        .scheduled_ats
                                                                        .length >
                                                                        1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeSchedule(
                                                                                    i,
                                                                                )
                                                                            }
                                                                            className="text-muted-foreground hover:text-destructive"
                                                                            aria-label="削除"
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faTrash
                                                                                }
                                                                                className="size-3.5"
                                                                            />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </RadioGroup>

                                    {timing === "scheduled" && (
                                        <>
                                            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                                                配信日時は複数登録ができます。最大{MAX_SCHEDULES}個の日時まで登録可能です。
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addSchedule}
                                                disabled={
                                                    form.data.scheduled_ats
                                                        .length >= MAX_SCHEDULES
                                                }
                                                className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPlus}
                                                    className="size-3"
                                                />
                                                配信日時追加
                                            </button>
                                        </>
                                    )}
                                    {form.errors.scheduled_ats && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.scheduled_ats}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 配信先絞込み */}
                            <Card>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label className="text-sm font-bold">
                                            配信先絞込み
                                        </Label>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-bold">
                                                配信数
                                            </span>
                                            <FontAwesomeIcon
                                                icon={faCircleQuestion}
                                                className="size-3.5 text-muted-foreground"
                                            />
                                            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                                {recipientCount != null
                                                    ? `${recipientCount.toLocaleString()}人(予定)`
                                                    : "—"}
                                            </span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-blue-500 hover:bg-blue-600 text-white h-8"
                                                onClick={recalc}
                                                disabled={recalculating}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faRotate}
                                                    spin={recalculating}
                                                    className="size-3"
                                                />
                                                再計算
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <RadioGroup
                                            value={form.data.target_type}
                                            onValueChange={(v) =>
                                                v &&
                                                form.setData(
                                                    "target_type",
                                                    v as BroadcastTargetType,
                                                )
                                            }
                                            className="flex items-center gap-4"
                                        >
                                            <Label
                                                className={cn(
                                                    "flex items-center gap-2 cursor-pointer text-sm",
                                                    form.data.target_type ===
                                                        "all"
                                                        ? "text-primary font-bold"
                                                        : "text-foreground font-normal",
                                                )}
                                            >
                                                <RadioGroupItem value="all" />
                                                すべての友だち
                                            </Label>
                                            <Label
                                                className={cn(
                                                    "flex items-center gap-2 cursor-pointer text-sm",
                                                    form.data.target_type ===
                                                        "tag"
                                                        ? "text-primary font-bold"
                                                        : "text-foreground font-normal",
                                                )}
                                            >
                                                <RadioGroupItem value="tag" />
                                                絞り込み
                                            </Label>
                                        </RadioGroup>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={
                                                form.data.target_type === "all"
                                            }
                                            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                                            onClick={() => setFilterOpen(true)}
                                        >
                                            設定
                                        </Button>
                                    </div>

                                    <div className="min-h-24 rounded-md bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                                        {form.data.target_type === "all"
                                            ? "未設定（全員）"
                                            : filterSummary(
                                                  form.data.target_filter,
                                              )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                {/* ステップ1: メッセージ登録へ進む */}
                {step === 1 && (
                    <div className="flex flex-col items-start gap-3 pt-2">
                        <Button
                            type="button"
                            disabled={!step1Valid}
                            onClick={() => setStep(2)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6"
                        >
                            メッセージの登録に進む
                            <FontAwesomeIcon
                                icon={faChevronRight}
                                className="size-3"
                            />
                        </Button>
                        <Link
                            href="/broadcasts"
                            className="text-sm text-blue-600 dark:text-blue-400 underline"
                        >
                            戻る
                        </Link>
                    </div>
                )}

                {/* ステップ2: メッセージ登録（下に展開） */}
                {step === 2 && (
                    <>
                        <hr className="border-border" />
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">メッセージ登録</h2>

                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                        disabled={
                                            linked ||
                                            form.data.messages.length >= 5
                                        }
                                        onClick={openAddMessage}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            className="size-3"
                                        />
                                        メッセージ追加
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                        disabled={linked}
                                        onClick={() => setModeOpen(true)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            className="size-3"
                                        />
                                        テンプレートから追加
                                    </Button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewTestOpen(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    プレビュー・テスト
                                </button>
                            </div>

                            {linked && (
                                <div className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm">
                                    <span className="text-primary">
                                        テンプレート「{linkedTemplateName}
                                        」を利用中（元のテンプレート編集が自動反映されます）
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={unlinkTemplate}
                                    >
                                        解除
                                    </Button>
                                </div>
                            )}

                            {form.data.messages.length === 0 ? (
                                <div className="rounded-md bg-muted/40 px-3 py-8 text-center text-sm text-muted-foreground">
                                    メッセージが登録されていません
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {form.data.messages.map((m, i) => (
                                        <li
                                            key={i}
                                            className="rounded-md border border-border p-3"
                                        >
                                            <MessageRow
                                                message={m}
                                                index={i}
                                                total={form.data.messages.length}
                                                readOnly={linked}
                                                onEdit={() => openEditMessage(i)}
                                                onRemove={() => removeMessage(i)}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {form.errors.messages && (
                                <p className="text-xs text-destructive">
                                    {form.errors.messages}
                                </p>
                            )}
                        </div>

                        {/* いちごアクション */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setActionsOpen((v) => !v)}
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                いちごアクションを追加
                                <FontAwesomeIcon
                                    icon={
                                        actionsOpen
                                            ? faChevronUp
                                            : faChevronDown
                                    }
                                    className="size-3"
                                />
                            </button>

                            {actionsOpen && (
                                <div className="rounded-md border border-border p-4 space-y-4">
                                    <div className="border-b border-border">
                                        <span className="inline-block border-b-2 border-primary pb-2 text-sm font-bold text-primary">
                                            いちごアクション
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                        onClick={() => setActionDialogOpen(true)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            className="size-3"
                                        />
                                        アクション登録
                                    </Button>
                                    {form.data.actions.length === 0 ? (
                                        <div className="rounded-md bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                                            いちごアクションが登録されていません
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {form.data.actions.map((a, i) => (
                                                <li
                                                    key={`${a.key}-${i}`}
                                                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                                                >
                                                    <span className="font-bold">
                                                        {ACTION_LABEL[a.key] ??
                                                            a.key}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setActionDialogOpen(
                                                                    true,
                                                                )
                                                            }
                                                            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                                        >
                                                            編集
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                form.setData(
                                                                    "actions",
                                                                    form.data.actions.filter(
                                                                        (_, j) =>
                                                                            j !== i,
                                                                    ),
                                                                )
                                                            }
                                                            className="text-muted-foreground hover:text-destructive"
                                                            aria-label="削除"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                                className="size-3.5"
                                                            />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <hr className="border-border" />

                        <div className="flex items-center gap-3 flex-wrap pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                            >
                                <FontAwesomeIcon
                                    icon={faChevronLeft}
                                    className="size-3"
                                />
                                配信設定に戻る
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setConfirmOpen(true)}
                                disabled={
                                    form.processing ||
                                    form.data.messages.length === 0
                                }
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                配信内容を確認して送信に進む
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => submit("draft")}
                                disabled={form.processing}
                            >
                                <FontAwesomeIcon
                                    icon={faSave}
                                    className="size-3.5"
                                />
                                下書きとして保存
                            </Button>
                            {form.processing && (
                                <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        spin
                                        className="size-3"
                                    />
                                    送信中...
                                </span>
                            )}
                        </div>
                    </>
                )}
            </form>

            <FilterDialog
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                value={form.data.target_filter}
                onApply={(filter) => form.setData("target_filter", filter)}
                tags={tags}
                chatStatuses={chatStatuses}
                friendFieldFolders={friendFieldFolders}
            />

            <ActionDialog
                open={actionDialogOpen}
                onClose={() => setActionDialogOpen(false)}
                initial={form.data.actions}
                onSave={(actions) => form.setData("actions", actions)}
                tags={tags}
                chatStatuses={chatStatuses}
                friendFieldFolders={friendFieldFolders}
                scenarios={scenarioOptions}
                richMenus={richMenuOptions}
                reminders={reminderOptions}
            />

            <BroadcastConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => {
                    setConfirmOpen(false);
                    submit(timing === "immediate" ? "send_now" : "schedule");
                }}
                processing={form.processing}
                title={form.data.title}
                scheduledLabel={
                    timing === "immediate"
                        ? "メッセージ登録後すぐに配信"
                        : form.data.scheduled_ats
                              .map((s) => s.replace("T", " "))
                              .join("、")
                }
                targetLabel={
                    form.data.target_type === "all"
                        ? "未設定（全員）"
                        : filterSummary(form.data.target_filter)
                }
                recipientCount={recipientCount}
                channelName={selectedChannel?.name ?? ""}
                messages={
                    linked
                        ? (templates.find(
                              (t) => t.id === form.data.linked_template_id,
                          )?.messages ?? [])
                        : form.data.messages
                }
                actions={form.data.actions}
            />

            <BroadcastPreviewTestDialog
                open={previewTestOpen}
                onClose={() => setPreviewTestOpen(false)}
                title={form.data.title}
                scheduledLabel={
                    timing === "immediate"
                        ? "メッセージ登録後すぐに配信"
                        : form.data.scheduled_ats
                              .map((s) => s.replace("T", " "))
                              .join("、")
                }
                targetLabel={
                    form.data.target_type === "all"
                        ? "未設定（全員）"
                        : filterSummary(form.data.target_filter)
                }
                recipientCount={recipientCount}
                channelName={selectedChannel?.name ?? ""}
                messages={
                    linked
                        ? (templates.find(
                              (t) => t.id === form.data.linked_template_id,
                          )?.messages ?? [])
                        : form.data.messages
                }
                linkedTemplateId={form.data.linked_template_id}
                actions={form.data.actions}
            />

            <TemplateModeDialog
                open={modeOpen}
                onClose={() => setModeOpen(false)}
                onDecide={(mode) => {
                    setTemplateMode(mode);
                    setModeOpen(false);
                    setTemplateOpen(true);
                }}
            />

            <TemplateImportDialog
                open={templateOpen}
                onClose={() => setTemplateOpen(false)}
                templates={templates}
                onImport={onPickTemplate}
            />

            {composerOpen && (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <h2 className="text-lg font-bold">
                            {composerIndex === null
                                ? "メッセージ追加"
                                : "メッセージ編集"}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setComposerOpen(false)}
                            aria-label="閉じる"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <FontAwesomeIcon icon={faXmark} className="size-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <MessageComposer
                            value={composerValue}
                            onChange={(patch) =>
                                setComposerValue((v) => ({ ...v, ...patch }))
                            }
                            friendFieldFolders={friendFieldFolders}
                            tags={tags}
                            scenarios={[]}
                        />
                        <div className="flex items-center gap-3 pt-5">
                            <Button
                                type="button"
                                disabled={!composerValid(composerValue)}
                                onClick={saveComposer}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10"
                            >
                                保存
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="px-8 h-10"
                                onClick={() => setComposerOpen(false)}
                            >
                                戻る
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function TemplateModeDialog({
    open,
    onClose,
    onDecide,
}: {
    open: boolean;
    onClose: () => void;
    onDecide: (mode: "copy" | "link") => void;
}) {
    const [mode, setMode] = useState<"copy" | "link">("link");
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-lg bg-background shadow-xl">
                <div className="flex items-start justify-between px-6 pt-5">
                    <div className="flex-1" />
                    <h2 className="text-xl font-bold">テンプレートから選択</h2>
                    <div className="flex-1 text-right">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="閉じる"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <FontAwesomeIcon icon={faXmark} className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 px-8 py-6">
                    {(
                        [
                            {
                                v: "link" as const,
                                title: "テンプレートをそのまま利用する",
                                note: "※元のテンプレートが編集されたら、自動的に編集が適用されます",
                            },
                            {
                                v: "copy" as const,
                                title: "テンプレートを引用して編集する",
                                note: "※元のテンプレートが編集されても、編集は適用されません",
                            },
                        ]
                    ).map((o) => (
                        <button
                            key={o.v}
                            type="button"
                            onClick={() => setMode(o.v)}
                            className="flex w-full items-start gap-3 text-left"
                        >
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={cn(
                                    "mt-1 size-4 shrink-0",
                                    mode === o.v
                                        ? "text-primary"
                                        : "text-muted-foreground/30",
                                )}
                            />
                            <span>
                                <span className="block text-base font-bold">
                                    {o.title}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {o.note}
                                </span>
                            </span>
                        </button>
                    ))}

                    <div className="flex justify-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-12 h-11"
                            onClick={() => onDecide(mode)}
                        >
                            決定
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MSG_TYPE_LABEL: Record<BMessageType, string> = {
    text: "テキスト",
    image: "画像",
    video: "動画",
    audio: "音声",
    sticker: "スタンプ",
    location: "位置情報",
    panel: "パネル・ボタン",
};

function MessageRow({
    message: m,
    index,
    total,
    readOnly = false,
    onEdit,
    onRemove,
}: {
    message: BMessage;
    index: number;
    total: number;
    readOnly?: boolean;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const preview =
        m.message_type === "text"
            ? (m.text_content ?? "").slice(0, 60) || "（本文未設定）"
            : m.message_type === "image"
              ? "画像"
              : m.message_type === "panel"
                ? "パネル・ボタン"
                : MSG_TYPE_LABEL[m.message_type];
    return (
        <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs font-bold text-muted-foreground">
                {index + 1}/{total}
            </span>
            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {MSG_TYPE_LABEL[m.message_type]}
            </span>
            {m.message_type === "image" && m.image_url ? (
                <img
                    src={m.image_url}
                    alt=""
                    className="size-10 shrink-0 rounded border border-border object-cover"
                />
            ) : null}
            <span className="flex-1 truncate text-sm text-muted-foreground">
                {preview}
            </span>
            {!readOnly && (
                <>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                    >
                        編集
                    </Button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="削除"
                    >
                        <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                    </button>
                </>
            )}
        </div>
    );
}

function TemplateImportDialog({
    open,
    onClose,
    templates,
    onImport,
}: {
    open: boolean;
    onClose: () => void;
    templates: ImportTemplate[];
    onImport: (t: ImportTemplate) => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-lg bg-background shadow-xl my-8">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <h2 className="text-base font-bold">
                        テンプレートから追加
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
                <div className="max-h-[60vh] overflow-y-auto p-3">
                    {templates.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                            テンプレートがありません
                        </p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {templates.map((t) => (
                                <li
                                    key={t.id}
                                    className="flex items-center justify-between gap-3 px-2 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">
                                            {t.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {t.messages.length} メッセージ
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={t.messages.length === 0}
                                        onClick={() => {
                                            onImport(t);
                                            onClose();
                                        }}
                                    >
                                        追加
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function filterSummary(filter: TargetFilter | null): string {
    if (!filter) return "条件未設定";
    const and = filter.and?.length ?? 0;
    const or = filter.or?.length ?? 0;
    if (and === 0 && or === 0) return "条件未設定";
    const parts: string[] = [];
    if (and > 0) parts.push(`すべて満たす ${and} 件`);
    if (or > 0) parts.push(`いずれか満たす ${or} 件`);
    return parts.join(" ／ ");
}

function ChannelAvatar({ name }: { name: string }) {
    return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {name.slice(0, 1) || "?"}
        </div>
    );
}

function TypeTab({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "py-2 px-4 text-sm font-bold transition-colors -mb-px",
                active
                    ? "text-primary border-b-2 border-primary"
                    : "text-foreground hover:text-primary",
            )}
        >
            {label}
        </button>
    );
}

function ImageUploader({
    imageUrl,
    onChange,
    error,
}: {
    imageUrl: string;
    onChange: (url: string) => void;
    error?: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        try {
            const url = await uploadImage(file);
            onChange(url);
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : "アップロード失敗");
        } finally {
            setUploading(false);
        }
    };

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = "";
    };

    return (
        <div className="space-y-3">
            <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={onFile}
                hidden
            />
            {imageUrl ? (
                <div className="relative inline-block">
                    <img
                        src={imageUrl}
                        alt="プレビュー"
                        className="max-w-xs max-h-64 rounded-md border border-border"
                    />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute top-1 right-1 size-7 rounded-full bg-background/80 hover:bg-background border border-border inline-flex items-center justify-center"
                        aria-label="画像を削除"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex flex-col items-center justify-center gap-2 w-full max-w-xs h-40 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="size-6 text-muted-foreground"
                            />
                            <span className="text-xs text-muted-foreground">
                                アップロード中...
                            </span>
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon
                                icon={faImage}
                                className="size-6 text-muted-foreground"
                            />
                            <span className="text-xs text-muted-foreground">
                                クリックして画像を選択 (PNG / JPEG)
                            </span>
                        </>
                    )}
                </button>
            )}
            {(uploadError || error) && (
                <p className="text-xs text-destructive">
                    {uploadError ?? error}
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                ※ローカル環境では cloudflared トンネルが起動し、`LINE_PUBLIC_BASE_URL`
                が現在のトンネル URL に一致している必要があります。
            </p>
        </div>
    );
}

// ── データ取得ラッパー（Inertia の server props を API 取得に置換） ──
export default function NewBroadcastPage() {
    const { currentChannelId } = useAuth();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id") ?? undefined;

    const { data, error } = useResource(
        currentChannelId ? `broadcast-form:${currentChannelId}:${editId ?? "new"}` : null,
        async () => {
            const [
                channels,
                tags,
                chatStatuses,
                templates,
                scenarioOptions,
                richMenuOptions,
                reminderOptions,
                friendFieldFolders,
                activeFriendsCount,
                broadcast,
            ] = await Promise.all([
                fetchFormChannels(),
                fetchFormTags(),
                fetchFormChatStatuses(),
                fetchFormTemplates(),
                fetchFormScenarios(),
                fetchFormRichMenus(),
                fetchFormReminders(),
                fetchFormFriendFieldFolders(),
                fetchRecipientCount({ target_type: "all", target_filter: null }).catch(
                    () => 0,
                ),
                editId ? fetchRawBroadcast(editId) : Promise.resolve(null),
            ]);
            return {
                channels,
                tags,
                chatStatuses,
                templates,
                scenarioOptions,
                richMenuOptions,
                reminderOptions,
                friendFieldFolders,
                activeFriendsCount: activeFriendsCount ?? 0,
                broadcast,
            };
        },
    );

    if (error) {
        return (
            <div className="flex-1 grid place-items-center p-8 text-sm text-destructive">
                読み込みに失敗しました。時間をおいて再度お試しください。
            </div>
        );
    }
    if (!data) {
        return (
            <div className="flex-1 grid place-items-center p-8 text-sm text-muted-foreground">
                読み込み中…
            </div>
        );
    }

    return (
        <BroadcastsFormInner
            channels={data.channels}
            tags={data.tags}
            chatStatuses={data.chatStatuses}
            broadcast={data.broadcast as unknown as Broadcast | null}
            activeFriendsCount={data.activeFriendsCount}
            friendFieldFolders={data.friendFieldFolders}
            templates={data.templates as unknown as ImportTemplate[]}
            scenarioOptions={data.scenarioOptions}
            richMenuOptions={data.richMenuOptions}
            reminderOptions={data.reminderOptions}
            editId={editId}
        />
    );
}
