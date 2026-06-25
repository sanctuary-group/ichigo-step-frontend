"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrashCan, faBolt } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ActionDialog, ScenarioRef } from "@/components/greetings/greeting-form";
import { saveAutoReply } from "@/lib/api/auto-replies";
import { type BuilderOptions } from "@/lib/api/builder-options";
import { ApiError } from "@/lib/api/client";
import type {
    AutoReply,
    AutoReplyTriggerType,
    AutoReplyMatchMode,
    AutoReplyScheduleType,
    AutoReplyActionMode,
    AutoReplyAudience,
} from "@/types/auto-reply";
import type { GreetingAction } from "@/types/greeting";
import type { ChatStatus, Tag } from "@/types/chat";

export type FolderOption = { id: number; name: string; is_system: boolean };

type DescribeContext = {
    tags: Tag[];
    scenarios: ScenarioRef[];
    richMenus: BuilderOptions["richMenus"];
    templates: BuilderOptions["templates"];
};

/** アクションを「【種別】 内容」形式で要約する（選択中のテンプレ名なども表示）。 */
function describeAction(a: GreetingAction, ctx: DescribeContext): string {
    switch (a.type) {
        case "send_template": {
            const t = ctx.templates.find((x) => x.id === a.template_id);
            return `【テンプレート】 ${t?.name ?? "(未選択)"}`;
        }
        case "send_text": {
            const text = (a.text ?? "").trim();
            const preview = text.slice(0, 20) + (text.length > 20 ? "…" : "");
            return `【テキスト】 ${preview || "(未入力)"}`;
        }
        case "tag_attach":
        case "tag_detach": {
            const ids = a.tag_ids ?? (a.tag_id ? [a.tag_id] : []);
            const names = ids
                .map((id) => ctx.tags.find((t) => t.id === id)?.name ?? "(削除済み)")
                .join("、");
            const verb = a.type === "tag_attach" ? "を付与" : "を解除";
            return `【タグ】 ${names || "(未選択)"}${verb}`;
        }
        case "scenario_start": {
            if ((a.scenario_mode ?? "start") === "stop") {
                return "【ステップ配信】 停止";
            }
            const s = ctx.scenarios.find((x) => x.id === a.scenario_id);
            return `【ステップ配信】 ${s?.name ?? "(未選択)"}`;
        }
        case "link_rich_menu": {
            const r = ctx.richMenus.find((x) => x.id === a.rich_menu_id);
            return `【リッチメニュー】 ${r?.name ?? "(未選択)"}`;
        }
        case "reminder":
            return `【リマインド】 ${(a.reminder_op ?? "start") === "stop" ? "停止" : "開始"}`;
        case "bookmark":
            return `【ブックマーク】 ${a.bookmark_op === "remove" ? "解除" : "登録"}`;
        case "friend_field":
            return "【友だち情報】";
        case "chat_status":
            return "【対応ステータス】";
        case "block":
            return "【ブロック】";
        default:
            return a.type;
    }
}

type FormShape = {
    auto_reply_folder_id: number;
    trigger_type: AutoReplyTriggerType;
    match_mode: AutoReplyMatchMode;
    keywords: string[];
    exclude_bracket: boolean;
    audience: AutoReplyAudience;
    schedule_type: AutoReplyScheduleType;
    schedule_start: string;
    schedule_end: string;
    action_mode: AutoReplyActionMode;
    actions: GreetingAction[];
    is_active: boolean;
};

