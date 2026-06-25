"use client";

import { useParams } from "next/navigation";

import { ScenariosFormInner } from "../../builder-form";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import {
    fetchFormChannels,
    fetchFormTags,
    fetchFormChatStatuses,
    fetchFormFriendFieldFolders,
} from "@/lib/api/broadcast-form-data";
import {
    fetchScenarioImportTemplates,
    fetchScenarioTemplateFolders,
    fetchQuoteSources,
    fetchDefaultScenarioFolderId,
} from "@/lib/api/scenario-form-data";
import { fetchRawScenario } from "@/lib/api/scenarios";

// ── 編集ルート: 既存シナリオ + フォーム用 options を取得して Inner に渡す ──
export default function EditScenarioPage() {
    const { currentChannelId } = useAuth();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const { data, error } = useResource(
        currentChannelId && id
            ? `scenario-form:${currentChannelId}:edit:${id}`
            : null,
        async () => {
            const [
                scenario,
                channels,
                tags,
                chatStatuses,
                friendFieldFolders,
                templates,
                templateFolders,
                quoteSources,
                defaultFolderId,
            ] = await Promise.all([
                fetchRawScenario(String(id)),
                fetchFormChannels(),
                fetchFormTags(),
                fetchFormChatStatuses(),
                fetchFormFriendFieldFolders(),
                fetchScenarioImportTemplates(),
                fetchScenarioTemplateFolders(),
                fetchQuoteSources(),
                fetchDefaultScenarioFolderId(),
            ]);
            return {
                scenario,
                channels,
                tags,
                chatStatuses,
                friendFieldFolders,
                templates,
                templateFolders,
                quoteSources,
                defaultFolderId,
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
        <ScenariosFormInner
            scenario={data.scenario}
            defaultFolderId={data.defaultFolderId}
            friendFieldFolders={data.friendFieldFolders}
            templates={data.templates}
            templateFolders={data.templateFolders}
            quoteSources={data.quoteSources}
            channels={data.channels}
            tags={data.tags}
            chatStatuses={data.chatStatuses}
        />
    );
}
