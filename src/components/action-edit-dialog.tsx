"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ACTION_TYPES = [
  "ステップ",
  "テンプレート",
  "テキスト",
  "リマインド",
  "タグ",
  "リッチメニュー",
  "ブックマーク",
  "友だち情報",
  "対応ステータス",
  "ブロック",
];

type ActionRow = {
  type: string;
  detail: string;
  filterLabel: string;
};

const DEFAULT_ROWS: ActionRow[] = [
  { type: "テンプレート", detail: "挨拶メッセージ", filterLabel: "絞込 未設定" },
];

export function ActionEditDialog({
  open,
  onOpenChange,
  rows = DEFAULT_ROWS,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows?: ActionRow[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 bg-background">
        <DialogTitle className="text-center text-lg font-bold py-5 border-b border-border">
          アクション
        </DialogTitle>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 p-6">
          <div className="space-y-2">
            {ACTION_TYPES.map((label) => (
              <button
                key={label}
                type="button"
                className="w-full flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
              >
                <FontAwesomeIcon
                  icon={faCirclePlus}
                  className="size-4 text-muted-foreground"
                />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2 min-h-[480px]">
            {rows.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-2.5"
              >
                <div className="text-sm font-medium w-28 shrink-0">
                  {row.type}
                </div>
                <div className="text-sm flex-1 min-w-0 truncate">
                  {row.detail}
                </div>
                <span className="rounded-md bg-muted text-xs px-2 py-1 text-muted-foreground whitespace-nowrap">
                  {row.filterLabel}
                </span>
                <button
                  type="button"
                  aria-label="削除"
                  className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-16 h-11 font-bold"
            onClick={() => onOpenChange(false)}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
