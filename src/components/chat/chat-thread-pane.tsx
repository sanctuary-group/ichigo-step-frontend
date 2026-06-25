"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faAddressCard,
  faLink,
  faPenToSquare,
  faPaperclip,
  faEnvelope,
  faFaceSmile,
  faPaperPlane,
  faChevronDown,
  faChevronLeft,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { EmptyState } from "@/components/empty-state";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { type MockFriend } from "@/mocks/data";
import { useState } from "react";
import {
  fetchFriendMessages,
  sendFriendMessage,
  toggleFriendPin,
  setFriendChatStatus,
} from "@/lib/api/friends";
import { fetchChatStatuses } from "@/lib/api/chat-statuses";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatThreadPane({
  friend,
  mobileVisible = true,
  onBack,
  onShowInfo,
  onSent,
  onChanged,
}: {
  friend: MockFriend | undefined;
  mobileVisible?: boolean;
  onBack?: () => void;
  onShowInfo?: () => void;
  onSent?: () => void;
  onChanged?: () => void;
}) {
  const { currentChannelId } = useAuth();
  const { data: messages = [], mutate } = useResource(
    friend ? `messages:${friend.id}` : null,
    () => fetchFriendMessages(friend!.id),
  );
  const { data: chatStatuses = [] } = useResource(
    currentChannelId ? `chat-statuses:${currentChannelId}` : null,
    () => fetchChatStatuses(),
  );
  const currentStatus = chatStatuses.find((s) => s.id === friend?.chatStatusId);

  async function handleTogglePin() {
    if (!friend) return;
    await toggleFriendPin(friend.id);
    onChanged?.();
  }

  async function handleSetStatus(statusId: string | null) {
    if (!friend) return;
    await setFriendChatStatus(friend.id, statusId);
    onChanged?.();
  }

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !friend || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendFriendMessage(friend.id, text);
      setDraft("");
      mutate();
      onSent?.();
    } catch (e) {
      setSendError(
        e instanceof ApiError ? e.message : "送信に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setSending(false);
    }
  }

  const mobileVisibilityClass = mobileVisible ? "flex" : "hidden";

  if (!friend) {
    return (
      <div
        className={`${mobileVisibilityClass} lg:flex flex-1 place-items-center bg-muted/20 min-w-0`}
      >
        <EmptyState
          icon={faComments}
          title="友だちを選択してください"
          description="左の一覧からトークを開始する友だちを選びます"
        />
      </div>
    );
  }

  return (
    <div
      className={`${mobileVisibilityClass} lg:flex flex-1 flex-col min-w-0 bg-muted/20`}
    >
      {/* Header */}
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 h-14 border-b border-border bg-background shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden text-muted-foreground"
          onClick={onBack}
          aria-label="一覧に戻る"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-4" />
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleTogglePin}
                className={
                  friend.pinned
                    ? "hidden lg:inline-flex text-primary"
                    : "hidden lg:inline-flex text-muted-foreground"
                }
              />
            }
          >
            <FontAwesomeIcon icon={faBookmark} className="size-4" />
          </TooltipTrigger>
          <TooltipContent>{friend.pinned ? "ピン留め解除" : "ピン留め"}</TooltipContent>
        </Tooltip>
        <Avatar className="size-8">
          <AvatarImage src={friend.pictureUrl} />
          <AvatarFallback>{friend.displayName.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="font-medium text-sm text-primary truncate min-w-0">
          {friend.displayName}
        </div>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden xl:inline-flex text-muted-foreground"
              />
            }
          >
            <FontAwesomeIcon icon={faAddressCard} className="size-4" />
          </TooltipTrigger>
          <TooltipContent>名刺</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden xl:inline-flex text-muted-foreground"
              />
            }
          >
            <FontAwesomeIcon icon={faLink} className="size-4" />
          </TooltipTrigger>
          <TooltipContent>関連リンク</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-8 rounded-full gap-1.5 text-xs"
              />
            }
          >
            {currentStatus ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                />
                {currentStatus.name}
              </span>
            ) : (
              "ステータスなし"
            )}
            <FontAwesomeIcon
              icon={faChevronDown}
              className="size-2.5 text-muted-foreground"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleSetStatus(null)}>
              ステータスなし
            </DropdownMenuItem>
            {chatStatuses.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => handleSetStatus(s.id)} className="gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden xl:inline-flex text-muted-foreground"
              />
            }
          >
            <FontAwesomeIcon icon={faPenToSquare} className="size-4" />
          </TooltipTrigger>
          <TooltipContent>編集</TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden text-muted-foreground"
          onClick={onShowInfo}
          aria-label="友だち情報を表示"
        >
          <FontAwesomeIcon icon={faCircleInfo} className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState
            icon={faComments}
            title="まだメッセージがありません"
            description="最初のメッセージを送りましょう（モックでは送信できません）"
          />
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            <DateDivider label={formatDateLabel(messages[0].timestamp)} />
            {messages.map((m, i) => {
              const showDate =
                i > 0 &&
                formatDateLabel(messages[i - 1].timestamp) !==
                  formatDateLabel(m.timestamp);
              return (
                <div key={m.id} className="flex flex-col gap-3">
                  {showDate && (
                    <DateDivider label={formatDateLabel(m.timestamp)} />
                  )}
                  <ChatBubble message={m} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background px-4 py-3 shrink-0">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>送信ユーザー名</span>
            <span className="font-medium text-foreground">
              ichigo-step 公式LINE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              aria-label="ファイル添付"
              disabled
            >
              <FontAwesomeIcon icon={faPaperclip} className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              aria-label="テンプレート"
              disabled
            >
              <FontAwesomeIcon icon={faEnvelope} className="size-4" />
            </Button>
            <Input
              placeholder="メッセージを入力してください"
              className="flex-1 h-10 rounded-full bg-muted/40 border-transparent"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              aria-label="絵文字"
              disabled
            >
              <FontAwesomeIcon icon={faFaceSmile} className="size-4" />
            </Button>
            <Button
              size="icon"
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              aria-label="送信"
              onClick={handleSend}
              disabled={sending || draft.trim().length === 0}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
            </Button>
          </div>
          {sendError && (
            <div className="text-[11px] text-destructive text-center">{sendError}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-2 self-center">
      <span className="text-[11px] text-muted-foreground px-3 py-0.5 rounded-full bg-background border border-border">
        {label}
      </span>
    </div>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
