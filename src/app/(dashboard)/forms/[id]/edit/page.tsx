"use client";

import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { fetchFolders } from "@/lib/api/folders";
import { fetchRawForm } from "@/lib/api/forms";
import type { FriendFieldOption, ScenarioOption } from "@/types/form";
import {
    FormEditor,
    type FolderOption,
    type SharedChannel,
    type SharedTag,
} from "../../builder-form";

// ── 編集ルート：fetchRawForm + options ローダーで FormEditor に model を渡す ──
export default function EditFormPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id);

    const { data, isLoading, error } = useResource(
        `form-builder:edit:${id}`,
        async () => {
            const [record, channels, tags, folders, friendFields, scenarios] =
                await Promise.all([
                    fetchRawForm(id),
                    apiFetch<SharedChannel[]>("/channels"),
                    apiFetch<SharedTag[]>("/tags"),
                    fetchFolders("form-folders"),
                    apiFetch<FriendFieldOption[]>("/friend-fields"),
                    apiFetch<ScenarioOption[]>("/scenarios"),
                ]);
            return { record, channels, tags, folders, friendFields, scenarios };
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
        folderOptions.find((f) => f.is_system)?.id ?? folderOptions[0]?.id ?? null;

    return (
        <FormEditor
            form={data.record}
            folders={folderOptions}
            friendFields={data.friendFields}
            scenarios={data.scenarios}
            defaultFolderId={defaultFolderId}
            channels={data.channels}
            tags={data.tags}
        />
    );
}
