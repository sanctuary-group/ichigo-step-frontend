"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPenToSquare,
  faArrowUp,
  faArrowDown,
  faArrowsUpDown,
  faCheck,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { FormEvent, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PreviewTestDialog } from "@/components/templates/preview-test-dialog";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import {
  fetchRawTemplate,
  updateTemplate,
  deleteTemplateMessage,
  bulkDeleteTemplateMessages,
  reorderTemplateMessages,
  setTemplateSendOption,
} from "@/lib/api/templates";
import { fetchFolders, type Folder } from "@/lib/api/folders";
import { cn } from "@/lib/utils";
import type { Template, TemplateMessage } from "@/types/template";

const MAX_NAME = 20;

export default function TemplateEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { currentChannelId } = useAuth();

  const { data, mutate } = useResource(
    currentChannelId ? `template-edit:${currentChannelId}:${id}` : null,
    async () => {
      const [template, folders] = await Promise.all([
        fetchRawTemplate(id),
        fetchFolders("template-folders"),
      ]);
      return { template, folders };
    },
  );

  if (!data) {
    return (
      <div className="flex-1 grid place-items-center p-8 text-sm text-muted-foreground">
        読み込み中…
      </div>
    );
  }
  if (!data.template) {
    return (
      <div className="flex-1 grid place-items-center p-8 text-sm text-destructive">
        テンプレートが見つかりませんでした。
      </div>
    );
  }

  return (
    <TemplateEditInner
      template={data.template}
      folders={data.folders}
      onChanged={mutate}
    />
  );
}

