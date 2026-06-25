"use client";

import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchRawRichMenu } from "@/lib/api/rich-menus";
import {
    RICH_MENU_LAYOUTS,
    fetchRichMenuFolderOptions,
    fetchActionTemplates,
    fetchActionTemplateFolders,
    fetchRichMenuActionOptions,
} from "@/lib/api/rich-menu-form-data";
import type { LineChannel } from "@/types/broadcast";
import { RichMenuForm } from "../../builder-form";

// ── 編集ルート: 対象リッチメニュー + 各種 options を取得して共有ビルダーへ ──
export default function EditRichMenuPage() {
    const { currentChannelId } = useAuth();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const { data, error } = useResource(
        currentChannelId && id
            ? `rich-menu-form:${currentChannelId}:edit:${id}`
            : null,
        async () => {
            const [
                richMenu,
                channels,
                folders,
                actionTemplates,
                actionTemplateFolders,
                actionOptions,
            ] = await Promise.all([
                fetchRawRichMenu(id!),
                apiFetch<LineChannel[]>("/channels"),
                fetchRichMenuFolderOptions(),
                fetchActionTemplates(),
                fetchActionTemplateFolders(),
                fetchRichMenuActionOptions(),
            ]);
            return {
                richMenu,
                channels,
                folders,
                actionTemplates,
                actionTemplateFolders,
                actionOptions,
            };
        },
    );

    if (error) {
        return (
            <div className="flex-1 grid place-items-center p-8 text-sm text-destructive">
                読み込みに失敗しました。時間をおいて再度お試しください。
            </div>
        );
    }
    if (!data) {
        return (
            <div className="flex-1 grid place-items-center p-8 text-sm text-muted-foreground">
                読み込み中…
            </div>
        );
    }

    return (
        <RichMenuForm
            richMenu={data.richMenu}
            layouts={RICH_MENU_LAYOUTS}
            folders={data.folders}
            actionTemplates={data.actionTemplates}
            actionTemplateFolders={data.actionTemplateFolders}
            actionOptions={data.actionOptions}
            defaultFolderId={data.folders[0]?.id ?? null}
            channels={data.channels}
            tags={data.actionOptions.tags}
        />
    );
}
