"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  MessageComposer,
  composerValid,
  defaultComposerValue,
  normalizeComposerValue,
  type ComposerValue,
  type FriendFieldFolder,
  type ScenarioOption,
  type TagOption,
} from "@/components/templates/message-composer";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import {
  fetchRawTemplate,
  createTemplateMessage,
  updateTemplateMessage,
  type TemplateMessageInput,
} from "@/lib/api/templates";
import {
  fetchFormFriendFieldFolders,
  fetchFormTags,
  fetchFormScenarios,
} from "@/lib/api/broadcast-form-data";
import type { TemplateMessage } from "@/types/template";

export function MessageEditForm({
  templateId,
  messageId,
}: {
  templateId: string;
  messageId?: string;
}) {
  const { currentChannelId } = useAuth();
  const isEdit = messageId != null;

  const { data } = useResource(
    currentChannelId
      ? `template-message-edit:${currentChannelId}:${templateId}:${messageId ?? "new"}`
      : null,
    async () => {
      const [template, friendFieldFolders, tags, scenarios] = await Promise.all([
        fetchRawTemplate(templateId),
        fetchFormFriendFieldFolders().catch(() => []),
        fetchFormTags().catch(() => []),
        fetchFormScenarios().catch(() => []),
      ]);
      const message = isEdit
        ? (template?.messages ?? []).find((m) => String(m.id) === String(messageId)) ??
          null
        : null;
      return { template, message, friendFieldFolders, tags, scenarios };
    },
  );

  if (!data) {
    return (
      <div className="flex-1 grid place-items-center p-8 text-sm text-muted-foreground">
        読み込み中…
      </div>
    );
  }
  if (!data.template || (isEdit && !data.message)) {
    return (
      <div className="flex-1 grid place-items-center p-8 text-sm text-destructive">
        メッセージが見つかりませんでした。
      </div>
    );
  }

  return (
    <MessageEditInner
      templateId={templateId}
      messageId={messageId}
      message={data.message}
      friendFieldFolders={data.friendFieldFolders as FriendFieldFolder[]}
      tags={data.tags as TagOption[]}
      scenarios={data.scenarios as ScenarioOption[]}
    />
  );
}

function MessageEditInner({
  templateId,
  messageId,
  message,
  friendFieldFolders,
  tags,
  scenarios,
}: {
  templateId: string;
  messageId?: string;
  message: TemplateMessage | null;
  friendFieldFolders: FriendFieldFolder[];
  tags: TagOption[];
  scenarios: ScenarioOption[];
}) {
  const router = useRouter();
  const isEdit = messageId != null;

  const [value, setValue] = useState<ComposerValue>(() =>
    defaultComposerValue(message),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const backUrl = `/templates/${templateId}/edit`;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    const payload = normalizeComposerValue(value) as TemplateMessageInput;
    try {
      if (isEdit) {
        await updateTemplateMessage(templateId, messageId!, payload);
      } else {
        await createTemplateMessage(templateId, payload);
      }
      router.push(backUrl);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <MessageComposer
        value={value}
        onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
        errors={errors as Partial<Record<keyof ComposerValue, string>>}
        lockType={isEdit}
        friendFieldFolders={friendFieldFolders}
        tags={tags}
        scenarios={scenarios}
      />

      <div className="flex items-center gap-3 pt-5">
        <Button
          type="submit"
          disabled={!composerValid(value) || processing}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10"
        >
          {processing ? "保存中..." : "保存"}
        </Button>
        <Link
          href={backUrl}
          className={cn(buttonVariants({ variant: "outline" }), "px-8 h-10")}
        >
          戻る
        </Link>
      </div>
    </form>
  );
}
