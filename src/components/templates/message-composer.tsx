import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faFont,
    faImage,
    faVideo,
    faMusic,
    faXmark,
    faSpinner,
    faWindowMaximize,
    faFaceSmile,
    faLocationDot,
    faCircleInfo,
    faFilePdf,
    faChevronRight,
    faCircle,
    faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmojiPicker } from "@/components/emoji-picker";
import {
    STICKER_PACKAGES,
    stickerImageUrl,
    findPackage,
} from "@/lib/line-stickers";
import { LocationPicker } from "@/components/templates/location-picker";
import {
    PanelBuilder,
    defaultPanelContent,
} from "@/components/templates/panel-builder";
import { cn } from "@/lib/utils";
import { uploadImage, uploadMedia, uploadPdf } from "@/lib/api/uploads";
import type { PanelContent, TemplateMessageType } from "@/types/template";

export const MAX_TEXT = 5000;

const TYPE_TABS = [
    { key: "text", label: "テキスト", icon: faFont },
    { key: "panel", label: "パネル・ボタン", icon: faWindowMaximize },
    { key: "image", label: "画像・動画・音声", icon: faImage },
    { key: "sticker", label: "スタンプ", icon: faFaceSmile },
    { key: "location", label: "位置情報", icon: faLocationDot },
] as const;

const MEDIA_TYPES: TemplateMessageType[] = ["image", "video", "audio"];
export const isMediaType = (t: TemplateMessageType) => MEDIA_TYPES.includes(t);

export type FriendField = { id: number; name: string };
export type FriendFieldFolder = {
    id: number;
    name: string;
    fields: FriendField[];
};
export type TagOption = { id: number; name: string; color?: string };
export type ScenarioOption = { id: number; name: string };

export type ComposerValue = {
    message_type: TemplateMessageType;
    text_content: string;
    image_url: string;
    image_preview_url: string;
    media_duration: number | null;
    sticker_package_id: number | null;
    sticker_id: number | null;
    location_title: string;
    location_address: string;
    latitude: number | null;
    longitude: number | null;
    panel_content: PanelContent;
};

type MessageSeed = {
    message_type?: TemplateMessageType;
    text_content?: string | null;
    image_url?: string | null;
    image_preview_url?: string | null;
    media_duration?: number | null;
    sticker_package_id?: number | null;
    sticker_id?: number | null;
    location_title?: string | null;
    location_address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    panel_content?: PanelContent | null;
};

export function defaultComposerValue(m?: MessageSeed | null): ComposerValue {
    return {
        message_type: m?.message_type ?? "text",
        text_content: m?.text_content ?? "",
        image_url: m?.image_url ?? "",
        image_preview_url: m?.image_preview_url ?? m?.image_url ?? "",
        media_duration: m?.media_duration ?? null,
        sticker_package_id: m?.sticker_package_id ?? null,
        sticker_id: m?.sticker_id ?? null,
        location_title: m?.location_title ?? "",
        location_address: m?.location_address ?? "",
        latitude: m?.latitude ?? null,
        longitude: m?.longitude ?? null,
        panel_content: m?.panel_content ?? defaultPanelContent(),
    };
}

/** 保存可能か（種別ごとの必須チェック） */
export function composerValid(v: ComposerValue): boolean {
    if (v.message_type === "text") return v.text_content.trim().length > 0;
    if (isMediaType(v.message_type)) return v.image_url.length > 0;
    if (v.message_type === "sticker") return v.sticker_id != null;
    if (v.message_type === "location")
        return v.latitude != null && v.location_title.trim().length > 0;
    return (v.panel_content?.panels?.length ?? 0) > 0;
}

/** 種別ごとに不要なフィールドを掃除して正規化する */
export function normalizeComposerValue(v: ComposerValue): ComposerValue {
    const blank = defaultComposerValue();
    if (v.message_type === "text")
        return { ...blank, message_type: "text", text_content: v.text_content };
    if (isMediaType(v.message_type))
        return {
            ...blank,
            message_type: v.message_type,
            image_url: v.image_url,
            image_preview_url: v.image_preview_url || v.image_url,
            media_duration: v.message_type === "image" ? null : v.media_duration,
        };
    if (v.message_type === "sticker")
        return {
            ...blank,
            message_type: "sticker",
            sticker_package_id: v.sticker_package_id,
            sticker_id: v.sticker_id,
        };
    if (v.message_type === "location")
        return {
            ...blank,
            message_type: "location",
            location_title: v.location_title,
            location_address: v.location_address,
            latitude: v.latitude,
            longitude: v.longitude,
        };
    return { ...blank, message_type: "panel", panel_content: v.panel_content };
}

