import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faLayerGroup, faRobot } from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";
import type { MockMessage } from "@/mocks/data";

export function ChatBubble({ message }: { message: MockMessage }) {
  const isOutgoing = message.direction === "outgoing";
  return (
    <div
      className={cn(
        "flex flex-col max-w-[75%]",
        isOutgoing ? "self-end items-end" : "self-start items-start"
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
            : "bg-white border border-border rounded-tl-sm"
        )}
      >
        {message.type === "text" && message.content}
        {message.type === "image" && (
          <div className="flex flex-col gap-2 -mx-2 -my-1">
            <div className="grid place-items-center w-56 h-32 rounded-lg bg-muted text-muted-foreground">
              <FontAwesomeIcon icon={faImage} className="size-6" />
            </div>
            <div className="text-xs text-muted-foreground px-1">
              {message.content}
            </div>
          </div>
        )}
        {message.type === "flex" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <FontAwesomeIcon icon={faLayerGroup} className="size-4" />
            <span>{message.content}</span>
          </div>
        )}
        {message.type === "sticker" && (
          <div className="text-3xl">{message.content}</div>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 px-1">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
