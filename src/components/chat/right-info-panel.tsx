"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faAddressBook,
  faEllipsis,
  faCirclePlus,
  faTag as faTagSolid,
  faChevronLeft,
  faChevronDown,
  faXmark,
  faFolder,
  faArrowsRotate,
  faPenToSquare,
  faUser,
  faUserPen,
  faUserPlus,
  faIdCard,
  faRectangleList,
  faStairs,
  faTableCells,
  faFileLines,
  faFilePen,
  faChevronRight,
  faArrowUpShortWide,
  faArrowDownWideShort,
  faArrowsUpDown,
  faGripLines,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { type FormEvent, useEffect, useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagBadge } from "@/components/tag-badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/time";
import { type MockFriend, type MockTag } from "@/mocks/data";
import { fetchTags } from "@/lib/api/tags";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import {
  type FriendDetail,
  type FriendFieldDetail,
  type FieldValueLite,
  type MemoDetail,
  type FormResponseLite,
  type ScenarioFolderTree,
  type RichMenuOption,
  fetchFriendDetail,
  fetchFriendFieldDefs,
  fetchFriendFieldValues,
  saveFriendFieldValues,
  saveFieldVisibility,
  syncFriendTagIds,
  detachFriendTagId,
  fetchFriendMemos,
  createFriendMemo,
  updateFriendMemo,
  deleteFriendMemo,
  reorderFriendMemos,
  updateFriendBasic,
  refreshFriendProfile,
  fetchScenarioTree,
  enrollScenario,
  stopScenario,
  fetchRichMenuOptions,
  linkRichMenu,
  unlinkRichMenu,
  fetchFriendFormResponses,
} from "@/lib/api/friend-detail";

/* ─────────────────────────── 流入経路ラベル ─────────────────────────── */

const SOURCE_LABELS: Record<string, string> = {
  qr: "QR コード",
  card: "名刺",
  web: "Web",
  manual: "手動追加",
  other: "その他",
};

function sourceLabel(source: string | null | undefined): string {
  if (!source) return "";
  return SOURCE_LABELS[source] ?? source;
}

/* ─────────────────────────── 右情報パネル本体 ─────────────────────────── */

