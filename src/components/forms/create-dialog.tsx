"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Folder } from "@/lib/api/folders";

const MAX_NAME = 100;

export function CreateDialog({
  open,
  onClose,
  folders,
  defaultFolderId,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>(defaultFolderId ?? "");

  useEffect(() => {
    if (open) {
      setName("");
      setFolderId(defaultFolderId ?? folders[0]?.id ?? "");
    }
  }, [open, defaultFolderId, folders]);

  const onSubmit = () => {
    const params = new URLSearchParams({ name });
    if (folderId) params.set("folder", folderId);
    router.push(`/forms/new?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-center text-lg font-bold">
          フォーム 新規作成
        </DialogTitle>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <Label htmlFor="fm-name" className="text-sm font-bold">
                管理名
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {name.length}/{MAX_NAME}
              </span>
            </div>
            <Input
              id="fm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              placeholder="管理名を入力して下さい"
              className="h-11"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold">フォルダ</Label>
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
          </div>
          <div className="pt-2 flex justify-end">
            <button
              disabled={name.length === 0}
              onClick={onSubmit}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
            >
              <FontAwesomeIcon icon={faFileLines} className="size-3.5" />
              フォームの作成に進む
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
