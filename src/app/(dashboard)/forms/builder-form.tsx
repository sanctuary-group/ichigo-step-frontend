"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faPlus,
    faTrashCan,
    faArrowUp,
    faArrowDown,
    faGripVertical,
    faCopy,
    faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { saveForm, setFormPublished } from "@/lib/api/forms";
import type {
    FormModel,
    FormFolder,
    FormFieldData,
    FormFieldType,
    FormType,
    FriendFieldOption,
    ScenarioOption,
} from "@/types/form";

const MAX_NAME = 100;

const FIELD_TYPES: { value: FormFieldType; label: string; choice: boolean }[] = [
    { value: "text", label: "短文（1行）", choice: false },
    { value: "textarea", label: "長文（複数行）", choice: false },
    { value: "radio", label: "単一選択（ラジオ）", choice: true },
    { value: "checkbox", label: "複数選択（チェック）", choice: true },
    { value: "select", label: "プルダウン", choice: true },
    { value: "email", label: "メールアドレス", choice: false },
    { value: "number", label: "数値", choice: false },
    { value: "date", label: "日付", choice: false },
];

const TYPE_OPTIONS: { value: FormType; label: string }[] = [
    { value: "standard", label: "標準" },
    { value: "survey", label: "アンケート" },
    { value: "reservation", label: "予約" },
];

function isChoice(type: FormFieldType): boolean {
    return type === "radio" || type === "checkbox" || type === "select";
}

export type FolderOption = Pick<FormFolder, "id" | "name" | "is_system">;

export type BuilderFormModel = FormModel & { public_url?: string };

export type PageProps = {
    form: BuilderFormModel | null;
    folders: FolderOption[];
    friendFields: FriendFieldOption[];
    scenarios: ScenarioOption[];
    defaultName?: string;
    defaultFolderId: number | null;
};

type FormShape = {
    name: string;
    title: string;
    description: string;
    form_folder_id: number;
    line_channel_id: number | null;
    form_type: FormType;
    submit_message: string;
    fields: FormFieldData[];
    action_tag_ids: number[];
    action_scenario_id: number | null;
    send_thanks_message: boolean;
};

export type SharedChannel = { id: number; name: string };
export type SharedTag = { id: number; name: string; color: string };

