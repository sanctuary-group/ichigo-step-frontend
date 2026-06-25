"use client";

import { useParams } from "next/navigation";

import { useResource } from "@/lib/api/use-resource";
import { fetchFolders } from "@/lib/api/folders";
import {
    fetchBuilderOptions,
    fetchTags,
    fetchChatStatuses,
} from "@/lib/api/builder-options";
import { fetchRawAutoReply } from "@/lib/api/auto-replies";
import {
    AutoReplyFormInner,
    type FolderOption,
} from "../../builder-form";

export default function EditAutoReplyPage() {
    const params = useParams();
    const id = String(params.id);

    const { data, isLoading, error } = useResource(
        `auto-reply-form-edit-${id}`,
        async () => {
            const [record, folders, options, tags, chatStatuses] = await Promise.all([
                fetchRawAutoReply(id),
                fetchFolders("auto-reply-folders"),
                fetchBuilderOptions(),
                fetchTags(),
                fetchChatStatuses(),
            ]);
            return { record, folders, options, tags, chatStatuses };
        },
    );

    if (isLoading || !data) {
        return (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                {error ? "読み込みに失敗しました" : "読み込み中..."}
            </div>
        );
    }

    const folderOptions: FolderOption[] = data.folders.map((f) => ({
        id: Number(f.id),
        name: f.name,
        is_system: f.isSystem,
    }));
    const defaultFolderId =
        folderOptions.find((f) => !f.is_system)?.id ?? folderOptions[0]?.id ?? null;

    return (
        <AutoReplyFormInner
            autoReply={data.record}
            editId={id}
            folders={folderOptions}
            defaultFolderId={defaultFolderId}
            options={data.options}
            tags={data.tags}
            chatStatuses={data.chatStatuses}
        />
    );
}
