"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Folder } from "@/lib/api/folders";

/** 選択したリッチメニューを別フォルダへ一括移動するダイアログ。 */
export function BulkMoveDialog({
  open,
  onClose,
  folders,
  count,
  onMove,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  count: number;
  onMove: (folderId: string) => void;
}) {
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? "");

  useEffect(() => {
    if (open) setFolderId(folders[0]?.id ?? "");
  }, [open, folders]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>一括フォルダ変更</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            選択した {count} 件を移動するフォルダを選択してください。
          </p>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              type="button"
              disabled={!folderId}
              onClick={() => onMove(folderId)}
            >
              移動する
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
