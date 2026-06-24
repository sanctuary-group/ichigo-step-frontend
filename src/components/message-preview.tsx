import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faLayerGroup } from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";
import type { MockMessageType } from "@/mocks/data";

/**
 * 配信エディタやステップエディタで使う LINE 風メッセージプレビュー。
 * 受信側（左寄せ、白いバブル）として表示する。
 */
export function MessagePreview({
  type,
  content,
  authorName = "ichigo-step 公式LINE",
  className,
}: {
  type: MockMessageType;
  content: string;
  authorName?: string;
  className?: string;
}) {
  return (
    <div className={cn("p-4 rounded-2xl bg-[#7BB8C9]/30", className)}>
      <div className="flex items-start gap-2">
        <div className="size-9 rounded-full bg-white grid place-items-center text-xs font-bold text-primary shrink-0">
          {authorName.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-foreground/70 mb-1">{authorName}</div>
          <div
            className={cn(
              "inline-block max-w-full rounded-2xl px-4 py-2.5 text-sm shadow-sm bg-white whitespace-pre-wrap break-words"
            )}
          >
            {type === "text" && (content || "メッセージ本文を入力…")}
            {type === "image" && (
              <div className="flex flex-col gap-2 -mx-2 -my-1">
                <div className="grid place-items-center w-56 h-32 rounded-lg bg-muted text-muted-foreground">
                  <FontAwesomeIcon icon={faImage} className="size-6" />
                </div>
                {content && (
                  <div className="text-xs text-muted-foreground px-1">
                    {content}
                  </div>
                )}
              </div>
            )}
            {type === "flex" && (
              <div className="flex items-center gap-2 text-muted-foreground py-1">
                <FontAwesomeIcon icon={faLayerGroup} className="size-4" />
                <span>{content || "Flex Message"}</span>
              </div>
            )}
            {type === "sticker" && (
              <div className="text-3xl">{content || "🌸"}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
