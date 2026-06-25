"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faCirclePlus,
    faChevronDown,
    faTrash,
    faPaperPlane,
    faClock,
    faTag,
    faTableCells,
    faFileLines,
    faEllipsis,
    faComment,
    faBell,
    faBookmark,
    faAddressCard,
    faListCheck,
    faBan,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { FriendAddUrlCard } from "@/components/friend-add-url-card";
import { GuideButton } from "@/components/guide-button";
import { MediaUploader } from "@/components/media/media-uploader";
import { cn } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api/client";
import { createTag } from "@/lib/api/tags";
import type { Tag, ChatStatus } from "@/types/chat";
import type { LineChannel } from "@/types/broadcast";
import type {
    Greeting,
    GreetingAction,
    GreetingActionType,
    GreetingType,
    RichMenuRef,
    TemplateRef,
    TemplateFolderRef,
    ReminderRef,
    FriendFieldRef,
    FriendFieldFolderRef,
} from "@/types/greeting";

const MAX_TEXT = 5000;

export type GreetingTheme = {
    badgeLabel: string;
    badgeClass: string;
    icon: IconDefinition;
    iconColorClass: string;
    description: React.ReactNode;
    sectionTitle: string;
    showSendButton?: boolean;
    testSteps: string[];
    testNote?: React.ReactNode;
};

export type ScenarioRef = {
    id: number;
    name: string;
    line_channel_id?: number;
    steps_count?: number;
};

