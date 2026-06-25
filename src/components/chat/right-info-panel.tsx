"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faAddressCard,
  faTag as faTagSolid,
  faNoteSticky,
  faPenToSquare,
  faArrowsRotate,
  faStairs,
  faLayerGroup,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tag-badge";
import { type MockFriend } from "@/mocks/data";
import { formatDateTime } from "@/lib/time";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { fetchTags } from "@/lib/api/tags";
import { attachFriendTag, detachFriendTag } from "@/lib/api/friends";
import { fetchMemos, createMemo, deleteMemo } from "@/lib/api/memos";
import { fetchFriendFields } from "@/lib/api/friend-fields";
import { fetchFieldValues, updateFieldValues } from "@/lib/api/field-values";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

export function RightInfoPanel({
  friend,
  mobileVisible = false,
  onBack,
  onChanged,
}: {
  friend: MockFriend;
  mobileVisible?: boolean;
  onBack?: () => void;
  onChanged?: () => void;
}) {
  const { currentChannelId } = useAuth();
  const { data: allTags } = useResource(
    currentChannelId ? `tags:${currentChannelId}` : null,
    () => fetchTags(),
  );
  const tags = (allTags ?? []).filter((t) => friend.tagIds.includes(t.id));
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const assignable = (allTags ?? []).filter((t) => !friend.tagIds.includes(t.id));

  // メモ
  const { data: memos, mutate: refreshMemos } = useResource(
    `memos:${friend.id}`,
    () => fetchMemos(friend.id),
  );
  const [memoDraft, setMemoDraft] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);

  async function handleAddMemo() {
    const body = memoDraft.trim();
    if (!body || savingMemo) return;
    setSavingMemo(true);
    try {
      await createMemo(friend.id, { body });
      setMemoDraft("");
      refreshMemos();
    } finally {
      setSavingMemo(false);
    }
  }

  async function handleDeleteMemo(memoId: string) {
    await deleteMemo(friend.id, memoId);
    refreshMemos();
  }

  // 友だち情報項目（カスタムフィールド）
  const { data: fieldDefs } = useResource(
    currentChannelId ? `friend-fields:${currentChannelId}` : null,
    () => fetchFriendFields(),
  );
  const { data: fieldValues, mutate: refreshValues } = useResource(
    `field-values:${friend.id}`,
    () => fetchFieldValues(friend.id),
  );
  const [valueDraft, setValueDraft] = useState<Record<string, string> | null>(null);
  const values = valueDraft ?? fieldValues ?? {};
  const [savingValues, setSavingValues] = useState(false);

  function setFieldValue(fieldId: string, v: string) {
    setValueDraft({ ...values, [fieldId]: v });
  }

  async function handleSaveValues() {
    setSavingValues(true);
    try {
      await updateFieldValues(friend.id, values);
      setValueDraft(null);
      refreshValues();
    } finally {
      setSavingValues(false);
    }
  }

  async function toggleTag(tagId: string, attached: boolean) {
    setBusyTagId(tagId);
    try {
      if (attached) await detachFriendTag(friend.id, tagId);
      else await attachFriendTag(friend.id, tagId);
      onChanged?.();
    } finally {
      setBusyTagId(null);
    }
  }

  return (
    <aside
      className={`${mobileVisible ? "flex" : "hidden"} xl:flex w-full xl:w-80 shrink-0 flex-col border-l border-border bg-background`}
    >
      <div className="flex items-center gap-2 h-12 px-3 border-b border-border xl:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onBack}
          aria-label="トークに戻る"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-4" />
        </Button>
        <div className="text-sm font-medium">友だち情報</div>
      </div>
      <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-3 grid grid-cols-4 h-9 bg-muted/60 w-auto">
          <TabsTrigger value="basic" aria-label="基本情報">
            <FontAwesomeIcon icon={faDatabase} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="profile" aria-label="友だち情報">
            <FontAwesomeIcon icon={faAddressCard} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="tags" aria-label="タグ">
            <FontAwesomeIcon icon={faTagSolid} className="size-3.5" />
          </TabsTrigger>
          <TabsTrigger value="memo" aria-label="メモ">
            <FontAwesomeIcon icon={faNoteSticky} className="size-3.5" />
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <TabsContent value="basic" className="space-y-5">
            <SectionTitle>基本情報</SectionTitle>

            <InfoRow label="LINE名" action={<RefreshIconBtn />}>
              <div className="text-sm">{friend.displayName}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {formatDateTime(friend.followedAt)} 新規友だち
              </div>
            </InfoRow>

            <InfoRow label="システム表示名" action={<EditIconBtn />}>
              <div className="text-sm text-muted-foreground">
                {friend.systemDisplayName ?? "—"}
              </div>
            </InfoRow>

            <InfoRow label="流入経路">
              <div className="text-sm">{friend.source}</div>
            </InfoRow>

            <InfoRow
              label="ステップ配信"
              icon={faStairs}
              action={<EditIconBtn />}
            >
              <div className="text-sm">
                {friend.scenarioStepLabel ?? "配信中のステップなし"}
              </div>
            </InfoRow>

            <InfoRow
              label="リッチメニュー"
              icon={faLayerGroup}
              action={<EditIconBtn />}
            >
              <div className="text-sm text-muted-foreground">
                MVP 後に対応予定
              </div>
            </InfoRow>
          </TabsContent>

          <TabsContent value="profile" className="space-y-3">
            <SectionTitle>友だち情報</SectionTitle>
            <InfoRow label="フォロー状態">
              <div className="text-sm">
                {friend.isFollowing ? "アクティブ" : "ブロック済み"}
              </div>
            </InfoRow>
            <InfoRow label="LINE userId">
              <div className="text-xs font-mono text-muted-foreground">
                Uxxxx...{friend.id}
              </div>
            </InfoRow>

            {(fieldDefs ?? []).length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <SectionTitle>友だち情報項目</SectionTitle>
                {(fieldDefs ?? []).map((f) => (
                  <div key={f.id} className="space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      {f.name}
                    </div>
                    <Input
                      value={values[f.id] ?? ""}
                      onChange={(e) => setFieldValue(f.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleSaveValues}
                  disabled={savingValues || valueDraft === null}
                >
                  {savingValues ? "保存中…" : "友だち情報を保存"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tags" className="space-y-3">
            <SectionTitle>タグ</SectionTitle>
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
                    disabled={busyTagId === t.id}
                    onClick={() => toggleTag(t.id, true)}
                    className="disabled:opacity-50"
                    title="クリックで解除"
                  >
                    <TagBadge tag={t} />
                  </button>
                ))
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowTagPicker((v) => !v)}
            >
              タグを追加
            </Button>
            {showTagPicker && (
              <div className="flex flex-wrap gap-1.5 rounded-md border border-border p-2">
                {assignable.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    追加できるタグがありません
                  </div>
                ) : (
                  assignable.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={busyTagId === t.id}
                      onClick={() => toggleTag(t.id, false)}
                      className="disabled:opacity-50"
                      title="クリックで追加"
                    >
                      <TagBadge tag={t} />
                    </button>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="memo" className="space-y-3">
            <SectionTitle>メモ</SectionTitle>
            <div className="space-y-2">
              {(memos ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  メモはまだありません
                </div>
              ) : (
                (memos ?? []).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-md border border-border p-2 text-sm flex items-start gap-2"
                  >
                    <div className="flex-1 min-w-0 whitespace-pre-wrap break-words">
                      {m.title && <div className="font-medium">{m.title}</div>}
                      <div>{m.body}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMemo(m.id)}
                      className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                      aria-label="メモを削除"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            <Textarea
              rows={3}
              value={memoDraft}
              onChange={(e) => setMemoDraft(e.target.value)}
              placeholder="メモを入力"
            />
            <Button
              size="sm"
              className="w-full"
              onClick={handleAddMemo}
              disabled={savingMemo || memoDraft.trim().length === 0}
            >
              {savingMemo ? "追加中…" : "メモを追加"}
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
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
  icon?: typeof faStairs;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            className="size-3 text-muted-foreground"
          />
        )}
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EditIconBtn() {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-foreground"
    >
      <FontAwesomeIcon icon={faPenToSquare} className="size-3" />
    </Button>
  );
}

function RefreshIconBtn() {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-foreground"
    >
      <FontAwesomeIcon icon={faArrowsRotate} className="size-3" />
    </Button>
  );
}
