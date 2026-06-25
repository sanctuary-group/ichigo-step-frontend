"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faCloudArrowUp,
    faImage,
    faLightbulb,
    faCircleInfo,
    faFloppyDisk,
    faTriangleExclamation,
    faUpRightFromSquare,
    faComment,
    faCheck,
    faPenToSquare,
    faFileLines,
    faPaperPlane,
    faClock,
    faTag,
    faEllipsis,
    faCopy,
    faRightLeft,
    faDesktop,
    faRectangleList,
    faCalendarDays,
    faCalendarCheck,
    faFlag,
    faStore,
    faShareNodes,
    faPhone,
    faCommentDots,
    faEnvelope,
    faTrashCan,
    faCircleExclamation,
    faChevronDown,
    faMobileScreenButton,
    faBan,
    faCamera,
    faImages,
    faLocationDot,
    faWrench,
    faUserPlus,
    faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { apiFetch } from "@/lib/api/client";
import { uploadRichMenuImage } from "@/lib/api/uploads";
import { saveRichMenu } from "@/lib/api/rich-menus";
import {
    RICH_MENU_LAYOUTS,
    fetchRichMenuFolderOptions,
    fetchActionTemplates,
    fetchActionTemplateFolders,
    fetchRichMenuActionOptions,
    type ActionOptions,
} from "@/lib/api/rich-menu-form-data";
import type { LineChannel } from "@/types/broadcast";
import type {
    RichMenu,
    RichMenuAreaAction,
    RichMenuFolder,
    RichMenuLayout,
} from "@/types/rich-menu";
import {
    RichMenuActionDialog,
    type RichMenuActionTemplate,
    type RichMenuActionTemplateFolder,
    type RichMenuActionTag,
    type RichMenuSavedAction,
} from "@/components/rich-menus/action-dialog";

const MAX_NAME = 50;
const MAX_CHATBAR = 14;

type StepId = 1 | 2 | 3 | 4;
const STEPS: { id: StepId; label: string }[] = [
    { id: 1, label: "画像設定" },
    { id: 2, label: "タップエリア" },
    { id: 3, label: "タップ時アクション" },
    { id: 4, label: "詳細設定" },
];

type FolderOption = Pick<RichMenuFolder, "id" | "name" | "is_system">;

const EMPTY_ACTION_OPTIONS: ActionOptions = {
    tags: [],
    chatStatuses: [],
    friendFieldFolders: [],
    scenarios: [],
    richMenus: [],
    reminders: [],
    forms: [],
};

type InnerProps = {
    richMenu: (RichMenu & { image_url?: string | null }) | null;
    layouts: RichMenuLayout[];
    folders: FolderOption[];
    actionTemplates?: RichMenuActionTemplate[];
    actionTemplateFolders?: RichMenuActionTemplateFolder[];
    actionOptions?: ActionOptions;
    defaultName?: string;
    defaultFolderId: number | null;
    channels: LineChannel[];
    tags: RichMenuActionTag[];
};

type FormShape = {
    name: string;
    line_channel_id: number;
    rich_menu_folder_id: number;
    chat_bar_text: string;
    selected: boolean;
    layout_key: string;
    image_path: string | null;
    areas: RichMenuAreaAction[];
};

// Inertia useForm の最小互換 shim（data/setData/errors/processing）。
function useFormState<T extends Record<string, unknown>>(initial: T) {
    const [data, setDataState] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    function setData<K extends keyof T>(
        keyOrFn: K | T | ((prev: T) => T),
        value?: T[K],
    ) {
        if (typeof keyOrFn === "function") {
            setDataState(keyOrFn as (prev: T) => T);
        } else if (typeof keyOrFn === "string") {
            setDataState((d) => ({ ...d, [keyOrFn]: value }));
        } else {
            setDataState(keyOrFn as T);
        }
    }
    return { data, setData, setDataState, errors, setErrors, processing, setProcessing };
}

function buildAreas(
    count: number,
    existing: RichMenuAreaAction[] = [],
): RichMenuAreaAction[] {
    return Array.from({ length: count }, (_, i) => ({
        type: existing[i]?.type ?? "none",
        value: existing[i]?.value ?? "",
        label: existing[i]?.label,
        config: existing[i]?.config ?? null,
    }));
}

