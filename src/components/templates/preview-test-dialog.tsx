import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faMagnifyingGlass,
    faPaperPlane,
    faUserPlus,
    faTrash,
    faSpinner,
    faImage,
    faVideo,
    faMusic,
    faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { stickerImageUrl } from "@/lib/line-stickers";
import type { TemplateMessage } from "@/types/template";
import { apiFetch } from "@/lib/api/client";

type TestUser = { id: number; name: string; picture_url: string | null };

// tenant API (Bearer) に委譲。url は /api/tenant/v1 直下の相対パス。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api(
    url: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    return apiFetch(url, { method, body });
}

export function PreviewTestDialog({
    open,
    onClose,
    templateId,
    messages,
}: {
    open: boolean;
    onClose: () => void;
    templateId: number;
    messages: TemplateMessage[];
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold">プレビュー・テスト送信</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="閉じる"
                >
                    <FontAwesomeIcon icon={faXmark} className="size-5" />
                </button>
            </div>

            <div className="grid h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-2 divide-x divide-border">
                <div className="overflow-y-auto bg-muted/20 p-6">
                    {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            メッセージがありません
                        </p>
                    ) : (
                        <div className="mx-auto flex max-w-sm flex-col gap-3">
                            {messages.map((m, i) => (
                                <MessageBubble key={m.id ?? i} message={m} />
                            ))}
                        </div>
                    )}
                </div>

                <TestUserPanel
                    open={open}
                    send={(friendIds) =>
                        api(`/templates/${templateId}/test-send`, "POST", {
                            friend_ids: friendIds,
                        })
                    }
                />
            </div>
        </div>
    );
}

