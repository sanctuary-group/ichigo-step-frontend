"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faMagnifyingGlass,
    faTrashCan,
    faPenToSquare,
    faInbox,
    faBell,
} from "@fortawesome/free-solid-svg-icons";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import {
    fetchReminders,
    deleteReminder as deleteReminderApi,
    toggleReminder,
} from "@/lib/api/reminders";
import type { ReminderRow } from "@/types/reminder";

function formatYmd(iso: string): string {
    const d = new Date(iso);
    const p = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default function RemindersIndex() {
    const router = useRouter();
    const { currentChannelId } = useAuth();
    const [query, setQuery] = useState("");
    const [appliedQuery, setAppliedQuery] = useState("");

    const { data, mutate } = useResource(
        currentChannelId ? `reminders:${currentChannelId}:${appliedQuery}` : null,
        () => fetchReminders({ q: appliedQuery || undefined }),
    );
    const reminders = data ?? [];

    const onSearch = (e: FormEvent) => {
        e.preventDefault();
        setAppliedQuery(query.trim());
    };

    const toggleActive = async (r: ReminderRow) => {
        await toggleReminder(String(r.id));
        mutate();
    };

    const deleteReminder = async (r: ReminderRow) => {
        if (!confirm(`「${r.name}」を削除しますか？`)) return;
        await deleteReminderApi(String(r.id));
        mutate();
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-muted/30">
                <h1 className="text-lg font-bold tracking-tight">
                    リマインド配信
                </h1>
                <Link
                    href="/reminders/new"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 rounded-md font-bold text-sm transition-colors"
                >
                    <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                    新規作成
                </Link>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border">
                <form onSubmit={onSearch} className="relative w-72 max-w-full">
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        placeholder="リマインド名で検索"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </form>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/60 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left font-bold">名前</th>
                            <th className="px-4 py-2 text-left font-bold w-28">ステップ数</th>
                            <th className="px-4 py-2 text-left font-bold w-28">登録中</th>
                            <th className="px-4 py-2 text-left font-bold w-32">作成日</th>
                            <th className="px-4 py-2 text-left font-bold w-24">稼働</th>
                            <th className="px-4 py-2 text-left font-bold w-20">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reminders.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
                                        <FontAwesomeIcon
                                            icon={faInbox}
                                            className="size-14 text-muted-foreground/30"
                                        />
                                        <div className="text-sm">
                                            まだリマインドがありません
                                        </div>
                                        <Link
                                            href="/reminders/new"
                                            className="text-xs text-blue-600 dark:text-blue-400 underline"
                                        >
                                            新規作成する
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            reminders.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() =>
                                        router.push(`/reminders/${r.id}/edit`)
                                    }
                                    className="border-b border-border hover:bg-muted/30 cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon
                                                icon={faBell}
                                                className="size-3.5 text-muted-foreground"
                                            />
                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                {r.name}
                                            </span>
                                        </div>
                                        {r.description && (
                                            <div className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                                                {r.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                                        {r.steps_count} ステップ
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                                        {r.friend_reminders_count} 人
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                                        {formatYmd(r.created_at)}
                                    </td>
                                    <td
                                        className="px-4 py-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Switch
                                            checked={r.is_active}
                                            onCheckedChange={() => toggleActive(r)}
                                        />
                                    </td>
                                    <td
                                        className="px-4 py-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={`/reminders/${r.id}/edit`}
                                                className="grid place-items-center size-8 rounded-md hover:bg-muted text-muted-foreground"
                                                aria-label="編集"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPenToSquare}
                                                    className="size-3.5"
                                                />
                                            </Link>
                                            <button
                                                onClick={() => deleteReminder(r)}
                                                className={cn(
                                                    "grid place-items-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive",
                                                )}
                                                aria-label="削除"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrashCan}
                                                    className="size-3.5"
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
