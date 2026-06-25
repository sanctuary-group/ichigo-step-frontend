"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClock,
    faUser,
    faList,
    faAngleRight,
    faPlus,
    faTrash,
    faXmark,
    faCircleQuestion,
    faBars,
    faChevronDown,
    faChevronRight,
    faCircle,
    faClockRotateLeft,
    faMessage,
    faCirclePlay,
    faShareFromSquare,
    faCircleUser,
    faArrowUp,
    faArrowDown,
    faEllipsis,
    faPenToSquare,
    faKeyboard,
    faGear,
} from "@fortawesome/free-solid-svg-icons";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    MessageComposer,
    composerValid,
    defaultComposerValue,
    normalizeComposerValue,
    type ComposerValue,
    type FriendFieldFolder,
} from "@/components/templates/message-composer";
import { ActionDialog } from "@/components/broadcasts/action-dialog";
import {
    FilterDialog,
    type TargetFilter,
} from "@/components/broadcasts/filter-dialog";
import { ScenarioStepTestDialog } from "@/components/scenarios/step-test-dialog";
import { ScenarioBulkTestDialog } from "@/components/scenarios/bulk-test-dialog";
import { MessageBubble } from "@/components/templates/preview-test-dialog";
import type { TemplateMessage } from "@/types/template";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type {
    ImportTemplate,
    TemplateFolderOption,
    QuoteSource,
    QuoteSourceStep,
} from "@/lib/api/scenario-form-data";
import { saveScenario } from "@/lib/api/scenarios";
import type { Tag, ChatStatus } from "@/types/chat";
import type { LineChannel } from "@/types/broadcast";
import type {
    Scenario,
    ScenarioStep,
    ScenarioStepMessage,
} from "@/types/scenario";

type BMessage = ScenarioStepMessage;
type BMessageType = BMessage["message_type"];

const MSG_TYPE_LABEL: Record<BMessageType, string> = {
    text: "テキスト",
    image: "画像",
    video: "動画",
    audio: "音声",
    sticker: "スタンプ",
    location: "位置情報",
    panel: "パネル・ボタン",
};

const MAX_NAME = 100;

/** 絞り込みフィルタの条件数（and + or）を数える */
function filterCount(filter: TargetFilter | null): number {
    if (!filter) return 0;
    const and = Array.isArray(filter.and) ? filter.and.length : 0;
    const or = Array.isArray(filter.or) ? filter.or.length : 0;
    return and + or;
}

export type PageProps = {
    scenario: Scenario | null;
    defaultFolderId: number | null;
    stepSubscriberCounts?: Record<string, number>;
    friendFieldFolders?: FriendFieldFolder[];
    templates?: ImportTemplate[];
    templateFolders?: TemplateFolderOption[];
    quoteSources?: QuoteSource[];
    channels: LineChannel[];
    tags: Tag[];
    chatStatuses: ChatStatus[];
};

type FormStep = {
    delay_minutes: number;
    timing_mode: TimingMode;
    admin_name: string | null;
    sender_name: string | null;
    sender_icon_url: string | null;
    linked_template_id: number | null;
    messages: BMessage[];
};

type FormData = {
    name: string;
    description: string;
    line_channel_id: number;
    scenario_folder_id: number;
    trigger_type: "friend_add" | "tag_added";
    trigger_tag_id: number | null;
    target_filter: TargetFilter | null;
    is_active: boolean;
    steps: FormStep[];
};

type TimingMode = "immediate" | "datetime" | "elapsed";

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
    return {
        data,
        setData,
        setDataState,
        errors,
        setErrors,
        processing,
        setProcessing,
    };
}

function defaultStep(delay = 0, mode: TimingMode = "immediate"): FormStep {
    return {
        delay_minutes: delay,
        timing_mode: mode,
        admin_name: null,
        sender_name: null,
        sender_icon_url: null,
        linked_template_id: null,
        messages: [],
    };
}

function toFormSteps(steps: ScenarioStep[] | undefined): FormStep[] {
    if (!steps || steps.length === 0) return [];
    return steps.map((s) => ({
        delay_minutes: s.delay_minutes,
        timing_mode: s.timing_mode ?? "elapsed",
        admin_name: s.admin_name ?? null,
        sender_name: s.sender_name ?? null,
        sender_icon_url: s.sender_icon_url ?? null,
        linked_template_id: s.linked_template_id ?? null,
        messages:
            s.messages && s.messages.length > 0
                ? s.messages
                : // 後方互換: messages 未設定の旧ステップは単一メッセージから復元
                  s.message_type === "image" && s.image_url
                  ? [
                        {
                            message_type: "image",
                            image_url: s.image_url,
                            image_preview_url:
                                s.image_preview_url ?? s.image_url,
                        },
                    ]
                  : s.text_content
                    ? [{ message_type: "text", text_content: s.text_content }]
                    : [],
    }));
}