function toLocalInput(iso: string | null): string {
    if (!iso) return "";
    // 'YYYY-MM-DD HH:mm:ss' or ISO → 'YYYY-MM-DDTHH:mm'
    return iso.replace(" ", "T").slice(0, 16);
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

export function AutoReplyFormInner({
    autoReply,
    editId,
    folders,
    defaultFolderId,
    options,
    tags: sharedTags,
    chatStatuses,
}: {
    autoReply: AutoReply | null;
    editId?: string;
    folders: FolderOption[];
    defaultFolderId: number | null;
    options: BuilderOptions;
    tags: Tag[];
    chatStatuses: ChatStatus[];
}) {
    const router = useRouter();
    const [actionDialogOpen, setActionDialogOpen] = useState(false);

    const form = useFormState<FormShape>({
        auto_reply_folder_id:
            autoReply?.auto_reply_folder_id ?? defaultFolderId ?? folders[0]?.id ?? 0,
        trigger_type: autoReply?.trigger_type ?? "keyword",
        match_mode: autoReply?.match_mode ?? "partial",
        keywords: autoReply?.keywords?.length ? autoReply.keywords : [""],
        exclude_bracket: autoReply?.exclude_bracket ?? false,
        audience: autoReply?.audience ?? "active",
        schedule_type: autoReply?.schedule_type ?? "always",
        schedule_start: toLocalInput(autoReply?.schedule_start ?? null),
        schedule_end: toLocalInput(autoReply?.schedule_end ?? null),
        action_mode: autoReply?.action_mode ?? "repeat",
        actions: (autoReply?.actions as GreetingAction[] | undefined) ?? [],
        is_active: autoReply?.is_active ?? true,
    });

    const setKeyword = (i: number, value: string) => {
        form.setData(
            "keywords",
            form.data.keywords.map((k, idx) => (idx === i ? value : k)),
        );
    };
    const addKeyword = () => form.setData("keywords", [...form.data.keywords, ""]);
    const removeKeyword = (i: number) =>
        form.setData(
            "keywords",
            form.data.keywords.filter((_, idx) => idx !== i),
        );

    const submit = async () => {
        form.setProcessing(true);
        form.setErrors({});
        try {
            await saveAutoReply(
                {
                    ...form.data,
                    keywords:
                        form.data.trigger_type === "keyword"
                            ? form.data.keywords.filter((k) => k.trim())
                            : null,
                    schedule_start:
                        form.data.schedule_type === "custom"
                            ? form.data.schedule_start || null
                            : null,
                    schedule_end:
                        form.data.schedule_type === "custom"
                            ? form.data.schedule_end || null
                            : null,
                },
                editId,
            );
            router.push("/auto-replies");
        } catch (e) {
            if (e instanceof ApiError) form.setErrors(e.fieldErrors());
        } finally {
            form.setProcessing(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <h1 className="text-lg font-bold tracking-tight">自動応答</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
                    {/* アクション稼働対象絞り込み */}
                    <Section title="アクション稼働対象絞り込み">
                        <RadioGroup
                            value={form.data.audience}
                            onValueChange={(v) =>
                                v && form.setData("audience", v as AutoReplyAudience)
                            }
                            className="flex items-center gap-6"
                        >
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <RadioGroupItem value="active" />
                                有効友だち
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <RadioGroupItem value="blocked" />
                                ブロックした友だち
                            </label>
                        </RadioGroup>
                        <p className="mt-3 text-xs text-muted-foreground">
                            ※ 自動応答は相手からのメッセージ受信時に送信されるため、実際に届くのは有効友だちのみです。
                        </p>
                    </Section>

                    {/* フォルダ */}
                    <Section title="フォルダ">
                        <select
                            value={form.data.auto_reply_folder_id}
                            onChange={(e) =>
                                form.setData(
                                    "auto_reply_folder_id",
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
                    </Section>

                    {/* キーワード設定 */}
                    <Section title="キーワード設定">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                            <Label className="text-sm bg-muted px-3 py-2 rounded-md">
                                利用設定
                            </Label>
                            <select
                                value={form.data.trigger_type}
                                onChange={(e) =>
                                    form.setData(
                                        "trigger_type",
                                        e.target.value as AutoReplyTriggerType,
                                    )
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="all">全てのメッセージに反応</option>
                                <option value="keyword">特定キーワードに反応</option>
                                <option value="follow">友だち追加時のみ反応</option>
                            </select>
                        </div>

                        {form.data.trigger_type === "keyword" && (
                            <div className="mt-4 space-y-3 rounded-md border border-border p-4">
                                <RadioGroup
                                    value={form.data.match_mode}
                                    onValueChange={(v) =>
                                        v &&
                                        form.setData(
                                            "match_mode",
                                            v as AutoReplyMatchMode,
                                        )
                                    }
                                    className="flex items-center gap-6"
                                >
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <RadioGroupItem value="partial" />
                                        部分一致
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <RadioGroupItem value="exact" />
                                        完全一致
                                    </label>
                                </RadioGroup>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">
                                        反応するキーワード
                                    </Label>
                                    {form.data.keywords.map((kw, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input
                                                value={kw}
                                                onChange={(e) =>
                                                    setKeyword(i, e.target.value)
                                                }
                                                placeholder="例: 営業時間"
                                                className="h-9"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeKeyword(i)}
                                                disabled={form.data.keywords.length === 1}
                                                className="size-8 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-30"
                                                aria-label="削除"
                                            >
                                                <FontAwesomeIcon icon={faTrashCan} className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addKeyword}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="size-2.5" />
                                        キーワードを追加
                                    </button>
                                </div>
                            </div>
                        )}

                        {form.data.trigger_type !== "follow" && (
                            <label className="mt-3 inline-flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.exclude_bracket}
                                    onChange={(e) =>
                                        form.setData("exclude_bracket", e.target.checked)
                                    }
                                    className="size-4 rounded border-border accent-primary"
                                />
                                【〇〇】のメッセージには反応させない
                            </label>
                        )}
                    </Section>

                    {/* スケジュール設定 */}
                    <Section title="スケジュール設定">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                            <Label className="text-sm bg-muted px-3 py-2 rounded-md">
                                反応設定
                            </Label>
                            <select
                                value={form.data.schedule_type}
                                onChange={(e) =>
                                    form.setData(
                                        "schedule_type",
                                        e.target.value as AutoReplyScheduleType,
                                    )
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="always">常に（24時間/365日）反応する</option>
                                <option value="business">営業時間内のみ反応する</option>
                                <option value="custom">期間指定で反応する</option>
                            </select>
                        </div>
                        {form.data.schedule_type === "custom" && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">開始</Label>
                                    <Input
                                        type="datetime-local"
                                        value={form.data.schedule_start}
                                        onChange={(e) =>
                                            form.setData("schedule_start", e.target.value)
                                        }
                                        className="h-9"
                                    />
                                    {form.errors.schedule_start && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.schedule_start}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">終了</Label>
                                    <Input
                                        type="datetime-local"
                                        value={form.data.schedule_end}
                                        onChange={(e) =>
                                            form.setData("schedule_end", e.target.value)
                                        }
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        )}
                        {form.data.schedule_type === "business" && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                ※ 営業時間設定は今後対応予定です。現在は常時反応として扱われます。
                            </p>
                        )}
                    </Section>

                    {/* アクション設定 */}
                    <Section title="アクション設定">
                        <RadioGroup
                            value={form.data.action_mode}
                            onValueChange={(v) =>
                                v && form.setData("action_mode", v as AutoReplyActionMode)
                            }
                            className="flex items-center gap-6 flex-wrap"
                        >
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <RadioGroupItem value="once" />
                                1度のみアクション稼働
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <RadioGroupItem value="repeat" />
                                何度でもアクション稼働
                            </label>
                        </RadioGroup>

                        <div className="mt-4">
                            <Button
                                type="button"
                                onClick={() => setActionDialogOpen(true)}
                                className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold h-10 px-6"
                            >
                                <FontAwesomeIcon icon={faBolt} className="size-3.5" />
                                設定する
                            </Button>

                            {form.data.actions.length === 0 ? (
                                <div className="mt-3 rounded-md bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground">
                                    いちごアクションは登録されていません
                                </div>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {form.data.actions.map((a, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
                                        >
                                            <span className="inline-flex items-center gap-2 text-sm min-w-0">
                                                <FontAwesomeIcon
                                                    icon={faBolt}
                                                    className="size-3.5 text-amber-500 shrink-0"
                                                />
                                                <span className="truncate">
                                                    {describeAction(a, {
                                                        tags: sharedTags,
                                                        scenarios:
                                                            options.scenarios,
                                                        richMenus:
                                                            options.richMenus,
                                                        templates:
                                                            options.templates,
                                                    })}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData(
                                                        "actions",
                                                        form.data.actions.filter(
                                                            (_, idx) => idx !== i,
                                                        ),
                                                    )
                                                }
                                                className="size-8 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-destructive shrink-0"
                                                aria-label="削除"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrashCan}
                                                    className="size-3.5"
                                                />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {form.errors.actions && (
                                <p className="mt-1 text-xs text-destructive">
                                    {form.errors.actions}
                                </p>
                            )}
                        </div>
                    </Section>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/auto-replies")}
                        className="h-11 px-12"
                    >
                        戻る
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={form.processing}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-12 font-bold disabled:opacity-50"
                    >
                        {form.processing ? "保存中..." : "登録"}
                    </Button>
                </div>
            </div>

            <ActionDialog
                open={actionDialogOpen}
                onClose={() => setActionDialogOpen(false)}
                tags={sharedTags}
                scenarios={options.scenarios}
                richMenus={options.richMenus}
                templates={options.templates}
                templateFolders={options.templateFolders}
                reminders={options.reminders}
                friendFields={options.friendFields}
                friendFieldFolders={options.friendFieldFolders}
                chatStatuses={chatStatuses}
                presetType={null}
                currentActions={form.data.actions}
                onSave={(next) => {
                    form.setData("actions", next);
                    setActionDialogOpen(false);
                }}
            />
        </>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3 border-l-[3px] border-primary pl-2">
                <h2 className="text-sm font-bold">{title}</h2>
            </div>
            <div>{children}</div>
        </div>
    );
}
