import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faLayerGroup,
  faRobot,
  faFile,
  faVideo,
  faMicrophone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { MockMessage, MockMessageType } from "@/mocks/data";

const NON_TEXT_ICON: Partial<Record<MockMessageType, IconDefinition>> = {
  image: faImage,
  video: faVideo,
  audio: faMicrophone,
  file: faFile,
  flex: faLayerGroup,
  location: faMapMarkerAlt,
};

export function ChatBubble({ message }: { message: MockMessage }) {
  const isOutgoing = message.direction === "outgoing";
  const icon = NON_TEXT_ICON[message.type];

  return (
    <div
      className={cn(
        "flex flex-col max-w-[75%]",
        isOutgoing ? "self-end items-end" : "self-start items-start",
      )}
    >
      {isOutgoing && message.source === "scenario" && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
          <FontAwesomeIcon icon={faRobot} className="size-3" />
          <span>ステップ配信</span>
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap break-words",
          isOutgoing
            ? "bg-primary/10 text-foreground rounded-tr-sm"
            : "bg-white border border-border rounded-tl-sm",
        )}
      >
        {message.type === "text" && linkify(message.content)}
        {message.type === "sticker" && (
          <div className="text-muted-foreground">[スタンプ]</div>
        )}
        {message.type === "postback" && (
          <div className="text-muted-foreground text-xs">
            [ボタン操作] {message.content}
          </div>
        )}
        {(message.type === "image" ||
          message.type === "video" ||
          message.type === "audio") && (
          <MediaBubble type={message.type} content={message.content} />
        )}
        {icon &&
          !["image", "video", "audio"].includes(message.type) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FontAwesomeIcon icon={icon} className="size-4" />
              <span>
                {message.type === "file" && "ファイル"}
                {message.type === "flex" && "Flex メッセージ"}
                {message.type === "location" && "位置情報"}
              </span>
            </div>
          )}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 px-1">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}

/**
 * テキスト中の http(s) URL を <a> に変換する。
 * URL 以外は React の通常文字列レンダリングのまま扱うため XSS にはならない。
 */
function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(https?:\/\/[^\s<]+)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }

    let url = m[0];
    let trail = "";
    // 末尾の句読点・閉じ括弧はリンクから除外する
    const tm = url.match(/[.,!?;:)\]}、。）]+$/);
    if (tm) {
      trail = tm[0];
      url = url.slice(0, url.length - trail.length);
    }

    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline break-all"
      >
        {url}
      </a>,
    );
    if (trail) {
      nodes.push(trail);
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

const MEDIA_META: Record<
  "image" | "video" | "audio",
  { icon: IconDefinition; label: string }
> = {
  image: { icon: faImage, label: "画像" },
  video: { icon: faVideo, label: "動画" },
  audio: { icon: faMicrophone, label: "音声" },
};

function MediaBubble({
  type,
  content,
}: {
  type: "image" | "video" | "audio";
  content: string;
}) {
  const { icon, label } = MEDIA_META[type];
  let url: string | null = null;
  let expired = false;
  try {
    const parsed = JSON.parse(content);
    url =
      parsed.original ??
      parsed.originalContentUrl ??
      parsed.preview ??
      parsed.previewImageUrl ??
      null;
    expired = parsed.expired === true;
  } catch {
    url = content || null;
  }

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FontAwesomeIcon icon={icon} className="size-4" />
        <span>{label}（保存期間が過ぎたため表示できません）</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FontAwesomeIcon icon={icon} className="size-4" />
        <span>{label}</span>
      </div>
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        controls
        className="max-w-xs max-h-64 rounded-lg border border-border"
      />
    );
  }

  if (type === "audio") {
    return <audio src={url} controls className="w-64 max-w-full" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block -mx-2 -my-1"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="画像"
        className="max-w-xs max-h-64 rounded-lg object-cover"
        loading="lazy"
      />
    </a>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
