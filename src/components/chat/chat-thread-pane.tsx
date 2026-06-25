"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperclip,
  faEnvelope,
  faEnvelopeOpen,
  faFaceSmile,
  faPaperPlane,
  faChevronLeft,
  faCircleInfo,
  faComments,
  faXmark,
  faBookmark,
  faAddressCard,
  faLink,
  faChevronDown,
  faPenToSquare,
  faCheck,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { type MockFriend } from "@/mocks/data";
import {
  fetchFriendMessages,
  toggleFriendPin,
  setFriendChatStatus,
} from "@/lib/api/friends";
import {
  sendTextMessage,
  sendImageMessage,
  toggleFriendRead,
} from "@/lib/api/messages";
import { fetchChatStatuses } from "@/lib/api/chat-statuses";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

/** チャット設定のうちスレッドペインが参照する分。chat-settings 由来。 */
export type ChatThreadSettings = {
  send_shortcut?: "shift_enter_send" | "enter_send";
  send_preview?: boolean;
};

export function ChatThreadPane({
  friend,
  mobileVisible = true,
  onBack,
  onShowInfo,
  onSent,
  onChanged,
  chatSettings,
}: {
  friend: MockFriend | undefined;
  mobileVisible?: boolean;
  onBack?: () => void;
  onShowInfo?: () => void;
  onSent?: () => void;
  onChanged?: () => void;
  chatSettings?: ChatThreadSettings;
}) {
  const { data: messages = [], mutate } = useResource(
    friend ? `messages:${friend.id}` : null,
    () => fetchFriendMessages(friend!.id),
  );

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
      <ChatHeader
        friend={friend}
        onBack={onBack}
        onShowInfo={onShowInfo}
        onChanged={onChanged}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState
            icon={faComments}
            title="まだメッセージがありません"
            description="LINE から最初のメッセージを送ってもらいましょう"
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

      <Composer
        friend={friend}
        chatSettings={chatSettings}
        onSent={() => {
          mutate();
          onSent?.();
        }}
        onChanged={onChanged}
      />
    </div>
  );
}

