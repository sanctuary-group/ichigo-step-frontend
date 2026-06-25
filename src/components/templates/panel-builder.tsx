import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faImage,
    faSpinner,
    faXmark,
    faChevronUp,
    faChevronDown,
    faTrash,
    faUpload,
    faCopy,
    faCircle,
    faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/emoji-picker";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/api/uploads";

export type PanelButtonActionType =
    | "message"
    | "url"
    | "tag_attach"
    | "tag_detach"
    | "scenario_start";
export type PanelButton = {
    label: string;
    action_type: PanelButtonActionType;
    url: string;
    tag_id: number | null;
    scenario_id: number | null;
    button_color?: string;
    text_color?: string;
};
export type PanelTapAction = {
    action_type: PanelButtonActionType;
    url: string;
    tag_id: number | null;
    scenario_id: number | null;
};
export type Panel = {
    image_url: string;
    image_preview_url: string;
    title: string;
    body: string;
    title_color?: string;
    title_bold?: boolean;
    body_color?: string;
    body_bold?: boolean;
    buttons: PanelButton[];
    // 画像タイプ専用
    label_enabled?: boolean;
    label_text?: string;
    label_bg?: string;
    label_color?: string;
    title_enabled?: boolean;
    title_bg?: string;
    tap_action?: PanelTapAction;
};

const DEFAULT_BUTTON_COLOR = "#06C755";
const DEFAULT_TEXT_COLOR = "#FFFFFF";

function emptyTapAction(): PanelTapAction {
    return {
        action_type: "message",
        url: "",
        tag_id: null,
        scenario_id: null,
    };
}
export type PanelContent = {
    variant: string;
    panels: Panel[];
    alt_text?: string;
    size?: "large" | "medium" | "small";
    tap_limit?: "once_all" | "once_panel" | "once_choice" | "unlimited";
    over_tap_send?: "send" | "no";
    over_tap_message?: string;
    // クイックリプライ専用
    question_type?: "text" | "image";
    question_text?: string;
    question_image_url?: string;
    quick_buttons?: PanelButton[];
};

export type TagOption = { id: number; name: string; color?: string };
export type ScenarioOption = { id: number; name: string };

function emptyButton(index: number): PanelButton {
    return {
        label: `ボタン${index + 1}`,
        action_type: "message",
        url: "",
        tag_id: null,
        scenario_id: null,
        button_color: DEFAULT_BUTTON_COLOR,
        text_color: DEFAULT_TEXT_COLOR,
    };
}

const MAX_PANELS = 10;
const MAX_TITLE = 40;
const MAX_BODY = 60;

const VARIANTS = [
    { key: "standard", label: "スタンダード" },
    { key: "color_button", label: "カラーボタン" },
    { key: "image", label: "画像" },
    { key: "quick_reply", label: "クイックリプライ" },
] as const;

export function emptyPanel(): Panel {
    return {
        image_url: "",
        image_preview_url: "",
        title: "",
        body: "",
        title_color: "#000000",
        title_bold: false,
        body_color: "#000000",
        body_bold: false,
        buttons: [emptyButton(0)],
        label_enabled: false,
        label_text: "",
        label_bg: "#08BF5A",
        label_color: "#FFFFFF",
        title_enabled: false,
        title_bg: "#5B5B5B",
        tap_action: emptyTapAction(),
    };
}

export function defaultPanelContent(): PanelContent {
    return {
        variant: "standard",
        panels: [emptyPanel()],
        alt_text: "",
        size: "large",
        tap_limit: "unlimited",
        over_tap_send: "send",
        over_tap_message: "",
        question_type: "text",
        question_text: "",
        question_image_url: "",
        quick_buttons: [emptyButton(0)],
    };
}

