"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faChevronDown,
    faCopy,
    faDownload,
    faTag,
    faClock,
    faFileLines,
    faAddressCard,
    faEllipsis,
    faPlus,
    faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { Fragment, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { LiffAuthMock } from "@/components/qr-actions/liff-auth-mock";
import { cn } from "@/lib/utils";
import {
    ActionDialog,
    ActionRow,
    ActionTile,
    type ScenarioRef,
} from "@/components/greetings/greeting-form";
import { useResource } from "@/lib/api/use-resource";
import { fetchFolders } from "@/lib/api/folders";
import { saveQrAction } from "@/lib/api/qr-actions";
import {
    fetchBuilderOptions,
    fetchTags,
    fetchChatStatuses,
    type BuilderOptions,
} from "@/lib/api/builder-options";
import { ApiError } from "@/lib/api/client";
import type { QrAction, QrActionFolder, QrAudience } from "@/types/qr-action";
import type {
    GreetingAction,
    GreetingActionType,
    RichMenuRef,
    TemplateRef,
    FriendFieldRef,
    FriendFieldFolderRef,
} from "@/types/greeting";
import type { Tag, ChatStatus } from "@/types/chat";

export type FolderOption = Pick<QrActionFolder, "id" | "name" | "is_system">;

export type PageProps = {
    qrAction: (QrAction & { public_url?: string; image_url?: string }) | null;
    folders: FolderOption[];
    options: BuilderOptions;
    tags: Tag[];
    chatStatuses: ChatStatus[];
    accountName: string;
    defaultName?: string;
    defaultFolderId: number | null;
    defaultAudience?: QrAudience;
};

type OffBehavior = "friend_add" | "text" | "redirect";
type OffFollowAction = "greeting" | "custom";

type FormShape = {
    qr_action_folder_id: number;
    name: string;
    audience: QrAudience;
    message: string;
    actions: GreetingAction[];
    combine_greeting: boolean;
    off_behavior: OffBehavior;
    off_text: string;
    off_redirect_url: string;
    off_follow_action: OffFollowAction;
    off_actions: GreetingAction[];
    referral_referrer_title: string;
    referral_referrer_body: string;
    referral_referee_title: string;
    referral_referee_body: string;
    referral_message: string;
    referral_message_disabled: boolean;
    referral_actions: GreetingAction[];
    external_html_enabled: boolean;
    external_html: string;
    external_html_body: string;
    param_import_enabled: boolean;
    param_import_map: Record<string, number | "">;
    param_export_enabled: boolean;
    param_export_callback_url: string;
    schedule_enabled: boolean;
    schedule_start_at: string;
    schedule_end_at: string;
    is_active: boolean;
};

/** ISO 日時を datetime-local 入力用の "YYYY-MM-DDTHH:MM" に変換 */
function toLocalInput(iso: string | null): string {
    return iso ? iso.slice(0, 16) : "";
}

/** 日付("YYYY-MM-DD")と時刻("HH:MM")を "YYYY-MM-DDTHH:MM" に結合。日付が無ければ空。 */
function combineDateTime(date: string, time: string): string {
    if (!date) return "";
    return `${date}T${time || "00:00"}`;
}

function useFormState<T extends Record<string, unknown>>(initial: T) {
    const [data, setDataState] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    function setData<K extends keyof T>(keyOrObj: K | T, value?: T[K]) {
        if (typeof keyOrObj === "string")
            setDataState((d) => ({ ...d, [keyOrObj]: value }));
        else setDataState(keyOrObj as T);
    }
    return { data, setData, setDataState, errors, setErrors, processing, setProcessing };
}

type Tab = "basic" | "external" | "qr";
type NavKey = "read" | "active" | "referral" | "option";

const NAV: { key: NavKey; label: string }[] = [
    { key: "read", label: "読み込み時アクション" },
    { key: "active", label: "稼働ON・OFFの設定" },
    { key: "referral", label: "紹介時アクション" },
    { key: "option", label: "オプション設定" },
];

type ExtNavKey = "html" | "param_import" | "param_export" | "lp";

const EXT_NAV: { key: ExtNavKey; label: string }[] = [
    { key: "html", label: "HTMLタグ挿入" },
    { key: "param_import", label: "パラメーターインポート" },
    { key: "param_export", label: "パラメーターエクスポート" },
    { key: "lp", label: "LP連携" },
];

const MAX_MESSAGE = 5000;
const LINE_NAME_VAR = "{{LINE名}}";
const CID_KEYS = ["cid1", "cid2", "cid3", "cid4", "cid5"] as const;

export function QrActionForm({
    qrAction,
    folders,
    options,
    tags,
    chatStatuses,
    accountName,
    defaultName,
    defaultFolderId,
    defaultAudience,
}: PageProps) {
    const router = useRouter();
    const {
        scenarios,
        richMenus,
        templates,
        templateFolders,
        reminders,
        friendFields,
        friendFieldFolders,
    } = options;
    const isEdit = !!qrAction;

    const form = useFormState<FormShape>({
        qr_action_folder_id:
            qrAction?.qr_action_folder_id ?? defaultFolderId ?? folders[0]?.id ?? 0,
        name: qrAction?.name ?? defaultName ?? "",
        audience: qrAction?.audience ?? defaultAudience ?? "new",
        message: qrAction?.message ?? "",
        actions: qrAction?.actions ?? [],
        combine_greeting: qrAction?.combine_greeting ?? true,
        off_behavior: qrAction?.off_behavior ?? "friend_add",
        off_text: qrAction?.off_text ?? "",
        off_redirect_url: qrAction?.off_redirect_url ?? "",
        off_follow_action: qrAction?.off_follow_action ?? "greeting",
        off_actions: qrAction?.off_actions ?? [],
        referral_referrer_title: qrAction?.referral_referrer_title ?? "",
        referral_referrer_body: qrAction?.referral_referrer_body ?? "",
        referral_referee_title: qrAction?.referral_referee_title ?? "",
        referral_referee_body: qrAction?.referral_referee_body ?? "",
        referral_message: qrAction?.referral_message ?? "",
        referral_message_disabled: qrAction?.referral_message_disabled ?? false,
        referral_actions: qrAction?.referral_actions ?? [],
        external_html_enabled: qrAction?.external_html_enabled ?? false,
        external_html: qrAction?.external_html ?? "",
        external_html_body: qrAction?.external_html_body ?? "",
        param_import_enabled: qrAction?.param_import_enabled ?? false,
        param_import_map: Object.fromEntries(
            CID_KEYS.map((k) => [k, qrAction?.param_import_map?.[k] ?? ""]),
        ) as Record<string, number | "">,
        param_export_enabled: qrAction?.param_export_enabled ?? false,
        param_export_callback_url: qrAction?.param_export_callback_url ?? "",
        schedule_enabled: qrAction?.schedule_enabled ?? false,
        schedule_start_at: toLocalInput(qrAction?.schedule_start_at ?? null),
        schedule_end_at: toLocalInput(qrAction?.schedule_end_at ?? null),
        is_active: qrAction?.is_active ?? true,
    });

    const [tab, setTab] = useState<Tab>("basic");
    const [nav, setNav] = useState<NavKey>("read");
    const [extNav, setExtNav] = useState<ExtNavKey>("html");
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [presetType, setPresetType] = useState<GreetingActionType | null>(null);
    const [dialogTarget, setDialogTarget] = useState<"actions" | "off_actions" | "referral_actions">(
        "actions",
    );
    const [copied, setCopied] = useState(false);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    const openActionDialog = (
        preset?: GreetingActionType,
        target: "actions" | "off_actions" | "referral_actions" = "actions",
    ) => {
        setPresetType(preset ?? null);
        setDialogTarget(target);
        setActionDialogOpen(true);
    };

    const insertVariable = (token: string) => {
        const el = messageRef.current;
        const text = form.data.message;
        if (!el) {
            form.setData("message", (text + token).slice(0, MAX_MESSAGE));
            return;
        }
        const start = el.selectionStart ?? text.length;
        const end = el.selectionEnd ?? text.length;
        const next = (text.slice(0, start) + token + text.slice(end)).slice(
            0,
            MAX_MESSAGE,
        );
        form.setData("message", next);
    };

    const submit = async () => {
        form.setProcessing(true);
        form.setErrors({});
        try {
            const paramImportMap: Record<string, number | null> = {};
            for (const k of CID_KEYS) {
                const v = form.data.param_import_map[k];
                paramImportMap[k] = v === "" ? null : v;
            }
            await saveQrAction(
                {
                    ...form.data,
                    param_import_map: paramImportMap,
                    schedule_start_at: form.data.schedule_start_at || null,
                    schedule_end_at: form.data.schedule_end_at || null,
                },
                qrAction?.id,
            );
            router.push("/qr-actions");
        } catch (e) {
            if (e instanceof ApiError) form.setErrors(e.fieldErrors());
        } finally {
            form.setProcessing(false);
        }
    };

    const copyUrl = async () => {
        if (!qrAction?.public_url) return;
        try {
            await navigator.clipboard.writeText(qrAction.public_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* noop */
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "basic", label: "基本設定" },
        { key: "external", label: "外部連携" },
        { key: "qr", label: "QRコード表示" },
    ];

    return (
        <>
            <div className="flex-1 overflow-y-auto">
                {/* ヘッダー */}
                <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 bg-muted/30 border-b border-border">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.push("/qr-actions")}
                            className="hover:text-foreground hover:underline"
                        >
                            TOP
                        </button>
                        <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
                        <span className="font-bold text-foreground">
                            QRコードアクション {isEdit ? "編集" : "新規作成"}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">稼働対象</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                                <span className="size-2 rounded-full bg-primary" />
                                {form.data.audience === "new"
                                    ? "新規友だち追加時のみ"
                                    : "全ての友だち"}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold">管理名</Label>
                                <span className="text-[11px] text-muted-foreground">
                                    {form.data.name.length}/50
                                </span>
                            </div>
                            <Input
                                value={form.data.name}
                                onChange={(e) => form.setData("name", e.target.value)}
                                maxLength={50}
                                className="h-9 w-56"
                            />
                            {form.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">フォルダ</Label>
                            <select
                                value={form.data.qr_action_folder_id}
                                onChange={(e) =>
                                    form.setData(
                                        "qr_action_folder_id",
                                        Number(e.target.value),
                                    )
                                }
                                className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {folders.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* タブ */}
                    <div className="mt-4 flex items-center gap-1 border-b border-border -mb-3">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors",
                                    tab === t.key
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                    {tab === "basic" && (
                        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
                            {/* 左ナビ: 設定項目 */}
                            <aside className="bg-background rounded-lg border border-border overflow-hidden h-fit">
                                <div className="px-4 py-3 bg-muted/40 border-b border-border text-sm font-bold text-center">
                                    設定項目
                                </div>
                                <nav className="p-3 space-y-2">
                                    {NAV.map((n) => (
                                        <button
                                            key={n.key}
                                            type="button"
                                            onClick={() => setNav(n.key)}
                                            className={cn(
                                                "w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm font-bold text-left transition-colors",
                                                nav === n.key
                                                    ? "border-primary text-primary bg-primary/5"
                                                    : "border-border hover:border-primary/40",
                                            )}
                                        >
                                            {n.label}
                                            <FontAwesomeIcon
                                                icon={faChevronRight}
                                                className="size-3 shrink-0 text-muted-foreground"
                                            />
                                        </button>
                                    ))}
                                </nav>
                            </aside>

                            {/* 右: 選択中の設定パネル */}
                            <div className="space-y-6">
                                {nav === "read" && (
                                    <ReadActionPanel
                                        message={form.data.message}
                                        messageRef={messageRef}
                                        onMessageChange={(v) =>
                                            form.setData("message", v)
                                        }
                                        onInsertVariable={insertVariable}
                                        actions={form.data.actions}
                                        onOpenDialog={openActionDialog}
                                        onRemoveAction={(idx) =>
                                            form.setData(
                                                "actions",
                                                form.data.actions.filter(
                                                    (_, i) => i !== idx,
                                                ),
                                            )
                                        }
                                        combineGreeting={form.data.combine_greeting}
                                        onCombineChange={(v) =>
                                            form.setData("combine_greeting", v)
                                        }
                                        tags={tags}
                                        scenarios={scenarios}
                                        richMenus={richMenus}
                                        templates={templates}
                                    />
                                )}

                                {nav === "active" && (
                                    <ActivePanel
                                        offBehavior={form.data.off_behavior}
                                        onOffBehaviorChange={(v) =>
                                            form.setData("off_behavior", v)
                                        }
                                        offText={form.data.off_text}
                                        onOffTextChange={(v) =>
                                            form.setData("off_text", v)
                                        }
                                        offRedirectUrl={form.data.off_redirect_url}
                                        onOffRedirectUrlChange={(v) =>
                                            form.setData("off_redirect_url", v)
                                        }
                                        offFollowAction={form.data.off_follow_action}
                                        onOffFollowActionChange={(v) =>
                                            form.setData("off_follow_action", v)
                                        }
                                        offActions={form.data.off_actions}
                                        onOpenOffDialog={(preset) =>
                                            openActionDialog(preset, "off_actions")
                                        }
                                        onRemoveOffAction={(idx) =>
                                            form.setData(
                                                "off_actions",
                                                form.data.off_actions.filter(
                                                    (_, i) => i !== idx,
                                                ),
                                            )
                                        }
                                        tags={tags}
                                        scenarios={scenarios}
                                        richMenus={richMenus}
                                        templates={templates}
                                        scheduleEnabled={form.data.schedule_enabled}
                                        onScheduleEnabledChange={(v) =>
                                            form.setData("schedule_enabled", v)
                                        }
                                        scheduleStartAt={form.data.schedule_start_at}
                                        onScheduleStartChange={(v) =>
                                            form.setData("schedule_start_at", v)
                                        }
                                        scheduleEndAt={form.data.schedule_end_at}
                                        onScheduleEndChange={(v) =>
                                            form.setData("schedule_end_at", v)
                                        }
                                    />
                                )}

                                {nav === "referral" && (
                                    <ReferralPanel
                                        referralCode={qrAction?.referral_code ?? null}
                                        referrerTitle={
                                            form.data.referral_referrer_title
                                        }
                                        onReferrerTitleChange={(v) =>
                                            form.setData(
                                                "referral_referrer_title",
                                                v,
                                            )
                                        }
                                        referrerBody={
                                            form.data.referral_referrer_body
                                        }
                                        onReferrerBodyChange={(v) =>
                                            form.setData(
                                                "referral_referrer_body",
                                                v,
                                            )
                                        }
                                        refereeTitle={
                                            form.data.referral_referee_title
                                        }
                                        onRefereeTitleChange={(v) =>
                                            form.setData(
                                                "referral_referee_title",
                                                v,
                                            )
                                        }
                                        refereeBody={
                                            form.data.referral_referee_body
                                        }
                                        onRefereeBodyChange={(v) =>
                                            form.setData(
                                                "referral_referee_body",
                                                v,
                                            )
                                        }
                                        message={form.data.referral_message}
                                        onMessageChange={(v) =>
                                            form.setData("referral_message", v)
                                        }
                                        messageDisabled={
                                            form.data.referral_message_disabled
                                        }
                                        onMessageDisabledChange={(v) =>
                                            form.setData(
                                                "referral_message_disabled",
                                                v,
                                            )
                                        }
                                        referralActions={
                                            form.data.referral_actions
                                        }
                                        onOpenReferralDialog={(preset) =>
                                            openActionDialog(
                                                preset,
                                                "referral_actions",
                                            )
                                        }
                                        onRemoveReferralAction={(idx) =>
                                            form.setData(
                                                "referral_actions",
                                                form.data.referral_actions.filter(
                                                    (_, i) => i !== idx,
                                                ),
                                            )
                                        }
                                        tags={tags}
                                        scenarios={scenarios}
                                        richMenus={richMenus}
                                        templates={templates}
                                    />
                                )}

                                {nav === "option" && (
                                    <PlaceholderPanel
                                        title="オプション設定"
                                        body="詳細なオプション設定は今後対応予定です。"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "external" && (
                        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
                            <aside className="bg-background rounded-lg border border-border overflow-hidden h-fit">
                                <div className="px-4 py-3 bg-muted/40 border-b border-border text-sm font-bold text-center">
                                    設定項目
                                </div>
                                <nav className="p-3 space-y-2">
                                    {EXT_NAV.map((n) => (
                                        <button
                                            key={n.key}
                                            type="button"
                                            onClick={() => setExtNav(n.key)}
                                            className={cn(
                                                "w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm font-bold text-left transition-colors",
                                                extNav === n.key
                                                    ? "border-primary text-primary bg-primary/5"
                                                    : "border-border hover:border-primary/40",
                                            )}
                                        >
                                            {n.label}
                                            <FontAwesomeIcon
                                                icon={faChevronRight}
                                                className="size-3 shrink-0 opacity-50"
                                            />
                                        </button>
                                    ))}
                                </nav>
                            </aside>

                            <div className="space-y-6">
                                {extNav === "html" && (
                                    <HtmlTagPanel
                                        enabled={form.data.external_html_enabled}
                                        onEnabledChange={(v) =>
                                            form.setData(
                                                "external_html_enabled",
                                                v,
                                            )
                                        }
                                        headHtml={form.data.external_html}
                                        onHeadHtmlChange={(v) =>
                                            form.setData("external_html", v)
                                        }
                                        bodyHtml={form.data.external_html_body}
                                        onBodyHtmlChange={(v) =>
                                            form.setData("external_html_body", v)
                                        }
                                    />
                                )}
                                {extNav === "param_import" && (
                                    <ParamImportPanel
                                        enabled={form.data.param_import_enabled}
                                        onEnabledChange={(v) =>
                                            form.setData(
                                                "param_import_enabled",
                                                v,
                                            )
                                        }
                                        map={form.data.param_import_map}
                                        onMapChange={(cid, fieldId) =>
                                            form.setData("param_import_map", {
                                                ...form.data.param_import_map,
                                                [cid]: fieldId,
                                            })
                                        }
                                        friendFields={friendFields}
                                        friendFieldFolders={friendFieldFolders}
                                    />
                                )}
                                {extNav === "param_export" && (
                                    <ParamExportPanel
                                        enabled={form.data.param_export_enabled}
                                        onEnabledChange={(v) =>
                                            form.setData(
                                                "param_export_enabled",
                                                v,
                                            )
                                        }
                                        callbackUrl={
                                            form.data.param_export_callback_url
                                        }
                                        onCallbackUrlChange={(v) =>
                                            form.setData(
                                                "param_export_callback_url",
                                                v,
                                            )
                                        }
                                    />
                                )}
                                {extNav === "lp" && (
                                    <PlaceholderPanel
                                        title="LP連携"
                                        body="ランディングページとの連携設定です。この機能は今後対応予定です。"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "qr" && (
                        <div className="space-y-6">
                            {/* アクションURL（QRコード） */}
                            <section className="bg-background rounded-lg border border-border overflow-hidden">
                                <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-1.5">
                                    <h2 className="text-sm font-bold">
                                        アクションURL（QRコード）
                                    </h2>
                                    <FontAwesomeIcon
                                        icon={faCircleInfo}
                                        title="QRコード（URL）を読み込むとこのアクションが発火します"
                                        className="size-3 text-muted-foreground cursor-help"
                                    />
                                </div>
                                <div className="p-5">
                                    {isEdit && qrAction?.image_url ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                                    <code className="flex-1 text-xs bg-muted rounded-md px-3 py-2.5 truncate">
                                                        {qrAction.public_url}
                                                    </code>
                                                    <button
                                                        onClick={copyUrl}
                                                        className="shrink-0 size-10 grid place-items-center rounded-md border border-border hover:bg-muted text-muted-foreground"
                                                        aria-label="コピー"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faCopy}
                                                            className="size-4"
                                                        />
                                                    </button>
                                                </div>
                                                <div className="shrink-0 size-20 rounded-md border border-border bg-white grid place-items-center overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={qrAction.image_url}
                                                        alt="QRコード"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <a
                                                    href={qrAction.image_url}
                                                    download={`qr-${qrAction.token}.png`}
                                                    className="shrink-0 size-10 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
                                                    aria-label="QR画像をダウンロード"
                                                    title="QR画像をダウンロード"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faDownload}
                                                        className="size-4"
                                                    />
                                                </a>
                                            </div>
                                            {copied && (
                                                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                    コピーしました
                                                </p>
                                            )}
                                            <div className="mt-4 flex gap-6 text-xs text-muted-foreground">
                                                <div>
                                                    URL読込人数:{" "}
                                                    <span className="font-bold text-foreground tabular-nums">
                                                        {qrAction.scan_count.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    友だち追加:{" "}
                                                    <span className="font-bold text-foreground tabular-nums">
                                                        {qrAction.follow_count.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-sm text-muted-foreground py-10">
                                            「保存」するとQRコードと配信用URLが発行されます。
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 認証ページの表示について */}
                            <section className="bg-background rounded-lg border border-border overflow-hidden">
                                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                                    <h2 className="text-sm font-bold">
                                        認証ページの表示について（LIFF
                                        URLへのアクセス）
                                    </h2>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                                    <LiffAuthMock accountName={accountName} />
                                    <div className="space-y-4 text-sm">
                                        <p className="leading-relaxed">
                                            認証ページは、
                                            <span className="text-primary underline">
                                                LIFF(リフ)
                                            </span>{" "}
                                            URLにアクセスした際に
                                            友だち1人につき1度のみ表示されます。
                                        </p>
                                        <p className="font-bold text-destructive">
                                            これはLINE公式アカウントの仕様で、非表示にすることはできません。
                                        </p>
                                        <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-2">
                                            <p className="text-sm font-bold">
                                                LIFF URLを利用している機能
                                            </p>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                <li>・QRコードアクション</li>
                                                <li>・フォーム作成</li>
                                                <li>・予約（面談/レッスン/イベント）</li>
                                                <li>・商品販売</li>
                                                <li>・友だち紹介</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* フッター */}
                <div className="sticky bottom-0 flex items-center justify-center gap-4 px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/qr-actions")}
                        className="h-11 px-8"
                    >
                        一覧に戻る
                    </Button>
                    <Button
                        variant="outline"
                        disabled
                        className="h-11 px-8 opacity-60"
                    >
                        稼働プレビュー
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={form.processing}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-12 font-bold disabled:opacity-50"
                    >
                        {form.processing ? "保存中..." : "保存"}
                    </Button>
                </div>
            </div>

            <ActionDialog
                open={actionDialogOpen}
                onClose={() => setActionDialogOpen(false)}
                tags={tags}
                scenarios={scenarios}
                richMenus={richMenus}
                templates={templates}
                templateFolders={templateFolders}
                reminders={reminders}
                friendFields={friendFields}
                friendFieldFolders={friendFieldFolders}
                chatStatuses={chatStatuses}
                presetType={presetType}
                currentActions={form.data[dialogTarget]}
                onSave={(actions) => {
                    form.setData(dialogTarget, actions);
                    setActionDialogOpen(false);
                }}
            />
        </>
    );
}

function ReadActionPanel({
    message,
    messageRef,
    onMessageChange,
    onInsertVariable,
    actions,
    onOpenDialog,
    onRemoveAction,
    combineGreeting,
    onCombineChange,
    tags,
    scenarios,
    richMenus,
    templates,
}: {
    message: string;
    messageRef: React.RefObject<HTMLTextAreaElement | null>;
    onMessageChange: (v: string) => void;
    onInsertVariable: (token: string) => void;
    actions: GreetingAction[];
    onOpenDialog: (preset?: GreetingActionType) => void;
    onRemoveAction: (idx: number) => void;
    combineGreeting: boolean;
    onCombineChange: (v: boolean) => void;
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
}) {
    return (
        <>
            {/* 送信するメッセージ */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">QRコード読み込み時のメッセージ・アクション</h2>
                    <p className="text-[11px] text-destructive mt-1">
                        新規友だちに対するアクションは初めての友だち追加時のみ、1度だけ稼働します。
                    </p>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold">送信するメッセージを登録</Label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onInsertVariable(LINE_NAME_VAR)}
                                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                            >
                                ＋ LINE名
                            </button>
                            <button
                                type="button"
                                disabled
                                title="準備中"
                                className="rounded-md border border-border px-3 py-1.5 text-xs opacity-40 cursor-not-allowed"
                            >
                                友だち情報
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                ref={messageRef}
                                value={message}
                                onChange={(e) =>
                                    onMessageChange(e.target.value.slice(0, MAX_MESSAGE))
                                }
                                rows={8}
                                placeholder="読み込み時に送信するメッセージを入力（任意）"
                                className="w-full rounded-md border border-input bg-background p-3 text-sm resize-y"
                            />
                            <span className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">
                                {message.length}/{MAX_MESSAGE}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* アクション登録 */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">上記メッセージ送信以外のアクション登録</h2>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground">よく使われる項目</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        <ActionTile
                            icon={faFileLines}
                            label={["テンプレートを", "送信する"]}
                            onClick={() => onOpenDialog("send_template")}
                        />
                        <ActionTile
                            icon={faTag}
                            label={["タグを", "付け・外しする"]}
                            onClick={() => onOpenDialog("tag_attach")}
                        />
                        <ActionTile
                            icon={faAddressCard}
                            label={["友だち情報を", "設定する"]}
                            onClick={() => onOpenDialog("friend_field")}
                        />
                        <ActionTile
                            icon={faClock}
                            label={["ステップ配信を", "開始・停止する"]}
                            onClick={() => onOpenDialog("scenario_start")}
                        />
                        <ActionTile
                            icon={faEllipsis}
                            label={["その他の", "アクションをみる"]}
                            onClick={() => onOpenDialog()}
                        />
                    </div>

                    <div>
                        <Button
                            type="button"
                            onClick={() => onOpenDialog()}
                            className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3" />
                            アクション追加・編集
                        </Button>
                    </div>

                    {actions.length === 0 ? (
                        <div className="rounded-md bg-muted/40 px-3 py-3 text-sm text-center text-muted-foreground">
                            アクションは登録されていません
                        </div>
                    ) : (
                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground">
                                登録済みアクション ({actions.length})
                            </div>
                            {actions.map((action, idx) => (
                                <ActionRow
                                    key={idx}
                                    action={action}
                                    tags={tags}
                                    scenarios={scenarios}
                                    richMenus={richMenus}
                                    templates={templates}
                                    onRemove={() => onRemoveAction(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* あいさつメッセージの併用 */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">あいさつメッセージの併用</h2>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-xs text-muted-foreground">
                        QRコードを読み込んで友だちが追加された時に、上記のメッセージ・アクションと
                        あいさつメッセージを併用する場合の設定です。
                    </p>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="radio"
                                checked={combineGreeting}
                                onChange={() => onCombineChange(true)}
                                className="size-4 accent-primary"
                            />
                            併用する
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="radio"
                                checked={!combineGreeting}
                                onChange={() => onCombineChange(false)}
                                className="size-4 accent-primary"
                            />
                            併用しない
                        </label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        ※ QRコードアクションでステップ配信を設定している場合、
                        あいさつメッセージで設定しているステップ配信は実行されません。
                    </p>
                </div>
            </section>
        </>
    );
}

function ActivePanel({
    offBehavior,
    onOffBehaviorChange,
    offText,
    onOffTextChange,
    offRedirectUrl,
    onOffRedirectUrlChange,
    offFollowAction,
    onOffFollowActionChange,
    offActions,
    onOpenOffDialog,
    onRemoveOffAction,
    tags,
    scenarios,
    richMenus,
    templates,
    scheduleEnabled,
    onScheduleEnabledChange,
    scheduleStartAt,
    onScheduleStartChange,
    scheduleEndAt,
    onScheduleEndChange,
}: {
    offBehavior: OffBehavior;
    onOffBehaviorChange: (v: OffBehavior) => void;
    offText: string;
    onOffTextChange: (v: string) => void;
    offRedirectUrl: string;
    onOffRedirectUrlChange: (v: string) => void;
    offFollowAction: OffFollowAction;
    onOffFollowActionChange: (v: OffFollowAction) => void;
    offActions: GreetingAction[];
    onOpenOffDialog: (preset?: GreetingActionType) => void;
    onRemoveOffAction: (idx: number) => void;
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
    scheduleEnabled: boolean;
    onScheduleEnabledChange: (v: boolean) => void;
    scheduleStartAt: string;
    onScheduleStartChange: (v: string) => void;
    scheduleEndAt: string;
    onScheduleEndChange: (v: string) => void;
}) {
    const offBehaviorOptions: { value: OffBehavior; label: string }[] = [
        { value: "friend_add", label: "友だち追加ページを表示" },
        { value: "text", label: "テキストを表示" },
        { value: "redirect", label: "指定ページに遷移" },
    ];

    // 終了日時を設定するか（既に終了日時が入っていれば設定済みとみなす）
    const [endEnabled, setEndEnabled] = useState(scheduleEndAt !== "");

    return (
        <>
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">稼働ON・OFFの設定</h2>
                </div>
                <div className="p-5 text-sm text-muted-foreground">
                    一時的にQRコードアクションの利用を停止する場合、一覧ページから稼働の設定ができます。
                </div>
            </section>

            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">
                        稼働OFF時にQRコードが読み込まれた場合の設定
                    </h2>
                </div>
                <div className="p-5 space-y-5">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        {offBehaviorOptions.map((o) => (
                            <label
                                key={o.value}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    checked={offBehavior === o.value}
                                    onChange={() => onOffBehaviorChange(o.value)}
                                    className="size-4 accent-primary"
                                />
                                {o.label}
                            </label>
                        ))}
                    </div>

                    {offBehavior === "text" && (
                        <RichTextEditor
                            value={offText}
                            onChange={onOffTextChange}
                            placeholder="現在、友だち追加は受け付けていません。"
                        />
                    )}
                    {offBehavior === "redirect" && (
                        <Input
                            value={offRedirectUrl}
                            onChange={(e) =>
                                onOffRedirectUrlChange(e.target.value)
                            }
                            placeholder="https://example.com/..."
                            className="h-10"
                        />
                    )}

                    {offBehavior === "friend_add" && (
                    <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-sm font-bold">
                            稼働OFF時に友だち追加された場合のアクション
                            <span className="font-normal text-muted-foreground">
                                （通常友だち追加として扱われます）
                            </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    checked={offFollowAction === "greeting"}
                                    onChange={() =>
                                        onOffFollowActionChange("greeting")
                                    }
                                    className="size-4 accent-primary"
                                />
                                あいさつメッセージを稼働させる
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    checked={offFollowAction === "custom"}
                                    onChange={() =>
                                        onOffFollowActionChange("custom")
                                    }
                                    className="size-4 accent-primary"
                                />
                                個別にアクションを設定する
                            </label>
                        </div>

                        {offFollowAction === "custom" && (
                            <div className="rounded-lg border border-border p-5 space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold">
                                        上記メッセージ送信以外のアクション登録
                                    </h3>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        よく使われる項目
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    <ActionTile
                                        icon={faFileLines}
                                        label={["テンプレートを", "送信する"]}
                                        onClick={() => onOpenOffDialog("send_template")}
                                    />
                                    <ActionTile
                                        icon={faTag}
                                        label={["タグを", "付け・外しする"]}
                                        onClick={() => onOpenOffDialog("tag_attach")}
                                    />
                                    <ActionTile
                                        icon={faAddressCard}
                                        label={["友だち情報を", "設定する"]}
                                        onClick={() => onOpenOffDialog("friend_field")}
                                    />
                                    <ActionTile
                                        icon={faClock}
                                        label={["ステップ配信を", "開始・停止する"]}
                                        onClick={() => onOpenOffDialog("scenario_start")}
                                    />
                                    <ActionTile
                                        icon={faEllipsis}
                                        label={["その他の", "アクションをみる"]}
                                        onClick={() => onOpenOffDialog()}
                                    />
                                </div>

                                <div>
                                    <Button
                                        type="button"
                                        onClick={() => onOpenOffDialog()}
                                        className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            className="size-3"
                                        />
                                        アクション追加・編集
                                    </Button>
                                </div>

                                {offActions.length === 0 ? (
                                    <div className="rounded-md bg-muted/40 px-3 py-3 text-sm text-center text-muted-foreground">
                                        いちごアクションは登録されていません
                                    </div>
                                ) : (
                                    <div className="space-y-2 pt-2 border-t border-border">
                                        <div className="text-xs text-muted-foreground">
                                            登録済みアクション ({offActions.length})
                                        </div>
                                        {offActions.map((action, idx) => (
                                            <ActionRow
                                                key={idx}
                                                action={action}
                                                tags={tags}
                                                scenarios={scenarios}
                                                richMenus={richMenus}
                                                templates={templates}
                                                onRemove={() => onRemoveOffAction(idx)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </section>

            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">スケジュール設定</h2>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        開始・終了日時が到来すると、稼働状況が自動でON・OFFされます。
                    </p>
                    <div className="inline-flex rounded-md border border-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => onScheduleEnabledChange(false)}
                            className={cn(
                                "px-5 py-2 text-sm font-bold transition-colors",
                                !scheduleEnabled
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-muted-foreground hover:bg-muted",
                            )}
                        >
                            利用しない
                        </button>
                        <button
                            type="button"
                            onClick={() => onScheduleEnabledChange(true)}
                            className={cn(
                                "px-5 py-2 text-sm font-bold transition-colors border-l border-border",
                                scheduleEnabled
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-muted-foreground hover:bg-muted",
                            )}
                        >
                            利用する
                        </button>
                    </div>

                    {scheduleEnabled && (
                        <div className="space-y-5 pt-2">
                            {/* 開始日時 */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Label className="text-xs font-bold w-16 shrink-0">
                                    開始日時
                                </Label>
                                <input
                                    type="date"
                                    value={scheduleStartAt.slice(0, 10)}
                                    onChange={(e) =>
                                        onScheduleStartChange(
                                            combineDateTime(
                                                e.target.value,
                                                scheduleStartAt.slice(11, 16),
                                            ),
                                        )
                                    }
                                    className="h-10 w-44 rounded-md border border-input bg-background px-3 text-sm"
                                />
                                <input
                                    type="time"
                                    value={scheduleStartAt.slice(11, 16)}
                                    onChange={(e) =>
                                        onScheduleStartChange(
                                            combineDateTime(
                                                scheduleStartAt.slice(0, 10),
                                                e.target.value,
                                            ),
                                        )
                                    }
                                    className="h-10 w-36 rounded-md border border-input bg-background px-3 text-sm"
                                />
                            </div>

                            {/* 終了日時の有無 */}
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!endEnabled}
                                        onChange={() => {
                                            setEndEnabled(false);
                                            onScheduleEndChange("");
                                        }}
                                        className="size-4 accent-primary"
                                    />
                                    終了日時を設定しない(ONの状態を継続する)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={endEnabled}
                                        onChange={() => setEndEnabled(true)}
                                        className="size-4 accent-primary"
                                    />
                                    終了日時を設定する
                                </label>
                            </div>

                            {/* 終了日時 */}
                            {endEnabled && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <Label className="text-xs font-bold w-16 shrink-0">
                                        終了日時
                                    </Label>
                                    <input
                                        type="date"
                                        value={scheduleEndAt.slice(0, 10)}
                                        onChange={(e) =>
                                            onScheduleEndChange(
                                                combineDateTime(
                                                    e.target.value,
                                                    scheduleEndAt.slice(11, 16),
                                                ),
                                            )
                                        }
                                        className="h-10 w-44 rounded-md border border-input bg-background px-3 text-sm"
                                    />
                                    <input
                                        type="time"
                                        value={scheduleEndAt.slice(11, 16)}
                                        onChange={(e) =>
                                            onScheduleEndChange(
                                                combineDateTime(
                                                    scheduleEndAt.slice(0, 10),
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className="h-10 w-36 rounded-md border border-input bg-background px-3 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-bold">
            STEP {n}
        </span>
    );
}

function ReferralPanel({
    referralCode,
    referrerTitle,
    onReferrerTitleChange,
    referrerBody,
    onReferrerBodyChange,
    refereeTitle,
    onRefereeTitleChange,
    refereeBody,
    onRefereeBodyChange,
    message,
    onMessageChange,
    messageDisabled,
    onMessageDisabledChange,
    referralActions,
    onOpenReferralDialog,
    onRemoveReferralAction,
    tags,
    scenarios,
    richMenus,
    templates,
}: {
    referralCode: string | null;
    referrerTitle: string;
    onReferrerTitleChange: (v: string) => void;
    referrerBody: string;
    onReferrerBodyChange: (v: string) => void;
    refereeTitle: string;
    onRefereeTitleChange: (v: string) => void;
    refereeBody: string;
    onRefereeBodyChange: (v: string) => void;
    message: string;
    onMessageChange: (v: string) => void;
    messageDisabled: boolean;
    onMessageDisabledChange: (v: boolean) => void;
    referralActions: GreetingAction[];
    onOpenReferralDialog: (preset?: GreetingActionType) => void;
    onRemoveReferralAction: (idx: number) => void;
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
}) {
    const [pageTab, setPageTab] = useState<"referrer" | "referee">("referrer");
    const [copied, setCopied] = useState(false);
    const code = referralCode ? `[LANDING_INTRO_${referralCode}]` : "";
    // 紹介先タブのメッセージは referral_referee_body を流用（プレーンテキスト・最大200字）
    void refereeTitle;
    void onRefereeTitleChange;
    const REFEREE_MAX = 200;

    const copyCode = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* noop */
        }
    };

    return (
        <>
            {/* 紹介コード */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                    <h2 className="text-sm font-bold">紹介時アクション</h2>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-xs text-muted-foreground">
                        ※以下のコードを紹介元の友だちに送信してください
                    </p>
                    {code ? (
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm bg-muted rounded px-3 py-2 truncate">
                                {code}
                            </code>
                            <button
                                type="button"
                                onClick={copyCode}
                                className="shrink-0 size-9 grid place-items-center rounded hover:bg-muted text-muted-foreground"
                                title="コピー"
                            >
                                <FontAwesomeIcon
                                    icon={faCopy}
                                    className="size-4"
                                />
                            </button>
                            {copied && (
                                <span className="text-xs text-primary">
                                    コピーしました
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md bg-muted/40 px-3 py-3 text-sm text-center text-muted-foreground">
                            保存するとコードが発行されます
                        </div>
                    )}
                </div>
            </section>

            {/* 案内ページの設定 */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-bold">案内ページの設定</h2>
                    <StepBadge n={1} />
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground">
                        紹介元・紹介先それぞれに表示される案内ページ記載内容を設定します。
                    </p>
                    <div className="flex items-center gap-1 border-b border-border">
                        {(
                            [
                                { key: "referrer", label: "紹介元" },
                                { key: "referee", label: "紹介先" },
                            ] as const
                        ).map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setPageTab(t.key)}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors",
                                    pageTab === t.key
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {pageTab === "referrer" ? (
                        <>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold">
                                        ページタイトル
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {referrerTitle.length}/30
                                    </span>
                                </div>
                                <Input
                                    value={referrerTitle}
                                    onChange={(e) =>
                                        onReferrerTitleChange(
                                            e.target.value.slice(0, 30),
                                        )
                                    }
                                    maxLength={30}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">
                                    案内文
                                </Label>
                                <RichTextEditor
                                    value={referrerBody}
                                    onChange={onReferrerBodyChange}
                                    placeholder="案内ページに表示する文章を入力"
                                />
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
                                <span className="text-xs font-bold text-primary">
                                    紹介元の友だちに表示される紹介用ページ
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold">
                                        紹介先の友だちへ送信するメッセージ
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {refereeBody.length}/{REFEREE_MAX}
                                    </span>
                                </div>
                                <textarea
                                    value={refereeBody}
                                    onChange={(e) =>
                                        onRefereeBodyChange(
                                            e.target.value.slice(0, REFEREE_MAX),
                                        )
                                    }
                                    rows={6}
                                    placeholder="紹介先の友だちが友だち追加した時に受け取るメッセージを入力"
                                    className="w-full rounded-md border border-input bg-background p-3 text-sm resize-y"
                                />
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
                                <span className="text-xs font-bold text-primary">
                                    紹介先の友だちが受け取るメッセージ
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* 紹介時アクション設定 */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-bold">紹介時アクション設定</h2>
                    <StepBadge n={3} />
                </div>
                <div className="p-5 space-y-5">
                    <p className="text-xs text-muted-foreground">
                        紹介先が友だち追加した時に、紹介元が受け取るメッセージ・アクションを設定しましょう。
                    </p>

                    {/* メッセージ */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold">
                                送信するメッセージを登録
                            </Label>
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={messageDisabled}
                                    onChange={(e) =>
                                        onMessageDisabledChange(e.target.checked)
                                    }
                                    className="size-3.5 accent-primary"
                                />
                                利用しない
                            </label>
                        </div>
                        {!messageDisabled && (
                            <div className="relative">
                                <textarea
                                    value={message}
                                    onChange={(e) =>
                                        onMessageChange(
                                            e.target.value.slice(0, MAX_MESSAGE),
                                        )
                                    }
                                    rows={6}
                                    placeholder="紹介元に送信するメッセージを入力（任意）"
                                    className="w-full rounded-md border border-input bg-background p-3 text-sm resize-y"
                                />
                                <span className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">
                                    {message.length}/{MAX_MESSAGE}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* アクション登録 */}
                    <div className="rounded-lg border border-border p-5 space-y-4">
                        <div>
                            <h3 className="text-sm font-bold">
                                上記メッセージ送信以外のアクション登録
                            </h3>
                            <p className="mt-3 text-xs text-muted-foreground">
                                よく使われる項目
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            <ActionTile
                                icon={faFileLines}
                                label={["テンプレートを", "送信する"]}
                                onClick={() =>
                                    onOpenReferralDialog("send_template")
                                }
                            />
                            <ActionTile
                                icon={faTag}
                                label={["タグを", "付け・外しする"]}
                                onClick={() => onOpenReferralDialog("tag_attach")}
                            />
                            <ActionTile
                                icon={faAddressCard}
                                label={["友だち情報を", "設定する"]}
                                onClick={() =>
                                    onOpenReferralDialog("friend_field")
                                }
                            />
                            <ActionTile
                                icon={faClock}
                                label={["ステップ配信を", "開始・停止する"]}
                                onClick={() =>
                                    onOpenReferralDialog("scenario_start")
                                }
                            />
                            <ActionTile
                                icon={faEllipsis}
                                label={["その他の", "アクションをみる"]}
                                onClick={() => onOpenReferralDialog()}
                            />
                        </div>
                        <div>
                            <Button
                                type="button"
                                onClick={() => onOpenReferralDialog()}
                                className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                            >
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    className="size-3"
                                />
                                アクション追加・編集
                            </Button>
                        </div>
                        {referralActions.length === 0 ? (
                            <div className="rounded-md bg-muted/40 px-3 py-3 text-sm text-center text-muted-foreground">
                                いちごアクションは登録されていません
                            </div>
                        ) : (
                            <div className="space-y-2 pt-2 border-t border-border">
                                <div className="text-xs text-muted-foreground">
                                    登録済みアクション ({referralActions.length})
                                </div>
                                {referralActions.map((action, idx) => (
                                    <ActionRow
                                        key={idx}
                                        action={action}
                                        tags={tags}
                                        scenarios={scenarios}
                                        richMenus={richMenus}
                                        templates={templates}
                                        onRemove={() =>
                                            onRemoveReferralAction(idx)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

function CodeEditor({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const textRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const lineCount = Math.max(1, value.split("\n").length);

    const syncScroll = () => {
        if (gutterRef.current && textRef.current) {
            gutterRef.current.scrollTop = textRef.current.scrollTop;
        }
    };

    return (
        <div className="flex rounded-lg overflow-hidden bg-[#2b2b2b] font-mono text-xs">
            <div
                ref={gutterRef}
                className="shrink-0 overflow-hidden select-none py-3 pl-3 pr-2 text-right text-gray-500"
                style={{ minWidth: "2.75rem" }}
            >
                {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className="leading-5">
                        {i + 1}
                    </div>
                ))}
            </div>
            <textarea
                ref={textRef}
                value={value}
                onChange={(e) => onChange(e.target.value.slice(0, 20000))}
                onScroll={syncScroll}
                spellCheck={false}
                rows={14}
                className="flex-1 bg-transparent text-gray-100 leading-5 p-3 pl-1 outline-none resize-none"
            />
        </div>
    );
}

function HtmlTagPanel({
    enabled,
    onEnabledChange,
    headHtml,
    onHeadHtmlChange,
    bodyHtml,
    onBodyHtmlChange,
}: {
    enabled: boolean;
    onEnabledChange: (v: boolean) => void;
    headHtml: string;
    onHeadHtmlChange: (v: string) => void;
    bodyHtml: string;
    onBodyHtmlChange: (v: string) => void;
}) {
    const [htmlTab, setHtmlTab] = useState<"head" | "body">("head");

    return (
        <section className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">HTMLタグ挿入</h2>
            </div>
            <div className="p-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    友だち追加後のLINE画面上にHTMLタグを挿入することで（目視では確認できません。）
                    外部サービスの計測タグを発火させることができます。
                </p>
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => onEnabledChange(false)}
                        className={cn(
                            "px-5 py-2 text-sm font-bold transition-colors",
                            !enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                    >
                        利用しない
                    </button>
                    <button
                        type="button"
                        onClick={() => onEnabledChange(true)}
                        className={cn(
                            "px-5 py-2 text-sm font-bold transition-colors border-l border-border",
                            enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                    >
                        利用する
                    </button>
                </div>

                {enabled && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-6 border-b border-border">
                            {(
                                [
                                    { key: "head", label: "<head> タグ" },
                                    { key: "body", label: "<body> タグ" },
                                ] as const
                            ).map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setHtmlTab(t.key)}
                                    className={cn(
                                        "py-2 text-sm font-bold border-b-2 -mb-px transition-colors",
                                        htmlTab === t.key
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        {htmlTab === "head" ? (
                            <CodeEditor
                                value={headHtml}
                                onChange={onHeadHtmlChange}
                            />
                        ) : (
                            <CodeEditor
                                value={bodyHtml}
                                onChange={onBodyHtmlChange}
                            />
                        )}
                        <p className="text-[11px] text-muted-foreground">
                            友だち追加導線（LIFFランディング）の{" "}
                            {htmlTab === "head" ? "<head>" : "<body>"}{" "}
                            内にこのタグが読み込まれます。
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

function FriendFieldSelect({
    value,
    onChange,
    friendFields,
    friendFieldFolders,
}: {
    value: number | "";
    onChange: (id: number | "") => void;
    friendFields: FriendFieldRef[];
    friendFieldFolders: FriendFieldFolderRef[];
}) {
    const [open, setOpen] = useState(false);
    const [folderId, setFolderId] = useState<number | null>(
        friendFieldFolders[0]?.id ?? null,
    );
    const selected = friendFields.find((f) => f.id === value);
    const folderFields = friendFields.filter(
        (f) => f.friend_field_folder_id === folderId,
    );

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between text-left"
            >
                <span className={selected ? "" : "text-muted-foreground"}>
                    {selected?.name ?? "選択してください"}
                </span>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className="size-3 text-muted-foreground shrink-0"
                />
            </button>
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 w-full grid grid-cols-2 rounded-lg border border-border bg-popover shadow-lg overflow-hidden min-h-[220px]">
                        <div className="border-r border-border bg-muted/20 p-1.5 space-y-1">
                            {friendFieldFolders.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setFolderId(f.id)}
                                    className={cn(
                                        "w-full text-left rounded-md px-3 py-2.5 text-sm",
                                        f.id === folderId
                                            ? "bg-primary text-primary-foreground font-bold"
                                            : "hover:bg-muted",
                                    )}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                        <div className="bg-background overflow-y-auto max-h-72">
                            {folderFields.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground">
                                    分類を選択して下さい
                                </div>
                            ) : (
                                folderFields.map((ff) => (
                                    <button
                                        key={ff.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(ff.id);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-sm border-b border-border hover:bg-muted/40",
                                            value === ff.id &&
                                                "bg-primary/10 font-medium",
                                        )}
                                    >
                                        {ff.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function ParamImportPanel({
    enabled,
    onEnabledChange,
    map,
    onMapChange,
    friendFields,
    friendFieldFolders,
}: {
    enabled: boolean;
    onEnabledChange: (v: boolean) => void;
    map: Record<string, number | "">;
    onMapChange: (cid: string, fieldId: number | "") => void;
    friendFields: FriendFieldRef[];
    friendFieldFolders: FriendFieldFolderRef[];
}) {
    return (
        <section className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">パラメーターインポート</h2>
            </div>
            <div className="p-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    パラメーターを利用して、QRコード（URL）読み込み時に外部システムの顧客情報を
                    いちごの友だち情報にインポートすることができます。
                </p>
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => onEnabledChange(false)}
                        className={cn(
                            "px-5 py-2 text-sm font-bold transition-colors",
                            !enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                    >
                        利用しない
                    </button>
                    <button
                        type="button"
                        onClick={() => onEnabledChange(true)}
                        className={cn(
                            "px-5 py-2 text-sm font-bold transition-colors border-l border-border",
                            enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                    >
                        利用する
                    </button>
                </div>

                {enabled && (
                    <div className="space-y-4">
                        <div className="-mx-5 px-5 py-2.5 bg-muted/40 border-y border-border">
                            <h3 className="text-sm font-bold">
                                友だち情報の割り当て
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            最大5つまでの友だち情報を選択することができます。
                        </p>
                        <div className="grid grid-cols-[1fr_1fr] gap-x-6 gap-y-3 max-w-2xl">
                            <div className="text-center text-sm font-bold border-b border-border pb-2">
                                パラメーター名
                            </div>
                            <div className="text-center text-sm font-bold border-b border-border pb-2">
                                保存先の友だち情報
                            </div>
                            {CID_KEYS.map((cid) => (
                                <Fragment key={cid}>
                                    <div className="flex items-center justify-center rounded-md bg-muted/50 py-2.5 text-sm">
                                        {cid}
                                    </div>
                                    <FriendFieldSelect
                                        value={map[cid] ?? ""}
                                        onChange={(id) => onMapChange(cid, id)}
                                        friendFields={friendFields}
                                        friendFieldFolders={friendFieldFolders}
                                    />
                                </Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

const EXPORT_PARAMS: { name: string; label: string; info?: string }[] = [
    { name: "line_id", label: "LINE ID" },
    {
        name: "friend_type",
        label: "友だち追加情報",
        info: "新規追加(new) / ブロック解除(unblock) / 既存(existing)",
    },
    { name: "friend_name", label: "LINE登録名" },
    {
        name: "mail",
        label: "メールアドレス",
        info: "友だち情報の「メールアドレス」項目の値を送信します",
    },
];

function ParamExportPanel({
    enabled,
    onEnabledChange,
    callbackUrl,
    onCallbackUrlChange,
}: {
    enabled: boolean;
    onEnabledChange: (v: boolean) => void;
    callbackUrl: string;
    onCallbackUrlChange: (v: string) => void;
}) {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = async (name: string) => {
        try {
            await navigator.clipboard.writeText(name);
            setCopied(name);
            setTimeout(() => setCopied(null), 1200);
        } catch {
            /* noop */
        }
    };

    return (
        <section className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">パラメーターエクスポート</h2>
            </div>
            <div className="p-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    パラメーターを利用して、QRコード（URL）読み込み時に下記の情報を
                    外部システムにインポートすることができます。
                </p>
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => onEnabledChange(false)}
                        className={cn(
                            "px-5 py-2 text-sm font-bold transition-colors",
                            !enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                    >
                        利用しない
                    </button>
                    <button
                        type="button"
                        onClick={() => onEnabledChange(true)}
                        className={cn(
                            "px-5 py-2 text-sm font-bold transition-colors border-l border-border",
                            enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                    >
                        利用する
                    </button>
                </div>

                {enabled && (
                    <div className="space-y-5">
                        {/* Step1 */}
                        <div className="-mx-5 px-5 py-2.5 bg-muted/40 border-y border-border">
                            <h3 className="text-sm font-bold">
                                Step1　コールバックURLの設定
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            外部システムが発行するコールバックURLを設定して下さい。
                        </p>
                        <Input
                            type="url"
                            value={callbackUrl}
                            onChange={(e) => onCallbackUrlChange(e.target.value)}
                            placeholder="https://example.com"
                            className="h-10 max-w-xl"
                        />

                        {/* Step2 */}
                        <div className="-mx-5 px-5 py-2.5 bg-muted/40 border-y border-border">
                            <h3 className="text-sm font-bold">
                                Step2　パラメーター一覧
                            </h3>
                        </div>
                        <div className="grid grid-cols-[1fr_1fr] gap-x-6 gap-y-3 max-w-2xl">
                            <div className="text-center text-sm font-bold border-b border-border pb-2">
                                パラメーター名
                            </div>
                            <div className="text-center text-sm font-bold border-b border-border pb-2">
                                エクスポート情報
                            </div>
                            {EXPORT_PARAMS.map((p) => (
                                <Fragment key={p.name}>
                                    <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-sm">
                                        <span className="font-mono">
                                            {p.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => copy(p.name)}
                                            title="コピー"
                                            className="shrink-0 text-muted-foreground hover:text-foreground"
                                        >
                                            <FontAwesomeIcon
                                                icon={faCopy}
                                                className="size-3.5"
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-2.5 text-sm">
                                        {copied === p.name ? (
                                            <span className="text-primary">
                                                コピーしました
                                            </span>
                                        ) : (
                                            <>
                                                {p.label}
                                                {p.info && (
                                                    <FontAwesomeIcon
                                                        icon={faCircleInfo}
                                                        title={p.info}
                                                        className="size-3 text-muted-foreground cursor-help"
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function PlaceholderPanel({ title, body }: { title: string; body: string }) {
    return (
        <section className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">{title}</h2>
            </div>
            <div className="p-8 text-center text-sm text-muted-foreground">
                {body}
            </div>
        </section>
    );
}