function RichMenuForm({
    richMenu,
    layouts,
    folders,
    actionTemplates = [],
    actionTemplateFolders = [],
    actionOptions = EMPTY_ACTION_OPTIONS,
    defaultName,
    defaultFolderId,
    channels,
    tags: tagsProp,
}: InnerProps) {
    const router = useRouter();
    const tags = actionOptions.tags.length > 0 ? actionOptions.tags : tagsProp ?? [];
    const isEdit = !!richMenu;

    const initialLayoutKey = richMenu?.layout_key ?? layouts[0]?.key ?? "large_6";
    const initialLayout =
        layouts.find((l) => l.key === initialLayoutKey) ?? layouts[0];

    const form = useFormState<FormShape>({
        name: richMenu?.name ?? defaultName ?? "",
        line_channel_id: richMenu?.line_channel_id ?? channels[0]?.id ?? 0,
        rich_menu_folder_id:
            richMenu?.rich_menu_folder_id ??
            defaultFolderId ??
            folders[0]?.id ??
            0,
        chat_bar_text: richMenu?.chat_bar_text ?? "メニュー",
        selected: richMenu?.selected ?? true,
        layout_key: initialLayoutKey,
        image_path: richMenu?.image_path ?? null,
        areas: buildAreas(initialLayout?.areas.length ?? 0, richMenu?.areas ?? []),
    });

    const [step, setStep] = useState<StepId>(1);
    const [imageUrl, setImageUrl] = useState<string | null>(
        richMenu?.image_url ?? null,
    );
    const [imageSize, setImageSize] = useState<"large" | "compact" | null>(
        richMenu?.size ?? null,
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [timingInfoOpen, setTimingInfoOpen] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const layout = useMemo(
        () => layouts.find((l) => l.key === form.data.layout_key) ?? layouts[0],
        [form.data.layout_key, layouts],
    );
    const layoutsForSize = useMemo(
        () => layouts.filter((l) => l.size === imageSize),
        [layouts, imageSize],
    );

    const selectLayout = (key: string) => {
        const next = layouts.find((l) => l.key === key);
        if (!next) return;
        form.setData((prev) => ({
            ...prev,
            layout_key: key,
            areas: buildAreas(next.areas.length, prev.areas),
        }));
    };

    const setArea = (i: number, patch: Partial<RichMenuAreaAction>) => {
        form.setData(
            "areas",
            form.data.areas.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
        );
    };

    const upload = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        try {
            const data = await uploadRichMenuImage(file);
            setImageSize(data.size);
            // レイアウトが画像サイズと不一致なら、そのサイズの先頭レイアウトへ
            const matchedLayouts = layouts.filter((l) => l.size === data.size);
            const keepCurrent = matchedLayouts.some(
                (l) => l.key === form.data.layout_key,
            );
            const nextLayout = keepCurrent
                ? layouts.find((l) => l.key === form.data.layout_key)!
                : matchedLayouts[0];
            form.setData((prev) => ({
                ...prev,
                image_path: data.path,
                layout_key: nextLayout.key,
                areas: keepCurrent
                    ? prev.areas
                    : buildAreas(nextLayout.areas.length, prev.areas),
            }));
            setImageUrl(data.url);
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

    const save = async (then?: () => void) => {
        form.setProcessing(true);
        form.setErrors({});
        try {
            await saveRichMenu(form.data, isEdit ? richMenu!.id : undefined);
            form.setProcessing(false);
            then?.();
        } catch (e) {
            if (e instanceof ApiError) form.setErrors(e.fieldErrors());
            form.setProcessing(false);
        }
    };

    // 保存して一覧（TOP）に戻る
    const saveAndReturn = () => {
        save(() => router.push("/rich-menus"));
    };

    const publish = () => {
        if (!isEdit) return;
        save(() =>
            apiFetch(`/rich-menus/${richMenu!.id}/publish`, { method: "POST" }).catch(
                () => undefined,
            ),
        );
    };

    const unpublish = () => {
        if (!isEdit) return;
        if (!confirm("LINE 側のリッチメニューを取り下げます。よろしいですか？"))
            return;
        apiFetch(`/rich-menus/${richMenu!.id}/unpublish`, { method: "POST" }).catch(
            () => undefined,
        );
    };

    const hasImage = !!form.data.image_path;
    const canNext = step === 1 ? hasImage : true;

    return (
        <>
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
                {/* ヘッダー: パンくず + 管理名 + フォルダ */}
                <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 bg-background border-b border-border">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_320px] gap-6 items-end">
                        <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Link
                                    href="/rich-menus"
                                    className="hover:text-foreground hover:underline"
                                >
                                    TOP
                                </Link>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="size-2.5"
                                />
                                <span>
                                    リッチメニュー {isEdit ? "編集" : "新規作成"}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight mt-1">
                                リッチメニュー {isEdit ? "編集" : "新規作成"}
                            </h1>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-end justify-between">
                                <Label htmlFor="rm-name" className="text-xs font-bold">
                                    管理名
                                </Label>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {form.data.name.length} / {MAX_NAME}
                                </span>
                            </div>
                            <Input
                                id="rm-name"
                                value={form.data.name}
                                onChange={(e) => form.setData("name", e.target.value)}
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
                            <Label className="text-xs font-bold">フォルダ</Label>
                            <select
                                value={form.data.rich_menu_folder_id}
                                onChange={(e) =>
                                    form.setData(
                                        "rich_menu_folder_id",
                                        Number(e.target.value),
                                    )
                                }
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {folders.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* 左: ステッパー */}
                    <aside className="w-56 shrink-0 border-r border-border bg-background py-8 px-6 hidden md:block">
                        <ol className="space-y-0">
                            {STEPS.map((s, i) => {
                                const active = s.id === step;
                                const done = s.id < step;
                                const last = i === STEPS.length - 1;
                                return (
                                    <li key={s.id} className="flex flex-col">
                                        <button
                                            type="button"
                                            onClick={() => setStep(s.id)}
                                            className="flex items-center gap-3 text-left"
                                        >
                                            <div
                                                className={cn(
                                                    "size-7 rounded-full grid place-items-center text-xs font-bold shrink-0 tabular-nums",
                                                    active &&
                                                        "bg-primary text-primary-foreground",
                                                    done &&
                                                        "bg-primary/80 text-primary-foreground",
                                                    !active &&
                                                        !done &&
                                                        "bg-muted text-muted-foreground",
                                                )}
                                            >
                                                {done ? (
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                        className="size-3"
                                                    />
                                                ) : (
                                                    s.id
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-sm",
                                                    active && "font-bold",
                                                    !active &&
                                                        !done &&
                                                        "text-muted-foreground",
                                                )}
                                            >
                                                {s.label}
                                            </span>
                                        </button>
                                        {!last && (
                                            <div className="ml-3 my-1 h-6 w-px bg-border" />
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </aside>

                    {/* 右: ステップ内容 */}
                    <section className="flex-1 overflow-y-auto bg-background">
                        {step === 1 && (
                            <StepImage
                                layout={layout}
                                imageUrl={imageUrl}
                                areas={form.data.areas}
                                chatBarText={form.data.chat_bar_text}
                                uploading={uploading}
                                uploadError={uploadError}
                                onPick={() => fileRef.current?.click()}
                            />
                        )}
                        {step === 2 && (
                            <StepLayout
                                imageSize={imageSize}
                                layout={layout}
                                imageUrl={imageUrl}
                                layoutsForSize={layoutsForSize}
                                currentKey={form.data.layout_key}
                                onSelect={selectLayout}
                            />
                        )}
                        {step === 3 && (
                            <StepActions
                                layout={layout}
                                imageUrl={imageUrl}
                                areas={form.data.areas}
                                chatBarText={form.data.chat_bar_text}
                                setArea={setArea}
                                templates={actionTemplates}
                                templateFolders={actionTemplateFolders}
                                tags={tags}
                                actionOptions={actionOptions}
                            />
                        )}
                        {step === 4 && (
                            <StepDetails
                                form={form}
                                channels={channels}
                                layout={layout}
                                imageUrl={imageUrl}
                                isEdit={isEdit}
                                isPublished={!!richMenu?.is_published}
                            />
                        )}
                    </section>
                </div>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={onFile}
                    className="hidden"
                />

                {/* フッター */}
                {step < 4 ? (
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border gap-3">
                        <div className="relative text-sm flex items-center gap-1.5 font-bold text-foreground">
                            編集内容の友だちへの反映タイミング
                            <button
                                type="button"
                                onClick={() => setTimingInfoOpen((v) => !v)}
                                onBlur={() => setTimingInfoOpen(false)}
                                aria-label="反映タイミングの説明"
                                className="grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <FontAwesomeIcon
                                    icon={faCircleInfo}
                                    className="size-3.5"
                                />
                            </button>
                            {timingInfoOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-[420px] max-w-[80vw] rounded-md border border-border bg-popover px-4 py-3 text-xs font-normal text-foreground shadow-lg">
                                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5">
                                        <span className="font-bold whitespace-nowrap">
                                            「次へ」
                                        </span>
                                        <span className="text-muted-foreground">
                                            ：編集内容は友だちへは反映されません。
                                        </span>
                                        <span className="font-bold whitespace-nowrap">
                                            「保存してTOPに戻る」
                                        </span>
                                        <span className="text-muted-foreground">
                                            ：編集内容が友だちへ反映されます。
                                        </span>
                                    </div>
                                    <span className="absolute -bottom-1.5 left-6 size-3 rotate-45 border-b border-r border-border bg-popover" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setStep((s) => (s - 1) as StepId)
                                    }
                                    className="h-10 px-6"
                                >
                                    &lt; 戻る
                                </Button>
                            )}
                            <Button
                                onClick={() => setStep((s) => (s + 1) as StepId)}
                                disabled={!canNext}
                                className="h-10 px-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                次へ &gt;
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-6 px-4 sm:px-6 lg:px-8 py-5 bg-background border-t border-border">
                        <Button
                            onClick={saveAndReturn}
                            disabled={form.processing || uploading}
                            className="h-12 px-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 size-4" />
                            {form.processing ? "保存中..." : "保存してTOPに戻る"}
                        </Button>
                        <div className="text-sm flex items-center gap-1.5 text-muted-foreground">
                            <FontAwesomeIcon
                                icon={faCircleInfo}
                                className="size-4 text-destructive"
                            />
                            <span>
                                リッチメニューを保存しただけでは
                                <br />
                                友だちには表示されません。
                            </span>
                        </div>
                        {isEdit && richMenu!.is_published ? (
                            <Button
                                variant="outline"
                                onClick={unpublish}
                                className="h-10 px-6 text-destructive hover:text-destructive"
                            >
                                非公開にする
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={publish}
                                disabled={
                                    !isEdit ||
                                    form.processing ||
                                    uploading ||
                                    !hasImage ||
                                    channels.length === 0
                                }
                                className="h-10 px-6 disabled:opacity-50"
                            >
                                表示方法を確認
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/* ---------------- STEP 1: 画像設定 ---------------- */
function StepImage({
    layout,
    imageUrl,
    areas,
    chatBarText,
    uploading,
    uploadError,
    onPick,
}: {
    layout: RichMenuLayout;
    imageUrl: string | null;
    areas: RichMenuAreaAction[];
    chatBarText: string;
    uploading: boolean;
    uploadError: string | null;
    onPick: () => void;
}) {
    return (
        <>
            <div className="px-8 py-4 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">
                    STEP① リッチメニュー画像の登録・変更
                </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 px-8 py-8">
                <PhonePreview
                    layout={layout}
                    imageUrl={imageUrl}
                    areas={areas}
                    chatBarText={chatBarText}
                />

                <div className="space-y-5">
                    <p className="text-center text-sm font-medium">
                        リッチメニューとして表示する画像を設定します
                    </p>

                    <button
                        type="button"
                        onClick={onPick}
                        disabled={uploading}
                        className="w-full rounded-md border-2 border-dashed border-border bg-muted/20 p-8 text-center hover:bg-muted/40 transition-colors disabled:opacity-50"
                    >
                        <FontAwesomeIcon
                            icon={faCloudArrowUp}
                            className="size-10 text-muted-foreground/70 mb-3"
                        />
                        <div className="text-sm">
                            {uploading ? (
                                "アップロード中..."
                            ) : (
                                <>
                                    <span className="text-blue-600 dark:text-blue-400 underline">
                                        クリック
                                    </span>{" "}
                                    して画像を選択
                                </>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            ファイル形式 : .jpg .png
                        </div>
                    </button>

                    {uploadError && (
                        <p className="text-xs text-destructive flex items-center gap-1.5">
                            <FontAwesomeIcon
                                icon={faTriangleExclamation}
                                className="size-3"
                            />
                            {uploadError}
                        </p>
                    )}

                    <div className="relative rounded-md border-2 border-primary/60 p-5">
                        <div className="absolute -top-3 left-4 inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-bold">
                            <FontAwesomeIcon icon={faLightbulb} className="size-3" />
                            ヒント
                        </div>
                        <p className="text-sm mt-1">
                            アップロードできる画像のサイズは
                            <span className="text-red-600 dark:text-red-400 font-medium">
                                以下の2パターンのみ
                            </span>
                            です。
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
                            <SizePreview
                                cols={3}
                                rows={2}
                                label="横) 2,500px　縦) 1,686px"
                            />
                            <SizePreview
                                cols={3}
                                rows={1}
                                label="横) 2,500px　縦) 843px"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ---------------- STEP 2: タップエリア ---------------- */
function StepLayout({
    imageSize,
    layout,
    imageUrl,
    layoutsForSize,
    currentKey,
    onSelect,
}: {
    imageSize: "large" | "compact" | null;
    layout: RichMenuLayout;
    imageUrl: string | null;
    layoutsForSize: RichMenuLayout[];
    currentKey: string;
    onSelect: (key: string) => void;
}) {
    return (
        <>
            <div className="px-8 py-4 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">STEP② タップエリアの設定</h2>
            </div>
            <div className="px-8 py-8">
                {imageSize === null ? (
                    <div className="text-center text-sm text-muted-foreground py-16">
                        先に STEP① で画像をアップロードしてください。
                        <br />
                        画像サイズに応じて選べるレイアウトが変わります。
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
                        {/* 左: 選択中レイアウトのプレビュー（番号付き） */}
                        <div className="rounded-md border border-border p-2">
                            <AreaNumberPreview
                                layout={layout}
                                imageUrl={imageUrl}
                            />
                        </div>

                        {/* 右: レイアウト選択 */}
                        <div>
                            <p className="text-sm font-bold mb-4">
                                タップエリアを選択してください
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {layoutsForSize.map((l) => {
                                    const selected = l.key === currentKey;
                                    return (
                                        <button
                                            key={l.key}
                                            type="button"
                                            onClick={() => onSelect(l.key)}
                                            title={l.label}
                                            className={cn(
                                                "relative rounded-md border p-3 transition-colors",
                                                selected
                                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                                                    : "border-border hover:bg-muted/40",
                                            )}
                                        >
                                            <LayoutPatternThumb layout={l} />
                                            {selected && (
                                                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                        className="size-2.5"
                                                    />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 rounded-md border border-border p-3 text-sm font-bold hover:bg-muted/40"
                                >
                                    <FontAwesomeIcon
                                        icon={faPenToSquare}
                                        className="size-3.5"
                                    />
                                    手動編集
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

/** 選択中レイアウトを画像の上に番号付きエリアで表示 */
function AreaNumberPreview({
    layout,
    imageUrl,
}: {
    layout: RichMenuLayout;
    imageUrl: string | null;
}) {
    return (
        <div
            className="relative w-full overflow-hidden rounded bg-muted"
            style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt="リッチメニュー"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <FontAwesomeIcon
                        icon={faImage}
                        className="size-8 opacity-50"
                    />
                </div>
            )}
            {layout.areas.map((a, i) => (
                <div
                    key={i}
                    className="absolute grid place-items-center border border-white/70"
                    style={{
                        left: `${(a.x / layout.width) * 100}%`,
                        top: `${(a.y / layout.height) * 100}%`,
                        width: `${(a.width / layout.width) * 100}%`,
                        height: `${(a.height / layout.height) * 100}%`,
                    }}
                >
                    <span className="text-2xl font-bold text-white drop-shadow">
                        {i + 1}
                    </span>
                </div>
            ))}
        </div>
    );
}

/** レイアウトの分割パターンのみを線で表現した小サムネ */
function LayoutPatternThumb({ layout }: { layout: RichMenuLayout }) {
    return (
        <div
            className="relative w-full overflow-hidden rounded bg-background"
            style={{ aspectRatio: "2 / 1" }}
        >
            {layout.areas.map((a, i) => (
                <div
                    key={i}
                    className="absolute border border-muted-foreground/40"
                    style={{
                        left: `${(a.x / layout.width) * 100}%`,
                        top: `${(a.y / layout.height) * 100}%`,
                        width: `${(a.width / layout.width) * 100}%`,
                        height: `${(a.height / layout.height) * 100}%`,
                    }}
                />
            ))}
        </div>
    );
}

/* ---------------- STEP 3: タップ時アクション ---------------- */
const RICHMENU_ELME_ACTIONS: {
    icon: typeof faFileLines;
    label: string;
    key?: string;
}[] = [
    { icon: faFileLines, label: "テンプレートを\n送信する", key: "template" },
    { icon: faPaperPlane, label: "テキストを\n送信する", key: "text" },
    { icon: faClock, label: "ステップ配信を\n開始・停止する", key: "step" },
    { icon: faTag, label: "タグを\n付け・外しする", key: "tag" },
    { icon: faEllipsis, label: "全ての\nアクションをみる" },
];

const RICHMENU_FRIEND_ACTIONS: {
    key: string;
    icon: typeof faDesktop;
    label: string;
}[] = [
    { key: "page", icon: faDesktop, label: "指定ページを\nひらく" },
    { key: "form", icon: faRectangleList, label: "回答フォームを\nひらく" },
    { key: "salon", icon: faCalendarDays, label: "サロン予約を\nひらく" },
    { key: "lesson", icon: faCalendarCheck, label: "レッスン予約を\nひらく" },
    { key: "event", icon: faFlag, label: "イベント予約を\nひらく" },
    { key: "shop", icon: faStore, label: "商品販売ページを\nひらく" },
    { key: "conversion", icon: faShareNodes, label: "コンバージョン\n登録ページをひらく" },
    { key: "phone", icon: faPhone, label: "電話を\nかけさせる" },
    { key: "text", icon: faCommentDots, label: "テキストを\n送らせる" },
    { key: "mail", icon: faEnvelope, label: "メールを\n送らせる" },
];

const RICHMENU_URLSCHEME_ACTIONS: {
    key: string;
    icon: typeof faShareNodes;
    label: string;
}[] = [
    { key: "share_oa", icon: faShareNodes, label: "LINE公式アカウントを\nシェアする" },
    { key: "share_text", icon: faCommentDots, label: "友だちにテキストを\nシェアする" },
    { key: "camera", icon: faCamera, label: "カメラを\n起動させる" },
    { key: "camera_roll", icon: faImages, label: "カメラロールを\n開かせる" },
    { key: "location", icon: faLocationDot, label: "位置情報を\n送らせる" },
    {
        key: "other_oa",
        icon: faMobileScreenButton,
        label: "他LINE公式アカウントの\nプロフィール画面を開く",
    },
    { key: "custom", icon: faWrench, label: "カスタム設定\n（上級者向け）" },
];

const FRIEND_RESV: Record<
    string,
    { title: string; placeholder: string; radio: boolean }
> = {
    salon: {
        title: "サロン・面談予約をひらく",
        placeholder: "サロン・面談予約を選択してください",
        radio: true,
    },
    lesson: {
        title: "レッスン予約をひらく",
        placeholder: "レッスン予約を選択してください",
        radio: true,
    },
    event: {
        title: "イベント予約をひらく",
        placeholder: "イベント予約を選択してください",
        radio: false,
    },
};

const ICHIGO_LABEL: Record<string, string> = {
    step: "ステップ配信を開始・停止",
    template: "テンプレートを送信",
    text: "テキストを送信",
    remind: "リマインド",
    tag: "タグを付け・外し",
    bookmark: "ブックマーク",
    friend_field: "友だち情報",
    chat_status: "対応ステータス",
    block: "ブロック",
};

const FRIEND_LABEL: Record<string, string> = {
    page: "指定ページをひらく",
    form: "回答フォームをひらく",
    salon: "サロン予約をひらく",
    lesson: "レッスン予約をひらく",
    event: "イベント予約をひらく",
    shop: "商品販売ページをひらく",
    conversion: "コンバージョン登録ページをひらく",
    phone: "電話をかけさせる",
    text: "テキストを送らせる",
    mail: "メールを送らせる",
};

const SCHEME_LABEL: Record<string, string> = {
    share_oa: "LINE公式アカウントをシェアする",
    share_text: "友だちにテキストをシェアする",
    camera: "カメラを起動させる",
    camera_roll: "カメラロールを開かせる",
    location: "位置情報を送らせる",
    other_oa: "他LINE公式アカウントのプロフィール画面を開く",
    custom: "カスタム設定",
};

/** 友だちアクションを LINE エリアアクションに変換 */
function buildFriendAction(
    kind: string,
    v: {
        url: string;
        phone: string;
        mail: string;
        text: string;
        salonMode: string;
        shopMode: string;
    },
): RichMenuAreaAction {
    const label = FRIEND_LABEL[kind] ?? "友だちアクション";
    const base = { label, config: { category: "friend", kind } as Record<string, unknown> };
    switch (kind) {
        case "phone":
            return { type: "uri", value: v.phone ? `tel:${v.phone}` : "", ...base, config: { ...base.config, value: v.phone } };
        case "mail":
            return { type: "uri", value: v.mail ? `mailto:${v.mail}` : "", ...base, config: { ...base.config, value: v.mail } };
        case "text":
            return { type: "uri", value: v.text ? `https://line.me/R/share?text=${encodeURIComponent(v.text)}` : "", ...base, config: { ...base.config, value: v.text } };
        default:
            // page=指定ページURL / form=公開フォームURL / salon・lesson・event・shop・conversion=外部URL
            // いずれもタップで URL を開く uri アクションとして保存する。
            return {
                type: "uri",
                value: v.url,
                ...base,
                config: { ...base.config, value: v.url, salonMode: v.salonMode, shopMode: v.shopMode },
            };
    }
}

/** LINE URLスキームアクションを LINE エリアアクションに変換 */
function buildSchemeAction(kind: string, value: string): RichMenuAreaAction {
    const label = SCHEME_LABEL[kind] ?? "LINE URLスキーム";
    const config = { category: "urlscheme", kind, value } as Record<string, unknown>;
    const uri = (u: string): RichMenuAreaAction => ({ type: "uri", value: u, label, config });
    switch (kind) {
        case "share_oa":
            return uri(value ? `https://line.me/R/nv/recommendOA/${value}` : "");
        case "other_oa":
            return uri(value ? `https://line.me/R/ti/p/${value}` : "");
        case "share_text":
            return uri(value ? `https://line.me/R/share?text=${encodeURIComponent(value)}` : "");
        case "camera":
            return uri("line://nv/camera/");
        case "camera_roll":
            return uri("line://nv/cameraRoll/single");
        case "location":
            return uri("line://nv/location");
        case "custom":
            return uri(value);
        default:
            return uri(value);
    }
}

function FriendSelectField({
    title,
    placeholder,
    options,
    value,
    onChange,
    emptyHint,
}: {
    title: string;
    placeholder: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    emptyHint?: string;
}) {
    return (
        <div>
            <p className="text-sm font-bold">{title}</p>
            <div className="relative mt-2 max-w-md">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-11 w-full appearance-none rounded-md border border-input bg-background px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
            </div>
            {options.length === 0 && emptyHint && (
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    {emptyHint}
                </p>
            )}
        </div>
    );
}

/** 友だちアクションで外部URLを直接入力させる小フィールド（予約/商品/コンバージョン用） */
function FriendUrlField({
    title,
    value,
    onChange,
}: {
    title: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <p className="text-sm font-bold">{title}</p>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="開かせる外部ページの URL を入力してください"
                className="mt-2 h-11 max-w-md"
            />
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
                予約・商品ページ等の URL を貼り付けてください（タップで外部ページを開きます）。
            </p>
        </div>
    );
}

function StepActions({
    layout,
    imageUrl,
    areas,
    setArea,
    templates,
    templateFolders,
    tags,
    actionOptions,
}: {
    layout: RichMenuLayout;
    imageUrl: string | null;
    areas: RichMenuAreaAction[];
    chatBarText: string;
    setArea: (i: number, patch: Partial<RichMenuAreaAction>) => void;
    templates: RichMenuActionTemplate[];
    templateFolders: RichMenuActionTemplateFolder[];
    tags: RichMenuActionTag[];
    actionOptions: ActionOptions;
}) {
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionDialogKey, setActionDialogKey] = useState<
        string | undefined
    >(undefined);
    const [selected, setSelected] = useState(0);
    const [tab, setTab] = useState<"elme" | "friend" | "switch">("elme");
    const [friendAction, setFriendAction] = useState<string | null>(null);
    const [friendUrl, setFriendUrl] = useState("");
    const [salonMode, setSalonMode] = useState<"reserve" | "history">(
        "reserve",
    );
    const [shopMode, setShopMode] = useState<"single" | "subscription">(
        "single",
    );
    const [friendPhone, setFriendPhone] = useState("");
    const [friendText, setFriendText] = useState("");
    const [friendMail, setFriendMail] = useState("");
    const [switchMode, setSwitchMode] = useState<"show" | "stop">("show");
    const [switchRichMenuId, setSwitchRichMenuId] = useState<number>(0);
    const [urlSchemeMode, setUrlSchemeMode] = useState(false);
    const [urlSchemeAction, setUrlSchemeAction] = useState<string | null>(null);
    const [urlSchemeValue, setUrlSchemeValue] = useState("");
    const area = areas[selected];

    const pageDisplayNote = (
        <div>
            <p className="text-sm text-muted-foreground">ページ表示後に</p>
            <div className="mt-2 rounded-md bg-muted/40 px-4 py-3 text-sm">
                外部サイトに移動したため機能が正常に動作しないか
                <br />
                セキュリティが保証されていない場合があります。
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
                と表示される場合の対応方法は
                <span className="text-blue-600 underline dark:text-blue-400">
                    こちら
                </span>
            </p>
        </div>
    );

    // 選択エリアの保存値から STEP③ の UI を復元
    const hydrating = useRef(false);
    useEffect(() => {
        hydrating.current = true;
        const cfg = (area?.config ?? {}) as Record<string, string>;
        const cat = cfg.category;
        setUrlSchemeMode(cat === "urlscheme");
        setUrlSchemeAction(cat === "urlscheme" ? cfg.kind ?? null : null);
        setUrlSchemeValue(cat === "urlscheme" ? cfg.value ?? "" : "");
        setFriendAction(cat === "friend" ? cfg.kind ?? null : null);
        // page/form/salon/lesson/event/shop/conversion はいずれも URL を friendUrl に持つ
        setFriendUrl(
            cat === "friend" &&
                !["phone", "mail", "text"].includes(cfg.kind ?? "")
                ? cfg.value ?? ""
                : "",
        );
        setFriendPhone(cat === "friend" && cfg.kind === "phone" ? cfg.value ?? "" : "");
        setFriendMail(cat === "friend" && cfg.kind === "mail" ? cfg.value ?? "" : "");
        setFriendText(cat === "friend" && cfg.kind === "text" ? cfg.value ?? "" : "");
        setSalonMode((cfg.salonMode as "reserve" | "history") ?? "reserve");
        setShopMode((cfg.shopMode as "single" | "subscription") ?? "single");
        setSwitchMode((cfg.mode as "show" | "stop") ?? "show");
        setSwitchRichMenuId(
            cat === "switch" ? Number(cfg.richMenuId ?? 0) : 0,
        );
        setTab(
            cat === "switch" ? "switch" : cat === "friend" ? "friend" : "elme",
        );
        const id = requestAnimationFrame(() => {
            hydrating.current = false;
        });
        return () => cancelAnimationFrame(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    // STEP③ の操作結果をフォーム(area)へ保存
    useEffect(() => {
        if (hydrating.current) return;
        if (urlSchemeMode) {
            if (urlSchemeAction)
                setArea(selected, buildSchemeAction(urlSchemeAction, urlSchemeValue));
            return;
        }
        if (tab === "friend" && friendAction) {
            setArea(
                selected,
                buildFriendAction(friendAction, {
                    url: friendUrl,
                    phone: friendPhone,
                    mail: friendMail,
                    text: friendText,
                    salonMode,
                    shopMode,
                }),
            );
            return;
        }
        if (tab === "switch") {
            setArea(selected, {
                type: "postback",
                value: "",
                label: "リッチメニュー切り替え",
                config: {
                    category: "switch",
                    mode: switchMode,
                    richMenuId: switchRichMenuId,
                },
            });
        }
        // elme タブやアクション未選択時は area を変更しない（モーダル保存で別途反映）
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        urlSchemeMode,
        urlSchemeAction,
        urlSchemeValue,
        tab,
        friendAction,
        friendUrl,
        friendPhone,
        friendMail,
        friendText,
        salonMode,
        shopMode,
        switchMode,
        switchRichMenuId,
        selected,
    ]);

    // いちごアクション（モーダル）
    const ichigoCfg = (area?.config ?? {}) as Record<string, unknown>;
    const savedIchigo: RichMenuSavedAction[] =
        ichigoCfg.category === "ichigo"
            ? ((ichigoCfg.actions as RichMenuSavedAction[]) ?? [])
            : [];
    const openIchigo = (key?: string) => {
        setActionDialogKey(savedIchigo.length > 0 ? undefined : key);
        setActionDialogOpen(true);
    };
    const saveIchigo = (acts: RichMenuSavedAction[]) => {
        if (acts.length === 0) {
            setArea(selected, { type: "none", value: "", config: null });
            return;
        }
        // いちごアクションはタップ時に OA が push 実行するため postback に統一
        setArea(selected, {
            type: "postback",
            value: "",
            label: "いちごアクション",
            config: { category: "ichigo", actions: acts },
        });
    };

    return (
        <>
            <RichMenuActionDialog
                open={actionDialogOpen}
                onClose={() => setActionDialogOpen(false)}
                onSave={saveIchigo}
                initialKey={actionDialogKey}
                initialActions={savedIchigo}
                templates={templates}
                templateFolders={templateFolders}
                tags={tags}
                scenarios={actionOptions.scenarios}
                reminders={actionOptions.reminders}
                chatStatuses={actionOptions.chatStatuses}
                friendFieldFolders={actionOptions.friendFieldFolders}
            />
            <div className="px-8 py-4 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">
                    STEP③ タップ時アクションの設定
                </h2>
            </div>
            <div className="px-8 py-8 space-y-6">
                {/* エリア選択 */}
                <div>
                    <p className="text-sm font-bold mb-3">
                        アクションを設定したいエリアを選択
                    </p>
                    <div className="inline-block rounded-md bg-muted/40 p-2">
                        <div
                            className="relative overflow-hidden rounded"
                            style={{
                                width: 360,
                                aspectRatio: `${layout.width} / ${layout.height}`,
                            }}
                        >
                            {imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imageUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                            {layout.areas.map((a, i) => {
                                const isSel = i === selected;
                                const unset =
                                    (areas[i]?.type ?? "none") === "none";
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelected(i)}
                                        className={cn(
                                            "absolute grid place-items-center border border-white/70 transition-colors",
                                            isSel
                                                ? "bg-emerald-500/70"
                                                : "bg-slate-900/55 hover:bg-slate-900/40",
                                        )}
                                        style={{
                                            left: `${(a.x / layout.width) * 100}%`,
                                            top: `${(a.y / layout.height) * 100}%`,
                                            width: `${(a.width / layout.width) * 100}%`,
                                            height: `${(a.height / layout.height) * 100}%`,
                                        }}
                                    >
                                        <span className="text-2xl font-bold text-white drop-shadow leading-none">
                                            {i + 1}
                                        </span>
                                        {!isSel && unset && (
                                            <span className="mt-1 text-[11px] text-white/90">
                                                未設定
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* エリアタップ時のアクション */}
                <div>
                    <p className="text-sm font-bold">エリアタップ時のアクション</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        一度保存した後に変更した場合、タップ回数詳細がリセットされます
                    </p>

                    <div className="mt-3 rounded-md border border-border">
                        {/* エリア見出し */}
                        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-sm font-bold">
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="size-3 text-muted-foreground"
                                />
                                エリア {selected + 1}
                            </span>
                            <FontAwesomeIcon
                                icon={faCopy}
                                className="size-4 text-muted-foreground"
                            />
                        </div>

                        {/* タブ */}
                        {urlSchemeMode ? (
                            <div className="flex items-center gap-6 border-b border-border px-4">
                                <span className="relative -mb-px border-b-2 border-emerald-500 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    LINE URLスキーム
                                    <span className="absolute -right-2.5 top-2 size-2 rounded-full bg-emerald-500" />
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setUrlSchemeMode(false)}
                                    className="ml-auto my-2 inline-flex items-center gap-2 rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50/50 dark:text-emerald-400"
                                >
                                    <FontAwesomeIcon
                                        icon={faRightLeft}
                                        className="size-3.5"
                                    />
                                    いちご・友だちアクションを設定する
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 border-b border-border px-4">
                                {(
                                    [
                                        ["elme", "いちごアクション"],
                                        ["friend", "友だちアクション"],
                                        ["switch", "リッチメニュー切り替え"],
                                    ] as const
                                ).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTab(key)}
                                        className={cn(
                                            "relative py-3 text-sm font-bold -mb-px transition-colors",
                                            tab === key
                                                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {label}
                                        {key === "friend" && friendAction && (
                                            <span className="absolute -right-2.5 top-2 size-2 rounded-full bg-emerald-500" />
                                        )}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setUrlSchemeMode(true)}
                                    className="ml-auto my-2 inline-flex items-center gap-2 rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50/50 dark:text-emerald-400"
                                >
                                    <FontAwesomeIcon
                                        icon={faRightLeft}
                                        className="size-3.5"
                                    />
                                    LINE URLスキーム
                                </button>
                            </div>
                        )}

                        {/* ボディ */}
                        <div className="p-4">
                            {urlSchemeMode ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="rounded-md bg-muted/30 px-4 py-3 text-sm">
                                            <FontAwesomeIcon
                                                icon={faCircleExclamation}
                                                className="mr-2 text-destructive"
                                            />
                                            このエリアのタップ回数はカウントされません
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUrlSchemeMode(false);
                                                setUrlSchemeAction(null);
                                                setUrlSchemeValue("");
                                                setArea(selected, {
                                                    type: "none",
                                                    value: "",
                                                });
                                            }}
                                            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted/50"
                                        >
                                            <FontAwesomeIcon
                                                icon={faTrashCan}
                                                className="size-3.5"
                                            />
                                            LINE URLスキームを削除
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {RICHMENU_URLSCHEME_ACTIONS.map((a) => {
                                            const sel =
                                                urlSchemeAction === a.key;
                                            return (
                                                <button
                                                    key={a.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setUrlSchemeAction(a.key)
                                                    }
                                                    className={cn(
                                                        "relative flex flex-col items-center gap-2 rounded-md border bg-background px-2 py-5 text-center transition-colors",
                                                        sel
                                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                                                            : "border-border hover:bg-muted/40",
                                                    )}
                                                >
                                                    {sel && (
                                                        <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                                                            <FontAwesomeIcon
                                                                icon={faCheck}
                                                                className="size-2.5"
                                                            />
                                                        </span>
                                                    )}
                                                    <FontAwesomeIcon
                                                        icon={a.icon}
                                                        className={cn(
                                                            "size-5",
                                                            sel
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-foreground",
                                                        )}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "whitespace-pre-line text-xs",
                                                            sel &&
                                                                "font-bold text-emerald-600 dark:text-emerald-400",
                                                        )}
                                                    >
                                                        {a.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {urlSchemeAction === "share_oa" ? (
                                        <div className="border-t border-border pt-4">
                                            <p className="text-sm font-bold">
                                                シェアしたいLINE公式アカウントのLINE
                                                IDを入力
                                            </p>
                                            <Input
                                                value={urlSchemeValue}
                                                onChange={(e) =>
                                                    setUrlSchemeValue(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="例）@281qduvu"
                                                className="mt-3 h-11"
                                            />
                                        </div>
                                    ) : urlSchemeAction === "share_text" ? (
                                        <div className="border-t border-border pt-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold">
                                                    友だちにテキストをシェアする
                                                </p>
                                                <span className="text-sm text-muted-foreground tabular-nums">
                                                    {urlSchemeValue.length} / 900
                                                </span>
                                            </div>
                                            <textarea
                                                value={urlSchemeValue}
                                                onChange={(e) =>
                                                    setUrlSchemeValue(
                                                        e.target.value.slice(
                                                            0,
                                                            900,
                                                        ),
                                                    )
                                                }
                                                rows={6}
                                                placeholder="シェアしたいテキストを入力してください"
                                                className="mt-3 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    ) : urlSchemeAction === "camera" ? (
                                        <div className="border-t border-border pt-4">
                                            <div className="rounded-md bg-muted/30 px-4 py-4 text-center text-sm font-bold">
                                                <FontAwesomeIcon
                                                    icon={faCamera}
                                                    className="mr-2"
                                                />
                                                友だちのスマートフォンでカメラが起動します
                                            </div>
                                        </div>
                                    ) : urlSchemeAction === "camera_roll" ? (
                                        <div className="border-t border-border pt-4">
                                            <div className="rounded-md bg-muted/30 px-4 py-4 text-center text-sm font-bold">
                                                <FontAwesomeIcon
                                                    icon={faImages}
                                                    className="mr-2"
                                                />
                                                友だちのカメラロールが開きます
                                            </div>
                                        </div>
                                    ) : urlSchemeAction === "location" ? (
                                        <div className="border-t border-border pt-4">
                                            <div className="rounded-md bg-muted/30 px-4 py-4 text-center text-sm font-bold">
                                                <FontAwesomeIcon
                                                    icon={faLocationDot}
                                                    className="mr-2"
                                                />
                                                友だちの位置情報を送らせることができます
                                            </div>
                                        </div>
                                    ) : urlSchemeAction === "other_oa" ? (
                                        <div className="border-t border-border pt-4">
                                            <p className="text-sm font-bold">
                                                紹介したいLINE公式アカウントのLINE
                                                IDを入力
                                            </p>
                                            <Input
                                                value={urlSchemeValue}
                                                onChange={(e) =>
                                                    setUrlSchemeValue(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="例）@281qduvu"
                                                className="mt-3 h-11"
                                            />
                                            <div className="mt-4 rounded-md bg-muted/30 p-5">
                                                <div className="mx-auto max-w-md rounded-md border border-border bg-background p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                                                            公
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-base font-bold">
                                                                ichigo-step 公式
                                                            </p>
                                                            <span className="mt-1 inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faCircleCheck
                                                                    }
                                                                    className="size-3"
                                                                />
                                                                認証済
                                                            </span>
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                友だち 146,117
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-sm">
                                                        LINEで集客、自動化なら
                                                        ichigo-step
                                                    </p>
                                                    <div className="mt-3 flex gap-2">
                                                        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-bold text-white">
                                                            <FontAwesomeIcon
                                                                icon={faUserPlus}
                                                                className="size-3"
                                                            />
                                                            友だち追加
                                                        </span>
                                                        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold">
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faFileLines
                                                                }
                                                                className="size-3"
                                                            />
                                                            投稿
                                                        </span>
                                                        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold">
                                                            <FontAwesomeIcon
                                                                icon={faPhone}
                                                                className="size-3"
                                                            />
                                                            通話
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-center text-sm text-muted-foreground">
                                                    リッチメニューをタップすると
                                                    <br />
                                                    LINE
                                                    IDを入力したLINE公式アカウントの
                                                    <br />
                                                    プロフィールページ（上記例）が表示されます。
                                                </p>
                                            </div>
                                        </div>
                                    ) : urlSchemeAction === "custom" ? (
                                        <div className="border-t border-border pt-4">
                                            <p className="text-sm font-bold">
                                                LINE URLスキーム一覧は
                                                <span className="text-blue-600 underline dark:text-blue-400">
                                                    こちら
                                                </span>
                                            </p>
                                            <Input
                                                value={urlSchemeValue}
                                                onChange={(e) =>
                                                    setUrlSchemeValue(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="入力例）https://line.me/R/nv/chat"
                                                className="mt-3 h-11"
                                            />
                                        </div>
                                    ) : urlSchemeAction ? (
                                        <div className="border-t border-border pt-4">
                                            <div className="rounded-md bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                                                この項目は準備中です
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : tab === "elme" ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-5">
                                        {RICHMENU_ELME_ACTIONS.map((a) => (
                                            <button
                                                key={a.label}
                                                type="button"
                                                onClick={() =>
                                                    openIchigo(a.key)
                                                }
                                                className="flex flex-col items-center gap-2 rounded-md border border-border bg-background px-2 py-4 text-center hover:bg-muted/40"
                                            >
                                                <FontAwesomeIcon
                                                    icon={a.icon}
                                                    className="size-5 text-foreground"
                                                />
                                                <span className="whitespace-pre-line text-xs">
                                                    {a.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {savedIchigo.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            {savedIchigo.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between gap-3 rounded-md border border-emerald-500 bg-emerald-50/40 px-4 py-3 dark:bg-emerald-950/20"
                                                >
                                                    <span className="text-sm font-bold">
                                                        {ICHIGO_LABEL[s.key] ??
                                                            s.key}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openIchigo()
                                                        }
                                                        className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                                                    >
                                                        編集
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setArea(selected, {
                                                        type: "none",
                                                        value: "",
                                                        config: null,
                                                    })
                                                }
                                                className="text-xs text-destructive hover:underline"
                                            >
                                                いちごアクションを削除
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-md bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                                            いちごアクションが登録されていません
                                        </div>
                                    )}
                                </>
                            ) : tab === "friend" ? (
                                <>
                                    {friendAction && (
                                        <div className="mb-3 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFriendAction(null);
                                                    setFriendUrl("");
                                                    setArea(selected, {
                                                        type: "none",
                                                        value: "",
                                                    });
                                                }}
                                                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted/50"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrashCan}
                                                    className="size-3.5"
                                                />
                                                アクション設定を削除
                                            </button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-5">
                                        {RICHMENU_FRIEND_ACTIONS.map((a) => {
                                            const sel = friendAction === a.key;
                                            return (
                                                <button
                                                    key={a.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setFriendAction(a.key)
                                                    }
                                                    className={cn(
                                                        "relative flex flex-col items-center gap-2 rounded-md border bg-background px-2 py-4 text-center transition-colors",
                                                        sel
                                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                                                            : "border-border hover:bg-muted/40",
                                                    )}
                                                >
                                                    {sel && (
                                                        <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                                                            <FontAwesomeIcon
                                                                icon={faCheck}
                                                                className="size-2.5"
                                                            />
                                                        </span>
                                                    )}
                                                    <FontAwesomeIcon
                                                        icon={a.icon}
                                                        className={cn(
                                                            "size-5",
                                                            sel
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-foreground",
                                                        )}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "whitespace-pre-line text-xs",
                                                            sel &&
                                                                "font-bold text-emerald-600 dark:text-emerald-400",
                                                        )}
                                                    >
                                                        {a.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {!friendAction ? (
                                        <div className="mt-3 rounded-md bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                                            友だちアクションが登録されていません
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-5">
                                            <div className="rounded-md bg-muted/30 px-4 py-4 text-sm">
                                                <FontAwesomeIcon
                                                    icon={faCircleExclamation}
                                                    className="mr-2 text-destructive"
                                                />
                                                いちごアクションを併用しない場合、このエリアのタップ回数はカウントされません。
                                            </div>

                                            {friendAction === "page" ? (
                                                <>
                                                    <div>
                                                        <p className="text-sm font-bold">
                                                            指定ページのURL
                                                        </p>
                                                        <Input
                                                            value={friendUrl}
                                                            onChange={(e) =>
                                                                setFriendUrl(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="指定ページのURLを入力してください"
                                                            className="mt-2 h-11"
                                                        />
                                                    </div>
                                                    {pageDisplayNote}
                                                </>
                                            ) : friendAction === "form" ? (
                                                <FriendSelectField
                                                    title="回答フォームをひらく"
                                                    placeholder="回答フォームを選択してください"
                                                    options={actionOptions.forms.map(
                                                        (f) => ({
                                                            value: f.url,
                                                            label: f.name,
                                                        }),
                                                    )}
                                                    value={friendUrl}
                                                    onChange={setFriendUrl}
                                                    emptyHint="公開中のフォームがありません。先に「フォーム作成」で公開してください。"
                                                />
                                            ) : friendAction === "shop" ? (
                                                <>
                                                    <div className="inline-flex rounded-md border border-border bg-background p-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShopMode(
                                                                    "single",
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded px-8 py-2 text-sm font-bold transition-colors",
                                                                shopMode ===
                                                                    "single"
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "text-muted-foreground hover:text-foreground",
                                                            )}
                                                        >
                                                            単品商品
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShopMode(
                                                                    "subscription",
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded px-8 py-2 text-sm font-bold transition-colors",
                                                                shopMode ===
                                                                    "subscription"
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "text-muted-foreground hover:text-foreground",
                                                            )}
                                                        >
                                                            継続商品
                                                        </button>
                                                    </div>
                                                    <FriendUrlField
                                                        title="商品販売ページをひらく"
                                                        value={friendUrl}
                                                        onChange={setFriendUrl}
                                                    />
                                                    {pageDisplayNote}
                                                </>
                                            ) : friendAction === "conversion" ? (
                                                <>
                                                    <FriendUrlField
                                                        title="コンバージョン登録ページをひらく"
                                                        value={friendUrl}
                                                        onChange={setFriendUrl}
                                                    />
                                                    {pageDisplayNote}
                                                </>
                                            ) : friendAction === "phone" ? (
                                                <div>
                                                    <p className="text-sm font-bold">
                                                        電話番号を入力
                                                    </p>
                                                    <Input
                                                        value={friendPhone}
                                                        onChange={(e) =>
                                                            setFriendPhone(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="電話番号を入力してください　例）08012345678"
                                                        className="mt-2 h-11"
                                                    />
                                                </div>
                                            ) : friendAction === "text" ? (
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-bold">
                                                            テキストを送らせる
                                                        </p>
                                                        <span className="text-sm text-muted-foreground tabular-nums">
                                                            {friendText.length} /
                                                            900
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        value={friendText}
                                                        onChange={(e) =>
                                                            setFriendText(
                                                                e.target.value.slice(
                                                                    0,
                                                                    900,
                                                                ),
                                                            )
                                                        }
                                                        rows={5}
                                                        placeholder="送信させたいテキストを入力してください"
                                                        className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            ) : friendAction === "mail" ? (
                                                <div>
                                                    <p className="text-sm font-bold">
                                                        メールを送らせる
                                                    </p>
                                                    <Input
                                                        type="email"
                                                        value={friendMail}
                                                        onChange={(e) =>
                                                            setFriendMail(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="送信先のメールアドレスを入力してください"
                                                        className="mt-2 h-11"
                                                    />
                                                </div>
                                            ) : FRIEND_RESV[friendAction] ? (
                                                <>
                                                    <FriendUrlField
                                                        title={
                                                            FRIEND_RESV[
                                                                friendAction
                                                            ].title
                                                        }
                                                        value={friendUrl}
                                                        onChange={setFriendUrl}
                                                    />
                                                    {FRIEND_RESV[friendAction]
                                                        .radio && (
                                                        <div className="flex flex-wrap items-center gap-6">
                                                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                                                                <input
                                                                    type="radio"
                                                                    name="salon-mode"
                                                                    checked={
                                                                        salonMode ===
                                                                        "reserve"
                                                                    }
                                                                    onChange={() =>
                                                                        setSalonMode(
                                                                            "reserve",
                                                                        )
                                                                    }
                                                                    className="size-4 accent-blue-500"
                                                                />
                                                                予約ページ
                                                            </label>
                                                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                                                                <input
                                                                    type="radio"
                                                                    name="salon-mode"
                                                                    checked={
                                                                        salonMode ===
                                                                        "history"
                                                                    }
                                                                    onChange={() =>
                                                                        setSalonMode(
                                                                            "history",
                                                                        )
                                                                    }
                                                                    className="size-4 accent-blue-500"
                                                                />
                                                                予約履歴・キャンセルページ
                                                            </label>
                                                        </div>
                                                    )}
                                                    {pageDisplayNote}
                                                </>
                                            ) : (
                                                <div className="rounded-md bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                                                    この項目は準備中です
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSwitchMode("show")}
                                            className={cn(
                                                "inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 text-sm font-bold transition-colors",
                                                switchMode === "show"
                                                    ? "bg-emerald-500 text-white"
                                                    : "border border-border bg-background text-muted-foreground hover:bg-muted/50",
                                            )}
                                        >
                                            <FontAwesomeIcon
                                                icon={faMobileScreenButton}
                                                className="size-4"
                                            />
                                            表示する
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSwitchMode("stop")}
                                            className={cn(
                                                "inline-flex items-center justify-center gap-2 rounded-md px-8 py-3 text-sm font-bold transition-colors",
                                                switchMode === "stop"
                                                    ? "bg-emerald-500 text-white"
                                                    : "border border-border bg-background text-muted-foreground hover:bg-muted/50",
                                            )}
                                        >
                                            <FontAwesomeIcon
                                                icon={faBan}
                                                className="size-4"
                                            />
                                            停止する
                                        </button>
                                    </div>

                                    {switchMode === "show" && (
                                        <div>
                                            <p className="mb-2 text-sm font-bold">
                                                表示するリッチメニュー（公開済みのみ）
                                            </p>
                                            <div className="relative max-w-md">
                                                <select
                                                    value={switchRichMenuId}
                                                    onChange={(e) =>
                                                        setSwitchRichMenuId(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-11 w-full appearance-none rounded-md border border-input bg-background px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    <option value={0} disabled>
                                                        切り替え先のリッチメニューを選択
                                                    </option>
                                                    {actionOptions.richMenus
                                                        .filter(
                                                            (m) =>
                                                                m.is_published,
                                                        )
                                                        .map((m) => (
                                                            <option
                                                                key={m.id}
                                                                value={m.id}
                                                            >
                                                                {m.name}
                                                            </option>
                                                        ))}
                                                </select>
                                                <FontAwesomeIcon
                                                    icon={faChevronDown}
                                                    className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                                                />
                                            </div>
                                            {actionOptions.richMenus.filter(
                                                (m) => m.is_published,
                                            ).length === 0 && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    公開済みのリッチメニューがありません。先に他のメニューを公開してください。
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ---------------- STEP 4: 詳細設定 ---------------- */
function StepDetails({
    form,
    channels,
    layout,
    imageUrl,
    isEdit,
    isPublished,
}: {
    form: ReturnType<typeof useFormState<FormShape>>;
    channels: LineChannel[];
    layout: RichMenuLayout;
    imageUrl: string | null;
    isEdit: boolean;
    isPublished: boolean;
}) {
    const actionCount = form.data.areas.filter((a) => a.type !== "none").length;
    return (
        <>
            <div className="px-8 py-4 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">STEP④ 詳細設定</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 px-8 py-8">
                <PhonePreview
                    layout={layout}
                    imageUrl={imageUrl}
                    areas={form.data.areas}
                    chatBarText={form.data.chat_bar_text}
                />

                <div className="space-y-8 max-w-xl">
                    {/* メニューバーのテキスト */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-emerald-500" />
                            <Label htmlFor="rm-chatbar" className="text-sm font-bold">
                                メニューバーのテキスト
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground pl-3">
                            メニューバーに表示するテキストを設定します。
                        </p>
                        <div className="relative pl-3">
                            <span className="absolute -top-5 right-0 text-[11px] text-muted-foreground tabular-nums">
                                {form.data.chat_bar_text.length} / {MAX_CHATBAR}
                            </span>
                            <Input
                                id="rm-chatbar"
                                value={form.data.chat_bar_text}
                                onChange={(e) =>
                                    form.setData("chat_bar_text", e.target.value)
                                }
                                maxLength={MAX_CHATBAR}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* トーク画面の初期表示 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-emerald-500" />
                            <Label className="text-sm font-bold">
                                トーク画面の初期表示
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground pl-3">
                            友だちがトーク画面を開いた時のリッチメニュー表示状態を設定します。
                        </p>
                        <div className="flex items-center gap-2 pl-3">
                            {[
                                { value: true, label: "表示する" },
                                { value: false, label: "表示しない" },
                            ].map((opt) => {
                                const active = form.data.selected === opt.value;
                                return (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() =>
                                            form.setData("selected", opt.value)
                                        }
                                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition ${
                                            active
                                                ? "bg-muted font-bold"
                                                : "hover:bg-muted/50"
                                        }`}
                                    >
                                        <span
                                            className={`grid size-4 place-items-center rounded-full border-2 ${
                                                active
                                                    ? "border-blue-600 dark:border-blue-400"
                                                    : "border-muted-foreground/40"
                                            }`}
                                        >
                                            {active && (
                                                <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                            )}
                                        </span>
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 配信する LINE チャネル（公開先） */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-emerald-500" />
                            <Label className="text-sm font-bold">
                                配信する LINE チャネル
                            </Label>
                        </div>
                        {channels.length === 0 ? (
                            <Link
                                href="/settings/channels"
                                className="block pl-3 text-sm text-blue-600 dark:text-blue-400 underline"
                            >
                                先に LINE チャネルを登録してください
                            </Link>
                        ) : (
                            <select
                                value={form.data.line_channel_id}
                                onChange={(e) =>
                                    form.setData(
                                        "line_channel_id",
                                        Number(e.target.value),
                                    )
                                }
                                className="ml-3 h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {channels.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {form.errors.line_channel_id && (
                            <p className="pl-3 text-xs text-destructive">
                                {form.errors.line_channel_id}
                            </p>
                        )}
                        <div className="pl-3 pt-2 text-xs text-muted-foreground">
                            設定済みアクション:{" "}
                            <span className="font-bold text-foreground">
                                {actionCount}
                            </span>{" "}
                            件
                            {isEdit && isPublished && (
                                <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                    現在 LINE に公開中です
                                </span>
                            )}
                            {!isEdit && (
                                <span className="ml-2">
                                    ※ 公開は「下書き保存」後に行えます
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ---------------- 共通パーツ ---------------- */
function SizePreview({
    cols,
    rows,
    label,
}: {
    cols: number;
    rows: number;
    label: string;
}) {
    return (
        <div className="space-y-2">
            <div
                className="grid gap-1 aspect-[5/3]"
                style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
            >
                {Array.from({ length: cols * rows }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-primary/15 grid place-items-center text-[9px] text-primary"
                    >
                        <FontAwesomeIcon icon={faImage} className="size-4 opacity-70" />
                    </div>
                ))}
            </div>
            <div className="text-xs font-bold text-center">{label}</div>
        </div>
    );
}

/** スマホ枠 + リッチメニュー画像 + 番号付きエリアオーバーレイ */
function PhonePreview({
    layout,
    imageUrl,
    areas,
    chatBarText,
}: {
    layout: RichMenuLayout;
    imageUrl: string | null;
    areas: RichMenuAreaAction[];
    chatBarText: string;
}) {
    return (
        <div className="mx-auto w-[260px] rounded-[2.5rem] border-[10px] border-foreground/90 bg-background overflow-hidden shadow-xl">
            <div className="text-center text-[10px] py-1 bg-foreground/90 text-background">
                プレビュー
            </div>
            <div className="aspect-[9/16] bg-sky-200/50 dark:bg-sky-900/30 grid grid-rows-[1fr_auto]">
                <div />
                <div className="bg-background">
                    <div
                        className="relative w-full"
                        style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
                    >
                        {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageUrl}
                                alt="リッチメニュー"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 grid place-items-center bg-muted/70 text-muted-foreground">
                                <div className="flex flex-col items-center gap-1">
                                    <FontAwesomeIcon
                                        icon={faImage}
                                        className="size-6 opacity-50"
                                    />
                                    <span className="text-[10px]">画像未設定</span>
                                </div>
                            </div>
                        )}
                        {layout.areas.map((a, i) => {
                            const action = areas[i];
                            const active = action && action.type !== "none";
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "absolute border flex items-center justify-center",
                                        active
                                            ? "border-primary bg-primary/15"
                                            : "border-white/60 bg-black/5",
                                    )}
                                    style={{
                                        left: `${(a.x / layout.width) * 100}%`,
                                        top: `${(a.y / layout.height) * 100}%`,
                                        width: `${(a.width / layout.width) * 100}%`,
                                        height: `${(a.height / layout.height) * 100}%`,
                                    }}
                                >
                                    <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-foreground/80 text-background grid place-items-center text-[9px] font-bold tabular-nums">
                                        {i + 1}
                                    </span>
                                    {active && (
                                        <FontAwesomeIcon
                                            icon={
                                                action.type === "uri"
                                                    ? faUpRightFromSquare
                                                    : faComment
                                            }
                                            className="size-2.5 text-primary"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-muted/80 px-2 py-2 text-center text-[10px] text-foreground">
                        {chatBarText || "メニュー"}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── データ取得ラッパー（Inertia の server props を API 取得に置換） ──
export default function NewRichMenuPage() {
    const { currentChannelId } = useAuth();

    const { data, error } = useResource(
        currentChannelId ? `rich-menu-form:${currentChannelId}:new` : null,
        async () => {
            const [
                channels,
                folders,
                actionTemplates,
                actionTemplateFolders,
                actionOptions,
            ] = await Promise.all([
                apiFetch<LineChannel[]>("/channels"),
                fetchRichMenuFolderOptions(),
                fetchActionTemplates(),
                fetchActionTemplateFolders(),
                fetchRichMenuActionOptions(),
            ]);
            return {
                channels,
                folders,
                actionTemplates,
                actionTemplateFolders,
                actionOptions,
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
        <RichMenuForm
            richMenu={null}
            layouts={RICH_MENU_LAYOUTS}
            folders={data.folders}
            actionTemplates={data.actionTemplates}
            actionTemplateFolders={data.actionTemplateFolders}
            actionOptions={data.actionOptions}
            defaultFolderId={data.folders[0]?.id ?? null}
            channels={data.channels}
            tags={data.actionOptions.tags}
        />
    );
}