function formatDelay(minutes: number, mode: TimingMode): string {
    if (mode === "immediate" || minutes === 0) return "ステップ開始直後";

    if (mode === "datetime") {
        const days = Math.floor(minutes / 1440);
        const remainder = minutes % 1440;
        const h = Math.floor(remainder / 60);
        const m = remainder % 60;
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        return `${days} 日後 ${time} に配信`;
    }

    // elapsed
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} 分後`;
    if (m === 0) return `${h} 時間後`;
    return `${h} 時間 ${m} 分後`;
}

export function ScenariosFormInner({
    scenario,
    defaultFolderId,
    stepSubscriberCounts = {},
    friendFieldFolders = [],
    templates = [],
    templateFolders = [],
    quoteSources = [],
    channels,
    tags,
    chatStatuses,
}: PageProps) {
    const router = useRouter();

    const queryParams = useMemo(() => {
        if (typeof window === "undefined") return new URLSearchParams();
        return new URLSearchParams(window.location.search);
    }, []);

    const initialName =
        scenario?.name ?? queryParams.get("name") ?? "";
    const initialFolderId =
        scenario?.scenario_folder_id ??
        (queryParams.get("folder")
            ? Number(queryParams.get("folder"))
            : defaultFolderId ?? 0);

    const isEdit = !!scenario;

    const lastEditedLabel = scenario?.updated_at
        ? (() => {
              const d = new Date(scenario.updated_at);
              const p = (n: number) => String(n).padStart(2, "0");
              return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
          })()
        : "";

    const form = useFormState<FormData>({
        name: initialName,
        description: scenario?.description ?? "",
        line_channel_id: scenario?.line_channel_id ?? channels[0]?.id ?? 0,
        scenario_folder_id: initialFolderId,
        trigger_type: scenario?.trigger_type ?? "friend_add",
        trigger_tag_id: scenario?.trigger_tag_id ?? null,
        target_filter:
            (scenario?.target_filter as TargetFilter | null) ?? null,
        is_active: scenario?.is_active ?? false,
        steps: toFormSteps(scenario?.steps),
    });

    // 下書き自動保存（新規作成のみ）: 作成ボタンを押す前にリロードしても内容を失わない
    const DRAFT_KEY = "scenario-draft-new";
    const [draftReady, setDraftReady] = useState(false);
    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            /* noop */
        }
    };
    useEffect(() => {
        if (isEdit) {
            setDraftReady(true);
            return;
        }
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) form.setData(JSON.parse(raw) as FormData);
        } catch {
            /* 壊れた下書きは無視 */
        }
        setDraftReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (isEdit || !draftReady) return;
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(form.data));
        } catch {
            /* 容量超過等は無視 */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data, draftReady]);

    const [timingOpen, setTimingOpen] = useState(false);
    const [editingStepIdx, setEditingStepIdx] = useState<number | null>(null);
    const [pageSize, setPageSize] = useState("50");

    // メッセージエディタ（ステップ単位）
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerStepIdx, setComposerStepIdx] = useState<number | null>(null);
    const [composerMsgIdx, setComposerMsgIdx] = useState<number | null>(null);
    const [composerValue, setComposerValue] = useState<ComposerValue>(() =>
        defaultComposerValue(),
    );
    // テンプレート取込（対象ステップ）
    const [templateModeOpen, setTemplateModeOpen] = useState(false);
    const [templateMode, setTemplateMode] = useState<"copy" | "link">("link");
    const [templateImportOpen, setTemplateImportOpen] = useState(false);
    const [templateTargetStepIdx, setTemplateTargetStepIdx] = useState<
        number | null
    >(null);
    // いちごアクション設定（モック）
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    // 一括プレビュー（フルページ表示）
    const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
    // ステップ一括操作パネル
    const [bulkOpsOpen, setBulkOpsOpen] = useState(false);
    // ステップ一括操作 → プレビュー（モーダル）
    const [bulkPreviewModalOpen, setBulkPreviewModalOpen] = useState(false);
    // ステップ一括操作 → テスト（一括テスト送信モーダル）
    const [bulkTestOpen, setBulkTestOpen] = useState(false);
    // ステップ一括操作 → 引用登録（一括引用登録モーダル）
    const [bulkQuoteOpen, setBulkQuoteOpen] = useState(false);
    // ステップ一括操作 → メッセージ・アクション消去（一括削除モーダル）
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    // 配信対象追加の表示トグル
    const [targetAddOpen, setTargetAddOpen] = useState(false);
    // 絞込み条件（追加した配信対象）UI。target_filter があれば初期表示
    const [filterTargetOpen, setFilterTargetOpen] = useState(
        !!scenario?.target_filter,
    );
    const [filterTargetName, setFilterTargetName] = useState("絞込み条件1");
    // 絞り込み条件 編集モーダル
    const [filterEditOpen, setFilterEditOpen] = useState(false);
    // ステップのプレビュー・テスト送信
    const [testTarget, setTestTarget] = useState<{
        messages: BMessage[];
        linkedTemplateId: number | null;
    } | null>(null);
    const openStepTest = (stepIdx: number) => {
        const st = form.data.steps[stepIdx];
        if (!st) return;
        setTestTarget({
            messages: st.messages,
            linkedTemplateId: st.linked_template_id,
        });
    };
    const openMessageTest = (stepIdx: number, msgIdx: number) => {
        const m = form.data.steps[stepIdx]?.messages[msgIdx];
        if (!m) return;
        setTestTarget({ messages: [m], linkedTemplateId: null });
    };

    const updateStep = (idx: number, patch: Partial<FormStep>) => {
        const next = form.data.steps.map((s, i) =>
            i === idx ? { ...s, ...patch } : s,
        );
        form.setData("steps", next);
    };

    const setStepMessages = (stepIdx: number, messages: BMessage[]) => {
        updateStep(stepIdx, { messages });
    };

    const openAddMessage = (stepIdx: number) => {
        if ((form.data.steps[stepIdx]?.messages.length ?? 0) >= 5) return;
        setComposerValue(defaultComposerValue());
        setComposerStepIdx(stepIdx);
        setComposerMsgIdx(null);
        setComposerOpen(true);
    };
    const openEditMessage = (stepIdx: number, msgIdx: number) => {
        const m = form.data.steps[stepIdx]?.messages[msgIdx];
        setComposerValue(
            defaultComposerValue(
                m as Parameters<typeof defaultComposerValue>[0],
            ),
        );
        setComposerStepIdx(stepIdx);
        setComposerMsgIdx(msgIdx);
        setComposerOpen(true);
    };
    const saveComposer = () => {
        if (composerStepIdx === null) return;
        const msg = normalizeComposerValue(composerValue) as BMessage;
        const cur = form.data.steps[composerStepIdx]?.messages ?? [];
        const next =
            composerMsgIdx === null
                ? [...cur, msg]
                : cur.map((m, j) => (j === composerMsgIdx ? msg : m));
        setStepMessages(composerStepIdx, next);
        setComposerOpen(false);
    };
    const removeMessage = (stepIdx: number, msgIdx: number) => {
        const cur = form.data.steps[stepIdx]?.messages ?? [];
        setStepMessages(
            stepIdx,
            cur.filter((_, j) => j !== msgIdx),
        );
    };
    const moveMessage = (stepIdx: number, msgIdx: number, dir: -1 | 1) => {
        const cur = [...(form.data.steps[stepIdx]?.messages ?? [])];
        const dest = msgIdx + dir;
        if (dest < 0 || dest >= cur.length) return;
        [cur[msgIdx], cur[dest]] = [cur[dest], cur[msgIdx]];
        setStepMessages(stepIdx, cur);
    };

    const openTemplateMode = (stepIdx: number) => {
        setTemplateTargetStepIdx(stepIdx);
        setTemplateModeOpen(true);
    };
    const onImportTemplate = (t: ImportTemplate) => {
        if (templateTargetStepIdx === null) return;
        if (templateMode === "link") {
            // テンプレートをそのまま利用（リンク・自動更新）。内容はテンプレートに従う
            updateStep(templateTargetStepIdx, {
                linked_template_id: t.id,
                messages: t.messages,
            });
        } else {
            // 引用してコピー（独立編集）
            const cur = form.data.steps[templateTargetStepIdx]?.messages ?? [];
            const remaining = 5 - cur.length;
            if (remaining <= 0) return;
            setStepMessages(templateTargetStepIdx, [
                ...cur,
                ...t.messages.slice(0, remaining),
            ]);
        }
    };
    const unlinkStepTemplate = (stepIdx: number) => {
        updateStep(stepIdx, { linked_template_id: null, messages: [] });
    };

    const addStep = (delayMinutes: number, mode: TimingMode) => {
        form.setData("steps", [
            ...form.data.steps,
            defaultStep(delayMinutes, mode),
        ]);
        setTimingOpen(false);
    };

    const removeStep = (idx: number) => {
        form.setData(
            "steps",
            form.data.steps.filter((_, i) => i !== idx),
        );
    };

    const moveStep = (idx: number, dir: -1 | 1) => {
        const next = [...form.data.steps];
        const dest = idx + dir;
        if (dest < 0 || dest >= next.length) return;
        [next[idx], next[dest]] = [next[dest], next[idx]];
        form.setData("steps", next);
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (form.data.steps.length === 0) {
            alert("配信タイミングを 1 つ以上追加してください");
            return;
        }
        form.setProcessing(true);
        form.setErrors({});
        try {
            await saveScenario(
                form.data as unknown as Record<string, unknown>,
                isEdit && scenario ? String(scenario.id) : undefined,
            );
            if (!isEdit) clearDraft();
            router.push("/scenarios");
        } catch (err) {
            if (err instanceof ApiError) form.setErrors(err.fieldErrors());
            form.setProcessing(false);
        }
    };

    return (
        <>
            <form
                onSubmit={onSubmit}
                className={cn(
                    "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6",
                    (composerOpen || bulkPreviewOpen) && "hidden",
                )}
            >
                {/* トップ: 管理名 + フォルダ + 戻る */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 lg:items-end">
                    <div className="space-y-1.5">
                        <div className="flex items-end justify-between">
                            <Label
                                htmlFor="sc-name"
                                className="text-sm font-medium"
                            >
                                管理名
                                <span className="text-destructive ml-1">*</span>
                            </Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {form.data.name.length}/{MAX_NAME}
                            </span>
                        </div>
                        <Input
                            id="sc-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData("name", e.target.value)
                            }
                            maxLength={MAX_NAME}
                            className="h-10"
                        />
                        {form.errors.name && (
                            <p className="text-xs text-destructive">
                                {form.errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">フォルダ</Label>
                        {scenario?.folder ? (
                            <div className="h-10 px-3 rounded-md border border-input bg-background text-sm inline-flex items-center">
                                {scenario.folder.name}
                            </div>
                        ) : (
                            <div className="h-10 px-3 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground inline-flex items-center">
                                {form.data.scenario_folder_id
                                    ? `フォルダ #${form.data.scenario_folder_id}`
                                    : "未分類"}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 lg:self-center lg:pb-2.5">
                        <Link
                            href="/scenarios"
                            className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
                        >
                            ステップ配信一覧へ戻る
                        </Link>
                    </div>
                </div>

                {/* 配信対象 */}
                {filterTargetOpen ? (
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-3 rounded-full bg-muted/40 px-1.5 py-1.5 pr-4">
                            <span className="grid place-items-center size-8 rounded-full bg-muted-foreground/20">
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="size-3.5 text-muted-foreground"
                                />
                            </span>
                            <span className="text-sm text-muted-foreground">
                                選択中の配信対象
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                                {filterTargetName || "絞込み条件1"}
                                <FontAwesomeIcon
                                    icon={faGear}
                                    className="size-3.5 text-blue-500"
                                />
                            </span>
                            <span className="grid place-items-center size-7 rounded-full bg-muted-foreground/15">
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="size-2.5 text-muted-foreground"
                                />
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setFilterTargetOpen(false);
                                setTargetAddOpen(false);
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold hover:bg-muted/50"
                        >
                            閉じる
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className="size-3 rotate-180"
                            />
                        </button>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-3 rounded-full bg-muted/40 px-1.5 py-1.5 pr-1.5">
                        <span className="grid place-items-center size-8 rounded-full bg-muted-foreground/20">
                            <FontAwesomeIcon
                                icon={faUser}
                                className="size-3.5 text-muted-foreground"
                            />
                        </span>
                        <span className="text-sm text-muted-foreground">
                            選択中の配信対象
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-background border border-border px-3 py-1">
                            <span
                                className={cn(
                                    "text-sm font-bold",
                                    targetAddOpen
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-foreground",
                                )}
                            >
                                ステップ購読者全員
                            </span>
                            <button
                                type="button"
                                onClick={() => setTargetAddOpen((v) => !v)}
                                aria-label="配信対象追加を表示"
                                className="inline-flex items-center text-muted-foreground hover:text-foreground"
                            >
                                <FontAwesomeIcon
                                    icon={faAngleRight}
                                    className={cn(
                                        "size-2.5 transition-transform",
                                        targetAddOpen && "rotate-180",
                                    )}
                                />
                            </button>
                        </span>

                        {targetAddOpen && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterTargetName("絞込み条件1");
                                        setFilterTargetOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30"
                                >
                                    <FontAwesomeIcon
                                        icon={faUser}
                                        className="size-3.5"
                                    />
                                    ＋ 配信対象追加
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetAddOpen(false)}
                                    aria-label="閉じる"
                                    className="grid place-items-center size-8 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="size-3 rotate-180"
                                    />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* 絞り込み条件カード（配信対象追加時） */}
                {filterTargetOpen && (
                    <div className="overflow-hidden rounded-md border border-border">
                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr]">
                            <div className="flex items-center bg-muted/30 px-5 py-4 text-sm font-bold md:border-r md:border-border">
                                絞り込み条件
                            </div>
                            <div className="space-y-4 px-5 py-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFilterEditOpen(true)}
                                        className="inline-flex items-center rounded-md border border-blue-500 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50/40 dark:text-blue-400"
                                    >
                                        絞り込み条件 編集
                                    </button>
                                    <span className="text-sm text-muted-foreground">
                                        管理名（任意）
                                    </span>
                                    <Input
                                        value={filterTargetName}
                                        onChange={(e) =>
                                            setFilterTargetName(e.target.value)
                                        }
                                        className="h-10 w-64"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            form.setData("target_filter", null);
                                            setFilterTargetOpen(false);
                                            setTargetAddOpen(false);
                                        }}
                                        className="ml-auto text-sm font-bold text-destructive hover:underline"
                                    >
                                        配信対象削除
                                    </button>
                                </div>
                                {filterCount(form.data.target_filter) === 0 ? (
                                    <div className="rounded-md bg-destructive/10 px-4 py-4 text-center text-sm text-destructive">
                                        絞り込み条件が登録されていません（登録は必須です）
                                    </div>
                                ) : (
                                    <div className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                                        絞り込み条件{" "}
                                        <span className="font-bold tabular-nums">
                                            {filterCount(form.data.target_filter)}
                                        </span>{" "}
                                        件を設定中
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* アクションバー */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        type="button"
                        onClick={() => setTimingOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-5"
                    >
                        <FontAwesomeIcon icon={faClock} className="size-3.5" />
                        ＋ 配信タイミング
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-blue-500 text-blue-600 hover:bg-blue-50/40 hover:text-blue-600"
                        disabled={form.data.steps.length === 0}
                        onClick={() => setBulkPreviewOpen(true)}
                    >
                        <FontAwesomeIcon icon={faList} className="size-3.5" />
                        一括プレビュー
                    </Button>

                    <div className="ml-auto flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">表示件数:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value)}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="25">25件</option>
                            <option value="50">50件</option>
                            <option value="100">100件</option>
                        </select>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10"
                            onClick={() => setBulkOpsOpen(true)}
                        >
                            一括操作
                            <FontAwesomeIcon
                                icon={faAngleRight}
                                className="size-3"
                            />
                        </Button>
                        <span className="text-muted-foreground tabular-nums">
                            {form.data.steps.length}件
                        </span>
                    </div>
                </div>

                <hr className="border-border" />

                {/* ステップリスト */}
                <div className="space-y-3">
                    {form.data.steps.map((step, idx) => (
                        <StepCard
                            key={idx}
                            index={idx}
                            step={step}
                            totalSteps={form.data.steps.length}
                            subscriberCount={
                                stepSubscriberCounts[String(idx)] ?? 0
                            }
                            onEditTiming={() => {
                                setEditingStepIdx(idx);
                                setTimingOpen(true);
                            }}
                            onRemove={() => removeStep(idx)}
                            onMoveUp={() => moveStep(idx, -1)}
                            onMoveDown={() => moveStep(idx, 1)}
                            onAddMessage={() => openAddMessage(idx)}
                            onEditMessage={(mi) => openEditMessage(idx, mi)}
                            onRemoveMessage={(mi) => removeMessage(idx, mi)}
                            onUpdateStep={(patch) => updateStep(idx, patch)}
                            onAddTemplate={() => openTemplateMode(idx)}
                            onAddAction={() => setActionDialogOpen(true)}
                            onQuickTest={() => openStepTest(idx)}
                            onTestMessage={(mi) => openMessageTest(idx, mi)}
                            onMoveMessage={(mi, dir) =>
                                moveMessage(idx, mi, dir)
                            }
                            channelName={
                                channels.find(
                                    (c) =>
                                        c.id === form.data.line_channel_id,
                                )?.name
                            }
                            lastEditedLabel={lastEditedLabel}
                            linkedTemplateName={
                                step.linked_template_id != null
                                    ? templates.find(
                                          (t) =>
                                              t.id === step.linked_template_id,
                                      )?.name
                                    : undefined
                            }
                            onUnlink={() => unlinkStepTemplate(idx)}
                        />
                    ))}

                    {/* 「＋ 配信タイミング」と同じくタイミング追加ダイアログを開く */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTimingOpen(true)}
                        className="h-10 border-blue-500 text-blue-600 hover:text-blue-600 hover:bg-blue-50/40"
                    >
                        <FontAwesomeIcon icon={faPlus} className="size-3" />
                        次の配信タイミングを追加
                    </Button>
                </div>

                {/* 保存 + 戻る */}
                <div className="flex items-center gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-8"
                    >
                        {form.processing
                            ? "保存中..."
                            : isEdit
                              ? "更新"
                              : "作成"}
                    </Button>
                    <Link
                        href="/scenarios"
                        className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-border bg-background text-sm text-muted-foreground hover:bg-muted"
                    >
                        戻る
                    </Link>
                </div>
            </form>

            <TimingDialog
                open={timingOpen}
                onClose={() => {
                    setTimingOpen(false);
                    setEditingStepIdx(null);
                }}
                initialDelay={
                    editingStepIdx !== null
                        ? form.data.steps[editingStepIdx]?.delay_minutes ?? 0
                        : 0
                }
                initialMode={
                    editingStepIdx !== null
                        ? form.data.steps[editingStepIdx]?.timing_mode ??
                          "immediate"
                        : "immediate"
                }
                onConfirm={(minutes, mode) => {
                    if (editingStepIdx !== null) {
                        updateStep(editingStepIdx, {
                            delay_minutes: minutes,
                            timing_mode: mode,
                        });
                        setEditingStepIdx(null);
                    } else {
                        addStep(minutes, mode);
                    }
                    setTimingOpen(false);
                }}
            />

            <StepTemplateModeDialog
                open={templateModeOpen}
                onClose={() => setTemplateModeOpen(false)}
                onDecide={(mode) => {
                    setTemplateMode(mode);
                    setTemplateModeOpen(false);
                    setTemplateImportOpen(true);
                }}
            />

            <StepTemplateImportDialog
                open={templateImportOpen}
                onClose={() => setTemplateImportOpen(false)}
                templates={templates}
                folders={templateFolders}
                onImport={onImportTemplate}
            />

            <ActionDialog
                open={actionDialogOpen}
                onClose={() => setActionDialogOpen(false)}
                initial={[]}
                onSave={() => {}}
                tags={tags}
                chatStatuses={chatStatuses}
                friendFieldFolders={friendFieldFolders}
                scenarios={[]}
                richMenus={[]}
                reminders={[]}
            />

            <ScenarioStepTestDialog
                open={testTarget !== null}
                onClose={() => setTestTarget(null)}
                messages={testTarget?.messages ?? []}
                linkedTemplateId={testTarget?.linkedTemplateId ?? null}
            />

            <ScenarioBulkTestDialog
                open={bulkTestOpen}
                onClose={() => setBulkTestOpen(false)}
                messages={form.data.steps.flatMap((s) => s.messages)}
            />

            {bulkQuoteOpen && (
                <BulkQuoteModal
                    sources={quoteSources}
                    onApply={(steps) => {
                        form.setData(
                            "steps",
                            steps.map((s) => ({
                                delay_minutes: s.delay_minutes,
                                timing_mode: s.timing_mode,
                                admin_name: null,
                                sender_name: null,
                                sender_icon_url: null,
                                linked_template_id: s.linked_template_id,
                                messages: s.messages,
                            })),
                        );
                        setBulkQuoteOpen(false);
                    }}
                    onClose={() => setBulkQuoteOpen(false)}
                />
            )}

            <FilterDialog
                open={filterEditOpen}
                onClose={() => setFilterEditOpen(false)}
                value={form.data.target_filter}
                onApply={(filter) => form.setData("target_filter", filter)}
                tags={tags}
                chatStatuses={chatStatuses}
                friendFieldFolders={friendFieldFolders}
            />

            {bulkDeleteOpen && (
                <BulkDeleteModal
                    onConfirm={() => {
                        form.setData(
                            "steps",
                            form.data.steps.map((s) => ({
                                ...s,
                                linked_template_id: null,
                                messages: [],
                            })),
                        );
                        setBulkDeleteOpen(false);
                    }}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            {/* ステップ一括操作パネル（右ドロワー） */}
            {bulkOpsOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/20"
                        onClick={() => setBulkOpsOpen(false)}
                    />
                    <div className="fixed right-0 top-0 z-50 flex h-full w-[320px] max-w-full flex-col bg-background shadow-2xl">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-bold">
                                ステップ一括操作
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <BulkOpItem
                                icon={faCirclePlay}
                                label="プレビュー"
                                onClick={() => {
                                    setBulkOpsOpen(false);
                                    setBulkPreviewModalOpen(true);
                                }}
                            />
                            <BulkOpItem
                                icon={faMessage}
                                label="テスト"
                                onClick={() => {
                                    setBulkOpsOpen(false);
                                    setBulkTestOpen(true);
                                }}
                            />
                            <BulkOpItem
                                icon={faShareFromSquare}
                                label="引用登録"
                                onClick={() => {
                                    setBulkOpsOpen(false);
                                    setBulkQuoteOpen(true);
                                }}
                            />
                            <BulkOpItem
                                icon={faTrash}
                                label="メッセージ・アクション消去"
                                onClick={() => {
                                    setBulkOpsOpen(false);
                                    setBulkDeleteOpen(true);
                                }}
                            />
                        </div>
                        <div className="border-t border-border px-5 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setBulkOpsOpen(false)}
                            >
                                閉じる
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* メッセージエディタ（ステップ単位・フル機能） */}
            {composerOpen && (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <h2 className="text-lg font-bold">
                            {composerMsgIdx === null
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

            {bulkPreviewOpen && (
                <BulkPreview
                    steps={form.data.steps}
                    subscriberCounts={form.data.steps.map(
                        (_, i) => stepSubscriberCounts[String(i)] ?? 0,
                    )}
                    lastEditedLabel={lastEditedLabel}
                    onBack={() => setBulkPreviewOpen(false)}
                />
            )}

            {bulkPreviewModalOpen && (
                <BulkPreviewModal
                    steps={form.data.steps}
                    onClose={() => setBulkPreviewModalOpen(false)}
                />
            )}
        </>
    );
}

function BulkPreviewModal({
    steps,
    onClose,
}: {
    steps: FormStep[];
    onClose: () => void;
}) {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [tab, setTab] = useState<"message" | "action">("message");
    const selected = steps[selectedIdx];

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center gap-4 border-b border-border px-6 py-4">
                    <h2 className="text-xl font-bold">一括プレビュー</h2>
                    <span className="text-sm text-muted-foreground">
                        配信対象：友だち全員のメッセージが含まれます
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-6" />
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 divide-x divide-border">
                {/* 左: ステップ一覧 */}
                <div className="overflow-y-auto p-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                                <th className="px-3 py-2 font-medium">
                                    配信タイミング
                                </th>
                                <th className="px-3 py-2 font-medium">
                                    メッセージ管理名
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    プレビュー
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((step, i) => {
                                const active = i === selectedIdx;
                                return (
                                    <tr
                                        key={i}
                                        className={cn(
                                            "cursor-pointer border-b border-border",
                                            active
                                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                                : "hover:bg-muted/40",
                                        )}
                                        onClick={() => setSelectedIdx(i)}
                                    >
                                        <td
                                            className={cn(
                                                "px-3 py-3 font-bold",
                                                active &&
                                                    "text-emerald-600 dark:text-emerald-400",
                                            )}
                                        >
                                            {i + 1}{" "}
                                            {formatDelay(
                                                step.delay_minutes,
                                                step.timing_mode,
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-muted-foreground">
                                            –
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIdx(i);
                                                }}
                                                className="inline-flex size-8 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600"
                                                aria-label="プレビュー"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faCirclePlay}
                                                    className="size-4"
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 右: 選択ステップ詳細 */}
                <div className="overflow-y-auto bg-muted/20 p-6">
                    {selected && (
                        <>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <span className="text-base font-bold">
                                    {selectedIdx + 1}{" "}
                                    {formatDelay(
                                        selected.delay_minutes,
                                        selected.timing_mode,
                                    )}
                                </span>
                                <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setTab("message")}
                                        className={cn(
                                            "rounded px-5 py-1.5 text-sm font-bold transition-colors",
                                            tab === "message"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        メッセージ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTab("action")}
                                        className={cn(
                                            "rounded px-5 py-1.5 text-sm font-bold transition-colors",
                                            tab === "action"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        アクション
                                    </button>
                                </div>
                            </div>

                            {tab === "message" ? (
                                selected.messages.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted-foreground">
                                        メッセージがありません
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {selected.messages.map((m, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border border-border bg-background p-6"
                                            >
                                                <MessageBubble
                                                    message={
                                                        m as TemplateMessage
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <p className="py-10 text-center text-sm text-muted-foreground">
                                    アクションは設定されていません
                                </p>
                            )}
                        </>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function BulkPreview({
    steps,
    subscriberCounts = [],
    lastEditedLabel,
    onBack,
}: {
    steps: FormStep[];
    subscriberCounts?: number[];
    lastEditedLabel?: string;
    onBack: () => void;
}) {
    const [detailIdx, setDetailIdx] = useState<number | null>(null);
    const detailStep = detailIdx !== null ? steps[detailIdx] : null;

    return (
        <div className="relative flex-1 overflow-y-auto flex flex-col min-h-0 bg-muted/20">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
                <div className="text-sm">
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-muted-foreground hover:underline"
                    >
                        ステップ編集
                    </button>
                    <span className="text-muted-foreground"> ＞ </span>
                    <span className="font-bold">一括プレビュー</span>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    ← ステップ編集画面に戻る
                </button>
            </div>

            <div className="p-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-t-md border-x border-t border-border bg-background px-4 py-2 text-sm font-bold">
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className="size-3 text-muted-foreground"
                    />
                    詳細設定
                </div>

                {/* タイムライン */}
                <div className="rounded-md bg-muted/30 p-6">
                    <ol className="space-y-6">
                        {steps.map((step, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-4"
                            >
                                <div className="flex w-40 shrink-0 items-center justify-end gap-3 pt-3">
                                    <span className="text-sm text-foreground">
                                        {formatDelay(
                                            step.delay_minutes,
                                            step.timing_mode,
                                        )}
                                    </span>
                                    <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
                                        <span className="size-5 rounded-full border-[3px] border-blue-500 bg-blue-500" />
                                        <span className="absolute left-full top-1/2 h-px w-4 -translate-y-1/2 bg-border" />
                                    </span>
                                </div>
                                <StepPreviewCard
                                    step={step}
                                    subscriberCount={subscriberCounts[i] ?? 0}
                                    onEdit={() => setDetailIdx(i)}
                                />
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            {/* 右側ステップ詳細ドロワー */}
            {detailStep && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/20"
                        onClick={() => setDetailIdx(null)}
                    />
                    <StepDetailDrawer
                        step={detailStep}
                        lastEditedLabel={lastEditedLabel}
                        onClose={() => setDetailIdx(null)}
                        onEdit={onBack}
                    />
                </>
            )}
        </div>
    );
}

function BulkQuoteModal({
    sources,
    onApply,
    onClose,
}: {
    sources: QuoteSource[];
    onApply: (steps: QuoteSourceStep[]) => void;
    onClose: () => void;
}) {
    const [selectedId, setSelectedId] = useState<number | "">("");
    const selected = sources.find((s) => s.id === selectedId) ?? null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-background shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="relative border-b border-border px-6 py-5 text-center">
                    <h2 className="text-xl font-bold">一括引用登録</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="absolute right-5 top-5 text-foreground hover:text-muted-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-6" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <p className="text-sm text-muted-foreground">
                        引用元の配信対象（絞込み先）を選択
                    </p>
                    <div className="relative mt-2">
                        <select
                            value={selectedId}
                            onChange={(e) =>
                                setSelectedId(
                                    e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                )
                            }
                            className="h-12 w-full appearance-none rounded-md border border-input bg-background px-4 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="" disabled>
                                選択してください
                            </option>
                            {sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                        />
                    </div>

                    {/* 引用元のステップ一覧 */}
                    <div className="mt-4 overflow-hidden rounded-md border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        配信タイミング
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium">
                                        メッセージ管理名
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        プレビュー
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {!selected || selected.steps.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-4 text-center text-xs text-muted-foreground"
                                        >
                                            {selected
                                                ? "配信タイミングがありません"
                                                : ""}
                                        </td>
                                    </tr>
                                ) : (
                                    selected.steps.map((step, i) => (
                                        <tr
                                            key={i}
                                            className="border-t border-border"
                                        >
                                            <td className="px-4 py-3 font-bold">
                                                {i + 1}{" "}
                                                {formatDelay(
                                                    step.delay_minutes,
                                                    step.timing_mode,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">
                                                –
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {step.messages.length} 件
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-6 text-center text-sm font-bold text-destructive">
                        ※引用元の登録内容が上書きされますのでご注意ください
                    </p>

                    <div className="mt-4 flex justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 px-8 text-primary border-primary/40 hover:text-primary"
                            disabled={!selected}
                            onClick={() => {
                                if (selected) onApply(selected.steps);
                            }}
                        >
                            一括引用登録する
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BulkDeleteModal({
    onConfirm,
    onClose,
}: {
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl overflow-hidden rounded-lg bg-background shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="relative px-6 pt-6 text-center">
                    <h2 className="text-xl font-bold">一括削除</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="absolute right-5 top-5 text-foreground hover:text-muted-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-6" />
                    </button>
                </div>

                <div className="px-6 pb-8 pt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        選択中の配信対象
                    </p>
                    <div className="mt-3 rounded-md bg-muted px-4 py-4 text-base font-bold">
                        ステップ購読者全員
                    </div>

                    <p className="mt-6 text-sm text-muted-foreground">
                        上記の配信対象に登録されている
                        <br />
                        メッセージ・アクションを全て消去しますが、宜しいですか？
                    </p>
                    <p className="mt-4 text-sm font-bold text-destructive">
                        ※1度消去すると、元には戻せません
                    </p>

                    <div className="mt-6 flex flex-col items-center gap-3">
                        <Button
                            type="button"
                            onClick={onConfirm}
                            className="h-12 w-64 bg-destructive text-base font-bold text-white hover:bg-destructive/90"
                        >
                            全て削除
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-12 w-64 text-muted-foreground"
                        >
                            キャンセル
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BulkOpItem({
    icon,
    label,
    onClick,
}: {
    icon: typeof faCirclePlay;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left text-sm hover:bg-muted/50"
        >
            <FontAwesomeIcon
                icon={icon}
                className="size-4 text-muted-foreground"
            />
            <span className="flex-1">{label}</span>
            <FontAwesomeIcon
                icon={faAngleRight}
                className="size-3 text-muted-foreground"
            />
        </button>
    );
}

function StepDetailDrawer({
    step,
    lastEditedLabel,
    onClose,
    onEdit,
}: {
    step: FormStep;
    lastEditedLabel?: string;
    onClose: () => void;
    onEdit: () => void;
}) {
    const [tab, setTab] = useState<"message" | "action">("message");
    return (
        <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-full flex-col bg-background shadow-2xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold">
                    <FontAwesomeIcon
                        icon={faClockRotateLeft}
                        className="size-4 text-muted-foreground"
                    />
                    {lastEditedLabel || "—"}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="閉じる"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <FontAwesomeIcon icon={faXmark} className="size-5" />
                </button>
            </div>

            {/* タイミング / 対象 */}
            <div className="space-y-3 border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3 border-b border-border pb-2">
                    <span className="inline-flex size-9 items-center justify-center rounded bg-blue-400 text-white">
                        <FontAwesomeIcon icon={faClock} className="size-4" />
                    </span>
                    <span className="text-sm">
                        {formatDelay(step.delay_minutes, step.timing_mode)}
                    </span>
                </div>
                <div className="flex items-center gap-3 border-b border-border pb-2">
                    <span className="inline-flex size-9 items-center justify-center rounded bg-blue-400 text-white">
                        <FontAwesomeIcon icon={faUser} className="size-4" />
                    </span>
                    <span className="text-sm text-muted-foreground">未設定</span>
                </div>
            </div>

            {/* タブ */}
            <div className="flex items-center gap-6 border-b border-border bg-muted/30 px-4">
                <button
                    type="button"
                    onClick={() => setTab("message")}
                    className={cn(
                        "py-3 text-sm font-bold transition-colors -mb-px",
                        tab === "message"
                            ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    メッセージ
                </button>
                <button
                    type="button"
                    onClick={() => setTab("action")}
                    className={cn(
                        "py-3 text-sm font-bold transition-colors -mb-px",
                        tab === "action"
                            ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    アクション
                </button>
            </div>

            {/* ボディ */}
            <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                {tab === "message" ? (
                    step.messages.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            メッセージがありません
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {step.messages.map((m, i) => (
                                <MessageBubble
                                    key={i}
                                    message={m as TemplateMessage}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        アクションは設定されていません
                    </p>
                )}
            </div>

            {/* フッター */}
            <div className="border-t border-border p-3">
                <button
                    type="button"
                    onClick={onEdit}
                    className="w-full rounded-md bg-blue-400 py-3 text-sm font-bold text-white hover:bg-blue-500"
                >
                    メッセージを編集する
                </button>
            </div>
        </div>
    );
}

function StepPreviewCard({
    step,
    subscriberCount = 0,
    onEdit,
}: {
    step: FormStep;
    subscriberCount?: number;
    onEdit: () => void;
}) {
    const [tab, setTab] = useState<"message" | "action">("message");
    return (
        <div className="w-[280px] shrink-0 rounded-lg border border-border bg-background shadow-sm">
            {/* カードヘッダー */}
            <div className="flex items-center justify-between gap-2 rounded-t-lg bg-blue-400 px-3 py-2.5 text-white">
                <span className="inline-flex items-center gap-2 text-sm font-bold">
                    <FontAwesomeIcon icon={faUser} className="size-3.5" />
                    ステップ購読者全員
                </span>
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label="ステップ詳細"
                    className="inline-flex size-7 items-center justify-center rounded bg-white/90 text-blue-500 hover:bg-white"
                >
                    <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                </button>
            </div>
            {/* 未設定行 */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm text-muted-foreground">
                <FontAwesomeIcon icon={faKeyboard} className="size-3.5" />
                未設定
            </div>
            {/* タブ */}
            <div className="flex items-center gap-4 border-b border-border px-3">
                <button
                    type="button"
                    onClick={() => setTab("message")}
                    className={cn(
                        "py-2 text-sm font-bold transition-colors -mb-px",
                        tab === "message"
                            ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    メッセージ
                </button>
                <button
                    type="button"
                    onClick={() => setTab("action")}
                    className={cn(
                        "py-2 text-sm font-bold transition-colors -mb-px",
                        tab === "action"
                            ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    アクション
                </button>
                <span className="ml-auto text-sm text-blue-600 dark:text-blue-400">
                    0
                </span>
            </div>
            {/* ボディ */}
            <div className="min-h-[280px] p-3">
                {tab === "message" ? (
                    step.messages.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                            メッセージがありません
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {step.messages.map((m, i) => (
                                <MessageBubble
                                    key={i}
                                    message={m as TemplateMessage}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                        アクションは設定されていません
                    </p>
                )}
            </div>
        </div>
    );
}

function StepCard({
    index,
    step,
    totalSteps,
    onEditTiming,
    onRemove,
    onMoveUp,
    onMoveDown,
    onAddMessage,
    onEditMessage,
    onRemoveMessage,
    onUpdateStep,
    onTestMessage,
    onMoveMessage,
    onAddTemplate,
    onAddAction,
    onQuickTest,
    linkedTemplateName,
    onUnlink,
    lastEditedLabel,
    subscriberCount = 0,
}: {
    index: number;
    step: FormStep;
    totalSteps: number;
    onEditTiming: () => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onAddMessage: () => void;
    onEditMessage: (msgIdx: number) => void;
    onRemoveMessage: (msgIdx: number) => void;
    onUpdateStep: (patch: Partial<FormStep>) => void;
    onTestMessage: (msgIdx: number) => void;
    onMoveMessage: (msgIdx: number, dir: -1 | 1) => void;
    onAddTemplate: () => void;
    onAddAction: () => void;
    onQuickTest: () => void;
    linkedTemplateName?: string;
    onUnlink: () => void;
    channelName?: string;
    lastEditedLabel?: string;
    subscriberCount?: number;
}) {
    const stepNo = index + 1;
    const [menuOpen, setMenuOpen] = useState(false);
    const [editMode, setEditMode] = useState<"admin" | "sender" | null>(null);
    const menuBtnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
        null,
    );
    const linked = step.linked_template_id != null;
    const full = step.messages.length >= 5 || linked;

    // カードの overflow-hidden に切られないよう、メニューは固定配置で表示
    const toggleMenu = () => {
        if (!menuOpen && menuBtnRef.current) {
            const r = menuBtnRef.current.getBoundingClientRect();
            setMenuPos({
                top: r.bottom + 4,
                right: window.innerWidth - r.right,
            });
        }
        setMenuOpen((v) => !v);
    };

    return (
        <Card>
            <CardContent className="p-0">
                {/* ヘッダー */}
                <div className="flex items-center gap-3 flex-wrap bg-muted/40 px-4 py-3">
                    <span className="inline-flex items-center justify-center size-8 rounded bg-blue-500 text-white text-sm font-bold">
                        {stepNo}
                    </span>
                    <button
                        type="button"
                        onClick={onEditTiming}
                        className="inline-flex items-center gap-2 px-3 h-8 rounded-md bg-muted hover:bg-muted/70 text-sm transition-colors"
                    >
                        <FontAwesomeIcon
                            icon={faClock}
                            className="size-3 text-muted-foreground"
                        />
                        <span className="font-bold">
                            {formatDelay(step.delay_minutes, step.timing_mode)}
                        </span>
                    </button>
                    {step.admin_name && (
                        <span className="inline-flex items-center rounded border border-border bg-background px-2 py-1 text-xs font-bold">
                            {step.admin_name}
                        </span>
                    )}
                    {step.sender_name && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <FontAwesomeIcon
                                icon={faCircleUser}
                                className="size-3"
                            />
                            {step.sender_name}
                        </span>
                    )}
                    <div className="ml-auto flex items-center gap-3 text-sm">
                        <button
                            type="button"
                            onClick={onQuickTest}
                            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                        >
                            クイックテストユーザー未登録
                        </button>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <FontAwesomeIcon icon={faUser} className="size-3.5" />
                            <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                                {subscriberCount}
                            </span>
                            <span>人</span>
                        </span>
                        <div>
                            <button
                                ref={menuBtnRef}
                                type="button"
                                onClick={toggleMenu}
                                className="size-8 inline-flex items-center justify-center rounded border border-border hover:bg-muted"
                                aria-label="メニュー"
                            >
                                <FontAwesomeIcon
                                    icon={faBars}
                                    className="size-3.5"
                                />
                            </button>
                            {menuOpen && menuPos && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setMenuOpen(false)}
                                    />
                                    <div
                                        style={{
                                            top: menuPos.top,
                                            right: menuPos.right,
                                        }}
                                        className="fixed z-50 max-h-[80vh] w-72 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
                                    >
                                        {/* ヘッダー: 最終編集日時 + 閉じる */}
                                        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <FontAwesomeIcon
                                                    icon={faClockRotateLeft}
                                                    className="size-3.5"
                                                />
                                                最終編集日時 {lastEditedLabel || "—"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setMenuOpen(false)
                                                }
                                                aria-label="閉じる"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faXmark}
                                                    className="size-4"
                                                />
                                            </button>
                                        </div>
                                        {/* 番号 + タイミング */}
                                        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                                            <span className="inline-flex items-center justify-center size-7 rounded bg-blue-500 text-white text-xs font-bold">
                                                {stepNo}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs font-bold">
                                                <FontAwesomeIcon
                                                    icon={faClock}
                                                    className="size-3 text-muted-foreground"
                                                />
                                                {formatDelay(
                                                    step.delay_minutes,
                                                    step.timing_mode,
                                                )}
                                            </span>
                                        </div>
                                        {/* 項目 */}
                                        <StepMenuRow
                                            icon={faMessage}
                                            onClick={() => {
                                                setEditMode("admin");
                                                setMenuOpen(false);
                                            }}
                                        >
                                            メッセージ管理名編集
                                        </StepMenuRow>
                                        <StepMenuRow
                                            icon={faCirclePlay}
                                            onClick={() => {
                                                onQuickTest();
                                                setMenuOpen(false);
                                            }}
                                        >
                                            テスト送信
                                        </StepMenuRow>
                                        <StepMenuRow
                                            icon={faShareFromSquare}
                                            onClick={() => {
                                                onAddTemplate();
                                                setMenuOpen(false);
                                            }}
                                        >
                                            メッセージ・アクションを引用
                                        </StepMenuRow>
                                        <StepMenuRow
                                            icon={faCircleUser}
                                            onClick={() => {
                                                setEditMode("sender");
                                                setMenuOpen(false);
                                            }}
                                        >
                                            送信者名変更
                                            {step.sender_name
                                                ? `（${step.sender_name}）`
                                                : ""}
                                        </StepMenuRow>
                                        <StepMenuRow
                                            icon={faArrowUp}
                                            disabled={index === 0}
                                            onClick={() => {
                                                onMoveUp();
                                                setMenuOpen(false);
                                            }}
                                        >
                                            上へ移動
                                        </StepMenuRow>
                                        <StepMenuRow
                                            icon={faArrowDown}
                                            disabled={index === totalSteps - 1}
                                            onClick={() => {
                                                onMoveDown();
                                                setMenuOpen(false);
                                            }}
                                        >
                                            下へ移動
                                        </StepMenuRow>
                                        <StepMenuRow
                                            icon={faTrash}
                                            destructive
                                            onClick={() => {
                                                onRemove();
                                                setMenuOpen(false);
                                            }}
                                        >
                                            配信タイミング削除
                                        </StepMenuRow>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ボディ */}
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:text-blue-600 hover:bg-blue-50/40"
                            disabled={full}
                            onClick={onAddMessage}
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3" />
                            メッセージ
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:text-blue-600 hover:bg-blue-50/40"
                            disabled={full}
                            onClick={onAddTemplate}
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3" />
                            テンプレート
                        </Button>
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
                                onClick={onUnlink}
                            >
                                解除
                            </Button>
                        </div>
                    )}

                    {step.messages.length === 0 ? (
                        !linked && (
                            <div className="rounded-md bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                                メッセージ・いちごアクションが登録されていません（どちらかの登録は必須です）
                            </div>
                        )
                    ) : (
                        <ul className="space-y-3">
                            {step.messages.map((m, mi) => (
                                <li
                                    key={mi}
                                    className="rounded-md border border-border p-3"
                                >
                                    <StepMessageRow
                                        message={m}
                                        index={mi}
                                        total={step.messages.length}
                                        readOnly={linked}
                                        onEdit={() => onEditMessage(mi)}
                                        onRemove={() => onRemoveMessage(mi)}
                                        onTest={() => onTestMessage(mi)}
                                        onMoveUp={() => onMoveMessage(mi, -1)}
                                        onMoveDown={() => onMoveMessage(mi, 1)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        type="button"
                        onClick={onAddAction}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-400 px-4 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50/40"
                    >
                        いちごアクション設定
                        <FontAwesomeIcon icon={faChevronDown} className="size-3" />
                    </button>
                </div>
            </CardContent>

            {editMode && (
                <StepFieldDialog
                    mode={editMode}
                    step={step}
                    onClose={() => setEditMode(null)}
                    onSave={(patch) => {
                        onUpdateStep(patch);
                        setEditMode(null);
                    }}
                />
            )}
        </Card>
    );
}

function StepFieldDialog({
    mode,
    step,
    onClose,
    onSave,
}: {
    mode: "admin" | "sender";
    step: FormStep;
    onClose: () => void;
    onSave: (patch: Partial<FormStep>) => void;
}) {
    const [adminName, setAdminName] = useState(step.admin_name ?? "");
    const [senderName, setSenderName] = useState(step.sender_name ?? "");
    const [senderIcon, setSenderIcon] = useState(step.sender_icon_url ?? "");

    const save = () => {
        if (mode === "admin") {
            onSave({ admin_name: adminName.trim() || null });
        } else {
            onSave({
                sender_name: senderName.trim() || null,
                sender_icon_url: senderIcon.trim() || null,
            });
        }
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogTitle>
                    {mode === "admin" ? "メッセージ管理名" : "送信者名変更"}
                </DialogTitle>
                {mode === "admin" ? (
                    <div className="space-y-2">
                        <Label htmlFor="step-admin">管理名（任意）</Label>
                        <Input
                            id="step-admin"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            maxLength={100}
                            placeholder="例: 初回あいさつ"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            友だちには表示されません。管理画面でステップを判別するためのラベルです。
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="step-sender">送信者名</Label>
                            <Input
                                id="step-sender"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                maxLength={20}
                                placeholder="例: 山田"
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                LINE上では「{senderName || "送信者名"} from
                                公式アカウント名」の形式で表示されます（最大20文字）。
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="step-sender-icon">
                                送信者アイコンURL（任意・https）
                            </Label>
                            <Input
                                id="step-sender-icon"
                                value={senderIcon}
                                onChange={(e) => setSenderIcon(e.target.value)}
                                maxLength={2000}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button onClick={save}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function StepMenuRow({
    children,
    icon,
    onClick,
    disabled = false,
    destructive = false,
}: {
    children: React.ReactNode;
    icon: typeof faMessage;
    onClick?: () => void;
    disabled?: boolean;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left text-sm last:border-b-0 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
                destructive && "text-destructive",
            )}
        >
            <FontAwesomeIcon
                icon={icon}
                className={cn(
                    "size-4 shrink-0",
                    destructive
                        ? "text-destructive"
                        : "text-muted-foreground",
                )}
            />
            <span className="flex-1">{children}</span>
            <FontAwesomeIcon
                icon={faChevronRight}
                className="size-3 shrink-0 text-muted-foreground"
            />
        </button>
    );
}

function StepMessageRow({
    message: m,
    index,
    total,
    readOnly = false,
    onEdit,
    onRemove,
    onTest,
    onMoveUp,
    onMoveDown,
}: {
    message: BMessage;
    index: number;
    total: number;
    readOnly?: boolean;
    onEdit: () => void;
    onRemove: () => void;
    onTest: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuBtnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
        null,
    );
    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!menuOpen && menuBtnRef.current) {
            const r = menuBtnRef.current.getBoundingClientRect();
            setMenuPos({
                top: r.bottom + 4,
                right: window.innerWidth - r.right,
            });
        }
        setMenuOpen((v) => !v);
    };

    const preview =
        m.message_type === "text"
            ? (m.text_content ?? "").slice(0, 60) || "（本文未設定）"
            : m.message_type === "image"
              ? "画像"
              : m.message_type === "panel"
                ? "パネル・ボタン"
                : MSG_TYPE_LABEL[m.message_type];
    return (
        <div
            onClick={readOnly ? undefined : onEdit}
            className={cn(
                "flex items-center gap-3",
                !readOnly && "cursor-pointer",
            )}
        >
            <span className="shrink-0 text-xs font-bold text-muted-foreground">
                {index + 1}/{total}
            </span>
            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {MSG_TYPE_LABEL[m.message_type]}
            </span>
            {m.message_type === "image" && m.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={m.image_url}
                    alt=""
                    className="size-10 shrink-0 rounded border border-border object-cover"
                />
            ) : null}
            <span className="flex-1 truncate text-sm text-muted-foreground">
                {preview}
            </span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onTest();
                }}
                className="text-muted-foreground hover:text-primary"
                aria-label="プレビュー・テスト送信"
                title="プレビュー・テスト送信"
            >
                <FontAwesomeIcon icon={faCirclePlay} className="size-4" />
            </button>
            {!readOnly && (
                <div>
                    <button
                        ref={menuBtnRef}
                        type="button"
                        onClick={toggleMenu}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="メニュー"
                    >
                        <FontAwesomeIcon icon={faEllipsis} className="size-4" />
                    </button>
                    {menuOpen && menuPos && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                }}
                            />
                            <div
                                style={{
                                    top: menuPos.top,
                                    right: menuPos.right,
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="fixed z-50 w-40 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg"
                            >
                                <MsgMenuItem
                                    icon={faArrowUp}
                                    disabled={index === 0}
                                    onClick={() => {
                                        onMoveUp();
                                        setMenuOpen(false);
                                    }}
                                >
                                    上に移動
                                </MsgMenuItem>
                                <MsgMenuItem
                                    icon={faArrowDown}
                                    disabled={index === total - 1}
                                    onClick={() => {
                                        onMoveDown();
                                        setMenuOpen(false);
                                    }}
                                >
                                    下に移動
                                </MsgMenuItem>
                                <MsgMenuItem
                                    icon={faTrash}
                                    destructive
                                    onClick={() => {
                                        onRemove();
                                        setMenuOpen(false);
                                    }}
                                >
                                    削除
                                </MsgMenuItem>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function MsgMenuItem({
    children,
    icon,
    onClick,
    disabled = false,
    destructive = false,
}: {
    children: React.ReactNode;
    icon: typeof faArrowUp;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed",
                destructive && "text-destructive",
            )}
        >
            <FontAwesomeIcon
                icon={icon}
                className={cn(
                    "size-3.5 shrink-0",
                    destructive ? "text-destructive" : "text-muted-foreground",
                )}
            />
            {children}
        </button>
    );
}

function StepTemplateModeDialog({
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
                    <h2 className="text-xl font-bold">テンプレート利用選択</h2>
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

function StepTemplateImportDialog({
    open,
    onClose,
    templates,
    folders,
    onImport,
}: {
    open: boolean;
    onClose: () => void;
    templates: ImportTemplate[];
    folders: TemplateFolderOption[];
    onImport: (t: ImportTemplate) => void;
}) {
    const [folderId, setFolderId] = useState<number | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setFolderId(folders[0]?.id ?? null);
            setSelectedId(null);
            setPreviewOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!open) return null;

    // folder_id 未設定のテンプレートは先頭（未分類）フォルダ扱い
    const unclassifiedId = folders[0]?.id ?? null;
    const inFolder = templates.filter(
        (t) => (t.folder_id ?? unclassifiedId) === folderId,
    );
    const selected = templates.find((t) => t.id === selectedId) ?? null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="flex-1 text-center text-lg font-bold">
                        テンプレート選択
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

                <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr] gap-4 overflow-hidden p-6">
                    {/* 左: フォルダ */}
                    <ul className="space-y-2 overflow-y-auto">
                        {folders.map((f) => (
                            <li key={f.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFolderId(f.id);
                                        setSelectedId(null);
                                    }}
                                    className={cn(
                                        "w-full rounded-md px-4 py-3 text-left text-sm font-bold transition-colors",
                                        folderId === f.id
                                            ? "bg-primary text-primary-foreground"
                                            : "border border-border hover:bg-muted/50",
                                    )}
                                >
                                    {f.name}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* 右: テンプレート（ラジオ選択） */}
                    <div className="overflow-y-auto rounded-md border border-border p-2">
                        {inFolder.length === 0 ? (
                            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                                テンプレートがありません
                            </p>
                        ) : (
                            <ul className="space-y-1">
                                {inFolder.map((t) => (
                                    <li key={t.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(t.id)}
                                            className={cn(
                                                "flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition-colors",
                                                selectedId === t.id
                                                    ? "bg-primary/10"
                                                    : "hover:bg-muted/50",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "size-4 shrink-0 rounded-full border-2",
                                                    selectedId === t.id
                                                        ? "border-primary bg-primary"
                                                        : "border-muted-foreground/40",
                                                )}
                                            />
                                            {t.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* フッター: 決定 / プレビュー */}
                <div className="relative flex items-center justify-center border-t border-border px-6 py-4">
                    <Button
                        type="button"
                        disabled={!selected}
                        onClick={() => {
                            if (selected) {
                                onImport(selected);
                                onClose();
                            }
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-11"
                    >
                        決定
                    </Button>
                    <button
                        type="button"
                        disabled={!selected}
                        onClick={() => setPreviewOpen(true)}
                        className="absolute right-6 rounded-md bg-muted px-8 h-11 text-sm font-bold text-muted-foreground hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        プレビュー
                    </button>
                </div>
            </div>

            {/* プレビュー サブモーダル */}
            {previewOpen && selected && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
                    <div className="w-full max-w-3xl rounded-lg bg-background shadow-xl my-8">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-lg font-bold">
                                [{selected.name}] プレビュー
                            </h2>
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(false)}
                                aria-label="閉じる"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <FontAwesomeIcon icon={faXmark} className="size-5" />
                            </button>
                        </div>
                        <div className="bg-muted/40 p-6">
                            {selected.messages.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    プレビューするメッセージがありません
                                </p>
                            ) : (
                                <div className="mx-auto flex max-w-sm flex-col gap-3">
                                    {selected.messages.map((m, i) => (
                                        <MessageBubble
                                            key={i}
                                            message={m as TemplateMessage}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center border-t border-border px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(false)}
                                className="rounded-md bg-muted px-10 h-11 text-sm font-bold text-muted-foreground hover:bg-muted/70"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TimingDialog({
    open,
    onClose,
    initialDelay,
    initialMode,
    onConfirm,
}: {
    open: boolean;
    onClose: () => void;
    initialDelay: number;
    initialMode: TimingMode;
    onConfirm: (minutes: number, mode: TimingMode) => void;
}) {
    const [mode, setMode] = useState<TimingMode>("immediate");
    const [dayOffset, setDayOffset] = useState("0");
    const [timeOfDay, setTimeOfDay] = useState("00:00");
    const [elapsedHours, setElapsedHours] = useState("0");
    const [elapsedMinutes, setElapsedMinutes] = useState("0");

    useEffect(() => {
        if (!open) return;
        setMode(initialMode);

        if (initialMode === "datetime") {
            const days = Math.floor(initialDelay / 1440);
            const rem = initialDelay % 1440;
            const h = Math.floor(rem / 60);
            const m = rem % 60;
            setDayOffset(String(days));
            setTimeOfDay(
                `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
            );
        } else if (initialMode === "elapsed") {
            setElapsedHours(String(Math.floor(initialDelay / 60)));
            setElapsedMinutes(String(initialDelay % 60));
        }
    }, [open, initialDelay, initialMode]);

    const confirm = () => {
        let minutes = 0;
        if (mode === "immediate") {
            minutes = 0;
        } else if (mode === "datetime") {
            const days = Math.max(0, Number(dayOffset) || 0);
            const [hh, mm] = timeOfDay.split(":").map((v) => Number(v) || 0);
            minutes = days * 1440 + hh * 60 + mm;
        } else {
            const hh = Math.max(0, Math.min(72, Number(elapsedHours) || 0));
            const mm = Math.max(0, Math.min(59, Number(elapsedMinutes) || 0));
            minutes = hh * 60 + mm;
        }
        onConfirm(minutes, mode);
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogTitle className="text-center text-lg font-bold">
                    配信タイミング選択
                </DialogTitle>

                <RadioGroup
                    value={mode}
                    onValueChange={(v) => v && setMode(v as TimingMode)}
                    className="space-y-3 pt-3"
                >
                    <label
                        className={cn(
                            "block p-4 rounded-lg border-2 cursor-pointer transition-colors",
                            mode === "immediate"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem
                                value="immediate"
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-foreground">
                                    ステップ開始直後
                                </div>
                                <p className="text-sm text-foreground mt-1.5">
                                    トリガーが稼働したらすぐに送信します
                                </p>
                            </div>
                        </div>
                    </label>

                    <label
                        className={cn(
                            "block p-4 rounded-lg border-2 cursor-pointer transition-colors",
                            mode === "datetime"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem
                                value="datetime"
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-foreground">
                                    日時で指定
                                </div>
                                <p className="text-sm text-foreground mt-1.5">
                                    ステップ開始時からの経過日数と時間で配信タイミングを指定します
                                </p>
                                <div className="mt-3 rounded-md bg-muted/60 p-3 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap text-sm">
                                        <span className="font-bold">
                                            ステップ開始から
                                        </span>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={dayOffset}
                                            onChange={(e) =>
                                                setDayOffset(e.target.value)
                                            }
                                            onClick={() => setMode("datetime")}
                                            disabled={mode !== "datetime"}
                                            className="w-20 h-9 text-center"
                                        />
                                        <span>日後の</span>
                                        <Input
                                            type="time"
                                            value={timeOfDay}
                                            onChange={(e) =>
                                                setTimeOfDay(e.target.value)
                                            }
                                            onClick={() => setMode("datetime")}
                                            disabled={mode !== "datetime"}
                                            className="h-9 w-32"
                                        />
                                        <span>に配信する</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ※ステップ開始当日に送信する場合は「0日後」を選択してください
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>

                    <label
                        className={cn(
                            "block p-4 rounded-lg border-2 cursor-pointer transition-colors",
                            mode === "elapsed"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40",
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem
                                value="elapsed"
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-foreground">
                                    経過時間で指定
                                </div>
                                <p className="text-sm text-foreground mt-1.5">
                                    ステップ開始時からの72時間以内の経過時間を指定します
                                </p>
                                <div className="mt-3 rounded-md bg-muted/60 p-3 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap text-sm">
                                        <span className="font-bold">
                                            ステップ開始から
                                        </span>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={72}
                                            value={elapsedHours}
                                            onChange={(e) =>
                                                setElapsedHours(e.target.value)
                                            }
                                            onClick={() => setMode("elapsed")}
                                            disabled={mode !== "elapsed"}
                                            className="w-20 h-9 text-center"
                                        />
                                        <span className="font-bold">時間</span>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={elapsedMinutes}
                                            onChange={(e) =>
                                                setElapsedMinutes(
                                                    e.target.value,
                                                )
                                            }
                                            onClick={() => setMode("elapsed")}
                                            disabled={mode !== "elapsed"}
                                            className="w-20 h-9 text-center"
                                        />
                                        <span>分後に配信する</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ※設定できるのは72時間00分以内です
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>
                </RadioGroup>

                <div className="pt-4 text-center">
                    <div className="text-sm text-foreground inline-flex items-center gap-1.5">
                        登録できる配信タイミング
                        <FontAwesomeIcon
                            icon={faCircleQuestion}
                            className="size-3.5 text-muted-foreground"
                        />
                    </div>
                </div>

                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-12 h-11"
                        onClick={confirm}
                    >
                        決定
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