/** テストユーザーの検索・登録・テスト送信を担う右ペイン（テンプレ/配信 共通） */
export function TestUserPanel({
    open,
    send: doSend,
}: {
    open: boolean;
    send: (
        friendIds: number[],
    ) => Promise<{ sent: number; failed: string[] }>;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<TestUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [testUsers, setTestUsers] = useState<TestUser[]>([]);
    const [checked, setChecked] = useState<Set<number>>(new Set());
    const [sendingIds, setSendingIds] = useState<Set<number>>(new Set());
    const [toast, setToast] = useState<string | null>(null);

    const loadTestUsers = () =>
        api("/templates/test-users").then((d) => setTestUsers(d.test_users));

    useEffect(() => {
        if (open) {
            setChecked(new Set());
            loadTestUsers();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const q = query.trim();
        if (q === "") {
            setResults([]);
            return;
        }
        setSearching(true);
        const t = setTimeout(() => {
            api(`/templates/test-users/search?q=${encodeURIComponent(q)}`)
                .then((d) => setResults(d.friends))
                .catch(() => setResults([]))
                .finally(() => setSearching(false));
        }, 300);
        return () => clearTimeout(t);
    }, [query, open]);

    const isRegistered = (id: number) => testUsers.some((u) => u.id === id);

    const register = async (friendId: number) => {
        await api("/templates/test-users", "POST", { friend_id: friendId });
        await loadTestUsers();
    };
    const unregister = async (friendId: number) => {
        await api(`/templates/test-users/${friendId}`, "DELETE");
        setChecked((p) => {
            const n = new Set(p);
            n.delete(friendId);
            return n;
        });
        await loadTestUsers();
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const send = async (friendIds: number[]) => {
        if (friendIds.length === 0) return;
        setSendingIds((p) => new Set([...p, ...friendIds]));
        try {
            const r = await doSend(friendIds);
            const failed: string[] = r.failed ?? [];
            showToast(
                failed.length === 0
                    ? `${r.sent}件にテスト送信しました`
                    : `${r.sent}件送信・${failed.length}件失敗（${failed.join("、")}）`,
            );
        } catch (e) {
            showToast(e instanceof Error ? e.message : "送信に失敗しました");
        } finally {
            setSendingIds((p) => {
                const n = new Set(p);
                friendIds.forEach((id) => n.delete(id));
                return n;
            });
        }
    };

    const allChecked =
        testUsers.length > 0 && checked.size === testUsers.length;
    const toggleAll = () =>
        setChecked(
            allChecked ? new Set() : new Set(testUsers.map((u) => u.id)),
        );

    return (
        <div className="overflow-y-auto p-6">
            <div className="flex items-baseline gap-3">
                <h3 className="text-base font-bold">テストユーザー登録</h3>
                <span className="text-xs text-muted-foreground">
                    送信先は実際の LINE 友だちです
                </span>
            </div>

            <div className="relative mt-3">
                <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-3 size-4 text-muted-foreground"
                />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="LINE名 / システム表示名で検索"
                    className="h-10 pl-9"
                />
                {searching && (
                    <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="absolute right-3 top-3 size-4 text-muted-foreground"
                    />
                )}
            </div>

            {query.trim() !== "" && (
                <div className="mt-2 rounded-md border border-border divide-y divide-border">
                    {results.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-muted-foreground">
                            {searching ? "検索中..." : "該当する友だちがいません"}
                        </p>
                    ) : (
                        results.map((f) => (
                            <div
                                key={f.id}
                                className="flex items-center gap-3 px-3 py-2"
                            >
                                <Avatar user={f} />
                                <span className="flex-1 truncate text-sm">
                                    {f.name}
                                </span>
                                {isRegistered(f.id) ? (
                                    <span className="text-xs text-muted-foreground">
                                        登録済み
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => register(f.id)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faUserPlus}
                                            className="size-3"
                                        />
                                        登録
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="mt-6 flex items-center gap-4">
                <h3 className="text-base font-bold">テストユーザー</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-primary border-primary/40"
                    disabled={checked.size === 0}
                    onClick={() => send(Array.from(checked))}
                >
                    一括テスト送信
                </Button>
            </div>

            <div className="mt-3 overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="w-10 px-3 py-2 text-left">
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={toggleAll}
                                    disabled={testUsers.length === 0}
                                    className="size-4 rounded border-border accent-primary"
                                    aria-label="すべて選択"
                                />
                            </th>
                            <th className="px-3 py-2 text-left font-bold">
                                テストユーザー名
                            </th>
                            <th className="px-3 py-2 text-left font-bold w-32">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {testUsers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                                >
                                    テストユーザーが登録されていません
                                </td>
                            </tr>
                        ) : (
                            testUsers.map((u) => {
                                const sending = sendingIds.has(u.id);
                                return (
                                    <tr
                                        key={u.id}
                                        className="border-t border-border"
                                    >
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={checked.has(u.id)}
                                                onChange={() =>
                                                    setChecked((p) => {
                                                        const n = new Set(p);
                                                        n.has(u.id)
                                                            ? n.delete(u.id)
                                                            : n.add(u.id);
                                                        return n;
                                                    })
                                                }
                                                className="size-4 rounded border-border accent-primary"
                                                aria-label={`${u.name} を選択`}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar user={u} />
                                                <span className="truncate">
                                                    {u.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8"
                                                    disabled={sending}
                                                    onClick={() => send([u.id])}
                                                >
                                                    {sending ? (
                                                        <FontAwesomeIcon
                                                            icon={faSpinner}
                                                            spin
                                                            className="size-3"
                                                        />
                                                    ) : (
                                                        <FontAwesomeIcon
                                                            icon={faPaperPlane}
                                                            className="size-3"
                                                        />
                                                    )}
                                                    テスト送信
                                                </Button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        unregister(u.id)
                                                    }
                                                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                                                    aria-label="登録解除"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        className="size-3.5"
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg">
                    {toast}
                </div>
            )}
        </div>
    );
}

function Avatar({ user }: { user: TestUser }) {
    return user.picture_url ? (
        <img
            src={user.picture_url}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
        />
    ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
            {user.name.slice(0, 1)}
        </div>
    );
}

function Bubble({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-[80%] self-start rounded-2xl rounded-tl-sm bg-background border border-border px-3 py-2 text-sm shadow-sm">
            {children}
        </div>
    );
}

export function MessageBubble({ message: m }: { message: TemplateMessage }) {
    if (m.message_type === "text") {
        return (
            <Bubble>
                <p className="whitespace-pre-wrap break-words">
                    {m.text_content || (
                        <span className="italic text-muted-foreground">
                            （本文未設定）
                        </span>
                    )}
                </p>
            </Bubble>
        );
    }
    if (m.message_type === "image") {
        return m.image_url ? (
            <img
                src={m.image_url}
                alt=""
                className="max-w-[80%] self-start rounded-xl border border-border"
            />
        ) : (
            <Bubble>
                <Chip icon={faImage} label="画像" />
            </Bubble>
        );
    }
    if (m.message_type === "video") {
        return (
            <div className="max-w-[80%] self-start">
                {m.image_url ? (
                    <video
                        src={m.image_url}
                        poster={m.image_preview_url ?? undefined}
                        controls
                        className="w-full rounded-xl border border-border"
                    />
                ) : (
                    <Bubble>
                        <Chip icon={faVideo} label="動画" />
                    </Bubble>
                )}
            </div>
        );
    }
    if (m.message_type === "audio") {
        return (
            <Bubble>
                {m.image_url ? (
                    <audio src={m.image_url} controls className="w-56" />
                ) : (
                    <Chip icon={faMusic} label="音声" />
                )}
            </Bubble>
        );
    }
    if (m.message_type === "sticker") {
        return m.sticker_id ? (
            <img
                src={stickerImageUrl(m.sticker_id)}
                alt="スタンプ"
                className="size-28 self-start object-contain"
            />
        ) : null;
    }
    if (m.message_type === "location") {
        return (
            <div className="max-w-[80%] self-start overflow-hidden rounded-xl border border-border bg-background">
                <div className="bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
                    {m.latitude != null
                        ? `📍 ${m.latitude.toFixed(4)}, ${m.longitude?.toFixed(4)}`
                        : "位置情報"}
                </div>
                <div className="border-t border-border px-3 py-2">
                    <p className="text-sm font-bold">{m.location_title}</p>
                    <p className="text-xs text-muted-foreground">
                        {m.location_address}
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-muted/30 px-3 py-1 text-xs text-primary">
                    <FontAwesomeIcon icon={faLocationDot} className="size-3" />
                    Location
                </div>
            </div>
        );
    }
    if (m.message_type === "panel") {
        const panel = m.panel_content?.panels?.[0];
        const isQuick = m.panel_content?.variant === "quick_reply";
        if (isQuick) {
            return (
                <div className="flex max-w-[90%] flex-col gap-2 self-start">
                    <Bubble>
                        {m.panel_content?.question_text ||
                            m.panel_content?.question_image_url ? (
                            m.panel_content?.question_image_url ? (
                                <img
                                    src={m.panel_content.question_image_url}
                                    alt=""
                                    className="rounded-lg"
                                />
                            ) : (
                                m.panel_content?.question_text
                            )
                        ) : (
                            "クイックリプライ"
                        )}
                    </Bubble>
                    <div className="flex flex-wrap gap-1.5">
                        {(m.panel_content?.quick_buttons ?? []).map((b, i) => (
                            <span
                                key={i}
                                className="rounded-full border border-primary/50 bg-background px-3 py-1 text-xs text-primary"
                            >
                                {b.label}
                            </span>
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <div className="max-w-[80%] self-start overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                {panel?.image_url && (
                    <img src={panel.image_url} alt="" className="w-full" />
                )}
                <div className="space-y-1 p-3">
                    {panel?.title && (
                        <p className="text-sm font-bold">{panel.title}</p>
                    )}
                    {panel?.body && (
                        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                            {panel.body}
                        </p>
                    )}
                </div>
                {(panel?.buttons ?? []).length > 0 && (
                    <div className="divide-y divide-border border-t border-border">
                        {panel!.buttons.map((b, i) => (
                            <div
                                key={i}
                                className="px-3 py-2 text-center text-sm text-primary"
                            >
                                {b.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
}

function Chip({
    icon,
    label,
}: {
    icon: typeof faImage;
    label: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <FontAwesomeIcon icon={icon} className="size-3.5" />
            {label}
        </span>
    );
}
