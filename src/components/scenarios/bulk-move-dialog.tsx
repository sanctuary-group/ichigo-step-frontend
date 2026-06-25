"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bulkMoveScenarios } from "@/lib/api/scenarios";
import type { Folder } from "@/lib/api/folders";

export function BulkMoveDialog({
  open,
  onClose,
  folders,
  ids,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  ids: string[];
  onDone: () => void;
}) {
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? "");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setFolderId(folders[0]?.id ?? "");
      setProcessing(false);
    }
  }, [open, folders]);

  const submit = async () => {
    if (!folderId) return;
    setProcessing(true);
    try {
      await bulkMoveScenarios(ids, folderId);
      onDone();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォルダを変更（{ids.length}件）</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>移動先フォルダ</Label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            キャンセル
          </Button>
          <Button onClick={submit} disabled={!folderId || processing}>
            {processing ? "変更中..." : "変更"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
