"use client";

import { useResource } from "@/lib/api/use-resource";
import { fetchChannelDetails } from "@/lib/api/channels";
import { ReminderFormInner, type ChannelOption } from "../builder-form";

export default function NewReminderPage() {
    const { data, isLoading, error } = useResource("reminder-form", () =>
        fetchChannelDetails(),
    );

    if (isLoading || !data) {
        return (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                {error ? "読み込みに失敗しました" : "読み込み中..."}
            </div>
        );
    }

    const channels: ChannelOption[] = data.map((c) => ({
        id: Number(c.id),
        name: c.name,
    }));

    return <ReminderFormInner reminder={null} channels={channels} />;
}