function ChatHeader({
  friend,
  onBack,
  onShowInfo,
  onChanged,
}: {
  friend: MockFriend;
  onBack?: () => void;
  onShowInfo?: () => void;
  onChanged?: () => void;
}) {
  const { currentChannelId } = useAuth();
  const { data: chatStatuses = [] } = useResource(
    currentChannelId ? `chat-statuses:${currentChannelId}` : null,
    () => fetchChatStatuses(),
  );
  const name = friend.displayName;
  const isPinned = !!friend.pinned;
  const currentStatus = chatStatuses.find((s) => s.id === friend.chatStatusId);

  const togglePin = async () => {
    await toggleFriendPin(friend.id);
    onChanged?.();
  };

  const setChatStatus = async (statusId: string | null) => {
    await setFriendChatStatus(friend.id, statusId);
    onChanged?.();
  };

  // ヘッダーのバーをクリックすると、いちごユーザーID（友だちID）をコピーする。
  // ボタン・リンクなどの操作要素をクリックしたときはコピーしない。
  const [idCopied, setIdCopied] = useState(false);
  const copyIchigoUserId = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest("button, a, input, [role='menu']")
    ) {
      return;
    }
    try {
      await navigator.clipboard.writeText(String(friend.id));
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 1500);
    } catch {
      // クリップボード非対応環境は無視
    }
  };

  // 友だち情報詳細ページへの共有リンクをコピーする。
  const [shareCopied, setShareCopied] = useState(false);
  const copyShareLink = async () => {
    const url = `${window.location.origin}/friends/${friend.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      // クリップボード非対応環境は無視
    }
  };

  return (
    <div
      className="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 h-14 border-b border-border bg-background shrink-0 cursor-pointer"
      onClick={copyIchigoUserId}
      title="クリックでいちごユーザーIDをコピー"
    >
      {idCopied && (
        <div className="absolute left-1/2 top-full z-20 -translate-x-1/2 translate-y-1 rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background shadow">
          いちごユーザーID（{friend.id}）をコピーしました
        </div>
      )}
      <Button
        variant="ghost"
        className="lg:hidden text-muted-foreground size-9 p-0"
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
              className={cn(
                "hidden lg:inline-flex size-9 p-0",
                isPinned
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={togglePin}
              aria-label={isPinned ? "ピン留めを解除" : "ピン留め"}
            />
          }
        >
          <FontAwesomeIcon icon={faBookmark} className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          {isPinned ? "ピン留めを解除" : "ピン留め"}
        </TooltipContent>
      </Tooltip>

      <a
        href={`/friends/${friend.id}`}
        className="group flex items-center gap-1 sm:gap-2 min-w-0 rounded-md -mx-1 px-1 py-0.5 hover:bg-muted/60 transition-colors"
        aria-label={`${name} の詳細情報を開く`}
        title="友だちの詳細情報を開く"
      >
        <div className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full size-8">
          {friend.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={friend.pictureUrl}
              alt={name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="size-full bg-zinc-400 bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faUser} className="size-1/2" />
            </div>
          )}
        </div>
        <div className="font-medium text-sm text-primary truncate min-w-0 group-hover:underline">
          {name}
        </div>
      </a>

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              className="hidden xl:inline-flex text-muted-foreground hover:text-foreground size-9 p-0"
              disabled
              aria-label="名刺"
            />
          }
        >
          <FontAwesomeIcon icon={faAddressCard} className="size-4" />
        </TooltipTrigger>
        <TooltipContent>名刺（次フェーズ）</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              className={cn(
                "hidden xl:inline-flex size-9 p-0",
                shareCopied
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={copyShareLink}
              aria-label="友だち詳細ページの共有リンクをコピー"
            />
          }
        >
          <FontAwesomeIcon
            icon={shareCopied ? faCheck : faLink}
            className="size-4"
          />
        </TooltipTrigger>
        <TooltipContent>
          {shareCopied
            ? "リンクをコピーしました"
            : "友だち詳細の共有リンクをコピー"}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className="hidden sm:inline-flex h-8 rounded-full gap-1.5 text-xs px-3"
            />
          }
        >
          {currentStatus ? (
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: currentStatus.color }}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: currentStatus.color }}
              />
              {currentStatus.name}
            </span>
          ) : (
            <span className="text-muted-foreground">ステータスなし</span>
          )}
          <FontAwesomeIcon
            icon={faChevronDown}
            className="size-2.5 text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => setChatStatus(null)}
            className={
              friend.chatStatusId == null ? "bg-muted font-medium" : ""
            }
          >
            ステータスなし
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          {chatStatuses.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => setChatStatus(s.id)}
              className={cn(
                "gap-2",
                friend.chatStatusId === s.id ? "bg-muted font-medium" : "",
              )}
              style={{ color: s.color }}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href="/chat/settings"
              className="hidden xl:inline-flex items-center justify-center rounded-lg size-9 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted/50 transition-colors"
              aria-label="チャット設定"
            />
          }
        >
          <FontAwesomeIcon icon={faPenToSquare} className="size-4" />
        </TooltipTrigger>
        <TooltipContent>チャット設定</TooltipContent>
      </Tooltip>

      <Button
        variant="ghost"
        className="lg:hidden text-muted-foreground size-9 p-0"
        onClick={onShowInfo}
        aria-label="友だち情報を表示"
      >
        <FontAwesomeIcon icon={faCircleInfo} className="size-4" />
      </Button>
    </div>
  );
}

function Composer({
  friend,
  chatSettings,
  onSent,
  onChanged,
}: {
  friend: MockFriend;
  chatSettings?: ChatThreadSettings;
  onSent?: () => void;
  onChanged?: () => void;
}) {
  const sendShortcut = chatSettings?.send_shortcut ?? "shift_enter_send";
  const sendPreview = chatSettings?.send_preview ?? true;

  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 友だち切り替え時に下書きをリセット
  useEffect(() => {
    setContent("");
    setImage(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
    setEmojiOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [friend.id]);

  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !document.getElementById("emoji-popover")?.contains(target) &&
        !document.getElementById("emoji-trigger")?.contains(target)
      ) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiOpen]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setImage(file);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doSend = async () => {
    if (processing) return;
    const hasImage = !!image;
    const text = content.trim();
    if (!hasImage && text.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      if (hasImage) {
        await sendImageMessage(friend.id, image);
      } else {
        await sendTextMessage(friend.id, text);
      }
      setContent("");
      clearImage();
      setPreviewOpen(false);
      onSent?.();
      inputRef.current?.focus();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "送信に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setProcessing(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const hasImage = !!image;
    const hasText = content.trim().length > 0;
    if (!hasImage && !hasText) return;
    if (processing) return;

    if (sendPreview) {
      setPreviewOpen(true);
      return;
    }
    void doSend();
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // textarea を内容に応じて自動リサイズ（最大約6行）
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [content]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    // IME変換確定のEnterは送信・改行どちらにも使わない
    if (e.nativeEvent.isComposing) return;
    const sendOnPlainEnter = sendShortcut === "enter_send";
    const shouldSend = sendOnPlainEnter ? !e.shiftKey : e.shiftKey;
    if (shouldSend) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
    // それ以外は既定動作（textareaに改行が挿入される）
  };

  const toggleRead = async () => {
    await toggleFriendRead(friend.id);
    onChanged?.();
  };

  const canSend =
    friend.isFollowing &&
    !processing &&
    (content.trim().length > 0 || !!image);
  const isUnread = friend.unreadCount > 0;

  return (
    <div className="border-t border-border bg-background px-4 py-3 shrink-0 relative">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 p-2 rounded-md bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="送信予定の画像"
            className="size-16 rounded object-cover"
          />
          <div className="flex-1 text-xs text-muted-foreground">
            画像を送信します
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-7 p-0 text-muted-foreground"
            onClick={clearImage}
            aria-label="画像を破棄"
          >
            <FontAwesomeIcon icon={faXmark} className="size-3.5" />
          </Button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 max-w-3xl mx-auto"
      >
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground size-9 p-0"
            aria-label="画像を添付"
            onClick={() => fileInputRef.current?.click()}
            disabled={!friend.isFollowing || processing}
          >
            <FontAwesomeIcon icon={faPaperclip} className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-full size-9 p-0",
              isUnread
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isUnread ? "既読にする" : "未読にする"}
            title={isUnread ? "既読にする" : "未読にする"}
            onClick={toggleRead}
          >
            <FontAwesomeIcon
              icon={isUnread ? faEnvelope : faEnvelopeOpen}
              className="size-4"
            />
          </Button>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder={
              !friend.isFollowing
                ? "ブロック中のため送信できません"
                : imagePreview
                  ? "コメント（画像と同送できません）"
                  : "メッセージを入力してください"
            }
            className="flex-1 resize-none min-h-10 max-h-36 rounded-2xl bg-muted/40 border border-transparent px-4 py-2 text-sm leading-5 outline-none focus-visible:border-ring disabled:opacity-50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!friend.isFollowing || processing || !!imagePreview}
          />
          <Button
            id="emoji-trigger"
            type="button"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground size-9 p-0"
            aria-label="絵文字"
            onClick={() => setEmojiOpen((v) => !v)}
            disabled={!friend.isFollowing || processing}
          >
            <FontAwesomeIcon icon={faFaceSmile} className="size-4" />
          </Button>
          <Button
            type="submit"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 size-9 p-0"
            aria-label="送信"
            disabled={!canSend}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
          </Button>
        </div>
        {error && (
          <div className="text-[11px] text-destructive text-center">
            {error}
          </div>
        )}
      </form>

      {emojiOpen && <EmojiPopover onSelect={insertEmoji} />}

      <Dialog
        open={previewOpen}
        onOpenChange={(o) => !o && setPreviewOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>送信プレビュー</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[80%] space-y-2">
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="送信画像プレビュー"
                    className="rounded-lg max-h-60 ml-auto"
                  />
                )}
                {content.trim().length > 0 && (
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap break-words">
                    {content}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              この内容で送信します。送信後の取り消しはできません。
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button type="button" onClick={() => void doSend()} disabled={processing}>
              {processing ? "送信中..." : "送信"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
  "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣",
  "😢", "😭", "😤", "😠", "😡", "🥺", "😱", "😨",
  "👍", "👎", "👏", "🙏", "💪", "🙌", "👌", "✌️",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔",
  "🎉", "🎊", "🎁", "🎂", "🍰", "☕", "🍻", "🌸",
  "⭐", "✨", "💡", "🔥", "💯", "✅", "❌", "❓",
];

function EmojiPopover({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div
      id="emoji-popover"
      className="absolute bottom-16 right-12 z-40 bg-popover border border-border rounded-lg shadow-lg p-2 grid grid-cols-9 gap-0.5"
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className="size-8 hover:bg-muted rounded text-lg"
        >
          {e}
        </button>
      ))}
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