export function MessageComposer({
    value,
    onChange,
    errors,
    lockType = false,
    friendFieldFolders = [],
    tags = [],
    scenarios = [],
}: {
    value: ComposerValue;
    onChange: (patch: Partial<ComposerValue>) => void;
    errors?: Partial<Record<keyof ComposerValue, string>>;
    lockType?: boolean;
    friendFieldFolders?: FriendFieldFolder[];
    tags?: TagOption[];
    scenarios?: ScenarioOption[];
}) {
    const [rawUrl, setRawUrl] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [pdfOpen, setPdfOpen] = useState(false);
    const [textTab, setTextTab] = useState<"register" | "url">("register");
    const [actionMode, setActionMode] = useState<"once" | "repeat">("once");
    const [urlPreview, setUrlPreview] = useState<"show" | "hide">("show");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const type = value.message_type;
    const setType = (t: TemplateMessageType) => onChange({ message_type: t });

    const insertToken = (token: string) => {
        const ta = textareaRef.current;
        const cur = value.text_content;
        let next: string;
        if (ta) {
            const start = ta.selectionStart ?? cur.length;
            const end = ta.selectionEnd ?? cur.length;
            next = cur.slice(0, start) + token + cur.slice(end);
        } else {
            next = cur + token;
        }
        onChange({ text_content: next.slice(0, MAX_TEXT) });
        setInfoOpen(false);
    };

    return (
        <div className="space-y-5">
            {/* メッセージタイプ選択 */}
            <div className="space-y-2">
                <p className="text-sm font-bold">
                    メッセージタイプを選択
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                        （保存後の変更はできません）
                    </span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {TYPE_TABS.map((t) => {
                        const active =
                            t.key === "image"
                                ? isMediaType(type)
                                : type === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                disabled={lockType}
                                onClick={() =>
                                    setType(t.key as TemplateMessageType)
                                }
                                className={cn(
                                    "inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-md border text-sm font-medium transition-colors",
                                    active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : !lockType
                                          ? "border-border bg-background text-foreground hover:bg-muted/50"
                                          : "border-border bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60",
                                )}
                            >
                                <FontAwesomeIcon
                                    icon={t.icon}
                                    className="size-3.5"
                                />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {type === "text" ? (
                <div className="space-y-3">
                    {/* サブタブ */}
                    <div className="flex items-center gap-6 border-b border-border">
                        <button
                            type="button"
                            onClick={() => setTextTab("register")}
                            className={cn(
                                "-mb-px pb-2 text-sm font-bold transition-colors",
                                textTab === "register"
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            テキスト登録
                        </button>
                        <button
                            type="button"
                            onClick={() => setTextTab("url")}
                            className={cn(
                                "-mb-px pb-2 text-sm font-bold transition-colors",
                                textTab === "url"
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            URL表示期限・アクション設定
                        </button>
                    </div>

                    {textTab === "url" ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 flex-wrap text-sm">
                                <span className="font-bold">
                                    アクション稼働設定
                                </span>
                                <Radio
                                    checked={actionMode === "once"}
                                    onClick={() => setActionMode("once")}
                                    label="一度のみ稼働"
                                />
                                <Radio
                                    checked={actionMode === "repeat"}
                                    onClick={() => setActionMode("repeat")}
                                    label="何度でも稼働"
                                />
                                <span className="text-muted-foreground">
                                    （稼働テストをする場合は「何度でも稼働」を選択してください）
                                </span>
                            </div>

                            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                                <FontAwesomeIcon
                                    icon={faCircleExclamation}
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                フォーム作成・カレンダー予約・イベント予約・商品販売・コンバージョン・QRコードアクションのURLは対応していません。
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold">
                                    URL表示プレビュー
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    URLのプレビュー表示の有無を設定します
                                </p>
                                <div className="flex items-center gap-6 pt-1 text-sm">
                                    <Radio
                                        checked={urlPreview === "show"}
                                        onClick={() => setUrlPreview("show")}
                                        label="表示する"
                                    />
                                    <Radio
                                        checked={urlPreview === "hide"}
                                        onClick={() => setUrlPreview("hide")}
                                        label="表示しない"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold">
                                    テキスト登録
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-blue-600 dark:text-blue-400"
                                    onClick={() => setInfoOpen(true)}
                                >
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        className="size-3"
                                    />
                                    情報自動挿入
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-blue-600 dark:text-blue-400"
                                    onClick={() => setPdfOpen(true)}
                                >
                                    <FontAwesomeIcon
                                        icon={faFilePdf}
                                        className="size-3"
                                    />
                                    PDFアップロード
                                </Button>
                                <EmojiPicker
                                    onSelect={(emoji) => insertToken(emoji)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-end">
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {value.text_content.length}/{MAX_TEXT}
                                    </span>
                                </div>
                                <Textarea
                                    ref={textareaRef}
                                    value={value.text_content}
                                    onChange={(e) =>
                                        onChange({ text_content: e.target.value })
                                    }
                                    maxLength={MAX_TEXT}
                                    rows={12}
                                    placeholder="メッセージ本文を入力..."
                                />
                                {errors?.text_content && (
                                    <p className="text-xs text-destructive">
                                        {errors.text_content}
                                    </p>
                                )}
                            </div>

                            <label className="flex items-start gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={rawUrl}
                                    onChange={(e) => setRawUrl(e.target.checked)}
                                    className="mt-0.5 size-4 rounded border-border accent-primary"
                                />
                                <span>
                                    このメッセージでは入力したそのままのURLを利用する
                                    <br />
                                    （そのままのURLを利用する場合、配信・開封の情報取得、URLタップ時アクションが利用できません。）
                                </span>
                            </label>
                            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <FontAwesomeIcon
                                    icon={faCircleInfo}
                                    className="mt-0.5 size-3 shrink-0"
                                />
                                URLの前後には自動的に半角スペースが挿入されます。（Android端末で正常にURLが表示されない場合があるため。）
                            </p>
                        </div>
                    )}
                </div>
            ) : type === "panel" ? (
                <PanelBuilder
                    value={value.panel_content}
                    onChange={(v) => onChange({ panel_content: v })}
                    tags={tags}
                    scenarios={scenarios}
                />
            ) : type === "sticker" ? (
                <StickerPicker
                    packageId={value.sticker_package_id}
                    stickerId={value.sticker_id}
                    onChange={(packageId, stickerId) =>
                        onChange({
                            sticker_package_id: packageId,
                            sticker_id: stickerId,
                        })
                    }
                />
            ) : type === "location" ? (
                <LocationPicker
                    value={{
                        latitude: value.latitude,
                        longitude: value.longitude,
                        title: value.location_title,
                        address: value.location_address,
                    }}
                    onChange={(patch) => {
                        const next: Partial<ComposerValue> = {};
                        if ("latitude" in patch)
                            next.latitude = patch.latitude ?? null;
                        if ("longitude" in patch)
                            next.longitude = patch.longitude ?? null;
                        if (patch.title !== undefined)
                            next.location_title = patch.title;
                        if (patch.address !== undefined)
                            next.location_address = patch.address;
                        onChange(next);
                    }}
                />
            ) : (
                <div className="space-y-1.5">
                    <MediaUploader
                        mediaType={
                            isMediaType(type)
                                ? (type as "image" | "video" | "audio")
                                : "image"
                        }
                        url={value.image_url}
                        onChange={({
                            message_type,
                            url,
                            preview_url,
                            duration,
                        }) =>
                            onChange({
                                message_type,
                                image_url: url,
                                image_preview_url: preview_url ?? url,
                                media_duration: duration ?? null,
                            })
                        }
                    />
                    {(errors?.image_url || errors?.media_duration) && (
                        <p className="text-xs text-destructive">
                            {errors?.image_url ?? errors?.media_duration}
                        </p>
                    )}
                </div>
            )}

            <InfoInsertDialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                onInsert={insertToken}
                friendFieldFolders={friendFieldFolders}
            />

            <PdfUploadDialog
                open={pdfOpen}
                onClose={() => setPdfOpen(false)}
                onUploaded={(url) => {
                    insertToken(url);
                    setPdfOpen(false);
                }}
            />
        </div>
    );
}

function Radio({
    checked,
    onClick,
    label,
}: {
    checked: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-2 text-sm",
                checked ? "font-bold text-primary" : "text-foreground",
            )}
        >
            <FontAwesomeIcon
                icon={faCircle}
                className={cn(
                    "size-4",
                    checked ? "text-primary" : "text-muted-foreground/30",
                )}
            />
            {label}
        </button>
    );
}

const INFO_CATEGORIES = [
    { key: "line_name", label: "LINE名" },
    { key: "elapsed", label: "経過日数・指定日付" },
    { key: "delivery_date", label: "配信日の日付" },
    { key: "friend_info", label: "友だち情報" },
    { key: "form_url", label: "回答フォームURL" },
    { key: "product_url", label: "商品販売ページURL" },
    { key: "salon", label: "サロン・面談予約" },
    { key: "lesson", label: "レッスン予約" },
    { key: "event_url", label: "イベント予約URL" },
] as const;

function todayIso(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DATE_FORMATS = [
    { key: "wd", label: "2024年1月1日（曜日あり）" },
    { key: "nd", label: "2024年1月1日（曜日なし）" },
    { key: "slash", label: "2024/1/1" },
] as const;

const TWO_COL_PANELS: Record<
    string,
    { leftHeader: string; rightHeader: string; leftItems?: string[] }
> = {
    form_url: {
        leftHeader: "フォルダ",
        rightHeader: "回答フォーム",
        leftItems: ["未分類"],
    },
    product_url: { leftHeader: "商品名", rightHeader: "ページ選択" },
    salon: { leftHeader: "カレンダー名", rightHeader: "ページ選択" },
    lesson: { leftHeader: "カレンダー名", rightHeader: "ページ選択" },
    event_url: { leftHeader: "カレンダー名", rightHeader: "ページ選択" },
};

function InfoInsertDialog({
    open,
    onClose,
    onInsert,
    friendFieldFolders,
}: {
    open: boolean;
    onClose: () => void;
    onInsert: (token: string) => void;
    friendFieldFolders: FriendFieldFolder[];
}) {
    const [activeKey, setActiveKey] = useState<string>("line_name");
    const [lineNameSelected, setLineNameSelected] = useState(true);
    const [untilDate, setUntilDate] = useState<string>(todayIso());
    const [elapsedMode, setElapsedMode] = useState<"until" | "after">("until");
    const [afterDays, setAfterDays] = useState<string>("0");
    const [afterFormat, setAfterFormat] = useState<string>("wd");
    const [deliveryFormat, setDeliveryFormat] = useState<string>("wd");
    const [folderId, setFolderId] = useState<number | null>(
        friendFieldFolders[0]?.id ?? null,
    );
    const [fieldId, setFieldId] = useState<number | null>(null);

    const [syncedFor, setSyncedFor] = useState<boolean | null>(null);
    if (open && syncedFor !== true) {
        setActiveKey("line_name");
        setLineNameSelected(true);
        setUntilDate(todayIso());
        setElapsedMode("until");
        setAfterDays("0");
        setAfterFormat("wd");
        setDeliveryFormat("wd");
        setFolderId(friendFieldFolders[0]?.id ?? null);
        setFieldId(null);
        setSyncedFor(true);
    }
    if (!open && syncedFor !== false) {
        setSyncedFor(false);
    }

    const activeFolder = friendFieldFolders.find((f) => f.id === folderId);

    const token: string | null =
        activeKey === "line_name"
            ? lineNameSelected
                ? "{{LINE名}}"
                : null
            : activeKey === "elapsed"
              ? elapsedMode === "until"
                  ? untilDate
                      ? `{{指定日までの日数:${untilDate}}}`
                      : null
                  : afterDays !== ""
                    ? `{{経過後日付:${Math.max(0, Number(afterDays) || 0)}:${afterFormat}}}`
                    : null
              : activeKey === "delivery_date"
                ? `{{配信日:${deliveryFormat}}}`
                : activeKey === "friend_info"
                  ? fieldId != null
                      ? `{{友だち情報:${fieldId}}}`
                      : null
                  : null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogTitle className="text-center text-lg font-bold">
                    【 情報自動挿入 】
                </DialogTitle>

                <div className="grid grid-cols-[minmax(0,12rem)_1fr] gap-4 pt-2">
                    <ul className="rounded-md border border-border overflow-hidden divide-y divide-border">
                        {INFO_CATEGORIES.map((c) => {
                            const isActive = c.key === activeKey;
                            return (
                                <li key={c.key}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveKey(c.key)}
                                        className={cn(
                                            "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors",
                                            isActive
                                                ? "bg-muted font-bold text-foreground"
                                                : "hover:bg-muted/50 text-foreground",
                                        )}
                                    >
                                        {c.label}
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            className="size-3 text-muted-foreground"
                                        />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="rounded-md border border-border p-4 min-h-[18rem]">
                        {activeKey === "line_name" ? (
                            <button
                                type="button"
                                onClick={() => setLineNameSelected(true)}
                                className="flex items-center gap-2 text-sm font-bold"
                            >
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className={cn(
                                        "size-4",
                                        lineNameSelected
                                            ? "text-primary"
                                            : "text-muted-foreground/30",
                                    )}
                                />
                                <span
                                    className={
                                        lineNameSelected ? "text-primary" : ""
                                    }
                                >
                                    LINE名を挿入
                                </span>
                            </button>
                        ) : activeKey === "elapsed" ? (
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setElapsedMode("until")}
                                        className={cn(
                                            "flex items-center gap-2 text-sm font-bold",
                                            elapsedMode === "until"
                                                ? "text-primary"
                                                : "text-foreground",
                                        )}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className={cn(
                                                "size-4",
                                                elapsedMode === "until"
                                                    ? "text-primary"
                                                    : "text-muted-foreground/30",
                                            )}
                                        />
                                        配信日から指定日までの日数を挿入
                                    </button>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 pl-6 text-sm",
                                            elapsedMode !== "until" &&
                                                "opacity-50",
                                        )}
                                    >
                                        <span>配信日から</span>
                                        <Input
                                            type="date"
                                            value={untilDate}
                                            disabled={elapsedMode !== "until"}
                                            onChange={(e) =>
                                                setUntilDate(e.target.value)
                                            }
                                            className="h-10 w-44"
                                        />
                                        <span>までの日数</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setElapsedMode("after")}
                                        className={cn(
                                            "flex items-center gap-2 text-sm font-bold",
                                            elapsedMode === "after"
                                                ? "text-primary"
                                                : "text-foreground",
                                        )}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCircle}
                                            className={cn(
                                                "size-4",
                                                elapsedMode === "after"
                                                    ? "text-primary"
                                                    : "text-muted-foreground/30",
                                            )}
                                        />
                                        配信日から指定日数経過後の日付を挿入
                                    </button>
                                    <div
                                        className={cn(
                                            "space-y-3",
                                            elapsedMode !== "after" &&
                                                "opacity-50",
                                        )}
                                    >
                                        <div className="flex items-center gap-3 pl-6 text-sm">
                                            <span>配信日から</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={afterDays}
                                                disabled={
                                                    elapsedMode !== "after"
                                                }
                                                onChange={(e) =>
                                                    setAfterDays(e.target.value)
                                                }
                                                className="h-10 w-24"
                                            />
                                            <span>日後の日付</span>
                                        </div>
                                        <div className="pl-6 space-y-1 text-sm">
                                            <p className="text-muted-foreground">
                                                日付の表示方法
                                            </p>
                                            <p className="text-muted-foreground">
                                                例）2024年1月1日（月）の場合
                                            </p>
                                            <select
                                                value={afterFormat}
                                                disabled={
                                                    elapsedMode !== "after"
                                                }
                                                onChange={(e) =>
                                                    setAfterFormat(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {DATE_FORMATS.map((f) => (
                                                    <option
                                                        key={f.key}
                                                        value={f.key}
                                                    >
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeKey === "delivery_date" ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                    <FontAwesomeIcon
                                        icon={faCircle}
                                        className="size-4 text-primary"
                                    />
                                    配信日の日付
                                </div>
                                <div className="pl-6 space-y-1 text-sm">
                                    <p className="text-muted-foreground">
                                        日付の表示方法
                                    </p>
                                    <p className="text-muted-foreground">
                                        例）2024年1月1日（月）の場合
                                    </p>
                                    <select
                                        value={deliveryFormat}
                                        onChange={(e) =>
                                            setDeliveryFormat(e.target.value)
                                        }
                                        className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {DATE_FORMATS.map((f) => (
                                            <option key={f.key} value={f.key}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : activeKey === "friend_info" ? (
                            <div className="grid grid-cols-2 -m-4 min-h-[18rem]">
                                <div className="border-r border-border">
                                    <div className="bg-muted/60 px-3 py-2 text-center text-sm font-bold">
                                        フォルダ
                                    </div>
                                    <ul className="divide-y divide-border">
                                        {friendFieldFolders.map((folder) => {
                                            const sel = folder.id === folderId;
                                            return (
                                                <li key={folder.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFolderId(
                                                                folder.id,
                                                            );
                                                            setFieldId(null);
                                                        }}
                                                        className={cn(
                                                            "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors",
                                                            sel
                                                                ? "bg-primary text-primary-foreground font-bold"
                                                                : "hover:bg-muted/50",
                                                        )}
                                                    >
                                                        {folder.name}
                                                        <FontAwesomeIcon
                                                            icon={faChevronRight}
                                                            className="size-3"
                                                        />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        {friendFieldFolders.length === 0 && (
                                            <li className="px-3 py-2.5 text-sm text-muted-foreground">
                                                フォルダがありません
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <div className="bg-muted/60 px-3 py-2 text-center text-sm font-bold">
                                        登録情報
                                    </div>
                                    <ul className="divide-y divide-border">
                                        {(activeFolder?.fields ?? []).map(
                                            (field) => {
                                                const sel =
                                                    field.id === fieldId;
                                                return (
                                                    <li key={field.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setFieldId(
                                                                    field.id,
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                                                                sel
                                                                    ? "text-primary font-bold"
                                                                    : "hover:bg-muted/50",
                                                            )}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faCircle}
                                                                className={cn(
                                                                    "size-3.5",
                                                                    sel
                                                                        ? "text-primary"
                                                                        : "text-muted-foreground/30",
                                                                )}
                                                            />
                                                            {field.name}
                                                        </button>
                                                    </li>
                                                );
                                            },
                                        )}
                                        {(activeFolder?.fields.length ?? 0) ===
                                            0 && (
                                            <li className="px-3 py-2.5 text-sm text-muted-foreground">
                                                項目がありません
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ) : TWO_COL_PANELS[activeKey] ? (
                            <div className="grid grid-cols-2 -m-4 min-h-[18rem]">
                                <div className="border-r border-border">
                                    <div className="bg-muted/60 px-3 py-2 text-center text-sm font-bold">
                                        {TWO_COL_PANELS[activeKey].leftHeader}
                                    </div>
                                    <ul className="divide-y divide-border">
                                        {(
                                            TWO_COL_PANELS[activeKey].leftItems ??
                                            []
                                        ).map((label, i) => (
                                            <li key={label}>
                                                <div
                                                    className={cn(
                                                        "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm",
                                                        i === 0
                                                            ? "bg-primary text-primary-foreground font-bold"
                                                            : "",
                                                    )}
                                                >
                                                    {label}
                                                    <FontAwesomeIcon
                                                        icon={faChevronRight}
                                                        className="size-3"
                                                    />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="bg-muted/60 px-3 py-2 text-center text-sm font-bold">
                                        {TWO_COL_PANELS[activeKey].rightHeader}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                この項目は準備中です。
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3 pt-2">
                    <Button
                        type="button"
                        disabled={!token}
                        onClick={() => token && onInsert(token)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-10"
                    >
                        <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                        メッセージに挿入
                    </Button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-blue-600 dark:text-blue-400 underline"
                    >
                        戻る
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PdfUploadDialog({
    open,
    onClose,
    onUploaded,
}: {
    open: boolean;
    onClose: () => void;
    onUploaded: (url: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        if (file.type !== "application/pdf") {
            setError("PDF ファイルを選択してください");
            return;
        }
        setUploading(true);
        setError(null);
        try {
            const url = await uploadPdf(file);
            onUploaded(url);
        } catch (e) {
            setError(e instanceof Error ? e.message : "アップロード失敗");
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
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogTitle className="text-center text-lg font-bold">
                    PDFアップロード
                </DialogTitle>

                <div className="space-y-5 pt-2">
                    <p className="text-center text-sm text-muted-foreground">
                        PDFデータはそのまま送信することはできません。
                        <br />
                        アップロード後、URLに変換されますので、URLを送信してください。
                    </p>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf"
                        onChange={onFile}
                        hidden
                    />
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) upload(file);
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed py-12 transition-colors",
                            dragOver
                                ? "border-primary bg-primary/5"
                                : "border-border",
                        )}
                    >
                        {uploading ? (
                            <>
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                    className="size-6 text-muted-foreground"
                                />
                                <span className="text-sm text-muted-foreground">
                                    アップロード中...
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm text-muted-foreground">
                                    ここにファイルをドロップ
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    または
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    PCから選択
                                </Button>
                            </>
                        )}
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        10MBまでのファイルをアップロードできます
                    </p>
                    {error && (
                        <p className="text-center text-xs text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm text-blue-600 dark:text-blue-400 underline"
                        >
                            戻る
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

type MediaKind = "image" | "video" | "audio";

type MediaChange = {
    message_type: MediaKind;
    url: string;
    preview_url?: string;
    duration?: number | null;
};

const MEDIA_CARDS: {
    kind: MediaKind;
    label: string;
    icon: typeof faImage;
    accept: string;
}[] = [
    {
        kind: "image",
        label: "画像",
        icon: faImage,
        accept: "image/png,image/jpeg,image/jpg",
    },
    { kind: "video", label: "動画", icon: faVideo, accept: "video/mp4" },
    { kind: "audio", label: "音声", icon: faMusic, accept: "audio/*,.m4a" },
];

const MEDIA_FORMATS = [
    { label: "画像", ext: ".png / .jpg", size: "10MBまで" },
    { label: "動画", ext: ".mp4", size: "200MBまで" },
    { label: "音声", ext: ".m4a", size: "200MBまで" },
];

// tenant API の /uploads/* に委譲。endpoint 名で種別を判定する（呼び出し側は据え置き）。
async function postFile(
    endpoint: string,
    _field: string,
    file: Blob,
    extra?: Record<string, string>,
): Promise<string> {
    if (endpoint.includes("upload-pdf")) return uploadPdf(file);
    if (endpoint.includes("upload-media")) {
        return uploadMedia(file, (extra?.kind as "video" | "audio") ?? "video");
    }
    return uploadImage(file);
}

function readVideoMeta(
    file: File,
): Promise<{ duration: number; thumb: Blob }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        const objUrl = URL.createObjectURL(file);
        video.src = objUrl;
        video.onloadedmetadata = () => {
            video.currentTime = Math.min(0.1, video.duration / 2 || 0);
        };
        video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const duration = Math.round((video.duration || 0) * 1000);
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(objUrl);
                    if (blob) resolve({ duration, thumb: blob });
                    else reject(new Error("サムネイル生成に失敗しました"));
                },
                "image/jpeg",
                0.8,
            );
        };
        video.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error("動画の読み込みに失敗しました"));
        };
    });
}

function readAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        const objUrl = URL.createObjectURL(file);
        audio.src = objUrl;
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objUrl);
            resolve(Math.round((audio.duration || 0) * 1000));
        };
        audio.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error("音声の読み込みに失敗しました"));
        };
    });
}

function MediaUploader({
    mediaType,
    url,
    onChange,
}: {
    mediaType: MediaKind;
    url: string;
    onChange: (change: MediaChange) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [accept, setAccept] = useState<string>("image/*,video/*,audio/*");
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detectKind = (file: File): MediaKind | null => {
        if (file.type.startsWith("image/")) return "image";
        if (file.type.startsWith("video/")) return "video";
        if (file.type.startsWith("audio/") || /\.m4a$/i.test(file.name))
            return "audio";
        return null;
    };

    const upload = async (file: File) => {
        const kind = detectKind(file);
        if (!kind) {
            setError("対応していないファイル形式です");
            return;
        }
        setUploading(true);
        setError(null);
        try {
            if (kind === "image") {
                const u = await postFile(
                    "/templates/upload-image",
                    "image",
                    file,
                );
                onChange({ message_type: "image", url: u, preview_url: u });
            } else if (kind === "video") {
                const { duration, thumb } = await readVideoMeta(file);
                const [u, preview] = await Promise.all([
                    postFile("/templates/upload-media", "media", file, {
                        kind: "video",
                    }),
                    postFile("/templates/upload-image", "image", thumb),
                ]);
                onChange({
                    message_type: "video",
                    url: u,
                    preview_url: preview,
                    duration,
                });
            } else {
                const duration = await readAudioDuration(file);
                const u = await postFile(
                    "/templates/upload-media",
                    "media",
                    file,
                    { kind: "audio" },
                );
                onChange({ message_type: "audio", url: u, duration });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "アップロード失敗");
        } finally {
            setUploading(false);
        }
    };

    const pick = (cardAccept: string) => {
        setAccept(cardAccept);
        requestAnimationFrame(() => fileRef.current?.click());
    };

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = "";
    };

    const reset = () =>
        onChange({ message_type: mediaType, url: "", preview_url: "" });

    return (
        <div className="space-y-4">
            <input
                ref={fileRef}
                type="file"
                accept={accept}
                onChange={onFile}
                hidden
            />

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) upload(file);
                }}
                className={cn(
                    "rounded-md border-2 border-dashed p-8 transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-primary/50",
                )}
            >
                {url ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            {mediaType === "image" && (
                                <img
                                    src={url}
                                    alt="プレビュー"
                                    className="max-w-xs max-h-64 rounded-md border border-border"
                                />
                            )}
                            {mediaType === "video" && (
                                <video
                                    src={url}
                                    controls
                                    className="max-w-sm max-h-64 rounded-md border border-border"
                                />
                            )}
                            {mediaType === "audio" && (
                                <audio src={url} controls className="w-72" />
                            )}
                            <button
                                type="button"
                                onClick={reset}
                                className="absolute -top-2 -right-2 size-7 rounded-full bg-background hover:bg-muted border border-border inline-flex items-center justify-center shadow-sm"
                                aria-label="削除"
                            >
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    className="size-3.5"
                                />
                            </button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileRef.current?.click()}
                        >
                            変更
                        </Button>
                    </div>
                ) : uploading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="size-7 text-primary"
                        />
                        <span className="text-sm text-muted-foreground">
                            アップロード中...
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-5">
                        <div className="flex items-start justify-center gap-6">
                            {MEDIA_CARDS.map((c) => (
                                <button
                                    key={c.kind}
                                    type="button"
                                    onClick={() => pick(c.accept)}
                                    className="w-28 overflow-hidden rounded-md border border-primary/40 bg-background transition-shadow hover:shadow-md"
                                >
                                    <div className="bg-primary py-2 text-center text-sm font-bold text-primary-foreground">
                                        {c.label}
                                    </div>
                                    <div className="flex items-center justify-center py-6">
                                        <FontAwesomeIcon
                                            icon={c.icon}
                                            className="size-10 text-primary"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            ここにファイルをドロップ
                            <br />
                            または
                        </div>
                        <Button
                            type="button"
                            className="bg-primary/70 text-primary-foreground hover:bg-primary px-8"
                            onClick={() => {
                                setAccept("image/*,video/*,audio/*");
                                requestAnimationFrame(() =>
                                    fileRef.current?.click(),
                                );
                            }}
                        >
                            PCから選択
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <p className="text-sm font-bold">対応フォーマット</p>
                <table className="w-full max-w-xl border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 text-center">
                            <th className="px-3 py-2 font-bold">データ形式</th>
                            <th className="px-3 py-2 font-bold">対応形式</th>
                            <th className="px-3 py-2 font-bold">最大データ容量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MEDIA_FORMATS.map((f) => (
                            <tr
                                key={f.label}
                                className="border-b border-border text-center"
                            >
                                <td className="px-3 py-2">{f.label}</td>
                                <td className="px-3 py-2">{f.ext}</td>
                                <td className="px-3 py-2">{f.size}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function StickerPicker({
    packageId,
    stickerId,
    onChange,
}: {
    packageId: number | null;
    stickerId: number | null;
    onChange: (packageId: number, stickerId: number) => void;
}) {
    const initialPkg =
        (packageId != null && findPackage(packageId)) || STICKER_PACKAGES[0];
    const [activePkgId, setActivePkgId] = useState<number>(
        initialPkg.packageId,
    );
    const activePkg = findPackage(activePkgId) ?? STICKER_PACKAGES[0];

    return (
        <div className="space-y-4">
            <div className="flex items-baseline gap-3">
                <p className="text-base font-bold">スタンプ選択</p>
                <span className="text-sm text-destructive">
                    ※クリエイターズスタンプは利用できません
                </span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border border-border p-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {STICKER_PACKAGES.map((pkg) => {
                        const active = pkg.packageId === activePkgId;
                        return (
                            <button
                                key={pkg.packageId}
                                type="button"
                                onClick={() => setActivePkgId(pkg.packageId)}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 rounded-md border p-2 text-center transition-colors",
                                    active
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-muted/40",
                                )}
                            >
                                <img
                                    src={stickerImageUrl(pkg.stickerIds[0])}
                                    alt={pkg.name}
                                    loading="lazy"
                                    className="size-12 object-contain"
                                />
                                <span
                                    className={cn(
                                        "line-clamp-2 text-[11px] leading-tight",
                                        active
                                            ? "font-bold text-primary"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {pkg.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-md border border-border p-4">
                <div className="grid grid-cols-5 gap-3 sm:grid-cols-7 lg:grid-cols-9">
                    {activePkg.stickerIds.map((sid) => {
                        const selected =
                            sid === stickerId && activePkgId === packageId;
                        return (
                            <button
                                key={sid}
                                type="button"
                                onClick={() => onChange(activePkgId, sid)}
                                className={cn(
                                    "flex flex-col items-center gap-1 rounded-md p-1 transition-colors",
                                    selected
                                        ? "bg-primary/10 ring-2 ring-primary"
                                        : "hover:bg-muted/40",
                                )}
                                aria-pressed={selected}
                            >
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className={cn(
                                        "size-3",
                                        selected
                                            ? "text-primary"
                                            : "text-muted-foreground/30",
                                    )}
                                />
                                <img
                                    src={stickerImageUrl(sid)}
                                    alt={`スタンプ ${sid}`}
                                    loading="lazy"
                                    className="size-12 object-contain"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-center text-sm font-bold">選択したスタンプ</p>
                <div className="flex min-h-32 items-center justify-center rounded-md border border-border p-4">
                    {stickerId != null ? (
                        <img
                            src={stickerImageUrl(stickerId)}
                            alt="選択したスタンプ"
                            className="size-24 object-contain"
                        />
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            スタンプを選択してください
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