export function RightInfoPanel({
  friend,
  mobileVisible = false,
  onBack,
  onChanged,
}: {
  friend: MockFriend;
  mobileVisible?: boolean;
  onBack?: () => void;
  /** 友だち情報・タグ・操作が変わったとき、親に再取得を促す。 */
  onChanged?: () => void;
}) {
  const friendId = Number(friend.id);
  const { currentChannelId } = useAuth();

  // 基本情報タブ用の詳細（MockFriend に無いフィールドを生で取得）
  const { data: detail, mutate: refreshDetail } = useResource(
    currentChannelId ? `friend-detail:${currentChannelId}:${friendId}` : null,
    () => fetchFriendDetail(friendId),
  );

  // 付帯マスタ・データ
  const { data: allTagsRaw } = useResource(
    currentChannelId ? `tags:${currentChannelId}` : null,
    () => fetchTags(),
  );
  const allTags: MockTag[] = allTagsRaw ?? [];

  const { data: fieldDefs } = useResource(
    currentChannelId ? `friend-fields:${currentChannelId}` : null,
    () => fetchFriendFieldDefs(),
  );
  const { data: fieldValues, mutate: refreshValues } = useResource(
    `field-values:${friendId}`,
    () => fetchFriendFieldValues(friendId),
  );
  const { data: memos, mutate: refreshMemos } = useResource(
    `memos:${friendId}`,
    () => fetchFriendMemos(friendId),
  );
  const { data: formResponses } = useResource(
    `form-responses:${friendId}`,
    () => fetchFriendFormResponses(friendId),
  );

  const tags = (allTags ?? []).filter((t) => friend.tagIds.includes(t.id));
  const [opDialog, setOpDialog] = useState<"scenario" | "rich_menu" | null>(null);
  const [tagBulkOpen, setTagBulkOpen] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [quickChecked, setQuickChecked] = useState<number[]>([]);
  const [quickFolderOpen, setQuickFolderOpen] = useState(false);
  const [editField, setEditField] = useState<"system_display_name" | "source" | null>(null);

  const notify = () => {
    refreshDetail();
    onChanged?.();
  };

  const detachTag = async (tag: MockTag) => {
    await detachFriendTagId(friendId, Number(tag.id));
    onChanged?.();
  };

  // クイック操作: 選択したタグを現在の付与に追加して保存
  const saveQuickTags = async () => {
    const attachedIds = tags.map((t) => Number(t.id));
    const union = Array.from(new Set([...attachedIds, ...quickChecked]));
    await syncFriendTagIds(friendId, union);
    setQuickMode(false);
    setQuickChecked([]);
    setQuickFolderOpen(false);
    onChanged?.();
  };

  const refreshProfile = async () => {
    await refreshFriendProfile(friendId);
    notify();
  };

  return (
    <aside
      className={`${mobileVisible ? "flex" : "hidden"} xl:flex w-full xl:w-80 shrink-0 flex-col border-l border-border bg-background`}
    >
      <div className="flex items-center gap-2 h-12 px-3 border-b border-border xl:hidden">
        <Button
          variant="ghost"
          className="text-muted-foreground size-9 p-0"
          onClick={onBack}
          aria-label="トークに戻る"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-4" />
        </Button>
        <div className="text-sm font-medium">友だち情報</div>
      </div>
      <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-3 grid grid-cols-5 h-9 bg-muted/60 w-auto">
          <TabsTrigger value="basic" aria-label="基本情報">
            <FontAwesomeIcon icon={faDatabase} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="fields" aria-label="友だち情報">
            <FontAwesomeIcon icon={faAddressBook} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="tags" aria-label="タグ管理">
            <FontAwesomeIcon icon={faTagSolid} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="form" aria-label="フォーム回答">
            <FontAwesomeIcon icon={faFileLines} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="memo" aria-label="メモ">
            <FontAwesomeIcon icon={faFilePen} className="size-3.5" />
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <TabsContent value="basic" className="space-y-5">
            <SectionTitle>基本情報</SectionTitle>

            <InfoRow
              icon={faUser}
              label="LINE 名"
              action={
                <IconButton
                  icon={faArrowsRotate}
                  label="LINE プロフィールを更新"
                  onClick={refreshProfile}
                />
              }
            >
              <div className="text-sm">
                {friend.displayName || "(名前未取得)"}
              </div>
              {(detail?.followed_at ?? friend.followedAt) && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDateTime(detail?.followed_at ?? friend.followedAt)} 友だち追加
                </div>
              )}
            </InfoRow>

            <InfoRow
              icon={faUserPen}
              label="システム表示名"
              action={
                <IconButton
                  icon={faPenToSquare}
                  label="システム表示名を編集"
                  onClick={() => setEditField("system_display_name")}
                />
              }
            >
              <div className="text-sm">
                {detail?.system_display_name ?? friend.systemDisplayName ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </InfoRow>

            <InfoRow
              icon={faUserPlus}
              label="流入経路"
              action={
                <IconButton
                  icon={faPenToSquare}
                  label="流入経路を編集"
                  onClick={() => setEditField("source")}
                />
              }
            >
              <div className="text-sm">
                {(detail?.source ?? friend.source) ? (
                  sourceLabel(detail?.source ?? friend.source)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </InfoRow>

            <InfoRow
              icon={faStairs}
              label="ステップ配信"
              action={
                <IconButton
                  icon={faPenToSquare}
                  label="ステップ配信を操作"
                  onClick={() => setOpDialog("scenario")}
                />
              }
            >
              <div className="text-sm">
                {detail?.active_scenario ? (
                  detail.active_scenario.name
                ) : friend.scenarioStepLabel ? (
                  friend.scenarioStepLabel
                ) : (
                  <span className="text-muted-foreground">配信中のステップなし</span>
                )}
              </div>
            </InfoRow>

            <InfoRow
              icon={faTableCells}
              label="リッチメニュー"
              action={
                <IconButton
                  icon={faPenToSquare}
                  label="リッチメニューを操作"
                  onClick={() => setOpDialog("rich_menu")}
                />
              }
            >
              <div className="text-sm">
                {detail?.rich_menu ? (
                  detail.rich_menu.name
                ) : detail?.rich_menu_id ? (
                  "表示中"
                ) : (
                  <span className="text-muted-foreground">表示なし</span>
                )}
              </div>
            </InfoRow>

            {detail?.status_message && (
              <InfoRow icon={faIdCard} label="ステータスメッセージ">
                <div className="text-sm">{detail.status_message}</div>
              </InfoRow>
            )}

            <InfoRow label="フォロー状態">
              <div className="text-sm">
                {(detail?.is_following ?? friend.isFollowing)
                  ? "アクティブ"
                  : "ブロック済み"}
              </div>
            </InfoRow>

            {detail?.unfollowed_at && (
              <InfoRow label="ブロック日時">
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(detail.unfollowed_at)}
                </div>
              </InfoRow>
            )}

            {detail?.line_user_id && (
              <InfoRow label="LINE userId">
                <div className="text-xs font-mono text-muted-foreground break-all">
                  {detail.line_user_id}
                </div>
              </InfoRow>
            )}
          </TabsContent>

          <TabsContent value="form" className="space-y-3">
            <FormResponsesTab responses={formResponses ?? []} />
          </TabsContent>

          <TabsContent value="fields" className="space-y-3">
            <CustomFieldsTab
              friendId={friendId}
              fields={fieldDefs ?? []}
              values={fieldValues ?? []}
              onSaved={refreshValues}
            />
          </TabsContent>

          <TabsContent value="tags" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <SectionTitle>タグ管理</SectionTitle>
                {quickMode ? (
                  <button
                    type="button"
                    onClick={saveQuickTags}
                    className="inline-flex h-8 items-center rounded-md border border-blue-500 px-5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  >
                    保存
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMode(true);
                      setQuickChecked([]);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    クイック操作
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTagBulkOpen(true)}
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="タグを一括編集"
              >
                <FontAwesomeIcon icon={faEllipsis} className="size-4" />
              </button>
            </div>

            {quickMode ? (
              <div className="space-y-2">
                <p className="text-sm">選択したタグを追加します</p>
                <div>
                  <button
                    type="button"
                    onClick={() => setQuickFolderOpen((o) => !o)}
                    className="flex w-full items-center justify-between border-b border-border py-2 text-sm text-muted-foreground"
                  >
                    <span>未分類</span>
                    <span className="inline-flex items-center gap-1">
                      {quickFolderOpen ? "とじる" : "ひらく"}
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={cn(
                          "size-3 transition-transform",
                          quickFolderOpen && "rotate-180",
                        )}
                      />
                    </span>
                  </button>
                  {quickFolderOpen && (
                    <ul className="mt-2 space-y-2">
                      {allTags.length === 0 ? (
                        <li className="text-xs text-muted-foreground">
                          タグがありません
                        </li>
                      ) : (
                        allTags.map((t) => {
                          const tid = Number(t.id);
                          return (
                            <li key={t.id}>
                              <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={quickChecked.includes(tid)}
                                  onChange={() =>
                                    setQuickChecked((prev) =>
                                      prev.includes(tid)
                                        ? prev.filter((x) => x !== tid)
                                        : [...prev, tid],
                                    )
                                  }
                                  className="size-4 accent-blue-500"
                                />
                                <TagBadge tag={t} />
                              </label>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    タグはまだありません
                  </div>
                ) : (
                  tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => detachTag(t)}
                      className="group inline-flex items-center gap-1"
                      aria-label={`タグ ${t.name} を外す`}
                    >
                      <TagBadge tag={t} />
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="memo" className="space-y-3">
            <MemoTab
              friendId={friendId}
              memos={memos ?? []}
              onChanged={refreshMemos}
            />
          </TabsContent>
        </div>
      </Tabs>

      <FieldEditDialog
        friendId={friendId}
        field={editField}
        systemDisplayName={detail?.system_display_name ?? friend.systemDisplayName ?? null}
        source={detail?.source ?? friend.source ?? null}
        onClose={() => setEditField(null)}
        onSaved={notify}
      />

      <TagBulkDialog
        open={tagBulkOpen}
        onOpenChange={setTagBulkOpen}
        friendId={friendId}
        attachedTagIds={tags.map((t) => Number(t.id))}
        tags={allTags}
        onSaved={() => onChanged?.()}
      />

      <FriendOpDialog
        open={opDialog !== null}
        kind={opDialog ?? "scenario"}
        friendId={friendId}
        onClose={() => setOpDialog(null)}
        onSaved={notify}
      />
    </aside>
  );
}

/* ─────────────────────────── 友だち操作（ステップ / リッチメニュー） ─────────────────────────── */

/** ステップ配信 / リッチメニューの「操作」モーダル（開始・変更 → 選択 / 停止）。 */
function FriendOpDialog({
  open,
  kind,
  friendId,
  onClose,
  onSaved,
}: {
  open: boolean;
  kind: "scenario" | "rich_menu";
  friendId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [action, setAction] = useState<"start" | "stop">("start");
  const [phase, setPhase] = useState<"choose" | "select">("choose");
  const [processing, setProcessing] = useState(false);
  // rich menu 用
  const [selectedId, setSelectedId] = useState<number>(0);
  // scenario 用
  const [folderId, setFolderId] = useState<number>(0);
  const [scenarioId, setScenarioId] = useState<number>(0);
  const [startMode, setStartMode] = useState<"first" | "resume">("first");
  const [resumeOrder, setResumeOrder] = useState<number>(0);

  const { data: scenarioTree } = useResource<ScenarioFolderTree[]>(
    open && kind === "scenario" ? "scenario-tree" : null,
    () => fetchScenarioTree(),
  );
  const { data: richMenuOptions } = useResource<RichMenuOption[]>(
    open && kind === "rich_menu" ? "rich-menu-options" : null,
    () => fetchRichMenuOptions(),
  );
  const scenarioFolders = scenarioTree ?? [];
  const options = richMenuOptions ?? [];

  useEffect(() => {
    if (open) {
      setAction("start");
      setPhase("choose");
      setProcessing(false);
      setSelectedId(0);
      setFolderId(0);
      setScenarioId(0);
      setStartMode("first");
      setResumeOrder(0);
    }
  }, [open]);

  useEffect(() => {
    if (open && kind === "scenario" && !folderId && scenarioFolders[0]) {
      setFolderId(scenarioFolders[0].id);
    }
  }, [open, kind, folderId, scenarioFolders]);

  const cfg =
    kind === "scenario"
      ? {
          title: "ステップ配信 操作",
          startLabel: "ステップを開始・変更する",
          startHint: "※2つ以上のステップを同時に配信することはできません。",
          stopLabel: "ステップ配信を停止する",
        }
      : {
          title: "リッチメニュー 操作",
          startLabel: "リッチメニューを表示・変更する",
          startHint: "",
          stopLabel: "リッチメニューの表示を停止する",
        };

  const run = async (fn: () => Promise<void>) => {
    setProcessing(true);
    try {
      await fn();
      onSaved();
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const next = () => {
    if (action === "stop") {
      run(() => (kind === "scenario" ? stopScenario(friendId) : unlinkRichMenu(friendId)));
      return;
    }
    setPhase("select");
  };

  const applyRichMenu = () => {
    if (!selectedId) return;
    run(() => linkRichMenu(friendId, selectedId));
  };

  const selectedFolder = scenarioFolders.find((f) => f.id === folderId);
  const selectedScenario = selectedFolder?.scenarios.find((s) => s.id === scenarioId);

  const startScenario = () => {
    if (!scenarioId) return;
    const order = startMode === "resume" && resumeOrder > 0 ? resumeOrder : undefined;
    run(() => enrollScenario(friendId, scenarioId, order));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={
          phase === "select" && kind === "scenario" ? "sm:max-w-2xl" : undefined
        }
      >
        <DialogHeader>
          <DialogTitle className="text-center">{cfg.title}</DialogTitle>
        </DialogHeader>

        {phase === "choose" ? (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col gap-1">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="radio"
                  checked={action === "start"}
                  onChange={() => setAction("start")}
                  className="size-4 accent-blue-500"
                />
                <span className={action === "start" ? "text-blue-600 dark:text-blue-400" : ""}>
                  {cfg.startLabel}
                </span>
              </span>
              {cfg.startHint && (
                <span className="ml-6 text-xs text-muted-foreground">
                  {cfg.startHint}
                </span>
              )}
            </label>
            <label className="flex cursor-pointer items-center gap-2 font-bold">
              <input
                type="radio"
                checked={action === "stop"}
                onChange={() => setAction("stop")}
                className="size-4 accent-blue-500"
              />
              <span
                className={
                  action === "stop"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }
              >
                {cfg.stopLabel}
              </span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={next}
                disabled={processing}
                className="mx-auto min-w-40 border-blue-400 text-blue-600 dark:text-blue-400"
              >
                次にすすむ
              </Button>
            </DialogFooter>
          </div>
        ) : kind === "rich_menu" ? (
          <div className="space-y-3">
            <p className="text-sm font-bold">表示するリッチメニューを選択</p>
            {options.length === 0 ? (
              <p className="rounded-md bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
                公開済みのリッチメニューがありません
              </p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm font-bold hover:bg-muted/40"
                  >
                    <input
                      type="radio"
                      name="friend-rm-option"
                      checked={selectedId === o.id}
                      onChange={() => setSelectedId(o.id)}
                      className="size-4 accent-blue-500"
                    />
                    {o.name}
                  </label>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase("choose")}
                disabled={processing}
              >
                戻る
              </Button>
              <Button
                type="button"
                onClick={applyRichMenu}
                disabled={!selectedId || processing}
              >
                {processing ? "適用中..." : "適用"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* フォルダ＋シナリオの2ペイン */}
            <div className="grid grid-cols-2 gap-3">
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {scenarioFolders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFolderId(f.id);
                      setScenarioId(0);
                      setResumeOrder(0);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold transition-colors",
                      f.id === folderId ? "bg-blue-500 text-white" : "hover:bg-muted/50",
                    )}
                  >
                    <FontAwesomeIcon
                      icon={faRectangleList}
                      className="size-3.5 opacity-70"
                    />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="tabular-nums opacity-80">
                      （{f.scenarios.length}）
                    </span>
                  </button>
                ))}
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {!selectedFolder || selectedFolder.scenarios.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    シナリオがありません
                  </p>
                ) : (
                  selectedFolder.scenarios.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-muted/40"
                    >
                      <input
                        type="radio"
                        name="friend-scenario-option"
                        checked={scenarioId === s.id}
                        onChange={() => {
                          setScenarioId(s.id);
                          setResumeOrder(s.steps[0]?.step_order ?? 0);
                        }}
                        className="size-4 accent-blue-500"
                      />
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* 最初から / 途中から */}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input
                  type="radio"
                  checked={startMode === "first"}
                  onChange={() => setStartMode("first")}
                  className="size-4 accent-blue-500"
                />
                <span className={startMode === "first" ? "text-blue-600 dark:text-blue-400" : ""}>
                  ステップの最初から配信を開始する
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                  <input
                    type="radio"
                    checked={startMode === "resume"}
                    onChange={() => setStartMode("resume")}
                    className="size-4 accent-blue-500"
                  />
                  <span
                    className={
                      startMode === "resume"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    }
                  >
                    ステップの途中から配信を開始する
                  </span>
                </label>
                {startMode === "resume" && selectedScenario && (
                  <select
                    value={resumeOrder}
                    onChange={(e) => setResumeOrder(Number(e.target.value))}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {selectedScenario.steps.map((st) => (
                      <option key={st.step_order} value={st.step_order}>
                        ステップ {st.step_order} から
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase("choose")}
                disabled={processing}
              >
                戻る
              </Button>
              <Button
                type="button"
                onClick={startScenario}
                disabled={!scenarioId || processing}
                className="border-blue-400 text-blue-600 dark:text-blue-400"
                variant="outline"
              >
                {processing ? "開始中..." : "ステップを開始する"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── メモ ─────────────────────────── */

function MemoTab({
  friendId,
  memos,
  onChanged,
}: {
  friendId: number;
  memos: MemoDetail[];
  onChanged: () => void;
}) {
  // null=閉じている / "new"=新規 / MemoDetail=編集
  const [editing, setEditing] = useState<MemoDetail | "new" | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle>メモ</SectionTitle>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="メモを新規作成"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setReorderOpen(true)}
            disabled={memos.length < 2}
            className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label="メモを並べ替え"
          >
            <FontAwesomeIcon icon={faArrowsUpDown} className="size-4" />
          </button>
        </div>
      </div>

      {memos.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          メモはまだありません
        </div>
      ) : (
        <div className="space-y-4">
          {memos.map((m) => (
            <div key={m.id}>
              <div className="rounded-lg border border-border">
                <div className="flex items-center justify-between gap-2 rounded-t-lg bg-muted/40 px-3 py-2">
                  <span className="min-w-0 truncate text-sm font-bold">
                    {m.title || "（無題）"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="メモを編集"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap break-words px-3 py-3 text-sm">
                  {m.body}
                </p>
              </div>
              {m.updated_at && (
                <div className="mt-1 text-[11px] text-muted-foreground underline">
                  {formatDateTime(m.updated_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <MemoEditDialog
        friendId={friendId}
        memo={editing}
        onClose={() => setEditing(null)}
        onChanged={onChanged}
      />
      <MemoReorderDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        friendId={friendId}
        memos={memos}
        onChanged={onChanged}
      />
    </>
  );
}

/** メモ作成 / 編集ダイアログ。 */
function MemoEditDialog({
  friendId,
  memo,
  onClose,
  onChanged,
}: {
  friendId: number;
  memo: MemoDetail | "new" | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const open = memo !== null;
  const isEdit = memo !== null && memo !== "new";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  useEffect(() => {
    if (open) {
      setTitle(isEdit ? ((memo as MemoDetail).title ?? "") : "");
      setBody(isEdit ? ((memo as MemoDetail).body ?? "") : "");
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memo]);

  const save = async () => {
    setProcessing(true);
    setErrors({});
    try {
      if (isEdit) {
        await updateFriendMemo(friendId, (memo as MemoDetail).id, { title, body });
      } else {
        await createFriendMemo(friendId, { title, body });
      }
      onChanged();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors());
    } finally {
      setProcessing(false);
    }
  };

  const remove = async () => {
    if (!isEdit) return;
    if (!confirm("このメモを削除します。よろしいですか？")) return;
    setProcessing(true);
    try {
      await deleteFriendMemo(friendId, (memo as MemoDetail).id);
      onChanged();
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-center">
          {isEdit ? "メモ編集" : "メモ作成"}
        </DialogTitle>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="memo-title" className="text-sm">
              タイトル
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {title.length}/20
            </span>
          </div>
          <Input
            id="memo-title"
            value={title}
            maxLength={20}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="memo-body" className="text-sm">
              メモ本文
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {body.length}/1000
            </span>
          </div>
          <textarea
            id="memo-body"
            value={body}
            maxLength={1000}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className={cn(
              "w-full resize-y rounded-md border bg-background px-3 py-2 text-sm",
              errors.body ? "border-destructive" : "border-input",
            )}
          />
          {errors.body && (
            <p className="text-xs text-destructive">{errors.body}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={processing}
            className="inline-flex h-11 min-w-48 items-center justify-center rounded-md border border-blue-500 px-8 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-blue-500/10"
          >
            {processing ? "保存中..." : "内容を保存"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={processing}
              className="text-sm font-bold text-destructive underline hover:no-underline disabled:opacity-60"
            >
              このメモを削除する
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** メモ並べ替えダイアログ（ドラッグで順序入れ替え）。 */
function MemoReorderDialog({
  open,
  onOpenChange,
  friendId,
  memos,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendId: number;
  memos: MemoDetail[];
  onChanged: () => void;
}) {
  const [order, setOrder] = useState<MemoDetail[]>(memos);
  const [dragId, setDragId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setOrder(memos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    setOrder((prev) => {
      const from = prev.findIndex((m) => m.id === dragId);
      const to = prev.findIndex((m) => m.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await reorderFriendMemos(friendId, order.map((m) => m.id));
      onChanged();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-center">並べ替え</DialogTitle>

        <ul className="space-y-3">
          {order.map((m) => (
            <li
              key={m.id}
              draggable
              onDragStart={() => setDragId(m.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(m.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3",
                dragId === m.id && "opacity-50",
              )}
            >
              <FontAwesomeIcon
                icon={faGripLines}
                className="size-4 cursor-grab text-muted-foreground"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {m.title || "（無題）"}
              </span>
              <FontAwesomeIcon
                icon={faEllipsis}
                className="size-4 text-muted-foreground"
              />
            </li>
          ))}
        </ul>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 min-w-48 items-center justify-center rounded-md border border-blue-500 px-8 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-blue-500/10"
          >
            {saving ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── 友だち情報（カスタム項目） ─────────────────────────── */

function CustomFieldsTab({
  friendId,
  fields,
  values: valueList,
  onSaved,
}: {
  friendId: number;
  fields: FriendFieldDetail[];
  values: FieldValueLite[];
  onSaved: () => void;
}) {
  // 「友だち情報」タブに表示するのは、表示中に設定された項目のみ
  const visibleFields = fields.filter((f) => f.show_in_chat_panel);
  const visKey = visibleFields.map((f) => f.id).join(",");
  const valKey = valueList.map((v) => `${v.friend_field_id}:${v.value ?? ""}`).join("|");

  const initial = () => {
    const map: Record<number, string> = {};
    for (const f of visibleFields) {
      const v = valueList.find((fv) => fv.friend_field_id === f.id);
      map[f.id] = v?.value ?? "";
    }
    return map;
  };

  const [values, setValues] = useState<Record<number, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setValues(initial());
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId, visKey, valKey]);

  const baseline = initial();
  const dirty = visibleFields.some((f) => (values[f.id] ?? "") !== baseline[f.id]);

  const setValue = (id: number, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveFriendFieldValues(friendId, values);
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  // 表示中の項目をフォルダごとにグルーピング（取得順を維持）
  const groups: { name: string; items: FriendFieldDetail[] }[] = [];
  for (const f of visibleFields) {
    const name = f.folder?.name ?? "未分類";
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(f);
    else groups.push({ name, items: [f] });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle>友だち情報</SectionTitle>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="表示する項目を選択"
        >
          <FontAwesomeIcon icon={faEllipsis} className="size-4" />
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-xs text-muted-foreground leading-relaxed">
          友だち情報の項目がまだありません。
          <a
            href="/data-management/friend-fields"
            className="text-blue-600 dark:text-blue-400 underline mx-1"
          >
            友だち情報管理
          </a>
          で項目を作成してください。
        </div>
      ) : visibleFields.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground leading-relaxed">
          表示する項目が選択されていません。
          <br />
          右上の「…」から表示する項目を選んでください。
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.name} className="space-y-3">
                <div className="text-[11px] font-medium text-muted-foreground">
                  {g.name}
                </div>
                {g.items.map((f) => (
                  <div key={f.id} className="space-y-1">
                    <Label htmlFor={`ff-${f.id}`} className="text-xs">
                      {f.name}
                    </Label>
                    <FieldValueInput
                      field={f}
                      value={values[f.id] ?? ""}
                      onChange={(v) => setValue(f.id, v)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {saved ? "保存しました" : ""}
            </span>
            <Button size="sm" onClick={save} disabled={saving || !dirty}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </>
      )}

      <FieldVisibilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fields={fields}
      />
    </>
  );
}

/** 「友だち情報の表示」設定ダイアログ（非表示項目 ↔ 表示中の項目）。 */
function FieldVisibilityDialog({
  open,
  onOpenChange,
  fields,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FriendFieldDetail[];
}) {
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVisibleIds(fields.filter((f) => f.show_in_chat_panel).map((f) => f.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const add = (id: number) =>
    setVisibleIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const remove = (id: number) =>
    setVisibleIds((prev) => prev.filter((x) => x !== id));

  const hidden = fields.filter((f) => !visibleIds.includes(f.id));
  const shown = visibleIds
    .map((id) => fields.find((f) => f.id === id))
    .filter(Boolean) as FriendFieldDetail[];

  // 非表示項目はフォルダごとにグルーピング
  const groups: { name: string; items: FriendFieldDetail[] }[] = [];
  for (const f of hidden) {
    const name = f.folder?.name ?? "未分類";
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(f);
    else groups.push({ name, items: [f] });
  }

  const save = async () => {
    setSaving(true);
    try {
      await saveFieldVisibility(visibleIds);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-center">友だち情報の表示</DialogTitle>

        <div className="grid grid-cols-2 gap-4">
          {/* 非表示項目 */}
          <div className="rounded-xl bg-muted/40 p-4">
            <h3 className="mb-3 text-center text-sm font-bold">非表示項目</h3>
            <div className="max-h-[55vh] space-y-4 overflow-y-auto">
              {hidden.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  すべて表示中です
                </p>
              ) : (
                groups.map((g) => (
                  <div key={g.name}>
                    <div className="border-b border-border pb-1 text-xs text-muted-foreground">
                      {g.name}
                    </div>
                    <ul className="mt-2 space-y-2.5">
                      {g.items.map((f) => (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => add(f.id)}
                            className="flex items-center gap-2 text-sm hover:text-foreground"
                          >
                            <FontAwesomeIcon
                              icon={faCirclePlus}
                              className="size-4 text-blue-500"
                            />
                            {f.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 表示中の項目 */}
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-3 text-center text-sm font-bold">表示中の項目</h3>
            <ul className="max-h-[55vh] space-y-2 overflow-y-auto">
              {shown.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  項目がありません
                </p>
              ) : (
                shown.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => remove(f.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`${f.name} を非表示にする`}
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 min-w-48 items-center justify-center rounded-md border border-blue-500 px-8 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-blue-500/10"
          >
            {saving ? "保存中..." : "内容を保存"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── タグ一括編集 ─────────────────────────── */

/** 「タグ一括編集」ダイアログ（この友だちに付けるタグをまとめて選ぶ）。 */
function TagBulkDialog({
  open,
  onOpenChange,
  friendId,
  attachedTagIds,
  tags,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendId: number;
  attachedTagIds: number[];
  tags: MockTag[];
  onSaved: () => void;
}) {
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setCheckedIds(attachedTagIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, friendId]);

  const toggle = (id: number) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const allChecked = tags.length > 0 && tags.every((t) => checkedIds.includes(Number(t.id)));
  const toggleAll = () =>
    setCheckedIds(allChecked ? [] : tags.map((t) => Number(t.id)));

  const save = async () => {
    setSaving(true);
    try {
      await syncFriendTagIds(friendId, checkedIds);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-center">タグ一括編集</DialogTitle>

        <div className="grid grid-cols-2 gap-4">
          {/* フォルダ（タグはフォルダ概念がないため未分類のみ） */}
          <div>
            <div className="flex items-center gap-2 rounded-md bg-blue-400 px-3 py-2.5 text-sm font-bold text-white">
              <FontAwesomeIcon icon={faFolder} className="size-3.5" />
              未分類（{tags.length}）
            </div>
          </div>

          {/* タグ一覧 */}
          <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                タグがまだありません
              </p>
            ) : (
              <>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="size-4 accent-blue-500"
                  />
                  <span className="text-sm">以下を全選択</span>
                </label>
                {tags.map((t) => {
                  const tid = Number(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(tid)}
                        onChange={() => toggle(tid)}
                        className="size-4 accent-blue-500"
                      />
                      <span className="min-w-0 truncate text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 min-w-48 items-center justify-center rounded-md border border-blue-500 px-8 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-blue-500/10"
          >
            {saving ? "保存中..." : "内容を保存"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── フォーム回答 ─────────────────────────── */

/** 「フォーム回答」タブ（年で絞り込み・回答日で並び替え）。 */
function FormResponsesTab({ responses }: { responses: FormResponseLite[] }) {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const inYear = responses.filter(
    (r) => r.submitted_at && new Date(r.submitted_at).getFullYear() === year,
  );
  const sorted = [...inYear].sort((a, b) => {
    const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return sortDir === "asc" ? ta - tb : tb - ta;
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle>フォーム回答</SectionTitle>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="並び替え"
              />
            }
          >
            <FontAwesomeIcon icon={faEllipsis} className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              回答日
            </div>
            <DropdownMenuItem
              onClick={() => setSortDir("asc")}
              className={sortDir === "asc" ? "text-blue-600" : ""}
            >
              <FontAwesomeIcon icon={faArrowUpShortWide} className="size-3.5" />
              昇順
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortDir("desc")}
              className={sortDir === "desc" ? "text-blue-600" : ""}
            >
              <FontAwesomeIcon icon={faArrowDownWideShort} className="size-3.5" />
              降順
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 年ナビゲーション */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="grid h-10 w-12 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          aria-label="前の年"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-3.5" />
        </button>
        <div className="grid h-10 flex-1 place-items-center rounded-md border border-border text-sm font-medium">
          {year}年
        </div>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="grid h-10 w-12 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          aria-label="次の年"
        >
          <FontAwesomeIcon icon={faChevronRight} className="size-3.5" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          {year}年の回答はありません
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((r) => (
            <li key={r.id} className="rounded-md border border-border px-3 py-2">
              <div className="truncate text-sm font-medium">{r.form_name}</div>
              <div className="text-[11px] text-muted-foreground">
                {r.submitted_at ? formatDateTime(r.submitted_at) : "—"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ─────────────────────────── 入力ヘルパー ─────────────────────────── */

function FieldValueInput({
  field,
  value,
  onChange,
}: {
  field: FriendFieldDetail;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `ff-${field.id}`;
  const cls = "w-full h-9 rounded-md border border-input bg-background px-3 text-sm";

  if (field.field_type === "choice") {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      >
        <option value="">未設定</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  const type =
    field.field_type === "number"
      ? "number"
      : field.field_type === "date"
        ? "date"
        : field.field_type === "phone"
          ? "tel"
          : field.field_type === "email"
            ? "email"
            : "text";

  return (
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={1000}
    />
  );
}

/* ─────────────────────────── 基本情報の編集 ─────────────────────────── */

function FieldEditDialog({
  friendId,
  field,
  systemDisplayName,
  source,
  onClose,
  onSaved,
}: {
  friendId: number;
  field: "system_display_name" | "source" | null;
  systemDisplayName: string | null;
  source: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isSystemName = field === "system_display_name";
  const isSource = field === "source";
  const [value, setValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (field) {
      setValue((isSystemName ? systemDisplayName : isSource ? source : "") ?? "");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!field) return;
    setProcessing(true);
    setError(null);
    try {
      await updateFriendBasic(friendId, { [field]: value || null });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        setError(fe[field] ?? err.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const title = isSystemName
    ? "システム表示名を編集"
    : isSource
      ? "流入経路を編集"
      : "";

  return (
    <Dialog open={field !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {isSystemName && (
            <div className="space-y-1.5">
              <Label htmlFor="field-input">システム表示名</Label>
              <Input
                id="field-input"
                placeholder="社内呼称（任意）"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                LINE 表示名の代わりに各画面で表示されます
              </p>
            </div>
          )}

          {isSource && (
            <div className="space-y-1.5">
              <Label htmlFor="field-input">流入経路</Label>
              <select
                id="field-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                autoFocus
              >
                <option value="">未設定</option>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── 共通 UI ─────────────────────────── */

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="size-6 p-0 text-muted-foreground hover:text-foreground"
      aria-label={label}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon} className="size-3" />
    </Button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold text-foreground/90">{children}</div>
  );
}

function InfoRow({
  label,
  icon,
  action,
  children,
}: {
  label: string;
  icon?: IconDefinition;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5 bg-muted/40 rounded-md px-2 py-1 w-fit">
        {icon && (
          <FontAwesomeIcon icon={icon} className="size-3 text-muted-foreground" />
        )}
        <div className="text-xs font-medium text-foreground/80">{label}</div>
        {action && <div className="ml-1">{action}</div>}
      </div>
      <div className="px-2">{children}</div>
    </div>
  );
}
