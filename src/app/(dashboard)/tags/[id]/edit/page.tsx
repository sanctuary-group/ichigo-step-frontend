"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faClipboard,
  faTag,
  faAddressCard,
  faBarsStaggered,
  faEllipsis,
  faBolt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/greetings/greeting-form";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/api/use-resource";
import { fetchFolders, type Folder } from "@/lib/api/folders";
import {
  fetchBuilderOptions,
  fetchTags,
  fetchChatStatuses,
  type BuilderOptions,
} from "@/lib/api/builder-options";
import { fetchTagDetail, updateTag } from "@/lib/api/tags";
import { ApiError } from "@/lib/api/client";
import type { GreetingAction, GreetingActionType } from "@/types/greeting";
import type { Tag, ChatStatus } from "@/types/chat";

const MAX_TAG_NAME = 50;

type Section = "action" | "limit";

const ACTION_TYPE_LABELS: Record<string, string> = {
  tag_attach: "タグを追加",
  tag_detach: "タグを外す",
  scenario_start: "ステップ配信",
  link_rich_menu: "リッチメニュー",
  send_template: "テンプレート送信",
  send_text: "テキスト送信",
  reminder: "リマインド",
  bookmark: "ブックマーク",
  friend_field: "友だち情報",
  chat_status: "対応ステータス",
  block: "ブロック",
};

const PALETTE: {
  label: string;
  icon: typeof faTag;
  preset: GreetingActionType | null;
}[] = [
  { label: "テンプレート", icon: faClipboard, preset: "send_template" },
  { label: "タグ", icon: faTag, preset: "tag_attach" },
  { label: "友だち情報", icon: faAddressCard, preset: "friend_field" },
  { label: "ステップ配信", icon: faBarsStaggered, preset: "scenario_start" },
  { label: "その他", icon: faEllipsis, preset: null },
];

export default function TagsEditPage() {
  const params = useParams();
  const id = String(params.id);

  const { data, isLoading, error } = useResource(
    `tag-edit-${id}`,
    async () => {
      const [tag, folders, options, tags, chatStatuses] = await Promise.all([
        fetchTagDetail(id),
        fetchFolders("tag-folders"),
        fetchBuilderOptions(),
        fetchTags(),
        fetchChatStatuses(),
      ]);
      return { tag, folders, options, tags, chatStatuses };
    },
  );

  if (isLoading || !data) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
        {error ? "読み込みに失敗しました" : "読み込み中..."}
      </div>
    );
  }

  return (
    <TagsEditInner
      tagId={id}
      tag={data.tag}
      folders={data.folders}
      options={data.options}
      tags={data.tags}
      chatStatuses={data.chatStatuses}
    />
  );
}