export type ServerProps = {
    greeting: Greeting | null;
    channel: LineChannel | null;
    channels: LineChannel[];
    scenarios: ScenarioRef[];
    tags: Tag[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
    templateFolders: TemplateFolderRef[];
    reminders: ReminderRef[];
    friendFields: FriendFieldRef[];
    friendFieldFolders: FriendFieldFolderRef[];
    chatStatuses?: ChatStatus[];
};

type FormData = {
    line_channel_id: number;
    is_active: boolean;
    message_type: "text" | "image" | "video" | "audio";
    text_content: string;
    image_url: string;
    image_preview_url: string;
    media_duration: number | null;
    actions: GreetingAction[];
};

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

export function GreetingForm({
    type,
    theme,
    submitUrl,
    sendUrl,
    greeting,
    channel,
    channels,
    scenarios,
    tags,
    richMenus: richMenusProp,
    templates: templatesProp,
    templateFolders: templateFoldersProp,
    reminders: remindersProp,
    friendFields: friendFieldsProp,
    friendFieldFolders: friendFieldFoldersProp,
    chatStatuses: chatStatusesProp,
}: {
    type: GreetingType;
    theme: GreetingTheme;
    submitUrl: string;
    sendUrl?: string;
} & ServerProps) {
    const richMenus = richMenusProp ?? [];
    const templates = templatesProp ?? [];
    const templateFolders = templateFoldersProp ?? [];
    const reminders = remindersProp ?? [];
    const friendFields = friendFieldsProp ?? [];
    const friendFieldFolders = friendFieldFoldersProp ?? [];
    const chatStatuses = chatStatusesProp ?? [];

    const form = useFormState<FormData>({
        line_channel_id: channel?.id ?? 0,
        is_active: greeting?.is_active ?? true,
        message_type: greeting?.message_type ?? "text",
        text_content: greeting?.text_content ?? "",
        image_url: greeting?.image_url ?? "",
        image_preview_url: greeting?.image_preview_url ?? "",
        media_duration: greeting?.media_duration ?? null,
        actions: greeting?.actions ?? [],
    });

    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [presetType, setPresetType] = useState<GreetingActionType | null>(
        null,
    );

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        form.setProcessing(true);
        form.setErrors({});
        try {
            await apiFetch(submitUrl, { method: "PUT", body: form.data });
        } catch (err) {
            if (err instanceof ApiError) form.setErrors(err.fieldErrors());
        } finally {
            form.setProcessing(false);
        }
    };

    const sendExisting = async () => {
        if (!sendUrl) return;
        if (
            !confirm(
                "登録されている既存友だち全員にメッセージを送信します。よろしいですか？",
            )
        ) {
            return;
        }
        await apiFetch(sendUrl, {
            method: "POST",
            body: { line_channel_id: form.data.line_channel_id },
        });
    };

    const openActionDialog = (preset?: GreetingActionType) => {
        setPresetType(preset ?? null);
        setActionDialogOpen(true);
    };

    return (
        <form
            onSubmit={onSubmit}
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4"
        >
            {/* ヘッダー */}
            <div className="flex items-center gap-3 flex-wrap">
                <span
                    className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
                        theme.badgeClass,
                    )}
                >
                    {theme.badgeLabel}
                </span>
                <h1 className="text-xl font-bold tracking-tight">
                    あいさつメッセージ設定
                </h1>
                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline ml-auto"
                >
                    友だちの流入経路を分析したい場合はこちら
                </a>
                <GuideButton topic="webhook" />
            </div>

            {/* 説明カード */}
            <Card className="bg-muted/40">
                <CardContent className="p-4 flex items-start gap-3">
                    <span className="grid place-items-center size-10 rounded-full bg-background border border-border shrink-0">
                        <FontAwesomeIcon
                            icon={theme.icon}
                            className={cn("size-4", theme.iconColorClass)}
                        />
                    </span>
                    <div className="text-sm text-foreground">
                        {theme.description}
                    </div>
                </CardContent>
            </Card>

            {/* チャネル + 稼働 toolbar (mockup には無いが必須項目) */}
            <Card className="bg-background">
                <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                    <Label className="text-xs text-muted-foreground">
                        対象 LINE チャネル:
                    </Label>
                    {channels.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                            アクティブな LINE チャネルがありません
                        </span>
                    ) : (
                        <select
                            value={form.data.line_channel_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                form.setData("line_channel_id", id);
                            }}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {channels.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                            稼働
                        </Label>
                        <Switch
                            checked={form.data.is_active}
                            onCheckedChange={(v) =>
                                form.setData("is_active", v)
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 友だち追加 URL (新規 / 既存友だち用のみ) */}
            {type !== "unblock" && <FriendAddUrlCard />}

            {/* タブ */}
            <Tabs defaultValue="settings" className="flex flex-col">
                <TabsList
                    variant="line"
                    className="border-b border-border justify-start gap-2 h-auto rounded-none p-0 self-stretch"
                >
                    <TabsTrigger
                        value="settings"
                        className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
                    >
                        メッセージ・アクション設定
                    </TabsTrigger>
                    <TabsTrigger
                        value="test"
                        className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
                    >
                        テスト方法
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-4 mt-4">
                    <Card>
                        <CardContent className="p-5 space-y-4">
                            <div className="text-sm font-bold">
                                {theme.sectionTitle}
                            </div>

                            {/* 内カード: メッセージ */}
                            <Card className="border-border">
                                <CardContent className="p-4 space-y-3">
                                    <div className="text-sm font-bold">
                                        送信するメッセージを登録
                                    </div>

                                    {/* 種別切替: テキスト / メディア（画像・動画・音声） */}
                                    <div className="inline-flex rounded-md border border-border overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    "message_type",
                                                    "text",
                                                )
                                            }
                                            className={cn(
                                                "px-4 py-1.5 text-sm",
                                                form.data.message_type === "text"
                                                    ? "bg-primary text-primary-foreground font-bold"
                                                    : "bg-background",
                                            )}
                                        >
                                            テキスト
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    form.data.message_type ===
                                                    "text"
                                                ) {
                                                    form.setData(
                                                        "message_type",
                                                        "image",
                                                    );
                                                }
                                            }}
                                            className={cn(
                                                "px-4 py-1.5 text-sm border-l border-border",
                                                form.data.message_type !== "text"
                                                    ? "bg-primary text-primary-foreground font-bold"
                                                    : "bg-background",
                                            )}
                                        >
                                            画像・動画・音声
                                        </button>
                                    </div>

                                    {form.data.message_type === "text" ? (
                                        <>
                                            <div className="rounded-md border border-border bg-muted/30 p-2 flex items-center gap-2 flex-wrap">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 bg-background"
                                                    onClick={() =>
                                                        form.setData(
                                                            "text_content",
                                                            form.data
                                                                .text_content +
                                                                "{{LINE名}}",
                                                        )
                                                    }
                                                >
                                                    ＋ LINE名
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 bg-background"
                                                    disabled
                                                >
                                                    ＋ 友だち情報
                                                </Button>
                                                <span className="text-[11px] text-muted-foreground ml-auto">
                                                    ※ 変数は本文末尾に挿入されます
                                                </span>
                                            </div>

                                            <Textarea
                                                rows={14}
                                                value={form.data.text_content}
                                                onChange={(e) =>
                                                    form.setData(
                                                        "text_content",
                                                        e.target.value.slice(
                                                            0,
                                                            MAX_TEXT,
                                                        ),
                                                    )
                                                }
                                                placeholder="本文を入力..."
                                            />
                                            <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                                                {form.data.text_content.length}/
                                                {MAX_TEXT.toLocaleString()}
                                            </div>
                                            {form.errors.text_content && (
                                                <p className="text-xs text-destructive">
                                                    {form.errors.text_content}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <MediaUploader
                                                mediaType={
                                                    form.data.message_type as
                                                        | "image"
                                                        | "video"
                                                        | "audio"
                                                }
                                                url={form.data.image_url}
                                                uploadImageEndpoint="/greetings/upload-image"
                                                uploadMediaEndpoint="/greetings/upload-media"
                                                onChange={(c) =>
                                                    form.setData({
                                                        ...form.data,
                                                        message_type:
                                                            c.message_type,
                                                        image_url: c.url,
                                                        image_preview_url:
                                                            c.preview_url ??
                                                            c.url,
                                                        media_duration:
                                                            c.duration ?? null,
                                                    })
                                                }
                                            />
                                            {(form.errors.image_url ||
                                                form.errors.image_preview_url ||
                                                form.errors.media_duration) && (
                                                <p className="text-xs text-destructive">
                                                    {form.errors.image_url ??
                                                        form.errors
                                                            .image_preview_url ??
                                                        form.errors
                                                            .media_duration}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 内カード: アクション */}
                            <Card className="border-border">
                                <CardContent className="p-4 space-y-3">
                                    <div className="text-sm font-bold">
                                        上記メッセージ送信以外のアクション登録
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        友だち追加時の
                                        <span className="text-foreground font-medium mx-0.5">
                                            ステップ配信の開始
                                        </span>
                                        や
                                        <span className="text-foreground font-medium mx-0.5">
                                            リッチメニュー表示
                                        </span>
                                        などのアクションをこちらで設定します。
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        <ActionTile
                                            icon={faClock}
                                            label={[
                                                "ステップ配信を",
                                                "開始・停止する",
                                            ]}
                                            onClick={() =>
                                                openActionDialog(
                                                    "scenario_start",
                                                )
                                            }
                                        />
                                        <ActionTile
                                            icon={faTableCells}
                                            label={[
                                                "リッチメニューを",
                                                "表示する",
                                            ]}
                                            onClick={() =>
                                                openActionDialog(
                                                    "link_rich_menu",
                                                )
                                            }
                                        />
                                        <ActionTile
                                            icon={faFileLines}
                                            label={[
                                                "テンプレートを",
                                                "送信する",
                                            ]}
                                            onClick={() =>
                                                openActionDialog("send_template")
                                            }
                                        />
                                        <ActionTile
                                            icon={faTag}
                                            label={["タグを", "付け・外しする"]}
                                            onClick={() =>
                                                openActionDialog("tag_attach")
                                            }
                                        />
                                        <ActionTile
                                            icon={faEllipsis}
                                            label={[
                                                "その他の",
                                                "アクションをみる",
                                            ]}
                                            onClick={() => openActionDialog()}
                                        />
                                    </div>

                                    <div>
                                        <Button
                                            type="button"
                                            onClick={() => openActionDialog()}
                                            className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                                        >
                                            <FontAwesomeIcon
                                                icon={faPlus}
                                                className="size-3"
                                            />
                                            アクション追加・編集
                                        </Button>
                                    </div>

                                    {form.data.actions.length === 0 ? (
                                        <div className="rounded-md bg-muted/40 px-3 py-3 text-sm text-center text-muted-foreground">
                                            アクションは登録されていません
                                        </div>
                                    ) : (
                                        <div className="space-y-2 pt-2 border-t border-border">
                                            <div className="text-xs text-muted-foreground">
                                                登録済みアクション (
                                                {form.data.actions.length})
                                            </div>
                                            {form.data.actions.map(
                                                (action, idx) => (
                                                    <ActionRow
                                                        key={idx}
                                                        action={action}
                                                        tags={tags}
                                                        scenarios={scenarios}
                                                        richMenus={richMenus}
                                                        templates={templates}
                                                        onRemove={() => {
                                                            const next =
                                                                form.data.actions.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        idx,
                                                                );
                                                            form.setData(
                                                                "actions",
                                                                next,
                                                            );
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={form.processing || !channel}
                            className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-10"
                        >
                            {form.processing ? "保存中..." : "保存"}
                        </Button>
                        {theme.showSendButton && sendUrl && (
                            <Button
                                type="button"
                                onClick={sendExisting}
                                disabled={!channel}
                                className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-6"
                            >
                                <FontAwesomeIcon
                                    icon={faPaperPlane}
                                    className="size-3.5"
                                />
                                既存友だち全員に今すぐ送信
                            </Button>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="test" className="space-y-4 mt-4">
                    <Card>
                        <CardContent className="p-5 space-y-5">
                            <h3 className="text-sm font-bold">
                                {theme.badgeLabel} アクションのテスト方法
                            </h3>

                            <div className="relative">
                                <div
                                    className="absolute top-4 left-[12.5%] right-[12.5%] h-px bg-border"
                                    style={{
                                        display:
                                            theme.testSteps.length > 1
                                                ? "block"
                                                : "none",
                                    }}
                                />
                                <div
                                    className={cn(
                                        "grid gap-3 relative",
                                        theme.testSteps.length === 3
                                            ? "grid-cols-1 sm:grid-cols-3"
                                            : "grid-cols-2 sm:grid-cols-4",
                                    )}
                                >
                                    {theme.testSteps.map((step, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-center">
                                                <div className="relative z-10 size-8 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold tabular-nums">
                                                    {i + 1}
                                                </div>
                                            </div>
                                            <div className="rounded-md border border-border bg-background px-3 py-3 text-xs text-center leading-relaxed min-h-20 flex items-center justify-center">
                                                <div className="whitespace-pre-line">
                                                    {step}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm font-bold">
                                ご注意事項
                            </div>
                            <div className="text-sm text-foreground">
                                {theme.testNote ?? (
                                    <p>
                                        LINE
                                        公式アカウント管理画面のあいさつメッセージが設定されている場合は、どちらも送信されます。
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                currentActions={form.data.actions}
                onSave={(actions) => {
                    form.setData("actions", actions);
                    setActionDialogOpen(false);
                }}
            />
        </form>
    );
}

export function ActionTile({
    icon,
    label,
    onClick,
    disabled,
}: {
    icon: IconDefinition;
    label: [string, string];
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-background p-4 transition-colors",
                disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-muted/40 hover:border-primary/40",
            )}
        >
            <FontAwesomeIcon icon={icon} className="size-6 text-foreground" />
            <div className="text-xs text-center leading-tight text-foreground">
                <div>{label[0]}</div>
                <div>{label[1]}</div>
            </div>
        </button>
    );
}

export function ActionRow({
    action,
    tags,
    scenarios,
    richMenus,
    templates,
    onRemove,
}: {
    action: GreetingAction;
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
    onRemove: () => void;
}) {
    let label = "";
    let icon: IconDefinition = faTag;
    if (action.type === "tag_attach" || action.type === "tag_detach") {
        const ids = action.tag_ids ?? (action.tag_id ? [action.tag_id] : []);
        const names = ids
            .map((id) => tags.find((t) => t.id === id)?.name ?? "(削除済み)")
            .join("、");
        const verb = action.type === "tag_attach" ? "付与" : "解除";
        label = `タグ「${names || "(未選択)"}」を${verb}`;
        icon = faTag;
    } else if (action.type === "scenario_start") {
        const mode = action.scenario_mode ?? "start";
        icon = faClock;
        if (mode === "stop") {
            label = "ステップ配信を停止";
        } else {
            const s = scenarios.find((s) => s.id === action.scenario_id);
            const verb =
                mode === "place" ? "を途中から配置" : "を開始・再開";
            label = `ステップ配信「${s?.name ?? "(削除済み)"}」${verb}`;
        }
    } else if (action.type === "link_rich_menu") {
        const r = richMenus.find((r) => r.id === action.rich_menu_id);
        label = `リッチメニュー「${r?.name ?? "(未公開/削除済み)"}」を表示`;
        icon = faTableCells;
    } else if (action.type === "send_template") {
        const t = templates.find((t) => t.id === action.template_id);
        label = `テンプレート「${t?.name ?? "(削除済み)"}」を送信`;
        icon = faFileLines;
    } else if (action.type === "send_text") {
        const preview = (action.text ?? "").trim().slice(0, 20);
        label = `テキスト送信「${preview || "(未入力)"}${
            (action.text ?? "").length > 20 ? "…" : ""
        }」`;
        icon = faComment;
    } else if (action.type === "reminder") {
        icon = faBell;
        const verb =
            (action.reminder_op ?? "start") === "stop" ? "停止" : "開始";
        label = `リマインド配信を${verb}`;
    }
    return (
        <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
            <FontAwesomeIcon
                icon={icon}
                className="size-3.5 text-muted-foreground"
            />
            <span className="text-sm flex-1">{label}</span>
            <button
                type="button"
                onClick={onRemove}
                className="size-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                aria-label="削除"
            >
                <FontAwesomeIcon icon={faTrash} className="size-3" />
            </button>
        </div>
    );
}

const SELECT_CLASS =
    "w-full h-10 rounded-md border border-input bg-background px-3 text-sm";

type PaletteItem = {
    label: string;
    icon: IconDefinition;
    actionType?: GreetingActionType; // undefined = 未対応（無効化）
};

// 画像の並びに合わせた左パレット。actionType を持つものだけ追加可能。
const ACTION_PALETTE: PaletteItem[] = [
    { label: "ステップ", icon: faClock, actionType: "scenario_start" },
    { label: "テンプレート", icon: faFileLines, actionType: "send_template" },
    { label: "テキスト", icon: faComment, actionType: "send_text" },
    { label: "リマインド", icon: faBell, actionType: "reminder" },
    { label: "タグ", icon: faTag, actionType: "tag_attach" },
    { label: "リッチメニュー", icon: faTableCells, actionType: "link_rich_menu" },
    { label: "ブックマーク", icon: faBookmark, actionType: "bookmark" },
    { label: "友だち情報", icon: faAddressCard, actionType: "friend_field" },
    { label: "対応ステータス", icon: faListCheck, actionType: "chat_status" },
    { label: "ブロック", icon: faBan, actionType: "block" },
];

function newAction(type: GreetingActionType): GreetingAction {
    switch (type) {
        case "scenario_start":
            return {
                type,
                scenario_mode: "stop",
                scenario_id: null,
                start_step_order: null,
            };
        case "send_template":
            return { type, template_id: null };
        case "link_rich_menu":
            return { type, rich_menu_id: null };
        case "send_text":
            return { type, text: "" };
        case "reminder":
            return {
                type,
                reminder_op: "start",
                reminder_id: null,
                reminder_end_at: null,
            };
        case "bookmark":
            return { type, bookmark_op: "add" };
        case "friend_field":
            return { type, friend_field_id: null, friend_field_value: "" };
        case "chat_status":
            return { type, chat_status_op: "add", chat_status_id: null };
        case "block":
            return { type, block_mode: "block" };
        default:
            return { type: "tag_attach", tag_ids: [] };
    }
}

function isActionValid(a: GreetingAction): boolean {
    if (a.type === "scenario_start") {
        if ((a.scenario_mode ?? "stop") === "stop") return true;
        return !!a.scenario_id;
    }
    if (a.type === "tag_attach" || a.type === "tag_detach")
        return (a.tag_ids?.length ?? 0) > 0 || !!a.tag_id;
    if (a.type === "link_rich_menu") return !!a.rich_menu_id;
    if (a.type === "send_template") return !!a.template_id;
    if (a.type === "send_text") return (a.text ?? "").trim().length > 0;
    if (a.type === "reminder") {
        if (!a.reminder_id) return false;
        if ((a.reminder_op ?? "start") === "stop") return true;
        return !!a.reminder_end_at;
    }
    if (a.type === "bookmark") return true;
    if (a.type === "friend_field") return !!a.friend_field_id;
    if (a.type === "chat_status") {
        if ((a.chat_status_op ?? "add") === "remove") return true;
        return !!a.chat_status_id;
    }
    if (a.type === "block") return true;
    return false;
}

export function ActionDialog({
    open,
    onClose,
    tags: tagsProp,
    scenarios,
    richMenus,
    templates,
    templateFolders,
    reminders,
    friendFields,
    friendFieldFolders,
    chatStatuses,
    presetType,
    currentActions,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
    templateFolders: TemplateFolderRef[];
    reminders: ReminderRef[];
    friendFields: FriendFieldRef[];
    friendFieldFolders: FriendFieldFolderRef[];
    chatStatuses: ChatStatus[];
    presetType: GreetingActionType | null;
    currentActions: GreetingAction[];
    onSave: (actions: GreetingAction[]) => void;
}) {
    const [draft, setDraft] = useState<GreetingAction[]>([]);
    // タグはダイアログ内で新規作成され得るため、ローカル配列で保持する。
    const [tags, setTags] = useState<Tag[]>(tagsProp);

    useEffect(() => {
        setTags(tagsProp);
    }, [tagsProp]);

    // 開くたびに現在のアクションを読み込み、preset 指定があればそのカードを 1 枚追加
    useEffect(() => {
        if (!open) return;
        const init = currentActions.map((a) => ({ ...a }));
        if (presetType) init.push(newAction(presetType));
        setDraft(init);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const addCard = (type: GreetingActionType) =>
        setDraft((d) => [...d, newAction(type)]);
    const updateCard = (idx: number, patch: Partial<GreetingAction>) =>
        setDraft((d) =>
            d.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
        );
    const removeCard = (idx: number) =>
        setDraft((d) => d.filter((_, i) => i !== idx));

    const activeTypes = new Set(draft.map((a) => a.type));
    const isPaletteActive = (p: PaletteItem) => {
        if (!p.actionType) return false;
        if (p.actionType === "tag_attach")
            return activeTypes.has("tag_attach") || activeTypes.has("tag_detach");
        return activeTypes.has(p.actionType);
    };

    // 「タグ新規追加」: アクション設定画面の上に重ねず、表示を切り替える
    const [tagAddOpen, setTagAddOpen] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [creatingTag, setCreatingTag] = useState(false);
    const backToActions = () => {
        setTagAddOpen(false);
        setNewTagName("");
    };
    const submitNewTag = async () => {
        const name = newTagName.trim();
        if (!name) return;
        const palette = [
            "#ef4444",
            "#f59e0b",
            "#22c55e",
            "#3b82f6",
            "#a855f7",
            "#ec4899",
        ];
        const color = palette[tags.length % palette.length];
        setCreatingTag(true);
        try {
            const created = await createTag({ name, color });
            setTags((prev) => [
                ...prev,
                {
                    id: Number(created.id),
                    organization_id: 0,
                    name: created.name,
                    color: created.color,
                },
            ]);
            backToActions();
        } finally {
            setCreatingTag(false);
        }
    };

    if (tagAddOpen) {
        return (
            <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogTitle className="text-center text-lg font-bold py-2">
                        タグ新規追加
                    </DialogTitle>
                    <div className="space-y-5 px-2 pb-2">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold">
                                追加するフォルダ選択
                            </Label>
                            <select
                                disabled
                                value="default"
                                className={cn(SELECT_CLASS, "text-center")}
                            >
                                <option value="default">未分類</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold">
                                    追加するタグ名
                                </Label>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {newTagName.length}/50
                                </span>
                            </div>
                            <Input
                                value={newTagName}
                                onChange={(e) =>
                                    setNewTagName(e.target.value.slice(0, 50))
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        submitNewTag();
                                    }
                                }}
                                placeholder="タグ名を入力"
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col items-center gap-3 pt-2">
                            <Button
                                type="button"
                                onClick={submitNewTag}
                                disabled={!newTagName.trim() || creatingTag}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-11 font-bold w-full sm:w-auto"
                            >
                                {creatingTag
                                    ? "保存中..."
                                    : "保存してアクションに設定に戻る"}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={backToActions}
                                className="px-8 h-9"
                            >
                                戻る
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-3xl w-[calc(100vw-2rem)] p-0 gap-0">
                <DialogTitle className="text-center text-lg font-bold py-4 border-b border-border">
                    アクション
                </DialogTitle>

                <div className="grid grid-cols-1 md:grid-cols-[210px_1fr]">
                    {/* 左パレット */}
                    <aside className="border-b md:border-b-0 md:border-r border-border p-3 space-y-2">
                        {ACTION_PALETTE.map((p) => {
                            const supported = !!p.actionType;
                            const active = isPaletteActive(p);
                            return (
                                <button
                                    key={p.label}
                                    type="button"
                                    disabled={!supported}
                                    onClick={() =>
                                        supported && addCard(p.actionType!)
                                    }
                                    title={
                                        supported
                                            ? undefined
                                            : "この機能は準備中です"
                                    }
                                    className={cn(
                                        "w-full flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-bold transition-colors text-left",
                                        !supported &&
                                            "opacity-40 cursor-not-allowed border-border bg-muted/30",
                                        supported &&
                                            active &&
                                            "bg-primary text-primary-foreground border-primary",
                                        supported &&
                                            !active &&
                                            "bg-background border-border hover:border-primary/50",
                                    )}
                                >
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className="size-4 shrink-0"
                                    />
                                    {p.label}
                                </button>
                            );
                        })}
                    </aside>

                    {/* 右キャンバス */}
                    <section className="p-4 space-y-3 overflow-y-auto max-h-[60vh] min-h-[360px]">
                        {draft.length === 0 ? (
                            <div className="grid place-items-center h-full text-sm text-muted-foreground py-16 text-center">
                                左の項目からアクションを追加してください
                            </div>
                        ) : (
                            draft.map((a, i) => (
                                <ActionCard
                                    key={i}
                                    action={a}
                                    tags={tags}
                                    scenarios={scenarios}
                                    richMenus={richMenus}
                                    templates={templates}
                                    templateFolders={templateFolders}
                                    reminders={reminders}
                                    friendFields={friendFields}
                                    friendFieldFolders={friendFieldFolders}
                                    chatStatuses={chatStatuses}
                                    onChange={(patch) => updateCard(i, patch)}
                                    onRemove={() => removeCard(i)}
                                    onRequestAddTag={() => setTagAddOpen(true)}
                                />
                            ))
                        )}
                    </section>
                </div>

                <div className="flex justify-center p-4 border-t border-border">
                    <Button
                        type="button"
                        onClick={() => onSave(draft.filter(isActionValid))}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-16 h-11 font-bold"
                    >
                        保存
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ActionCard({
    action,
    tags,
    scenarios,
    richMenus,
    templates,
    templateFolders,
    reminders,
    friendFields,
    friendFieldFolders,
    chatStatuses,
    onChange,
    onRemove,
    onRequestAddTag,
}: {
    action: GreetingAction;
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: RichMenuRef[];
    templates: TemplateRef[];
    templateFolders: TemplateFolderRef[];
    reminders: ReminderRef[];
    friendFields: FriendFieldRef[];
    friendFieldFolders: FriendFieldFolderRef[];
    chatStatuses: ChatStatus[];
    onChange: (patch: Partial<GreetingAction>) => void;
    onRemove: () => void;
    onRequestAddTag: () => void;
}) {
    const headerLabel =
        action.type === "scenario_start"
            ? "ステップ"
            : action.type === "send_template"
              ? "送信するテンプレート"
              : action.type === "link_rich_menu"
                ? "リッチメニュー"
                : action.type === "send_text"
                  ? "送信するテキスト"
                  : action.type === "reminder"
                    ? "リマインド"
                    : action.type === "bookmark"
                      ? "ブックマーク"
                      : action.type === "friend_field"
                        ? "友だち情報"
                        : action.type === "chat_status"
                          ? "対応ステータス"
                          : action.type === "block"
                            ? "ブロック・非表示"
                            : "タグ";

    const mode = action.scenario_mode ?? "stop";
    const selectedScenario = scenarios.find((s) => s.id === action.scenario_id);
    const stepCount = selectedScenario?.steps_count ?? 0;

    // タグ複数選択（旧データの単一 tag_id も拾う）
    const tagIds =
        action.tag_ids ?? (action.tag_id ? [action.tag_id] : []);

    // リマインド選択の展開状態
    const [reminderPickerOpen, setReminderPickerOpen] = useState(false);
    const selectedReminder = reminders.find((r) => r.id === action.reminder_id);

    // テンプレートカードのフォルダ選択（既定: 選択中テンプレートのフォルダ → 先頭フォルダ）
    const [tplFolderId, setTplFolderId] = useState<number | null>(() => {
        const current = templates.find((t) => t.id === action.template_id);
        return (
            current?.template_folder_id ?? templateFolders[0]?.id ?? null
        );
    });
    const folderTemplates = templates.filter(
        (t) => t.template_folder_id === tplFolderId,
    );

    // 友だち情報の選択（フォルダ → 項目の2ペイン）
    const [ffPickerOpen, setFfPickerOpen] = useState(false);
    const [ffFolderId, setFfFolderId] = useState<number | null>(
        () => friendFieldFolders[0]?.id ?? null,
    );
    const selectedFriendField = friendFields.find(
        (f) => f.id === action.friend_field_id,
    );
    const folderFriendFields = friendFields.filter(
        (f) => f.friend_field_folder_id === ffFolderId,
    );

    return (
        <div className="rounded-lg border-2 border-primary/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{headerLabel}</span>
                <div className="flex items-center gap-2">
                    {(action.type === "tag_attach" ||
                        action.type === "tag_detach") && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onRequestAddTag}
                            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            タグ新規追加
                        </Button>
                    )}
                    <span className="text-xs rounded-md border border-border px-3 py-1.5 text-muted-foreground bg-muted/30">
                        絞込 未設定
                    </span>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="size-9 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        aria-label="削除"
                    >
                        <FontAwesomeIcon icon={faTrash} className="size-4" />
                    </button>
                </div>
            </div>

            {/* ステップ */}
            {action.type === "scenario_start" && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            配信設定
                        </Label>
                        <select
                            value={mode}
                            onChange={(e) => {
                                const m = e.target.value as
                                    | "start"
                                    | "stop"
                                    | "place";
                                const patch: Partial<GreetingAction> = {
                                    scenario_mode: m,
                                };
                                if (m === "place" && !action.start_step_order)
                                    patch.start_step_order = 1;
                                onChange(patch);
                            }}
                            className={SELECT_CLASS}
                        >
                            <option value="stop">停止</option>
                            <option value="start">開始・再開</option>
                            <option value="place">途中から配置</option>
                        </select>
                    </div>

                    {mode !== "stop" && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                                対象シナリオ
                            </Label>
                            <select
                                value={action.scenario_id ?? ""}
                                onChange={(e) =>
                                    onChange({
                                        scenario_id: e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    })
                                }
                                className={SELECT_CLASS}
                            >
                                <option value="">(選択してください)</option>
                                {scenarios.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {mode === "place" && selectedScenario && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                                開始ステップ
                            </Label>
                            <select
                                value={action.start_step_order ?? 1}
                                onChange={(e) =>
                                    onChange({
                                        start_step_order: Number(e.target.value),
                                    })
                                }
                                className={SELECT_CLASS}
                            >
                                {stepCount === 0 && (
                                    <option value={1}>1通目</option>
                                )}
                                {Array.from({ length: stepCount }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}通目
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* タグ: 未分類フォルダ + タグ複数選択 + 操作 */}
            {(action.type === "tag_attach" ||
                action.type === "tag_detach") && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 rounded-md border border-border overflow-hidden min-h-[300px]">
                        {/* 左: フォルダ（タグは未分類のみ） */}
                        <div className="border-r border-border bg-muted/20">
                            <div className="w-full text-left px-4 py-3 text-sm font-bold bg-primary text-primary-foreground">
                                未分類({tags.length})
                            </div>
                        </div>

                        {/* 右: タグ（複数選択） */}
                        <div className="bg-background">
                            {tags.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground">
                                    タグがありません
                                </div>
                            ) : (
                                <>
                                    <label className="flex items-center gap-3 px-4 py-3 text-sm border-b border-border cursor-pointer hover:bg-muted/40 font-medium">
                                        <input
                                            type="checkbox"
                                            checked={
                                                tags.length > 0 &&
                                                tagIds.length === tags.length
                                            }
                                            onChange={() =>
                                                onChange({
                                                    tag_ids:
                                                        tagIds.length ===
                                                        tags.length
                                                            ? []
                                                            : tags.map(
                                                                  (t) => t.id,
                                                              ),
                                                })
                                            }
                                            className="size-4 accent-primary"
                                        />
                                        以下を全選択
                                    </label>
                                    {tags.map((t) => (
                                        <label
                                            key={t.id}
                                            className="flex items-center gap-3 px-4 py-3 text-sm border-b border-border cursor-pointer hover:bg-muted/40"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={tagIds.includes(t.id)}
                                                onChange={() =>
                                                    onChange({
                                                        tag_ids: tagIds.includes(
                                                            t.id,
                                                        )
                                                            ? tagIds.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      t.id,
                                                              )
                                                            : [...tagIds, t.id],
                                                    })
                                                }
                                                className="size-4 accent-primary"
                                            />
                                            {t.name}
                                        </label>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="text-sm text-muted-foreground">
                            選択したタグ
                        </div>
                        <Label className="text-xs text-muted-foreground">
                            タグ操作
                        </Label>
                        <select
                            value={action.type}
                            onChange={(e) =>
                                onChange({
                                    type: e.target
                                        .value as GreetingActionType,
                                })
                            }
                            className={cn(SELECT_CLASS, "max-w-40")}
                        >
                            <option value="tag_attach">つける</option>
                            <option value="tag_detach">はずす</option>
                        </select>
                    </div>
                </div>
            )}

            {/* リッチメニュー */}
            {action.type === "link_rich_menu" && (
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                        対象リッチメニュー
                    </Label>
                    <select
                        value={action.rich_menu_id ?? ""}
                        onChange={(e) =>
                            onChange({
                                rich_menu_id: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                            })
                        }
                        className={SELECT_CLASS}
                    >
                        <option value="">(選択してください)</option>
                        {richMenus.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                        公開済み（LINE に登録済み）のリッチメニューのみ選べます。
                    </p>
                </div>
            )}

            {/* テキスト: 自動情報挿入ツールバー + 本文 */}
            {action.type === "send_text" && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                            自動情報挿入
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 bg-background"
                            onClick={() =>
                                onChange({
                                    text:
                                        (action.text ?? "").slice(
                                            0,
                                            MAX_TEXT - "{{LINE名}}".length,
                                        ) + "{{LINE名}}",
                                })
                            }
                        >
                            ＋ LINE名
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 bg-background"
                            disabled
                        >
                            ＋ 友だち情報 ▾
                        </Button>
                        <button
                            type="button"
                            disabled
                            className="size-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground opacity-60"
                            aria-label="絵文字"
                        >
                            ☺
                        </button>
                    </div>
                    <Textarea
                        rows={5}
                        value={action.text ?? ""}
                        onChange={(e) =>
                            onChange({ text: e.target.value.slice(0, MAX_TEXT) })
                        }
                        placeholder=""
                    />
                    <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                        {(action.text ?? "").length}/
                        {MAX_TEXT.toLocaleString()}
                    </div>
                </div>
            )}

            {/* リマインド: 配信開始/停止 + 対象 + 配信終了日時 */}
            {action.type === "reminder" && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            配信設定
                        </Label>
                        <select
                            value={action.reminder_op ?? "start"}
                            onChange={(e) =>
                                onChange({
                                    reminder_op: e.target.value as
                                        | "start"
                                        | "stop",
                                })
                            }
                            className={SELECT_CLASS}
                        >
                            <option value="start">リマインド配信を開始</option>
                            <option value="stop">リマインド配信を停止</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            リマインド選択
                        </Label>
                        <button
                            type="button"
                            onClick={() =>
                                setReminderPickerOpen((o) => !o)
                            }
                            className={cn(
                                SELECT_CLASS,
                                "flex items-center justify-between text-left",
                            )}
                        >
                            <span
                                className={
                                    selectedReminder
                                        ? ""
                                        : "text-muted-foreground"
                                }
                            >
                                {selectedReminder?.name ?? ""}
                            </span>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className="size-3 text-muted-foreground"
                            />
                        </button>
                        {reminderPickerOpen && (
                            <div className="grid grid-cols-2 rounded-md border border-border overflow-hidden min-h-[200px]">
                                {/* 左: フォルダ（リマインドは未分類のみ） */}
                                <div className="border-r border-border bg-muted/20">
                                    <div className="w-full text-left px-4 py-3 text-sm font-bold bg-primary text-primary-foreground">
                                        未分類
                                    </div>
                                </div>
                                {/* 右: リマインド一覧 */}
                                <div className="bg-background">
                                    {reminders.length === 0 ? (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            分類を選択して下さい
                                        </div>
                                    ) : (
                                        reminders.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange({
                                                        reminder_id: r.id,
                                                    });
                                                    setReminderPickerOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-sm border-b border-border hover:bg-muted/40",
                                                    action.reminder_id === r.id &&
                                                        "bg-primary/10 font-medium",
                                                )}
                                            >
                                                {r.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {(action.reminder_op ?? "start") === "start" && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                                配信終了日時
                            </Label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <input
                                    type="date"
                                    value={
                                        (action.reminder_end_at ?? "").split(
                                            "T",
                                        )[0] ?? ""
                                    }
                                    onChange={(e) => {
                                        const time =
                                            (
                                                action.reminder_end_at ?? ""
                                            ).split("T")[1] ?? "00:00";
                                        onChange({
                                            reminder_end_at: e.target.value
                                                ? `${e.target.value}T${time}`
                                                : null,
                                        });
                                    }}
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                                <input
                                    type="time"
                                    value={
                                        (action.reminder_end_at ?? "").split(
                                            "T",
                                        )[1] ?? ""
                                    }
                                    onChange={(e) => {
                                        const date =
                                            (
                                                action.reminder_end_at ?? ""
                                            ).split("T")[0] ?? "";
                                        if (!date) return;
                                        onChange({
                                            reminder_end_at: `${date}T${
                                                e.target.value || "00:00"
                                            }`,
                                        });
                                    }}
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                                <span className="text-sm text-muted-foreground">
                                    に配信終了
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* テンプレート: フォルダ + テンプレート の2ペイン選択 */}
            {action.type === "send_template" && (
                <div className="grid grid-cols-2 rounded-md border border-border overflow-hidden min-h-[300px]">
                    {/* 左: フォルダ */}
                    <div className="border-r border-border bg-muted/20">
                        {templateFolders.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">
                                フォルダがありません
                            </div>
                        ) : (
                            templateFolders.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setTplFolderId(f.id)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 text-sm font-bold transition-colors",
                                        f.id === tplFolderId
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground hover:bg-muted",
                                    )}
                                >
                                    {f.name}
                                </button>
                            ))
                        )}
                    </div>

                    {/* 右: テンプレート（ラジオ選択） */}
                    <div className="bg-background">
                        {folderTemplates.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">
                                テンプレートがありません
                            </div>
                        ) : (
                            folderTemplates.map((t) => (
                                <label
                                    key={t.id}
                                    className="flex items-center gap-3 px-4 py-3 text-sm border-b border-border cursor-pointer hover:bg-muted/40"
                                >
                                    <input
                                        type="radio"
                                        name={`tpl-${action.type}-${tplFolderId}`}
                                        checked={action.template_id === t.id}
                                        onChange={() =>
                                            onChange({ template_id: t.id })
                                        }
                                        className="size-4 accent-primary"
                                    />
                                    {t.name}
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ブックマーク */}
            {action.type === "bookmark" && (
                <div className="flex items-center gap-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={(action.bookmark_op ?? "add") === "add"}
                            onChange={() => onChange({ bookmark_op: "add" })}
                            className="size-4 accent-primary"
                        />
                        ブックマークする
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={action.bookmark_op === "remove"}
                            onChange={() => onChange({ bookmark_op: "remove" })}
                            className="size-4 accent-primary"
                        />
                        ブックマークを外す
                    </label>
                </div>
            )}

            {/* 友だち情報 */}
            {action.type === "friend_field" && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            友だち情報選択
                        </Label>
                        <button
                            type="button"
                            onClick={() => setFfPickerOpen((o) => !o)}
                            className={cn(
                                SELECT_CLASS,
                                "flex items-center justify-between text-left",
                            )}
                        >
                            <span
                                className={
                                    selectedFriendField
                                        ? ""
                                        : "text-muted-foreground"
                                }
                            >
                                {selectedFriendField?.name ?? ""}
                            </span>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className="size-3 text-muted-foreground"
                            />
                        </button>
                        {ffPickerOpen && (
                            <div className="grid grid-cols-2 rounded-md border border-border overflow-hidden min-h-[200px]">
                                {/* 左: フォルダ（分類） */}
                                <div className="border-r border-border bg-muted/20">
                                    {friendFieldFolders.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setFfFolderId(f.id)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 text-sm",
                                                f.id === ffFolderId
                                                    ? "bg-primary text-primary-foreground font-bold"
                                                    : "text-foreground hover:bg-muted",
                                            )}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                                {/* 右: 項目一覧 */}
                                <div className="bg-background">
                                    {folderFriendFields.length === 0 ? (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            分類を選択して下さい
                                        </div>
                                    ) : (
                                        folderFriendFields.map((ff) => (
                                            <button
                                                key={ff.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange({
                                                        friend_field_id: ff.id,
                                                    });
                                                    setFfPickerOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-sm border-b border-border hover:bg-muted/40",
                                                    action.friend_field_id ===
                                                        ff.id &&
                                                        "bg-primary/10 font-medium",
                                                )}
                                            >
                                                {ff.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedFriendField && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                                設定する値
                            </Label>
                            {selectedFriendField.field_type === "choice" &&
                            (selectedFriendField.options?.length ?? 0) > 0 ? (
                                <select
                                    value={action.friend_field_value ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            friend_field_value: e.target.value,
                                        })
                                    }
                                    className={SELECT_CLASS}
                                >
                                    <option value="">選択してください</option>
                                    {selectedFriendField.options?.map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    value={action.friend_field_value ?? ""}
                                    onChange={(e) =>
                                        onChange({
                                            friend_field_value: e.target.value,
                                        })
                                    }
                                    placeholder="設定する値を入力"
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 対応ステータス */}
            {action.type === "chat_status" && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            対応ステータス設定
                        </Label>
                        <select
                            value={action.chat_status_op ?? "add"}
                            onChange={(e) =>
                                onChange({
                                    chat_status_op: e.target.value as
                                        | "add"
                                        | "remove",
                                })
                            }
                            className={SELECT_CLASS}
                        >
                            <option value="add">ステータスをつける</option>
                            <option value="remove">ステータスを外す</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            対応ステータス選択
                        </Label>
                        <select
                            value={action.chat_status_id ?? ""}
                            onChange={(e) =>
                                onChange({
                                    chat_status_id:
                                        e.target.value === ""
                                            ? null
                                            : Number(e.target.value),
                                })
                            }
                            className={SELECT_CLASS}
                        >
                            <option value="">
                                {(action.chat_status_op ?? "add") === "remove"
                                    ? "すべてのステータス"
                                    : "選択してください"}
                            </option>
                            {chatStatuses.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* ブロック・非表示 */}
            {action.type === "block" && (
                <div className="flex items-center gap-6 flex-wrap">
                    {(
                        [
                            ["block", "ブロックする"],
                            ["unblock", "ブロック解除"],
                            ["show", "表示"],
                            ["hide", "非表示"],
                        ] as const
                    ).map(([value, label]) => (
                        <label
                            key={value}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <input
                                type="radio"
                                checked={
                                    (action.block_mode ?? "block") === value
                                }
                                onChange={() =>
                                    onChange({ block_mode: value })
                                }
                                className="size-4 accent-primary"
                            />
                            {label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
