"use client";

import { useParams } from "next/navigation";

import { useResource } from "@/lib/api/use-resource";
import { fetchChannelDetails } from "@/lib/api/channels";
import { fetchRawReminder } from "@/lib/api/reminders";
import { ReminderFormInner, type ChannelOption } from "../../builder-form";

export default function EditReminderPage() {
    const params = useParams();
    const id = String(params.id);

    const { data, isLoading, error } = useResource(
        `reminder-form-edit-${id}`,
        async () => {
            const [record, channels] = await Promise.all([
                fetchRawReminder(id),
                fetchChannelDetails(),
            ]);
            return { record, channels };
        },
    );

    if (isLoading || !data) {
        return (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                {error ? "読み込みに失敗しました" : "読み込み中..."}
            </div>
        );
    }

    const channels: ChannelOption[] = data.channels.map((c) => ({
        id: Number(c.id),
        name: c.name,
    }));

    return (
        <ReminderFormInner
            reminder={data.record}
            editId={id}
            channels={channels}
        />
    );
}
