"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faMagnifyingGlass,
    faSpinner,
    faUserPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/components/templates/preview-test-dialog";

type TestUser = { id: number; name: string; picture_url: string | null };

type SendMode = "timing" | "simultaneous" | "interval";

export function ScenarioBulkTestDialog({
    open,
    onClose,
    messages,
}: {
    open: boolean;
    onClose: () => void;
    messages: unknown[];
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<TestUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [testUsers, setTestUsers] = useState<TestUser[]>([]);
    const [checked, setChecked] = useState<Set<number>>(new Set());
    const [sendMode, setSendMode] = useState<SendMode>("timing");
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const loadTestUsers = () =>
        api("/templates/test-users").then((d) => setTestUsers(d.test_users));

    useEffect(() => {
        if (open) {
            setChecked(new Set());
            setQuery("");
            setResults([]);
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

    if (!open) return null;

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

    const allChecked =
        testUsers.length > 0 && checked.size === testUsers.length;
    const toggleAll = () =>
        setChecked(
            allChecked ? new Set() : new Set(testUsers.map((u) => u.id)),
        );

    const send = async () => {
        const ids = Array.from(checked);
        if (ids.length === 0) {
            showToast("テストユーザーを選択してください");
            return;
        }
        setSending(true);
        try {
            const r = await api("/scenarios/test-send", "POST", {
                friend_ids: ids,
                messages,
                linked_template_id: null,
            });
            const failed: string[] = r.failed ?? [];
            showToast(
                failed.length === 0
                    ? `${r.sent}件にテスト送信しました`
                    : `${r.sent}件送信・${failed.length}件失敗（${failed.join("、")}）`,
            );
        } catch (e) {
            showToast(e instanceof Error ? e.message : "送信に失敗しました");
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-background shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="relative border-b border-border px-6 py-5 text-center">
                    <h2 className="text-xl font-bold">一括テスト送信</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        登録されている全てのメッセージ・アクションを送信・稼働します。
                        <br />
                        設定されている絞込み条件はテストアカウントにもそのまま適用されます。
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="absolute right-5 top-5 text-foreground hover:text-muted-foreground"
                    >
                        <FontAwesomeIcon icon={faXmark} className="size-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* テストユーザー登録 */}
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-base font-bold">
                            テストユーザー登録
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            検索してもアカウントが表示されない場合は
                            <span className="text-blue-600 dark:text-blue-400">
                                こちら
                            </span>
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
                            className="h-11 pl-9"
                        />
                        {searching && (
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="absolute right-3 top-3.5 size-4 text-muted-foreground"
                            />
                        )}
                    </div>

                    {query.trim() !== "" && (
                        <div className="mt-2 rounded-md border border-border divide-y divide-border">
                            {results.length === 0 ? (
                                <p className="px-3 py-3 text-sm text-muted-foreground">
                                    {searching
                                        ? "検索中..."
                                        : "該当する友だちがいません"}
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

                    {/* 送信設定 */}
                    <div className="mt-6 flex items-baseline gap-3">
                        <h3 className="text-base font-bold">送信設定</h3>
                        <span className="text-xs text-muted-foreground">
                            ※登録されているメッセージ数が多い場合
                        </span>
                    </div>
                    <div className="mt-3 space-y-3">
                        <RadioRow
                            checked={sendMode === "timing"}
                            onChange={() => setSendMode("timing")}
                            label="設定した配信タイミング通りにメッセージ・アクションの送信・稼働テストをする"
                        />
                        <RadioRow
                            checked={sendMode === "simultaneous"}
                            onChange={() => setSendMode("simultaneous")}
                            label="全てのメッセージを同時に送信"
                        />
                        <RadioRow
                            checked={sendMode === "interval"}
                            onChange={() => setSendMode("interval")}
                            label="20~30秒ごとにメッセージを送信（テスト開始後の編集内容は反映されません）"
                        />
                    </div>

                    {/* テストアカウント */}
                    <div className="mt-8 flex items-center gap-6">
                        <h3 className="text-base font-bold">テストアカウント</h3>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-6 text-primary border-primary/40 hover:text-primary"
                            disabled={checked.size === 0 || sending}
                            onClick={send}
                        >
                            {sending && (
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                    className="size-3.5"
                                />
                            )}
                            一括テスト送信
                        </Button>
                    </div>

                    {/* 登録済みテストユーザー一覧 */}
                    {testUsers.length > 0 && (
                        <div className="mt-4 overflow-hidden rounded-md border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="w-10 px-3 py-2 text-left">
                                            <input
                                                type="checkbox"
                                                checked={allChecked}
                                                onChange={toggleAll}
                                                className="size-4 rounded border-border accent-primary"
                                                aria-label="すべて選択"
                                            />
                                        </th>
                                        <th className="px-3 py-2 text-left font-bold">
                                            テストユーザー名
                                        </th>
                                        <th className="w-24 px-3 py-2 text-left font-bold">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {testUsers.map((u) => (
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {toast && (
                    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg">
                        {toast}
                    </div>
                )}
            </div>
        </div>
    );
}

function RadioRow({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
                type="radio"
                checked={checked}
                onChange={onChange}
                className="mt-0.5 size-4 accent-primary"
            />
            <span
                className={
                    checked
                        ? "text-primary"
                        : "text-foreground"
                }
            >
                {label}
            </span>
        </label>
    );
}

function Avatar({ user }: { user: TestUser }) {
    return user.picture_url ? (
        // eslint-disable-next-line @next/next/no-img-element
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