function TagsEditInner({
  tagId,
  tag,
  folders,
  options,
  tags,
  chatStatuses,
}: {
  tagId: string;
  tag: Awaited<ReturnType<typeof fetchTagDetail>>;
  folders: Folder[];
  options: BuilderOptions;
  tags: Tag[];
  chatStatuses: ChatStatus[];
}) {
  const router = useRouter();

  const [section, setSection] = useState<Section>("action");
  const [limited, setLimited] = useState(tag.personLimit != null);

  const [name, setName] = useState(tag.name);
  const [tagFolderId, setTagFolderId] = useState<number>(
    tag.tagFolderId ?? Number(folders[0]?.id ?? 0),
  );
  const [actions, setActions] = useState<GreetingAction[]>(tag.actions);
  const [actionRunOnce, setActionRunOnce] = useState(tag.actionRunOnce);
  const [personLimit, setPersonLimit] = useState<number | null>(
    tag.personLimit,
  );
  const [limitActions, setLimitActions] = useState<GreetingAction[]>(
    tag.limitActions,
  );
  const [limitActionRunOnce, setLimitActionRunOnce] = useState(
    tag.limitActionRunOnce,
  );

  const [processing, setProcessing] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setNameError(null);
    setLimitError(null);
    try {
      await updateTag(tagId, {
        name,
        color: tag.color,
        tag_folder_id: tagFolderId || null,
        person_limit: limited ? personLimit : null,
        actions,
        action_run_once: actionRunOnce,
        limit_actions: limitActions,
        limit_action_run_once: limitActionRunOnce,
      });
      router.push("/tags");
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors();
        setNameError(fields.name ?? null);
        setLimitError(fields.person_limit ?? null);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ヘッダーカード */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-8">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">タグ編集</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <Link href="/tags" className="underline hover:text-foreground">
              タグ一覧
            </Link>
            <span> &gt; タグ編集</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-end justify-between">
            <Label htmlFor="tag-name" className="text-sm font-bold">
              管理名
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {name.length}/{MAX_TAG_NAME}
            </span>
          </div>
          <Input
            id="tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_TAG_NAME}
            className="mt-1 h-11"
          />
          {nameError && (
            <p className="text-xs text-destructive mt-1">{nameError}</p>
          )}
        </div>
        <div className="w-full lg:w-64 shrink-0">
          <Label className="text-sm font-bold">フォルダ</Label>
          <select
            value={tagFolderId}
            onChange={(e) => setTagFolderId(Number(e.target.value))}
            className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 本体カード */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          {/* 設定項目ナビ */}
          <aside className="rounded-lg border border-border p-3 self-start">
            <div className="text-center text-sm font-bold text-muted-foreground pb-3 border-b border-border">
              設定項目
            </div>
            <div className="space-y-2 pt-3">
              <SectionTab
                label="アクション設定"
                active={section === "action"}
                onClick={() => setSection("action")}
              />
              <SectionTab
                label="人数制限"
                active={section === "limit"}
                onClick={() => setSection("limit")}
              />
            </div>
          </aside>

          {/* 右ペイン */}
          <section className="min-w-0">
            {section === "action" ? (
              <div className="space-y-5">
                <div className="rounded-md bg-muted/40 p-4">
                  <h2 className="text-sm font-bold">
                    タグ追加時アクション設定
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    自動応答や回答フォームなどでタグが追加された時に行うアクションを設定します。
                  </p>
                </div>

                <ActionSection
                  actions={actions}
                  runOnce={actionRunOnce}
                  onActions={setActions}
                  onRunOnce={setActionRunOnce}
                  options={options}
                  tags={tags}
                  chatStatuses={chatStatuses}
                />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-md bg-muted/40 p-4">
                  <h2 className="text-sm font-bold">人数制限</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    タグの追加上限人数を設定します。
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-md bg-muted/30 px-4 py-3">
                  <span className="text-sm font-bold">人数制限</span>
                  <div className="inline-flex rounded-md bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLimited(false);
                        setPersonLimit(null);
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded text-sm font-bold transition-colors",
                        !limited
                          ? "bg-background text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      制限しない
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLimited(true);
                        if (personLimit == null) setPersonLimit(100);
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded text-sm font-bold transition-colors",
                        limited
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      制限する
                    </button>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-3 px-4",
                    !limited && "opacity-50",
                  )}
                >
                  <Label className="text-sm text-muted-foreground w-20 shrink-0">
                    制限人数
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    disabled={!limited}
                    value={personLimit ?? ""}
                    onChange={(e) =>
                      setPersonLimit(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    className="h-10 w-40"
                  />
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
                {limitError && (
                  <p className="text-xs text-destructive px-4">{limitError}</p>
                )}

                {limited && (
                  <div className="space-y-5 pt-2">
                    <div className="rounded-md bg-muted/40 p-4">
                      <h3 className="text-sm font-bold">
                        制限到達後のタグ追加時アクション
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      制限人数に到達した後にタグの付与が発生した場合
                      <br />
                      タグの付与を行う代わりに、以下のアクションを稼働させることができます。
                    </p>

                    <ActionSection
                      actions={limitActions}
                      runOnce={limitActionRunOnce}
                      onActions={setLimitActions}
                      onRunOnce={setLimitActionRunOnce}
                      options={options}
                      tags={tags}
                      chatStatuses={chatStatuses}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* フッターカード */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary h-11 px-8"
          onClick={submit}
          disabled={processing}
        >
          {processing ? "保存中..." : "保存"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground h-11 px-8"
          onClick={() => router.push("/tags")}
        >
          戻る
        </Button>
      </div>
    </div>
  );
}

/** 稼働回数ラジオ + アクションパレット + 追加・編集 + 一覧 + ActionDialog の共通ブロック。 */
function ActionSection({
  actions,
  runOnce,
  onActions,
  onRunOnce,
  options,
  tags,
  chatStatuses,
}: {
  actions: GreetingAction[];
  runOnce: boolean;
  onActions: (next: GreetingAction[]) => void;
  onRunOnce: (v: boolean) => void;
  options: BuilderOptions;
  tags: Tag[];
  chatStatuses: ChatStatus[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetType, setPresetType] = useState<GreetingActionType | null>(null);

  const openDialog = (preset: GreetingActionType | null) => {
    setPresetType(preset);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-bold">アクションの稼働回数</h3>
        <div className="flex flex-wrap items-center gap-6">
          <RunOnceRadio
            label="何度でもアクション稼働"
            checked={!runOnce}
            onChange={() => onRunOnce(false)}
          />
          <RunOnceRadio
            label="1度のみアクション稼働"
            checked={runOnce}
            onChange={() => onRunOnce(true)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PALETTE.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => openDialog(p.preset)}
              className="flex flex-col items-center justify-center gap-2 rounded-md bg-muted/50 hover:bg-muted py-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FontAwesomeIcon icon={p.icon} className="size-5" />
              <span className="text-xs font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border" />

      <Button
        type="button"
        className="bg-blue-500 hover:bg-blue-600 text-white h-11 px-6"
        onClick={() => openDialog(null)}
      >
        <FontAwesomeIcon icon={faBolt} className="size-3.5" />
        アクション追加・編集
      </Button>

      {actions.length === 0 ? (
        <div className="rounded-md bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          いちごアクションは登録されていません
        </div>
      ) : (
        <ul className="space-y-2">
          {actions.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
            >
              <span className="inline-flex items-center gap-2 text-sm">
                <FontAwesomeIcon
                  icon={faBolt}
                  className="size-3.5 text-amber-500"
                />
                {ACTION_TYPE_LABELS[a.type] ?? a.type}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                aria-label="削除"
                onClick={() => onActions(actions.filter((_, idx) => idx !== i))}
              >
                <FontAwesomeIcon icon={faTrash} className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ActionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tags={tags}
        scenarios={options.scenarios}
        richMenus={options.richMenus}
        templates={options.templates}
        templateFolders={options.templateFolders}
        reminders={options.reminders}
        friendFields={options.friendFields}
        friendFieldFolders={options.friendFieldFolders}
        chatStatuses={chatStatuses}
        presetType={presetType}
        currentActions={actions}
        onSave={(next) => {
          onActions(next);
          setDialogOpen(false);
        }}
      />
    </>
  );
}

function SectionTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors",
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
          : "border-border text-muted-foreground hover:bg-muted/50",
      )}
    >
      {label}
      <FontAwesomeIcon icon={faChevronRight} className="size-3" />
    </button>
  );
}

function RunOnceRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="size-4 accent-blue-500"
      />
      <span
        className={cn(
          "text-sm",
          checked
            ? "font-bold text-blue-600 dark:text-blue-400"
            : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </label>
  );
}
