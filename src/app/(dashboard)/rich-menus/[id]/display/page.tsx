"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMobileScreenButton,
    faBan,
    faUser,
    faCircleInfo,
    faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import {
    fetchRawRichMenu,
    fetchRichMenuDisplayData,
    displayRichMenu,
    type RichMenuDisplayFriend,
} from "@/lib/api/rich-menus";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import type { RichMenu } from "@/types/rich-menu";

function formatDateTime(v: string): string {
    if (!v) return "";
    const [date, time] = v.split("T");
    return `${date.replace(/-/g, "/")} ${time ?? ""}`.trim();
}

type Mode = "show" | "stop";
type Schedule = "now" | "reserved";
type Target = "all" | "individual";

export default function RichMenusDisplayPage() {
    const { currentChannelId } = useAuth();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const { data, error } = useResource(
        currentChannelId && id ? `rich-menu-display:${currentChannelId}:${id}` : null,
        async () => {
            const [richMenu, display] = await Promise.all([
                fetchRawRichMenu(id!),
                fetchRichMenuDisplayData(id!),
            ]);
            return { richMenu, ...display };
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
        <RichMenusDisplay
            richMenu={data.richMenu}
            displayCount={data.displayCount}
            followingCount={data.followingCount}
            friends={data.friends}
        />
    );
}

type DisplayProps = {
    richMenu: RichMenu;
    displayCount: number;
    followingCount: number;
    friends: RichMenuDisplayFriend[];
};

function RichMenusDisplay({
    richMenu,
    displayCount,
    followingCount,
    friends,
}: DisplayProps) {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("show");
    const [schedule, setSchedule] = useState<Schedule>("now");
    const [scheduledAt, setScheduledAt] = useState("");
    const [target, setTarget] = useState<Target>("all");
    const [selected, setSelected] = useState<Set<number>>(
        () => new Set(friends.filter((f) => f.linked).map((f) => f.id)),
    );
    const [query, setQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const filteredFriends = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return friends;
        return friends.filter((f) => f.name.toLowerCase().includes(q));
    }, [friends, query]);

    const toggleFriend = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // フッターの「確認にすすむ」: 入力チェックして確認モーダルを開く
    const openConfirm = () => {
        if (schedule === "reserved" && !scheduledAt) {
            alert(mode === "stop" ? "停止日時を設定してください" : "表示日時を設定してください");
            return;
        }
        if (mode === "show" && target === "individual" && selected.size === 0) {
            alert("表示する友だちを 1 人以上選択してください");
            return;
        }
        setConfirmOpen(true);
    };

    // 確認モーダルの「表示する / 停止する」: 実行する
    const submit = async () => {
        setSubmitting(true);
        try {
            await displayRichMenu(richMenu.id, {
                mode,
                schedule,
                scheduled_at: schedule === "reserved" ? scheduledAt : null,
                target,
                friend_ids: target === "individual" ? [...selected] : [],
            });
            setConfirmOpen(false);
            router.push("/rich-menus");
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "処理に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    // 確認モーダルに出すサマリ
    const timingLabel = mode === "show" ? "表示タイミング" : "停止予約日時";
    const timingValue =
        schedule === "reserved"
            ? formatDateTime(scheduledAt)
            : mode === "show"
              ? "すぐに表示する"
              : "すぐに停止する";
    const targetLabel =
        mode === "show"
            ? "リッチメニューを表示する友だち"
            : "リッチメニューを停止する友だち";
    const targetCount =
        target === "individual"
            ? selected.size
            : mode === "show"
              ? followingCount
              : displayCount;
    const targetValue =
        target === "individual"
            ? "個別に選択した友だち"
            : mode === "show"
              ? "ichigo-step 上の友だち全員"
              : "このリッチメニューが表示されている全員";

    return (
        <>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
                    {/* パンくず */}
                    <nav className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/rich-menus" className="hover:text-foreground">
                            TOP
                        </Link>
                        <span>›</span>
                        <span>リッチメニュー表示・停止の設定</span>
                    </nav>
                    <h1 className="mt-1 text-lg font-bold tracking-tight">
                        {richMenu.name}
                    </h1>

                    <div className="mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-6">
                        {/* 表示中の友だち数 */}
                        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                            <span className="text-sm font-medium">
                                このリッチメニューが表示されている友だち
                            </span>
                            <span className="inline-flex items-baseline gap-1">
                                <span className="text-lg font-bold tabular-nums">
                                    {displayCount}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    人
                                </span>
                            </span>
                        </div>

                        {/* 画像プレビュー */}
                        {richMenu.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={richMenu.image_url}
                                alt={richMenu.name}
                                className="w-full max-w-md rounded-lg border border-border"
                            />
                        ) : (
                            <div className="grid h-40 max-w-md place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                                画像が未設定です
                            </div>
                        )}

                        {/* 表示・停止の操作 */}
                        <section className="space-y-3">
                            <SectionLabel>リッチメニュー 表示・停止の操作</SectionLabel>
                            <div className="inline-flex rounded-lg border border-border p-1">
                                <ToggleButton
                                    active={mode === "show"}
                                    onClick={() => setMode("show")}
                                    icon={faMobileScreenButton}
                                >
                                    表示する
                                </ToggleButton>
                                <ToggleButton
                                    active={mode === "stop"}
                                    onClick={() => setMode("stop")}
                                    icon={faBan}
                                >
                                    停止する
                                </ToggleButton>
                            </div>
                        </section>

                        {mode === "show" && (
                            <>
                                {/* 表示予約 */}
                                <section className="space-y-3">
                                    <SectionLabel>表示予約</SectionLabel>
                                    <p className="text-xs text-muted-foreground">
                                        表示日時が到来すると、自動的にこのリッチメニューを表示します。
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <RadioPill
                                            active={schedule === "now"}
                                            onClick={() => setSchedule("now")}
                                        >
                                            表示日時を設定しない（すぐに表示する）
                                        </RadioPill>
                                        <RadioPill
                                            active={schedule === "reserved"}
                                            onClick={() =>
                                                setSchedule("reserved")
                                            }
                                        >
                                            表示日時を設定する
                                        </RadioPill>
                                    </div>
                                    {schedule === "reserved" && (
                                        <input
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={(e) =>
                                                setScheduledAt(e.target.value)
                                            }
                                            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                                        />
                                    )}
                                </section>

                                {/* 表示する友だちを選択 */}
                                <section className="space-y-3">
                                    <SectionLabel>
                                        リッチメニューを表示する友だちを選択
                                    </SectionLabel>
                                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <FontAwesomeIcon
                                            icon={faCircleInfo}
                                            className="mt-0.5 size-3.5 text-destructive"
                                        />
                                        他のリッチメニューが表示されている場合も、このリッチメニューに切り替わります。
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <RadioPill
                                            active={target === "all"}
                                            onClick={() => setTarget("all")}
                                        >
                                            ichigo-step 上の友だち全員
                                        </RadioPill>
                                        <RadioPill
                                            active={target === "individual"}
                                            onClick={() =>
                                                setTarget("individual")
                                            }
                                        >
                                            個別に選択する
                                        </RadioPill>
                                    </div>

                                    {target === "individual" && (
                                        <div className="rounded-lg border border-border">
                                            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                                                <div className="relative flex-1 max-w-xs">
                                                    <FontAwesomeIcon
                                                        icon={faMagnifyingGlass}
                                                        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                                                    />
                                                    <input
                                                        value={query}
                                                        onChange={(e) =>
                                                            setQuery(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="友だちを検索"
                                                        className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
                                                    />
                                                </div>
                                                <span className="whitespace-nowrap text-xs text-muted-foreground">
                                                    {selected.size} 人選択中
                                                </span>
                                            </div>
                                            <ul className="max-h-72 overflow-y-auto p-1">
                                                {filteredFriends.length ===
                                                0 ? (
                                                    <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                                                        友だちがいません
                                                    </li>
                                                ) : (
                                                    filteredFriends.map((f) => (
                                                        <li key={f.id}>
                                                            <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selected.has(
                                                                        f.id,
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleFriend(
                                                                            f.id,
                                                                        )
                                                                    }
                                                                    className="size-4 accent-primary"
                                                                />
                                                                {f.picture_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={
                                                                            f.picture_url
                                                                        }
                                                                        alt=""
                                                                        className="size-7 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground">
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faUser
                                                                            }
                                                                            className="size-3"
                                                                        />
                                                                    </span>
                                                                )}
                                                                <span className="truncate text-sm">
                                                                    {f.name}
                                                                </span>
                                                            </label>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {mode === "stop" && (
                            <section className="space-y-3">
                                <SectionLabel>停止予約</SectionLabel>
                                <p className="text-xs text-muted-foreground">
                                    停止日時が到来すると、自動的にこのリッチメニューの表示を停止します。
                                    <br />
                                    ※ 対象人数が多い場合、処理完了まで数分かかる場合があります。
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <RadioPill
                                        active={schedule === "now"}
                                        onClick={() => setSchedule("now")}
                                    >
                                        停止日時を設定しない（すぐに停止する）
                                    </RadioPill>
                                    <RadioPill
                                        active={schedule === "reserved"}
                                        onClick={() => setSchedule("reserved")}
                                    >
                                        停止日時を設定する
                                    </RadioPill>
                                </div>
                                {schedule === "reserved" && (
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) =>
                                            setScheduledAt(e.target.value)
                                        }
                                        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                                    />
                                )}
                            </section>
                        )}

                        {/* フッター操作 */}
                        <div className="flex items-center justify-between border-t border-border pt-5">
                            <Link
                                href="/rich-menus"
                                className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium hover:bg-muted"
                            >
                                戻る
                            </Link>
                            <button
                                type="button"
                                onClick={openConfirm}
                                className="inline-flex h-10 items-center gap-2 rounded-md border border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
                            >
                                リッチメニュー表示の確認にすすむ ›
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 確認モーダル */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogTitle className="text-center text-base font-bold">
                        {mode === "show"
                            ? "リッチメニューの表示"
                            : "リッチメニューの停止"}
                    </DialogTitle>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* 左: 画像 */}
                        <div className="rounded-xl bg-muted/40 p-4">
                            {richMenu.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={richMenu.image_url}
                                    alt={richMenu.name}
                                    className="w-full rounded-lg border border-border"
                                />
                            ) : (
                                <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                                    画像なし
                                </div>
                            )}
                            <p className="mt-3 text-center text-sm font-medium">
                                {richMenu.name}
                            </p>
                        </div>

                        {/* 右: サマリ */}
                        <div className="space-y-2">
                            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                {timingLabel}
                            </div>
                            <p className="px-1 text-sm font-bold">
                                {timingValue}
                            </p>

                            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                                <span className="text-sm text-muted-foreground">
                                    {targetLabel}
                                </span>
                                <span className="inline-flex items-baseline gap-1">
                                    <span className="text-base font-bold tabular-nums">
                                        {targetCount}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        人
                                    </span>
                                </span>
                            </div>
                            <p className="px-1 text-sm font-bold">
                                {targetValue}
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        対象人数が多い場合、処理完了まで数分かかる場合があります。
                    </p>

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={submit}
                            disabled={submitting}
                            className={cn(
                                "inline-flex h-11 min-w-56 items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90",
                                submitting && "opacity-60",
                            )}
                        >
                            {mode === "show" ? "表示する" : "停止する"}
                        </button>
                    </div>

                    {schedule === "reserved" && (
                        <p className="text-center text-xs text-muted-foreground">
                            TOPページ「操作予約・履歴」から予約の取り消しができます。
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-md bg-muted/40 px-3 py-2 text-sm font-bold">
            {children}
        </div>
    );
}

function ToggleButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: typeof faMobileScreenButton;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-bold transition-colors",
                active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            <FontAwesomeIcon icon={icon} className="size-3.5" />
            {children}
        </button>
    );
}

function RadioPill({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50",
            )}
        >
            <span
                className={cn(
                    "grid size-4 place-items-center rounded-full border",
                    active ? "border-primary" : "border-muted-foreground/50",
                )}
            >
                {active && <span className="size-2 rounded-full bg-primary" />}
            </span>
            {children}
        </button>
    );
}
