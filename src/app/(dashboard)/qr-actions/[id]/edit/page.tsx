"use client";

import { useParams } from "next/navigation";

import { useResource } from "@/lib/api/use-resource";
import { fetchFolders } from "@/lib/api/folders";
import { fetchRawQrAction } from "@/lib/api/qr-actions";
import {
    fetchBuilderOptions,
    fetchTags,
    fetchChatStatuses,
} from "@/lib/api/builder-options";
import { QrActionForm, type FolderOption } from "../../builder-form";

export default function EditQrActionPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const { data, isLoading, error } = useResource(
        `qr-action-form:${id}`,
        async () => {
            const [record, folders, options, tags, chatStatuses] = await Promise.all([
                fetchRawQrAction(id),
                fetchFolders("qr-action-folders"),
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
        <QrActionForm
            qrAction={data.record}
            folders={folderOptions}
            options={data.options}
            tags={data.tags}
            chatStatuses={data.chatStatuses}
            accountName="あなたのLINE公式アカウント"
            defaultFolderId={defaultFolderId}
        />
    );
}