export function PanelBuilder({
    value,
    onChange,
    tags,
    scenarios,
}: {
    value: PanelContent;
    onChange: (v: PanelContent) => void;
    tags: TagOption[];
    scenarios: ScenarioOption[];
}) {
    const panels = value.panels.length ? value.panels : [emptyPanel()];
    const [selected, setSelected] = useState(0);
    const [tab, setTab] = useState<"panel" | "detail">("panel");

    const idx = Math.min(selected, panels.length - 1);
    const panel = panels[idx];

    const update = (next: Partial<PanelContent>) =>
        onChange({ ...value, panels, ...next });
    const updatePanel = (i: number, next: Partial<Panel>) =>
        update({
            panels: panels.map((p, j) => (j === i ? { ...p, ...next } : p)),
        });

    const addPanel = () => {
        if (panels.length >= MAX_PANELS) return;
        update({ panels: [...panels, emptyPanel()] });
        setSelected(panels.length);
    };
    const removePanel = (i: number) => {
        if (panels.length <= 1) return;
        update({ panels: panels.filter((_, j) => j !== i) });
        setSelected(Math.max(0, i - 1));
    };

    return (
        <div className="space-y-5">
            {/* タイプ選択 */}
            <div className="space-y-2">
                <p className="text-sm font-bold">
                    タイプ選択
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                        （保存後の変更はできません）
                    </span>
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {VARIANTS.map((v) => (
                        <button
                            key={v.key}
                            type="button"
                            onClick={() => update({ variant: v.key })}
                            className={cn(
                                "rounded-lg border-2 p-3 text-left transition-colors",
                                value.variant === v.key
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40",
                            )}
                        >
                            <p
                                className={cn(
                                    "mb-2 text-center text-sm font-bold",
                                    value.variant === v.key && "text-primary",
                                )}
                            >
                                {v.label}
                            </p>
                            <div className="flex h-20 items-center justify-center rounded bg-muted/50 text-muted-foreground">
                                <FontAwesomeIcon
                                    icon={faImage}
                                    className="size-5"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {value.variant === "quick_reply" ? (
                <QuickReplyEditor
                    value={value}
                    onChange={onChange}
                    tags={tags}
                    scenarios={scenarios}
                />
            ) : (
              <>
            {/* パネル設定 / 詳細設定 タブ */}
            <div className="flex items-center gap-6 border-b border-border">
                <button
                    type="button"
                    onClick={() => setTab("panel")}
                    className={cn(
                        "-mb-px pb-2 text-sm font-bold transition-colors",
                        tab === "panel"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    パネル設定
                </button>
                <button
                    type="button"
                    onClick={() => setTab("detail")}
                    className={cn(
                        "-mb-px pb-2 text-sm font-bold transition-colors",
                        tab === "detail"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    詳細設定
                </button>
            </div>

            {tab === "detail" ? (
                <DetailSettings value={value} onChange={onChange} />
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    {/* 左: 編集 */}
                    <div className="space-y-4">
                        {/* パネル追加 + 一覧 */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                                disabled={panels.length >= MAX_PANELS}
                                onClick={addPanel}
                            >
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    className="size-3"
                                />
                                パネル追加
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                ※パネルは最大{MAX_PANELS}枚まで登録できます。
                            </span>
                        </div>

                        {value.variant === "image" && (
                            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className="mt-0.5 size-3 shrink-0"
                                />
                                複数のパネルを設定する際、縦横比は全て同じものを推奨します。異なる縦横比の画像の場合、余白が表示される場合があります。
                            </div>
                        )}

                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {panels.map((p, i) => (
                                <PanelChip
                                    key={i}
                                    index={i}
                                    panel={p}
                                    active={i === idx}
                                    onSelect={() => setSelected(i)}
                                    onRemove={
                                        panels.length > 1
                                            ? () => removePanel(i)
                                            : undefined
                                    }
                                />
                            ))}
                        </div>

                        <hr className="border-border" />

                        {/* パネル編集 */}
                        <h3 className="text-sm font-bold">
                            パネル{idx + 1}編集
                        </h3>

                        {value.variant === "image" ? (
                            <ImagePanelEditor
                                panel={panel}
                                tags={tags}
                                scenarios={scenarios}
                                onChange={(next) => updatePanel(idx, next)}
                            />
                        ) : (
                            <>
                                {/* 画像 */}
                                <div className="space-y-1.5">
                                    <p className="text-sm font-bold">
                                        画像登録
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                            推奨サイズ 1024×678 px
                                        </span>
                                    </p>
                                    <PanelImageUploader
                                        imageUrl={panel.image_url}
                                        onChange={(url) =>
                                            updatePanel(idx, {
                                                image_url: url,
                                                image_preview_url: url,
                                            })
                                        }
                                    />
                                </div>

                                {/* タイトル */}
                                <PanelTextField
                                    label="タイトル"
                                    value={panel.title}
                                    max={MAX_TITLE}
                                    placeholder="タイトル"
                                    styled={value.variant === "color_button"}
                                    color={panel.title_color ?? "#000000"}
                                    bold={panel.title_bold ?? false}
                                    onChange={(v) =>
                                        updatePanel(idx, { title: v })
                                    }
                                    onColor={(c) =>
                                        updatePanel(idx, { title_color: c })
                                    }
                                    onBold={(b) =>
                                        updatePanel(idx, { title_bold: b })
                                    }
                                />

                                {/* 本文 */}
                                <PanelTextField
                                    label="本文"
                                    required
                                    value={panel.body}
                                    max={MAX_BODY}
                                    rows={3}
                                    placeholder="本文"
                                    styled={value.variant === "color_button"}
                                    color={panel.body_color ?? "#000000"}
                                    bold={panel.body_bold ?? false}
                                    onChange={(v) =>
                                        updatePanel(idx, { body: v })
                                    }
                                    onColor={(c) =>
                                        updatePanel(idx, { body_color: c })
                                    }
                                    onBold={(b) =>
                                        updatePanel(idx, { body_bold: b })
                                    }
                                    note="表示端末によっては、文字数制限内でも全文表示されない場合があります。呼び出しテキストが文字数制限を超える場合、末尾がカットされます。"
                                />

                                {/* ボタン編集 */}
                                <ButtonEditor
                                    buttons={panel.buttons}
                                    tags={tags}
                                    scenarios={scenarios}
                                    colored={
                                        value.variant === "color_button"
                                    }
                                    onChange={(buttons) =>
                                        updatePanel(idx, { buttons })
                                    }
                                />
                            </>
                        )}
                    </div>

                    {/* 右: プレビュー */}
                    <div>
                        <PanelPreview
                            panel={panel}
                            variant={value.variant}
                        />
                    </div>
                </div>
            )}
              </>
            )}
        </div>
    );
}

const PANEL_SIZES = [
    { key: "large", label: "大" },
    { key: "medium", label: "中" },
    { key: "small", label: "小" },
] as const;

const TAP_LIMITS = [
    { key: "once_all", label: "全体で1回のみ" },
    { key: "once_panel", label: "各パネルで1回ずつ" },
    { key: "once_choice", label: "各選択肢で1回ずつ" },
    { key: "unlimited", label: "無制限" },
] as const;

function DetailSettings({
    value,
    onChange,
}: {
    value: PanelContent;
    onChange: (v: PanelContent) => void;
}) {
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const variant = value.variant ?? "standard";
    const altText = value.alt_text ?? "";
    const size = value.size ?? "large";
    const tapLimit = value.tap_limit ?? "unlimited";
    const overSend = value.over_tap_send ?? "send";
    const overMsg = value.over_tap_message ?? "";

    const set = (next: Partial<PanelContent>) => onChange({ ...value, ...next });

    const insertLineName = () => {
        const ta = titleRef.current;
        const token = "{{LINE名}}";
        if (ta) {
            const s = ta.selectionStart ?? altText.length;
            const e = ta.selectionEnd ?? altText.length;
            set({
                alt_text: (
                    altText.slice(0, s) +
                    token +
                    altText.slice(e)
                ).slice(0, 400),
            });
        } else {
            set({ alt_text: (altText + token).slice(0, 400) });
        }
    };

    // メッセージタイトル（カラーボタン用・上部に表示）
    const messageTitleCard = (
        <section className="space-y-2 rounded-lg border border-border p-4">
            <p className="text-sm font-bold">メッセージタイトル</p>
            <p className="text-xs text-muted-foreground">
                トーク一覧やプッシュ通知に表示される文言です。
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-blue-600 dark:text-blue-400"
                    onClick={insertLineName}
                >
                    <FontAwesomeIcon icon={faPlus} className="size-3" />
                    LINE名
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-blue-600 dark:text-blue-400"
                    disabled
                >
                    <FontAwesomeIcon icon={faPlus} className="size-3" />
                    友だち情報
                </Button>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {altText.length}/400
                </span>
            </div>
            <Textarea
                ref={titleRef}
                value={altText}
                maxLength={400}
                rows={4}
                onChange={(e) => set({ alt_text: e.target.value })}
                placeholder="メッセージタイトル"
            />
        </section>
    );

    // パネルサイズ（カラーボタン用）
    const panelSizeCard = (
        <section className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-bold">パネルサイズ</p>
            <div className="grid grid-cols-3 gap-3">
                {PANEL_SIZES.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => set({ size: s.key })}
                        className={cn(
                            "rounded-lg border-2 p-3 transition-colors",
                            size === s.key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40",
                        )}
                    >
                        <p
                            className={cn(
                                "mb-2 text-center text-sm font-bold",
                                size === s.key && "text-primary",
                            )}
                        >
                            {s.label}
                        </p>
                        <div
                            className={cn(
                                "mx-auto flex items-center justify-center rounded bg-muted/50 text-muted-foreground",
                                s.key === "large"
                                    ? "h-24"
                                    : s.key === "medium"
                                      ? "h-20"
                                      : "h-16",
                            )}
                        >
                            <FontAwesomeIcon icon={faImage} className="size-4" />
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );

    // 選択肢のタップ回数（共通）
    const tapLimitCard = (
        <section className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-bold">選択肢のタップ回数</p>
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                <FontAwesomeIcon
                    icon={faCircle}
                    className="mt-0.5 size-3 shrink-0"
                />
                タップ時のアクションにいちごアクションが含まれない場合、以下の設定は「無制限」となります。
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TAP_LIMITS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => set({ tap_limit: t.key })}
                        className={cn(
                            "rounded-lg border-2 p-3 text-center text-sm font-bold transition-colors",
                            tapLimit === t.key
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-foreground hover:border-primary/40",
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 上限超過時の送信メッセージ */}
            <div className="space-y-2 pt-2">
                <p className="text-sm font-bold">
                    設定タップ数を超えた時の送信メッセージ
                </p>
                <div className="flex items-center gap-6">
                    <Radio
                        checked={overSend === "send"}
                        onClick={() => set({ over_tap_send: "send" })}
                        label="送信する"
                    />
                    <Radio
                        checked={overSend === "no"}
                        onClick={() => set({ over_tap_send: "no" })}
                        label="送信しない"
                    />
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {overMsg.length}/400
                    </span>
                </div>
                <Textarea
                    value={overMsg}
                    maxLength={400}
                    rows={3}
                    disabled={overSend === "no"}
                    onChange={(e) => set({ over_tap_message: e.target.value })}
                    placeholder="タップ回数上限に達しています"
                />
            </div>

            {/* 上限超過時の稼働アクション（準備中） */}
            <div className="space-y-2 pt-2">
                <p className="text-sm font-bold">
                    設定タップ数を超えた時の稼働アクション
                </p>
                <div className="rounded-md border border-border p-3">
                    <div className="mb-2 flex items-center gap-6 border-b border-border">
                        <span className="-mb-px border-b-2 border-primary pb-2 text-sm font-bold text-primary">
                            いちごアクション
                        </span>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                        disabled
                    >
                        アクション登録・編集
                    </Button>
                    <div className="mt-2 rounded-md bg-muted/50 px-3 py-3 text-center text-sm text-muted-foreground">
                        いちごアクションが登録されていません
                    </div>
                </div>
            </div>
        </section>
    );

    // パソコン版・通知欄の表示テキスト（スタンダード用・下部に表示）
    const notificationTextCard = (
        <section className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                    パソコン版・通知欄の表示テキスト
                </p>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {altText.length}/400
                </span>
            </div>
            <Textarea
                value={altText}
                maxLength={400}
                rows={4}
                onChange={(e) => set({ alt_text: e.target.value })}
                placeholder="メッセージをご確認ください"
            />
            <p className="text-xs text-muted-foreground">
                ※端末により「スマートフォンでのみ確認可能なメッセージです」などの文章が表示される場合があります。
            </p>
        </section>
    );

    const showTopCards = variant === "color_button" || variant === "image";

    return (
        <div className="space-y-6">
            {showTopCards && messageTitleCard}
            {showTopCards && panelSizeCard}
            {tapLimitCard}
            {variant === "standard" && notificationTextCard}
        </div>
    );
}

const MAX_QUESTION = 5000;

function QuickReplyEditor({
    value,
    onChange,
    tags,
    scenarios,
}: {
    value: PanelContent;
    onChange: (v: PanelContent) => void;
    tags: TagOption[];
    scenarios: ScenarioOption[];
}) {
    const qtype = value.question_type ?? "text";
    const qtext = value.question_text ?? "";
    const buttons = value.quick_buttons?.length
        ? value.quick_buttons
        : [emptyButton(0)];
    const textRef = useRef<HTMLTextAreaElement>(null);

    const set = (next: Partial<PanelContent>) => onChange({ ...value, ...next });

    const insertInfo = () => {
        const ta = textRef.current;
        const token = "{{LINE名}}";
        if (ta) {
            const s = ta.selectionStart ?? qtext.length;
            const e = ta.selectionEnd ?? qtext.length;
            set({
                question_text: (
                    qtext.slice(0, s) +
                    token +
                    qtext.slice(e)
                ).slice(0, MAX_QUESTION),
            });
        } else {
            set({ question_text: (qtext + token).slice(0, MAX_QUESTION) });
        }
    };

    return (
        <div className="space-y-5">
            {/* 質問登録 */}
            <div className="space-y-2">
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1 text-sm font-bold">
                        質問登録
                        <span className="text-destructive">*</span>
                    </span>
                    <Radio
                        checked={qtype === "text"}
                        onClick={() => set({ question_type: "text" })}
                        label="テキスト"
                    />
                    <Radio
                        checked={qtype === "image"}
                        onClick={() => set({ question_type: "image" })}
                        label="画像"
                    />
                </div>

                {qtype === "image" ? (
                    <div className="space-y-1.5 rounded-lg border border-border p-4">
                        <p className="text-sm font-bold">
                            画像登録
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                推奨サイズ 1024×678 px
                            </span>
                        </p>
                        <PanelImageUploader
                            imageUrl={value.question_image_url ?? ""}
                            onChange={(url) =>
                                set({ question_image_url: url })
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-blue-600 dark:text-blue-400"
                                onClick={insertInfo}
                            >
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    className="size-3"
                                />
                                登録情報呼び出し
                            </Button>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {qtext.length}/{MAX_QUESTION}
                            </span>
                        </div>
                        <Textarea
                            ref={textRef}
                            value={qtext}
                            maxLength={MAX_QUESTION}
                            rows={6}
                            onChange={(e) =>
                                set({ question_text: e.target.value })
                            }
                            placeholder="質問メッセージを入力"
                        />
                    </div>
                )}
            </div>

            {/* ボタン編集（最大10） */}
            <ButtonEditor
                buttons={buttons}
                tags={tags}
                scenarios={scenarios}
                colored={false}
                max={10}
                note="※ボタンは10個まで登録できます。"
                onChange={(b) => set({ quick_buttons: b })}
            />

            {/* 注意 */}
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                <FontAwesomeIcon
                    icon={faCircle}
                    className="mt-0.5 size-3 shrink-0"
                />
                ボタンがタップされる前に次のメッセージが送信された場合、ボタンが表示されなくなるため、クイックリプライは同時に2通以上送信することはできません。クイックリプライは複数のメッセージを同時に送信する場合、常にメッセージの最後に送信されます。
            </div>
        </div>
    );
}

function ImagePanelEditor({
    panel,
    tags,
    scenarios,
    onChange,
}: {
    panel: Panel;
    tags: TagOption[];
    scenarios: ScenarioOption[];
    onChange: (next: Partial<Panel>) => void;
}) {
    return (
        <div className="space-y-4">
            {/* 画像登録 */}
            <div className="space-y-1.5">
                <p className="text-sm font-bold">
                    画像登録
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                        推奨サイズ 1000×1000 px
                    </span>
                </p>
                <PanelImageUploader
                    imageUrl={panel.image_url}
                    onChange={(url) =>
                        onChange({ image_url: url, image_preview_url: url })
                    }
                />
            </div>

            {/* ラベル */}
            <OverlayField
                label="ラベル"
                enabled={panel.label_enabled ?? false}
                onEnabled={(v) => onChange({ label_enabled: v })}
                bg={panel.label_bg ?? "#08BF5A"}
                onBg={(c) => onChange({ label_bg: c })}
                textColor={panel.label_color ?? "#FFFFFF"}
                onTextColor={(c) => onChange({ label_color: c })}
                text={panel.label_text ?? ""}
                onText={(v) => onChange({ label_text: v })}
                max={10}
                placeholder="ラベルテキストを入力"
            />

            {/* タイトル */}
            <OverlayField
                label="タイトル"
                enabled={panel.title_enabled ?? false}
                onEnabled={(v) => onChange({ title_enabled: v })}
                bg={panel.title_bg ?? "#5B5B5B"}
                onBg={(c) => onChange({ title_bg: c })}
                textColor={panel.title_color ?? "#FFFFFF"}
                onTextColor={(c) => onChange({ title_color: c })}
                text={panel.title}
                onText={(v) => onChange({ title: v })}
                max={40}
                placeholder="タイトルテキストを入力"
            />

            {/* タップ時アクション */}
            <ActionConfig
                value={panel.tap_action ?? emptyTapAction()}
                tags={tags}
                scenarios={scenarios}
                onChange={(next) =>
                    onChange({
                        tap_action: {
                            ...(panel.tap_action ?? emptyTapAction()),
                            ...next,
                        },
                    })
                }
            />
        </div>
    );
}

function OverlayField({
    label,
    enabled,
    onEnabled,
    bg,
    onBg,
    textColor,
    onTextColor,
    text,
    onText,
    max,
    placeholder,
}: {
    label: string;
    enabled: boolean;
    onEnabled: (v: boolean) => void;
    bg: string;
    onBg: (c: string) => void;
    textColor: string;
    onTextColor: (c: string) => void;
    text: string;
    onText: (v: string) => void;
    max: number;
    placeholder: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4">
                <span className="text-sm font-bold">{label}</span>
                <Radio
                    checked={!enabled}
                    onClick={() => onEnabled(false)}
                    label="利用しない"
                />
                <Radio
                    checked={enabled}
                    onClick={() => onEnabled(true)}
                    label="利用する"
                />
            </div>
            {enabled && (
                <>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">背景</span>
                            <ColorField value={bg} onChange={onBg} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">テキスト</span>
                            <ColorField
                                value={textColor}
                                onChange={onTextColor}
                            />
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                            {text.length}/{max}
                        </span>
                    </div>
                    <Input
                        value={text}
                        maxLength={max}
                        onChange={(e) => onText(e.target.value)}
                        placeholder={placeholder}
                    />
                </>
            )}
        </div>
    );
}

function ActionConfig({
    value,
    tags,
    scenarios,
    onChange,
}: {
    value: PanelTapAction;
    tags: TagOption[];
    scenarios: ScenarioOption[];
    onChange: (next: Partial<PanelTapAction>) => void;
}) {
    const [tab, setTab] = useState<"el" | "friend">("friend");
    const [dialogOpen, setDialogOpen] = useState(false);
    const mode: "el_friend" | "url_scheme" =
        value.action_type === "url" ? "url_scheme" : "el_friend";
    const summary = friendActionSummary(value, tags, scenarios);

    return (
        <div className="space-y-2">
            <span className="text-sm font-bold">タップ時アクション</span>
            <div className="space-y-2">
                <Radio
                    checked={mode === "el_friend"}
                    onClick={() =>
                        onChange({
                            action_type: summary ? value.action_type : "message",
                        })
                    }
                    label="いちごアクション・友だちアクションを設定する（併用可）"
                />
                <Radio
                    checked={mode === "url_scheme"}
                    onClick={() => onChange({ action_type: "url" })}
                    label="LINE URLスキームを設定する（他アクションとの併用不可）"
                />
            </div>

            {mode === "url_scheme" ? (
                <Input
                    value={value.url}
                    onChange={(e) => onChange({ url: e.target.value })}
                    placeholder="https://..."
                />
            ) : (
                <>
                    <div className="flex items-center gap-6 border-b border-border">
                        <button
                            type="button"
                            onClick={() => setTab("el")}
                            className={cn(
                                "-mb-px pb-2 text-sm font-bold transition-colors",
                                tab === "el"
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            いちごアクション
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("friend")}
                            className={cn(
                                "-mb-px pb-2 text-sm font-bold transition-colors",
                                tab === "friend"
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            友だちアクション
                        </button>
                    </div>
                    {tab === "el" ? (
                        <div className="space-y-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                                disabled
                            >
                                アクション登録・編集
                            </Button>
                            <div className="rounded-md bg-muted/50 px-3 py-3 text-center text-sm text-muted-foreground">
                                いちごアクションが登録されていません
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => setDialogOpen(true)}
                            >
                                アクション登録・編集
                            </Button>
                            <div
                                className={cn(
                                    "rounded-md px-3 py-3 text-center text-sm",
                                    summary
                                        ? "bg-primary/10 font-bold text-primary"
                                        : "bg-muted/50 text-muted-foreground",
                                )}
                            >
                                {summary ?? "友だちアクションが登録されていません"}
                            </div>
                        </div>
                    )}
                </>
            )}

            {dialogOpen && (
                <FriendActionDialog
                    open
                    button={value}
                    tags={tags}
                    scenarios={scenarios}
                    onClose={() => setDialogOpen(false)}
                    onSave={(next) => {
                        onChange(next);
                        setDialogOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function PanelChip({
    index,
    panel,
    active,
    onSelect,
    onRemove,
}: {
    index: number;
    panel: Panel;
    active: boolean;
    onSelect: () => void;
    onRemove?: () => void;
}) {
    return (
        <div
            className={cn(
                "w-44 shrink-0 overflow-hidden rounded-lg border",
                active ? "border-primary" : "border-border",
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                className={cn(
                    "block w-full py-1.5 text-center text-xs font-bold",
                    active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                )}
            >
                パネル{index + 1}
            </button>
            <button
                type="button"
                onClick={onSelect}
                className="block w-full p-2 text-left"
            >
                <div className="mb-1 flex h-20 items-center justify-center rounded bg-muted/50 text-muted-foreground">
                    {panel.image_url ? (
                        <img
                            src={panel.image_url}
                            alt=""
                            className="h-full w-full rounded object-cover"
                        />
                    ) : (
                        <FontAwesomeIcon icon={faImage} className="size-5" />
                    )}
                </div>
                <p className="truncate text-xs font-bold">
                    {panel.title || "タイトル"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {panel.body || "本文"}
                </p>
            </button>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex w-full items-center justify-center gap-1 border-t border-border py-1 text-xs text-muted-foreground hover:text-destructive"
                >
                    <FontAwesomeIcon icon={faTrash} className="size-3" />
                    削除
                </button>
            )}
        </div>
    );
}

type ActionLike = {
    action_type: PanelButtonActionType;
    url?: string;
    tag_id: number | null;
    scenario_id: number | null;
};

function friendActionSummary(
    b: ActionLike,
    tags: TagOption[],
    scenarios: ScenarioOption[],
): string | null {
    if (b.action_type === "tag_attach" || b.action_type === "tag_detach") {
        const t = tags.find((x) => x.id === b.tag_id);
        const verb = b.action_type === "tag_attach" ? "タグを付与" : "タグを解除";
        return t ? `${verb}：${t.name}` : verb;
    }
    if (b.action_type === "scenario_start") {
        const s = scenarios.find((x) => x.id === b.scenario_id);
        return s ? `シナリオを開始：${s.name}` : "シナリオを開始";
    }
    return null;
}

function ButtonEditor({
    buttons,
    tags,
    scenarios,
    colored,
    max = 4,
    note,
    onChange,
}: {
    buttons: PanelButton[];
    tags: TagOption[];
    scenarios: ScenarioOption[];
    colored: boolean;
    max?: number;
    note?: string;
    onChange: (b: PanelButton[]) => void;
}) {
    const [tabByIndex, setTabByIndex] = useState<Record<number, "el" | "friend">>(
        {},
    );
    const [dialogIndex, setDialogIndex] = useState<number | null>(null);

    const add = () => {
        if (buttons.length >= max) return;
        onChange([...buttons, emptyButton(buttons.length)]);
    };
    const update = (i: number, next: Partial<PanelButton>) =>
        onChange(buttons.map((b, j) => (j === i ? { ...b, ...next } : b)));
    const remove = (i: number) => onChange(buttons.filter((_, j) => j !== i));
    const duplicate = (i: number) => {
        if (buttons.length >= max) return;
        const copy = { ...buttons[i] };
        onChange([
            ...buttons.slice(0, i + 1),
            copy,
            ...buttons.slice(i + 1),
        ]);
    };
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= buttons.length) return;
        const next = [...buttons];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold">ボタン編集</h4>
            {buttons.map((b, i) => {
                const mode: "el_friend" | "url_scheme" =
                    b.action_type === "url" ? "url_scheme" : "el_friend";
                const tab = tabByIndex[i] ?? "friend";
                const summary = friendActionSummary(b, tags, scenarios);

                return (
                    <div
                        key={i}
                        className="overflow-hidden rounded-md border border-border"
                    >
                        {/* ヘッダー */}
                        <div className="flex items-center justify-between bg-muted/60 px-3 py-2">
                            <span className="text-sm font-bold">
                                ボタン{i + 1}
                            </span>
                            <div className="flex items-center gap-1">
                                <IconBtn
                                    icon={faChevronUp}
                                    disabled={i === 0}
                                    onClick={() => move(i, -1)}
                                />
                                <IconBtn
                                    icon={faChevronDown}
                                    disabled={i === buttons.length - 1}
                                    onClick={() => move(i, 1)}
                                />
                                <IconBtn
                                    icon={faCopy}
                                    disabled={buttons.length >= max}
                                    onClick={() => duplicate(i)}
                                />
                                <IconBtn
                                    icon={faTrash}
                                    disabled={buttons.length <= 1}
                                    onClick={() => remove(i)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 p-3">
                            {/* ボタンテキスト */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                                        ボタンテキスト
                                        <span className="text-destructive">
                                            *
                                        </span>
                                        <FontAwesomeIcon
                                            icon={faCircleQuestion}
                                            className="size-3.5 text-muted-foreground"
                                        />
                                    </span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {b.label.length}/20
                                    </span>
                                </div>
                                <Input
                                    value={b.label}
                                    maxLength={20}
                                    onChange={(e) =>
                                        update(i, { label: e.target.value })
                                    }
                                    placeholder="ボタン1"
                                />
                            </div>

                            {/* ボタン色 / テキスト色（カラーボタン） */}
                            {colored && (
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold">
                                            ボタン
                                        </span>
                                        <ColorField
                                            value={
                                                b.button_color ??
                                                "#06C755"
                                            }
                                            onChange={(c) =>
                                                update(i, { button_color: c })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold">
                                            テキスト
                                        </span>
                                        <ColorField
                                            value={
                                                b.text_color ?? "#FFFFFF"
                                            }
                                            onChange={(c) =>
                                                update(i, { text_color: c })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* アクション */}
                            <div className="space-y-2">
                                <span className="text-sm font-bold">
                                    アクション
                                </span>
                                <div className="space-y-2">
                                    <Radio
                                        checked={mode === "el_friend"}
                                        onClick={() =>
                                            update(i, {
                                                action_type:
                                                    summary && b.action_type !== "url"
                                                        ? b.action_type
                                                        : "message",
                                            })
                                        }
                                        label="いちごアクション・友だちアクションを設定する（併用可）"
                                    />
                                    <Radio
                                        checked={mode === "url_scheme"}
                                        onClick={() =>
                                            update(i, { action_type: "url" })
                                        }
                                        label="LINE URLスキームを設定する（他アクションとの併用不可）"
                                    />
                                </div>

                                {mode === "url_scheme" ? (
                                    <Input
                                        value={b.url}
                                        onChange={(e) =>
                                            update(i, { url: e.target.value })
                                        }
                                        placeholder="https://..."
                                    />
                                ) : (
                                    <>
                                        {/* タブ */}
                                        <div className="flex items-center gap-6 border-b border-border">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTabByIndex((p) => ({
                                                        ...p,
                                                        [i]: "el",
                                                    }))
                                                }
                                                className={cn(
                                                    "-mb-px pb-2 text-sm font-bold transition-colors",
                                                    tab === "el"
                                                        ? "border-b-2 border-primary text-primary"
                                                        : "text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                いちごアクション
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTabByIndex((p) => ({
                                                        ...p,
                                                        [i]: "friend",
                                                    }))
                                                }
                                                className={cn(
                                                    "-mb-px pb-2 text-sm font-bold transition-colors",
                                                    tab === "friend"
                                                        ? "border-b-2 border-primary text-primary"
                                                        : "text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                友だちアクション
                                            </button>
                                        </div>

                                        {tab === "el" ? (
                                            <div className="space-y-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                                                    disabled
                                                >
                                                    アクション登録・編集
                                                </Button>
                                                <div className="rounded-md bg-muted/50 px-3 py-3 text-center text-sm text-muted-foreground">
                                                    いちごアクションが登録されていません
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                                                    onClick={() =>
                                                        setDialogIndex(i)
                                                    }
                                                >
                                                    アクション登録・編集
                                                </Button>
                                                <div
                                                    className={cn(
                                                        "rounded-md px-3 py-3 text-center text-sm",
                                                        summary
                                                            ? "bg-primary/10 font-bold text-primary"
                                                            : "bg-muted/50 text-muted-foreground",
                                                    )}
                                                >
                                                    {summary ??
                                                        "友だちアクションが登録されていません"}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    size="sm"
                    className="h-9 bg-blue-500 text-white hover:bg-blue-600"
                    disabled={buttons.length >= max}
                    onClick={add}
                >
                    <FontAwesomeIcon icon={faPlus} className="size-3" />
                    ボタン追加
                </Button>
                {note && (
                    <span className="text-xs text-muted-foreground">{note}</span>
                )}
            </div>
            {!note && (
                <p className="text-xs text-muted-foreground">
                    ※選択肢はパネル1枚の場合は4つ、パネル2枚以上の場合は3つまで登録できます。
                </p>
            )}

            {dialogIndex !== null && (
                <FriendActionDialog
                    open
                    button={buttons[dialogIndex]}
                    tags={tags}
                    scenarios={scenarios}
                    onClose={() => setDialogIndex(null)}
                    onSave={(next) => {
                        update(dialogIndex, next);
                        setDialogIndex(null);
                    }}
                />
            )}
        </div>
    );
}

function FriendActionDialog({
    open,
    button,
    tags,
    scenarios,
    onClose,
    onSave,
}: {
    open: boolean;
    button: ActionLike;
    tags: TagOption[];
    scenarios: ScenarioOption[];
    onClose: () => void;
    onSave: (next: Partial<PanelButton>) => void;
}) {
    const [type, setType] = useState<PanelButtonActionType>(
        button.action_type === "url" ? "message" : button.action_type,
    );
    const [tagId, setTagId] = useState<number | null>(button.tag_id);
    const [scenarioId, setScenarioId] = useState<number | null>(
        button.scenario_id,
    );

    const FRIEND_ACTIONS: { key: PanelButtonActionType; label: string }[] = [
        { key: "message", label: "なし（ボタンテキストを送信）" },
        { key: "tag_attach", label: "タグを付与" },
        { key: "tag_detach", label: "タグを解除" },
        { key: "scenario_start", label: "シナリオを開始" },
    ];

    const canSave =
        type === "message"
            ? true
            : type === "scenario_start"
              ? scenarioId != null
              : tagId != null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle className="text-lg font-bold">
                    友だちアクション
                </DialogTitle>
                <div className="space-y-3 pt-2">
                    {FRIEND_ACTIONS.map((a) => (
                        <Radio
                            key={a.key}
                            checked={type === a.key}
                            onClick={() => setType(a.key)}
                            label={a.label}
                        />
                    ))}

                    {(type === "tag_attach" || type === "tag_detach") && (
                        <select
                            value={tagId ?? ""}
                            onChange={(e) =>
                                setTagId(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">タグを選択</option>
                            {tags.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {type === "scenario_start" && (
                        <select
                            value={scenarioId ?? ""}
                            onChange={(e) =>
                                setScenarioId(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">シナリオを選択</option>
                            {scenarios.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSave}
                        onClick={() =>
                            onSave({
                                action_type: type,
                                tag_id:
                                    type === "tag_attach" ||
                                    type === "tag_detach"
                                        ? tagId
                                        : null,
                                scenario_id:
                                    type === "scenario_start"
                                        ? scenarioId
                                        : null,
                            })
                        }
                    >
                        登録
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
                "flex items-start gap-2 text-left text-sm",
                checked ? "font-bold text-primary" : "text-foreground",
            )}
        >
            <FontAwesomeIcon
                icon={faCircle}
                className={cn(
                    "mt-0.5 size-4 shrink-0",
                    checked ? "text-primary" : "text-muted-foreground/30",
                )}
            />
            {label}
        </button>
    );
}

function PanelTextField({
    label,
    required,
    value,
    max,
    rows = 2,
    placeholder,
    styled,
    color,
    bold,
    note,
    onChange,
    onColor,
    onBold,
}: {
    label: string;
    required?: boolean;
    value: string;
    max: number;
    rows?: number;
    placeholder?: string;
    styled: boolean;
    color: string;
    bold: boolean;
    note?: string;
    onChange: (v: string) => void;
    onColor: (c: string) => void;
    onBold: (b: boolean) => void;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const insertAtCursor = (token: string) => {
        const ta = ref.current;
        if (ta) {
            const s = ta.selectionStart ?? value.length;
            const e = ta.selectionEnd ?? value.length;
            onChange((value.slice(0, s) + token + value.slice(e)).slice(0, max));
        } else {
            onChange((value + token).slice(0, max));
        }
    };

    return (
        <div className="space-y-1.5">
            {/* ラベル行: LINE名 / 絵文字 / (カラーボタン時) 色・太字 */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-bold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-blue-600 dark:text-blue-400"
                    onClick={() => insertAtCursor("{{LINE名}}")}
                >
                    <FontAwesomeIcon icon={faPlus} className="size-3" />
                    LINE名
                </Button>
                <EmojiPicker compact onSelect={(e) => insertAtCursor(e)} />
                {styled && (
                    <>
                        <ColorField value={color} onChange={onColor} />
                        <label className="inline-flex items-center gap-1.5 text-sm">
                            <input
                                type="checkbox"
                                checked={bold}
                                onChange={(e) => onBold(e.target.checked)}
                                className="size-4 rounded border-border accent-primary"
                            />
                            太字にする
                        </label>
                    </>
                )}
            </div>
            <Textarea
                ref={ref}
                value={value}
                maxLength={max}
                rows={rows}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <div className="flex items-center justify-between">
                {note ? (
                    <p className="text-xs text-muted-foreground">{note}</p>
                ) : (
                    <span />
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                    {value.length}/{max}
                </span>
            </div>
        </div>
    );
}

function ColorField({
    value,
    onChange,
}: {
    value: string;
    onChange: (c: string) => void;
}) {
    return (
        <div className="inline-flex items-center gap-1.5">
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-24 font-mono text-xs"
            />
            <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="size-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
                aria-label="色を選択"
            />
        </div>
    );
}

function IconBtn({
    icon,
    disabled,
    onClick,
}: {
    icon: typeof faTrash;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
            <FontAwesomeIcon icon={icon} className="size-3.5" />
        </button>
    );
}

function PanelPreview({
    panel,
    variant,
}: {
    panel: Panel;
    variant: string;
}) {
    if (variant === "image") {
        return (
            <div className="space-y-2">
                <div className="rounded-t-md bg-muted/60 px-3 py-2 text-center text-sm font-bold">
                    プレビュー
                </div>
                <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-xl border border-border bg-muted/50 shadow-sm">
                    <div className="flex aspect-square items-center justify-center text-muted-foreground">
                        {panel.image_url ? (
                            <img
                                src={panel.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <FontAwesomeIcon icon={faImage} className="size-6" />
                        )}
                    </div>
                    {/* ラベル（上） */}
                    {panel.label_enabled && (
                        <div
                            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold"
                            style={{
                                backgroundColor: panel.label_bg || "#08BF5A",
                                color: panel.label_color || "#FFFFFF",
                            }}
                        >
                            {panel.label_text || "ラベル"}
                        </div>
                    )}
                    {/* タイトルバー（下） */}
                    {panel.title_enabled && (
                        <div
                            className="absolute inset-x-0 bottom-0 px-3 py-2 text-center text-sm font-bold"
                            style={{
                                backgroundColor: panel.title_bg || "#5B5B5B",
                                color: panel.title_color || "#FFFFFF",
                            }}
                        >
                            {panel.title || "タイトル"}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="rounded-t-md bg-muted/60 px-3 py-2 text-center text-sm font-bold">
                プレビュー
            </div>
            <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex aspect-[1024/678] items-center justify-center bg-muted/50 text-muted-foreground">
                    {panel.image_url ? (
                        <img
                            src={panel.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <FontAwesomeIcon icon={faImage} className="size-6" />
                    )}
                </div>
                <div className="space-y-1 p-3">
                    <p
                        className="text-sm"
                        style={{
                            color: panel.title_color || undefined,
                            fontWeight: panel.title_bold ? 700 : 600,
                        }}
                    >
                        {panel.title || "タイトル"}
                    </p>
                    <p
                        className="text-xs"
                        style={{
                            color: panel.body_color || "#666666",
                            fontWeight: panel.body_bold ? 700 : 400,
                        }}
                    >
                        {panel.body || "本文"}
                    </p>
                </div>
                <div className="space-y-2 px-3 pb-3">
                    {panel.buttons.map((b, i) => (
                        <div
                            key={i}
                            className="rounded-md py-2 text-center text-xs font-bold"
                            style={{
                                backgroundColor: b.button_color || "#06C755",
                                color: b.text_color || "#FFFFFF",
                            }}
                        >
                            {b.label || `ボタン${i + 1}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PanelImageUploader({
    imageUrl,
    onChange,
}: {
    imageUrl: string;
    onChange: (url: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setUploading(true);
        setError(null);
        try {
            const url = await uploadImage(file);
            onChange(url);
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
        <div className="space-y-2">
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
                        className="max-h-40 max-w-xs rounded-md border border-border"
                    />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full border border-border bg-background/80 hover:bg-background"
                        aria-label="画像を削除"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                    </button>
                </div>
            ) : (
                <Button
                    type="button"
                    className="h-10 bg-blue-500 text-white hover:bg-blue-600"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                >
                    <FontAwesomeIcon
                        icon={uploading ? faSpinner : faUpload}
                        spin={uploading}
                        className="size-3.5"
                    />
                    {uploading ? "アップロード中..." : "アップロード"}
                </Button>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