/** model.actions（[{key,config}]）から指定キーの config を取り出す */
function findActionConfig(
    actions: FormModel["actions"],
    key: string,
): Record<string, unknown> | null {
    const hit = (actions ?? []).find((a) => a.key === key);
    return hit ? hit.config : null;
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

export function FormEditor({
    form: model,
    folders,
    friendFields,
    scenarios,
    defaultName,
    defaultFolderId,
    channels,
    tags,
}: PageProps & { channels: SharedChannel[]; tags: SharedTag[] }) {
    const router = useRouter();
    const isEdit = !!model;
    const isPublished = model?.status === "published";

    const tagConfig = findActionConfig(model?.actions, "tag");
    const stepConfig = findActionConfig(model?.actions, "step");

    const form = useFormState<FormShape>({
        name: model?.name ?? defaultName ?? "",
        title: model?.title ?? defaultName ?? "",
        description: model?.description ?? "",
        form_folder_id:
            model?.form_folder_id ?? defaultFolderId ?? folders[0]?.id ?? 0,
        line_channel_id: model?.line_channel_id ?? channels[0]?.id ?? null,
        form_type: model?.form_type ?? "standard",
        submit_message:
            model?.submit_message ?? "ご回答ありがとうございました。",
        fields: (model?.fields ?? []).map((f) => ({
            label: f.label,
            type: f.type,
            options: f.options ?? [],
            required: f.required,
            friend_field_id: f.friend_field_id ?? null,
        })),
        action_tag_ids: ((tagConfig?.tagIds as number[]) ?? []).map(Number),
        action_scenario_id: stepConfig
            ? Number(stepConfig.scenarioId) || null
            : null,
        send_thanks_message: model?.send_thanks_message ?? false,
    });

    const [copied, setCopied] = useState(false);

    const addField = () => {
        form.setData("fields", [
            ...form.data.fields,
            {
                label: "",
                type: "text",
                options: [],
                required: false,
                friend_field_id: null,
            },
        ]);
    };

    const updateField = (i: number, patch: Partial<FormFieldData>) => {
        form.setData(
            "fields",
            form.data.fields.map((f, idx) => {
                if (idx !== i) return f;
                const next = { ...f, ...patch };
                // 選択肢タイプに変わったら初期オプションを用意
                if (patch.type && isChoice(patch.type) && next.options.length === 0) {
                    next.options = ["選択肢1", "選択肢2"];
                }
                return next;
            }),
        );
    };

    const removeField = (i: number) => {
        form.setData(
            "fields",
            form.data.fields.filter((_, idx) => idx !== i),
        );
    };

    const moveField = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= form.data.fields.length) return;
        const next = [...form.data.fields];
        [next[i], next[j]] = [next[j], next[i]];
        form.setData("fields", next);
    };

    const setOption = (fi: number, oi: number, value: string) => {
        const next = [...form.data.fields];
        const opts = [...next[fi].options];
        opts[oi] = value;
        next[fi] = { ...next[fi], options: opts };
        form.setData("fields", next);
    };

    const addOption = (fi: number) => {
        const next = [...form.data.fields];
        next[fi] = {
            ...next[fi],
            options: [...next[fi].options, `選択肢${next[fi].options.length + 1}`],
        };
        form.setData("fields", next);
    };

    const removeOption = (fi: number, oi: number) => {
        const next = [...form.data.fields];
        next[fi] = {
            ...next[fi],
            options: next[fi].options.filter((_, idx) => idx !== oi),
        };
        form.setData("fields", next);
    };

    const save = async (then?: () => void) => {
        form.setProcessing(true);
        form.setErrors({});
        try {
            await saveForm(form.data, isEdit ? String(model!.id) : undefined);
            if (isEdit) {
                then?.();
            } else {
                router.push("/forms");
            }
        } catch (e) {
            if (e instanceof ApiError) form.setErrors(e.fieldErrors());
        } finally {
            form.setProcessing(false);
        }
    };

    const publish = () => {
        if (!isEdit) return;
        save(async () => {
            await setFormPublished(String(model!.id), true);
            router.push("/forms");
        });
    };

    const unpublish = async () => {
        if (!isEdit) return;
        await setFormPublished(String(model!.id), false);
        router.push("/forms");
    };

    const copyUrl = async () => {
        if (!model?.public_url) return;
        try {
            await navigator.clipboard.writeText(model.public_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* noop */
        }
    };

    return (
        <>
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
                {/* ヘッダー */}
                <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 bg-background border-b border-border">
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                        <Link
                            href="/forms"
                            className="hover:text-foreground hover:underline"
                        >
                            フォーム作成
                        </Link>
                        <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
                        <span>{isEdit ? "編集" : "新規作成"}</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_180px] gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-end justify-between">
                                <Label htmlFor="fm-name" className="text-xs font-bold">
                                    管理名
                                </Label>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {form.data.name.length} / {MAX_NAME}
                                </span>
                            </div>
                            <Input
                                id="fm-name"
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
                                value={form.data.form_folder_id}
                                onChange={(e) =>
                                    form.setData(
                                        "form_folder_id",
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
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">タイプ</Label>
                            <select
                                value={form.data.form_type}
                                onChange={(e) =>
                                    form.setData(
                                        "form_type",
                                        e.target.value as FormType,
                                    )
                                }
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {TYPE_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* 左: 設定 + 質問ビルダー */}
                    <div className="space-y-6">
                        <section className="bg-background rounded-lg border border-border overflow-hidden">
                            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                                <h2 className="text-sm font-bold">フォームの基本情報</h2>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">
                                        フォームタイトル（回答ページに表示）
                                    </Label>
                                    <Input
                                        value={form.data.title}
                                        onChange={(e) =>
                                            form.setData("title", e.target.value)
                                        }
                                        maxLength={150}
                                        className="h-10"
                                    />
                                    {form.errors.title && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.title}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">説明文</Label>
                                    <Textarea
                                        value={form.data.description}
                                        onChange={(e) =>
                                            form.setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        placeholder="フォームの説明（任意）"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">
                                        対象 LINE 公式アカウント
                                    </Label>
                                    <select
                                        value={form.data.line_channel_id ?? ""}
                                        onChange={(e) =>
                                            form.setData(
                                                "line_channel_id",
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            )
                                        }
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="">
                                            指定しない（回答者を識別しない）
                                        </option>
                                        {channels.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-muted-foreground">
                                        LINE
                                        アプリ内でフォームを開いた友だちを、この公式アカウントの友だちとして識別します（LIFF
                                        設定が必要）。
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-background rounded-lg border border-border overflow-hidden">
                            <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                                <h2 className="text-sm font-bold">質問項目</h2>
                                <span className="text-xs text-muted-foreground">
                                    {form.data.fields.length} 問
                                </span>
                            </div>
                            <div className="p-5 space-y-4">
                                {form.data.fields.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        質問がありません。「質問を追加」から作成してください。
                                    </p>
                                )}
                                {form.data.fields.map((field, i) => (
                                    <div
                                        key={i}
                                        className="rounded-md border border-border p-4 space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon
                                                icon={faGripVertical}
                                                className="size-3.5 text-muted-foreground/50"
                                            />
                                            <span className="text-xs font-bold text-muted-foreground">
                                                Q{i + 1}
                                            </span>
                                            <div className="ml-auto flex items-center gap-1">
                                                <button
                                                    onClick={() => moveField(i, -1)}
                                                    disabled={i === 0}
                                                    className="size-7 grid place-items-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                                                    aria-label="上へ"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faArrowUp}
                                                        className="size-3"
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => moveField(i, 1)}
                                                    disabled={
                                                        i ===
                                                        form.data.fields.length - 1
                                                    }
                                                    className="size-7 grid place-items-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                                                    aria-label="下へ"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faArrowDown}
                                                        className="size-3"
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => removeField(i)}
                                                    className="size-7 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                                                    aria-label="削除"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrashCan}
                                                        className="size-3"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                                            <Input
                                                value={field.label}
                                                onChange={(e) =>
                                                    updateField(i, {
                                                        label: e.target.value,
                                                    })
                                                }
                                                placeholder="質問文を入力"
                                                className="h-9"
                                            />
                                            <select
                                                value={field.type}
                                                onChange={(e) =>
                                                    updateField(i, {
                                                        type: e.target
                                                            .value as FormFieldType,
                                                    })
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {FIELD_TYPES.map((t) => (
                                                    <option
                                                        key={t.value}
                                                        value={t.value}
                                                    >
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {(form.errors as Record<string, string>)[
                                            `fields.${i}.label`
                                        ] && (
                                            <p className="text-xs text-destructive">
                                                質問文を入力してください
                                            </p>
                                        )}

                                        {isChoice(field.type) && (
                                            <div className="space-y-2 pl-4 border-l-2 border-border">
                                                {field.options.map((opt, oi) => (
                                                    <div
                                                        key={oi}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Input
                                                            value={opt}
                                                            onChange={(e) =>
                                                                setOption(
                                                                    i,
                                                                    oi,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="h-8 text-sm"
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                removeOption(i, oi)
                                                            }
                                                            className="size-7 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-destructive shrink-0"
                                                            aria-label="選択肢を削除"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrashCan}
                                                                className="size-3"
                                                            />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addOption(i)}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faPlus}
                                                        className="size-2.5"
                                                    />
                                                    選択肢を追加
                                                </button>
                                            </div>
                                        )}

                                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                            <Switch
                                                checked={field.required}
                                                onCheckedChange={(v) =>
                                                    updateField(i, { required: v })
                                                }
                                            />
                                            必須回答
                                        </label>

                                        <div className="space-y-1 border-t border-border pt-3">
                                            <label className="block text-xs text-muted-foreground">
                                                回答を友だち情報に保存
                                            </label>
                                            <select
                                                value={field.friend_field_id ?? ""}
                                                onChange={(e) =>
                                                    updateField(i, {
                                                        friend_field_id:
                                                            e.target.value === ""
                                                                ? null
                                                                : Number(
                                                                      e.target.value,
                                                                  ),
                                                    })
                                                }
                                                className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                                            >
                                                <option value="">
                                                    保存しない
                                                </option>
                                                {friendFields.map((ff) => (
                                                    <option
                                                        key={ff.id}
                                                        value={ff.id}
                                                    >
                                                        {ff.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {friendFields.length === 0 && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    友だち情報項目が未作成です。「データ管理 →
                                                    友だち情報管理」で作成できます。
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    onClick={addField}
                                    className="w-full h-10 border-dashed"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                                    質問を追加
                                </Button>
                            </div>
                        </section>

                        <section className="bg-background rounded-lg border border-border overflow-hidden">
                            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                                <h2 className="text-sm font-bold">送信完了メッセージ</h2>
                            </div>
                            <div className="p-5">
                                <Textarea
                                    value={form.data.submit_message}
                                    onChange={(e) =>
                                        form.setData(
                                            "submit_message",
                                            e.target.value,
                                        )
                                    }
                                    rows={2}
                                    maxLength={500}
                                    placeholder="回答送信後に表示するメッセージ"
                                />
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none mt-3">
                                    <Switch
                                        checked={form.data.send_thanks_message}
                                        onCheckedChange={(v) =>
                                            form.setData(
                                                "send_thanks_message",
                                                v,
                                            )
                                        }
                                    />
                                    このメッセージを回答者のLINEトークにも送信する
                                </label>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    ※ LINEで友だち登録済みの回答者にのみ届きます
                                </p>
                            </div>
                        </section>

                        <section className="bg-background rounded-lg border border-border overflow-hidden">
                            <div className="px-5 py-3 bg-muted/40 border-b border-border">
                                <h2 className="text-sm font-bold">
                                    回答後のアクション
                                </h2>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    友だち登録済みの回答者に対して実行されます
                                </p>
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="space-y-2">
                                    <span className="block text-sm font-medium">
                                        タグを付与
                                    </span>
                                    {tags.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground">
                                            タグが未作成です。「タグ管理」で作成できます。
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((t) => {
                                                const on =
                                                    form.data.action_tag_ids.includes(
                                                        t.id,
                                                    );
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() =>
                                                            form.setData(
                                                                "action_tag_ids",
                                                                on
                                                                    ? form.data.action_tag_ids.filter(
                                                                          (id) =>
                                                                              id !==
                                                                              t.id,
                                                                      )
                                                                    : [
                                                                          ...form
                                                                              .data
                                                                              .action_tag_ids,
                                                                          t.id,
                                                                      ],
                                                            )
                                                        }
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-full text-xs border transition-colors",
                                                            on
                                                                ? "border-transparent text-white"
                                                                : "border-border text-muted-foreground hover:bg-muted/50",
                                                        )}
                                                        style={
                                                            on
                                                                ? {
                                                                      backgroundColor:
                                                                          t.color,
                                                                  }
                                                                : undefined
                                                        }
                                                    >
                                                        {t.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="block text-sm font-medium">
                                        ステップ配信を開始
                                    </span>
                                    <select
                                        value={form.data.action_scenario_id ?? ""}
                                        onChange={(e) =>
                                            form.setData(
                                                "action_scenario_id",
                                                e.target.value === ""
                                                    ? null
                                                    : Number(e.target.value),
                                            )
                                        }
                                        className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                                    >
                                        <option value="">開始しない</option>
                                        {scenarios.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                    {scenarios.length === 0 && (
                                        <p className="text-[11px] text-muted-foreground">
                                            シナリオが未作成です。「ステップ配信」で作成できます。
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* 右: プレビュー */}
                    <div className="lg:sticky lg:top-0 self-start space-y-4">
                        <div className="bg-background rounded-lg border border-border overflow-hidden">
                            <div className="px-4 py-2 bg-muted/40 border-b border-border text-xs font-bold text-muted-foreground text-center">
                                回答ページ プレビュー
                            </div>
                            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                <h3 className="text-lg font-bold">
                                    {form.data.title || "（タイトル未設定）"}
                                </h3>
                                {form.data.description && (
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {form.data.description}
                                    </p>
                                )}
                                {form.data.fields.map((field, i) => (
                                    <FieldPreview key={i} field={field} />
                                ))}
                                {form.data.fields.length > 0 && (
                                    <Button
                                        disabled
                                        className="w-full bg-primary text-primary-foreground"
                                    >
                                        送信する
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isEdit && isPublished && model!.public_url && (
                            <div className="bg-background rounded-lg border border-border p-4 space-y-2">
                                <div className="text-xs font-bold">配信用URL</div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 truncate">
                                        {model!.public_url}
                                    </code>
                                    <button
                                        onClick={copyUrl}
                                        className="shrink-0 size-8 grid place-items-center rounded hover:bg-muted text-muted-foreground"
                                        aria-label="コピー"
                                    >
                                        <FontAwesomeIcon icon={faCopy} className="size-3.5" />
                                    </button>
                                    <a
                                        href={model!.public_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 size-8 grid place-items-center rounded hover:bg-muted text-muted-foreground"
                                        aria-label="開く"
                                    >
                                        <FontAwesomeIcon
                                            icon={faUpRightFromSquare}
                                            className="size-3.5"
                                        />
                                    </a>
                                </div>
                                {copied && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        コピーしました
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* フッター */}
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border gap-3">
                    <div className="text-sm text-muted-foreground">
                        {isEdit
                            ? isPublished
                                ? "公開中：URL を友だちに配布できます"
                                : "下書き状態です。公開すると回答URLが有効になります"
                            : "まず下書き保存してください"}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => save()}
                            disabled={form.processing}
                            className="h-10 px-6"
                        >
                            {form.processing ? "保存中..." : "下書き保存"}
                        </Button>
                        {isEdit && isPublished ? (
                            <Button
                                variant="outline"
                                onClick={unpublish}
                                className="h-10 px-6 text-destructive hover:text-destructive"
                            >
                                非公開にする
                            </Button>
                        ) : (
                            <Button
                                onClick={publish}
                                disabled={
                                    !isEdit ||
                                    form.processing ||
                                    form.data.fields.length === 0
                                }
                                className="h-10 px-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                公開する
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function FieldPreview({ field }: { field: FormFieldData }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
                {field.label || "（質問文未設定）"}
                {field.required && (
                    <span className="text-red-500 text-xs">必須</span>
                )}
            </label>
            {field.type === "text" && <Input disabled className="h-9 bg-muted/30" />}
            {field.type === "email" && (
                <Input disabled placeholder="example@mail.com" className="h-9 bg-muted/30" />
            )}
            {field.type === "number" && (
                <Input disabled placeholder="0" className="h-9 bg-muted/30" />
            )}
            {field.type === "date" && (
                <Input disabled placeholder="YYYY/MM/DD" className="h-9 bg-muted/30" />
            )}
            {field.type === "textarea" && (
                <Textarea disabled rows={3} className="bg-muted/30" />
            )}
            {field.type === "select" && (
                <select
                    disabled
                    className="w-full h-9 rounded-md border border-input bg-muted/30 px-3 text-sm"
                >
                    <option>選択してください</option>
                    {field.options.map((o, i) => (
                        <option key={i}>{o}</option>
                    ))}
                </select>
            )}
            {field.type === "radio" && (
                <div className="space-y-1">
                    {field.options.map((o, i) => (
                        <label
                            key={i}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <input type="radio" disabled className="accent-primary" />
                            {o}
                        </label>
                    ))}
                </div>
            )}
            {field.type === "checkbox" && (
                <div className="space-y-1">
                    {field.options.map((o, i) => (
                        <label
                            key={i}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <input
                                type="checkbox"
                                disabled
                                className="accent-primary"
                            />
                            {o}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