function TemplateEditInner({
  template,
  folders,
  onChanged,
}: {
  template: Template;
  folders: Folder[];
  onChanged: () => void;
}) {
  const router = useRouter();
  const messages = template.messages ?? [];

  const [name, setName] = useState(template.name);
  const [folderId, setFolderId] = useState<number>(
    template.template_folder_id ?? Number(folders[0]?.id ?? 0),
  );
  const [saving, setSaving] = useState(false);

  const [reorder, setReorder] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendOptOpen, setSendOptOpen] = useState(false);

  const addUrl = `/templates/${template.id}/messages/new`;
  const editUrl = (m: TemplateMessage) =>
    `/templates/${template.id}/messages/${m.id}/edit`;

  const moveMessage = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= messages.length) return;
    const ids = messages.map((m) => m.id as number);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await reorderTemplateMessages(template.id, ids);
    onChanged();
  };

  const removeMessage = async (m: TemplateMessage) => {
    if (!confirm("このメッセージを削除しますか？")) return;
    await deleteTemplateMessage(template.id, m.id as number);
    onChanged();
  };

  const toggleCheck = (mid: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(mid)) next.delete(mid);
      else next.add(mid);
      return next;
    });
  };
  const allChecked = messages.length > 0 && checked.size === messages.length;
  const toggleAll = () => {
    setChecked(
      allChecked ? new Set() : new Set(messages.map((m) => m.id as number)),
    );
  };
  const bulkDelete = async () => {
    if (checked.size === 0) return;
    if (!confirm(`${checked.size}件のメッセージを削除しますか？`)) return;
    await bulkDeleteTemplateMessages(template.id, Array.from(checked));
    setChecked(new Set());
    onChanged();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTemplate(template.id, {
        name,
        template_folder_id: folderId,
      });
      router.push("/templates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,2fr)_minmax(0,1.5fr)] gap-4 lg:gap-8 items-start">
          <div>
            <h1 className="text-xl font-bold tracking-tight">テンプレート編集</h1>
            <span className="text-xs text-muted-foreground">
              テンプレートの配信カウントについて
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-end justify-between">
              <Label htmlFor="tpl-name" className="text-sm font-bold">
                管理名
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {name.length}/{MAX_NAME}
              </span>
            </div>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">フォルダ</Label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-3">
          <h2 className="text-base font-bold">メッセージ登録</h2>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Link
              href={addUrl}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 border-primary text-primary hover:bg-primary/10 hover:text-primary",
              )}
            >
              <FontAwesomeIcon icon={faPlus} className="size-3" />
              メッセージ追加
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-blue-600 dark:text-blue-400"
                disabled={messages.length === 0}
                onClick={() => setPreviewOpen(true)}
              >
                プレビュー・テスト
              </Button>
              <Button
                type="button"
                variant={reorder ? "default" : "outline"}
                size="sm"
                className="h-9"
                disabled={messages.length === 0}
                onClick={() => setReorder((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={reorder ? faCheck : faArrowsUpDown}
                  className="size-3"
                />
                {reorder ? "完了" : "並べ替え"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setSendOptOpen(true)}
              >
                送信オプション / {template.delay_send ? "ON" : "OFF"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-destructive hover:text-destructive"
                disabled={checked.size === 0}
                onClick={bulkDelete}
              >
                一括削除
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      disabled={messages.length === 0}
                      className="size-4 rounded border-border accent-primary"
                      aria-label="すべて選択"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground">
                    内容
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-foreground w-28">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      メッセージが登録されていません
                    </td>
                  </tr>
                ) : (
                  messages.map((m, i) => (
                    <tr
                      key={m.id}
                      className="border-t border-border hover:bg-muted/30 align-top"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked.has(m.id as number)}
                          onChange={() => toggleCheck(m.id as number)}
                          className="size-4 rounded border-border accent-primary"
                          aria-label={`${i + 1} を選択`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <MessagePreview message={m} />
                      </td>
                      <td className="px-3 py-3">
                        {reorder ? (
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                              aria-label="上へ"
                              disabled={i === 0}
                              onClick={() => moveMessage(i, -1)}
                            >
                              <FontAwesomeIcon icon={faArrowUp} className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="size-9 p-0 text-muted-foreground disabled:opacity-30"
                              aria-label="下へ"
                              disabled={i === messages.length - 1}
                              onClick={() => moveMessage(i, 1)}
                            >
                              <FontAwesomeIcon icon={faArrowDown} className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={editUrl(m)}
                              aria-label="編集"
                              className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "size-9 p-0",
                              )}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                            </Link>
                            <Button
                              type="button"
                              variant="ghost"
                              className="size-9 p-0 text-muted-foreground hover:text-destructive"
                              aria-label="削除"
                              onClick={() => removeMessage(m)}
                            >
                              <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="outline"
            disabled={saving}
            className="border-primary text-primary hover:bg-primary/10 hover:text-primary h-10 px-6"
          >
            {saving ? "保存中..." : "保存して一覧に戻る"}
          </Button>
          <Link
            href="/templates"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 px-6")}
          >
            戻る
          </Link>
        </div>
      </form>

      <PreviewTestDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        templateId={template.id}
        messages={messages}
      />

      <SendOptionDialog
        open={sendOptOpen}
        onClose={() => setSendOptOpen(false)}
        templateId={template.id}
        delaySend={template.delay_send ?? false}
        onSaved={onChanged}
      />
    </>
  );
}

function SendOptionDialog({
  open,
  onClose,
  templateId,
  delaySend,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  templateId: number;
  delaySend: boolean;
  onSaved: () => void;
}) {
  const [on, setOn] = useState(delaySend);
  const [saving, setSaving] = useState(false);

  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setOn(delaySend);
    setWasOpen(true);
  }
  if (!open && wasOpen) setWasOpen(false);

  const save = async () => {
    setSaving(true);
    try {
      await setTemplateSendOption(templateId, on);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-center text-lg font-bold">
          送信オプション
        </DialogTitle>

        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">
              メッセージを1通ずつ数秒遅延させて送信する
            </span>
            <Switch checked={on} onCheckedChange={setOn} />
          </div>

          <div className="rounded-md bg-muted/50 p-4 space-y-3">
            <p className="text-center text-sm font-bold">注意点</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                ・送信オプションを利用した場合、1メッセージ1通とカウントされるため通常のテンプレート配信に比べ配信数が増加します。
              </li>
              <li>
                ・多数の友だちに同時にテンプレートを送信した場合、1通ごとの送信間隔が数十秒かかる可能性があります。
              </li>
              <li>
                ・メッセージ配信、ステップ配信でテンプレートを引用した場合、この設定は適応されません。
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={save}
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-10"
            >
              {saving ? "保存中..." : "変更を保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessagePreview({ message }: { message: TemplateMessage }) {
  if (message.message_type === "image") {
    return (
      <div className="flex items-center gap-2">
        {message.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.image_url}
            alt=""
            className="size-12 rounded border border-border object-cover shrink-0"
          />
        ) : null}
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <FontAwesomeIcon icon={faImage} className="size-3" />
          画像
        </span>
      </div>
    );
  }
  return (
    <div className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap max-w-2xl">
      {message.text_content || <span className="italic">（本文未設定）</span>}
    </div>
  );
}
