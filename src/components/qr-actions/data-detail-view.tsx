"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faDownload,
    faSort,
    faMagnifyingGlass,
    faInbox,
    faDisplay,
    faMobileScreen,
    faUser,
    faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
    QrActionDataDetail,
    QrActionFriendRow,
    QrActionStatRow,
} from "@/lib/api/qr-actions";

type Row = QrActionStatRow;
type FriendRow = QrActionFriendRow;

const FRIEND_TYPE_LABEL: Record<FriendRow["friend_type"], string> = {
    new: "新規友だち",
    existing: "既存友だち",
    unblock: "ブロック解除",
};

type Tab = "stats" | "friends" | "lp" | "branch";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-06-16" → "2026.06.16(火)" */
function formatDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    const wd = WD[new Date(y, m - 1, d).getDay()];
    return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}(${wd})`;
}

type Props = QrActionDataDetail & {
    /** 期間変更（apiFetch 再取得を発火）。 */
    onChangePeriod: (from: string, to: string) => void;
    /** 一覧へ戻る。 */
    onBack: () => void;
};

export function QrActionDataDetailView({
    qrAction,
    period,
    rows,
    totals,
    friends,
    friendStats,
    onChangePeriod,
    onBack,
}: Props) {
    const [tab, setTab] = useState<Tab>("stats");

    const reload = (from: string, to: string) => onChangePeriod(from, to);

    const tabs: { key: Tab; label: string }[] = [
        { key: "stats", label: "数値情報" },
        { key: "friends", label: "友だち一覧" },
        { key: "lp", label: "LP連携" },
        { key: "branch", label: "分岐詳細" },
    ];

    return (
        <>
            <div className="flex-1 overflow-y-auto">
                {/* ヘッダー */}
                <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 bg-background border-b border-border">
                    <h1 className="text-lg font-bold">{qrAction.name}</h1>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="hover:text-foreground hover:underline"
                        >
                            TOP
                        </button>
                        <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
                        <span>データ詳細</span>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                    {/* タブ */}
                    <div className="flex items-end gap-2">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={cn(
                                    "min-w-24 rounded-t-lg bg-background px-4 py-2 text-sm font-bold border-t-[3px] transition-colors",
                                    tab === t.key
                                        ? "border-primary text-primary shadow-sm"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "stats" && (
                        <div className="mt-4 bg-background rounded-lg border border-border">
                            {/* コントロール */}
                            <div className="p-5 flex flex-wrap items-end justify-between gap-4 border-b border-border">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground">
                                            表示期間
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={period.from}
                                                onChange={(e) =>
                                                    reload(e.target.value, period.to)
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            />
                                            <span className="text-muted-foreground">–</span>
                                            <input
                                                type="date"
                                                value={period.to}
                                                onChange={(e) =>
                                                    reload(period.from, e.target.value)
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-9"
                                                onClick={() =>
                                                    reload(
                                                        qrAction.created_date,
                                                        period.to,
                                                    )
                                                }
                                            >
                                                全期間
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground">
                                            表示単位
                                        </label>
                                        <select
                                            disabled
                                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                                        >
                                            <option>人数</option>
                                        </select>
                                    </div>
                                </div>

                                {/* KPI */}
                                <div className="flex items-end gap-6">
                                    <Kpi label="URL読み込み" value={totals.scans} />
                                    <Kpi label="友だち追加" value={totals.follows} />
                                    <Kpi label="アクション稼働" value={totals.actions} />
                                    <button
                                        type="button"
                                        disabled
                                        title="CSVダウンロード（準備中）"
                                        className="size-9 grid place-items-center rounded-md border border-border text-muted-foreground opacity-60"
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="size-4" />
                                    </button>
                                </div>
                            </div>

                            {/* テーブル */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="px-5 py-2.5 text-left font-bold">
                                                <span className="inline-flex items-center gap-1">
                                                    日時
                                                    <FontAwesomeIcon
                                                        icon={faSort}
                                                        className="size-3 text-muted-foreground"
                                                    />
                                                </span>
                                            </th>
                                            <th className="px-5 py-2.5 text-center font-bold">
                                                URL読み込み
                                            </th>
                                            <th className="px-5 py-2.5 text-center font-bold">
                                                友だち追加・ブロック解除
                                            </th>
                                            <th className="px-5 py-2.5 text-center font-bold">
                                                アクション稼働
                                            </th>
                                            <th className="px-5 py-2.5 text-right font-bold w-32" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r: Row) => (
                                            <tr
                                                key={r.date}
                                                className="border-t border-border"
                                            >
                                                <td className="px-5 py-3">
                                                    {formatDate(r.date)}
                                                </td>
                                                <td className="px-5 py-3 text-center tabular-nums">
                                                    {r.scans.toLocaleString()}人
                                                </td>
                                                <td className="px-5 py-3 text-center tabular-nums">
                                                    {r.follows.toLocaleString()}人
                                                </td>
                                                <td className="px-5 py-3 text-center tabular-nums">
                                                    {r.actions.toLocaleString()}人
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
                                                    >
                                                        詳細表示
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "friends" && (
                        <div className="mt-4 bg-background rounded-lg border border-border">
                            {/* コントロール */}
                            <div className="p-5 flex flex-wrap items-end justify-between gap-4 border-b border-border">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground">
                                            表示期間
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={period.from}
                                                onChange={(e) =>
                                                    reload(e.target.value, period.to)
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            />
                                            <span className="text-muted-foreground">–</span>
                                            <input
                                                type="date"
                                                value={period.to}
                                                onChange={(e) =>
                                                    reload(period.from, e.target.value)
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-9"
                                                onClick={() =>
                                                    reload(
                                                        qrAction.created_date,
                                                        period.to,
                                                    )
                                                }
                                            >
                                                全期間
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground">
                                            表示単位
                                        </label>
                                        <select
                                            disabled
                                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                                        >
                                            <option>人数</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-end gap-6">
                                    <Kpi label="新規友だち" value={friendStats.new} />
                                    <Kpi label="既存友だち" value={friendStats.existing} />
                                    <Kpi label="ブロック解除" value={friendStats.unblock} />
                                    <Kpi label="ブロック" value={friendStats.blocked} />
                                    <select
                                        disabled
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                                    >
                                        <option>全件表示</option>
                                    </select>
                                    <button
                                        type="button"
                                        disabled
                                        title="CSVダウンロード（準備中）"
                                        className="size-9 grid place-items-center rounded-md border border-border text-muted-foreground opacity-60"
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled
                                        title="検索（準備中）"
                                        className="size-9 grid place-items-center rounded-md border border-border text-muted-foreground opacity-60"
                                    >
                                        <FontAwesomeIcon
                                            icon={faMagnifyingGlass}
                                            className="size-4"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* テーブル */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="px-5 py-2.5 text-left font-bold whitespace-nowrap">友だち追加日時</th>
                                            <th className="px-5 py-2.5 text-left font-bold">LINE名</th>
                                            <th className="px-5 py-2.5 text-left font-bold">システム表示名</th>
                                            <th className="px-5 py-2.5 text-left font-bold whitespace-nowrap">友だちの種類</th>
                                            <th className="px-5 py-2.5 text-left font-bold">広告名</th>
                                            <th className="px-5 py-2.5 text-left font-bold">LP名</th>
                                            <th className="px-5 py-2.5 text-left font-bold whitespace-nowrap">ブロックされた日時</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {friends.length === 0 ? (
                                            <tr>
                                                <td colSpan={7}>
                                                    <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                                                        <FontAwesomeIcon
                                                            icon={faInbox}
                                                            className="size-14 text-muted-foreground/30"
                                                        />
                                                        <div className="text-sm">
                                                            まだデータがありません
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            friends.map((f: FriendRow, i: number) => (
                                                <tr
                                                    key={i}
                                                    className="border-t border-border"
                                                >
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        {f.added_at ?? "—"}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {f.display_name ?? "—"}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {f.system_display_name ?? "—"}
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        {FRIEND_TYPE_LABEL[f.friend_type]}
                                                    </td>
                                                    <td className="px-5 py-3 text-muted-foreground">
                                                        —
                                                    </td>
                                                    <td className="px-5 py-3 text-muted-foreground">
                                                        —
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                                                        {f.unfollowed_at ?? "—"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "lp" && (
                        <div className="mt-4 bg-background rounded-lg border border-border">
                            {/* コントロール */}
                            <div className="p-5 flex flex-wrap items-end justify-between gap-4 border-b border-border">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground">
                                            表示期間
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={period.from}
                                                onChange={(e) =>
                                                    reload(e.target.value, period.to)
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            />
                                            <span className="text-muted-foreground">–</span>
                                            <input
                                                type="date"
                                                value={period.to}
                                                onChange={(e) =>
                                                    reload(period.from, e.target.value)
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-9"
                                                onClick={() =>
                                                    reload(
                                                        qrAction.created_date,
                                                        period.to,
                                                    )
                                                }
                                            >
                                                全期間
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground">
                                            表示単位
                                        </label>
                                        <select
                                            disabled
                                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                                        >
                                            <option>人数</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-end gap-6">
                                    <Kpi label="URL読み込み" value={totals.scans} />
                                    <Kpi label="友だち追加" value={totals.follows} />
                                    <Kpi label="アクション稼働" value={totals.actions} />
                                    <select
                                        disabled
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                                    >
                                        <option>全件表示</option>
                                    </select>
                                    <button
                                        type="button"
                                        disabled
                                        title="CSVダウンロード（準備中）"
                                        className="size-9 grid place-items-center rounded-md border border-border text-muted-foreground opacity-60"
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled
                                        title="検索（準備中）"
                                        className="size-9 grid place-items-center rounded-md border border-border text-muted-foreground opacity-60"
                                    >
                                        <FontAwesomeIcon
                                            icon={faMagnifyingGlass}
                                            className="size-4"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* テーブル */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="px-5 py-2.5 text-left font-bold">
                                                <span className="inline-flex items-center gap-1">
                                                    日時
                                                    <FontAwesomeIcon
                                                        icon={faSort}
                                                        className="size-3 text-muted-foreground"
                                                    />
                                                </span>
                                            </th>
                                            <th className="px-5 py-2.5 text-left font-bold">広告名</th>
                                            <th className="px-5 py-2.5 text-left font-bold">LP名</th>
                                            <th className="px-5 py-2.5 text-center font-bold whitespace-nowrap">URL読み込み</th>
                                            <th className="px-5 py-2.5 text-center font-bold whitespace-nowrap">友だち追加・ブロック解除</th>
                                            <th className="px-5 py-2.5 text-center font-bold whitespace-nowrap">アクション稼働</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                                                    <FontAwesomeIcon
                                                        icon={faInbox}
                                                        className="size-14 text-muted-foreground/30"
                                                    />
                                                    <div className="text-sm">
                                                        まだデータがありません
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "branch" && (
                        <BranchDetail
                            period={period}
                            createdDate={qrAction.created_date}
                            totals={totals}
                            friendStats={friendStats}
                            onChangePeriod={reload}
                        />
                    )}
                </div>
            </div>

            {/* フッター */}
            <div className="sticky bottom-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="h-10 px-8"
                >
                    戻る
                </Button>
                <select
                    disabled
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                >
                    <option>100/page</option>
                </select>
            </div>
        </>
    );
}

/* ===== 分岐詳細（LIFF ファネル図） ===== */

type FNode = {
    x: number;
    y: number;
    w: number;
    h: number;
    kind: "device" | "box" | "cat" | "auth" | "permit" | "terminal" | "trunk";
    label?: string;
    lines?: string[];
    count?: number;
    info?: boolean;
    icon?: typeof faUser;
};

const FUNNEL_W = 1720;
const FUNNEL_H = 990;

function BranchDetail({
    period,
    createdDate,
    totals,
    friendStats,
    onChangePeriod,
}: {
    period: { from: string; to: string };
    createdDate: string;
    totals: { scans: number; follows: number; actions: number };
    friendStats: { new: number; existing: number; unblock: number; blocked: number };
    onChangePeriod: (from: string, to: string) => void;
}) {
    const [from, setFrom] = useState(period.from);
    const [to, setTo] = useState(period.to);

    void createdDate;

    // 各 split の分岐元 y は子の中点に合わせて対称ブラケットにする
    const N: Record<string, FNode> = {
        // 入口
        pc: { x: 20, y: 170, w: 72, h: 56, kind: "device", icon: faDisplay, lines: ["PC", "(スマホ以外)"] },
        urlclick: { x: 150, y: 175, w: 150, h: 46, kind: "box", label: "URLクリック", count: 0 },
        qrnone: { x: 330, y: 152, w: 190, h: 20, kind: "terminal", label: "QRコード読み込みなし（終了）" },
        qrread: { x: 330, y: 214, w: 150, h: 46, kind: "box", label: "QRコード読み込み", count: 0 },
        sp: { x: 20, y: 320, w: 72, h: 56, kind: "device", icon: faMobileScreen, lines: ["スマホ"] },
        urltap: { x: 330, y: 320, w: 150, h: 46, kind: "box", label: "URLタップ", count: 0, info: true },
        trunk: { x: 548, y: 290, w: 0, h: 0, kind: "trunk" },
        // カテゴリ（幹からの分岐先）
        cat1: { x: 620, y: 208, w: 190, h: 44, kind: "cat", lines: ["友だち追加前のユーザー"] },
        cat2: { x: 620, y: 448, w: 190, h: 44, kind: "cat", lines: ["友だち登録済みで", "いちごステップには表示されていない"] },
        cat3: { x: 620, y: 663, w: 190, h: 44, kind: "cat", lines: ["LINE公式アカウントを", "ブロックしている友だち"] },
        cat4: { x: 620, y: 878, w: 190, h: 44, kind: "cat", lines: ["いちごステップ上にすでに", "表示されている友だち"] },
        // 認証
        a1: { x: 900, y: 220, w: 52, h: 20, kind: "auth", label: "未認証", info: true },
        a2u: { x: 900, y: 424, w: 48, h: 20, kind: "auth", label: "未認証" },
        a2c: { x: 900, y: 496, w: 48, h: 20, kind: "auth", label: "認証済" },
        a3u: { x: 900, y: 640, w: 48, h: 20, kind: "auth", label: "未認証" },
        a3c: { x: 900, y: 710, w: 48, h: 20, kind: "auth", label: "認証済" },
        a4u: { x: 900, y: 854, w: 48, h: 20, kind: "auth", label: "未認証" },
        a4c: { x: 900, y: 926, w: 48, h: 20, kind: "auth", label: "認証済" },
        // 許可
        p1y: { x: 1015, y: 190, w: 70, h: 20, kind: "permit", label: "許可する" },
        p1n: { x: 1015, y: 250, w: 150, h: 20, kind: "terminal", label: "許可しない（終了）" },
        p2y: { x: 1015, y: 400, w: 70, h: 20, kind: "permit", label: "許可する" },
        p2n: { x: 1015, y: 448, w: 150, h: 20, kind: "terminal", label: "許可しない（終了）" },
        p3y: { x: 1015, y: 640, w: 70, h: 20, kind: "permit", label: "許可する" },
        p3n: { x: 1110, y: 745, w: 180, h: 20, kind: "terminal", label: "ブロック解除しない（終了）" },
        p4y: { x: 1015, y: 830, w: 70, h: 20, kind: "permit", label: "許可する" },
        p4n: { x: 1015, y: 878, w: 150, h: 20, kind: "terminal", label: "許可しない（終了）" },
        // 中間
        m1: { x: 1200, y: 152, w: 150, h: 46, kind: "box", label: "友だち追加", count: friendStats.new },
        m1n: { x: 1200, y: 215, w: 160, h: 20, kind: "terminal", label: "友だち追加しない（終了）" },
        m3: { x: 1200, y: 662, w: 150, h: 46, kind: "box", label: "ブロック解除", count: friendStats.unblock },
        // アクション稼働
        act1: { x: 1545, y: 152, w: 150, h: 46, kind: "box", label: "アクション稼働", count: totals.actions },
        act2: { x: 1545, y: 435, w: 150, h: 46, kind: "box", label: "アクション稼働", count: 0 },
        act3: { x: 1545, y: 662, w: 150, h: 46, kind: "box", label: "アクション稼働", count: 0 },
        act4: { x: 1545, y: 865, w: 150, h: 46, kind: "box", label: "アクション稼働", count: 0 },
    };

    // 分岐（1→N） / 合流（N→1） / 直結 をグループで宣言
    const splits: { from: string; to: string[] }[] = [
        { from: "urlclick", to: ["qrnone", "qrread"] },
        { from: "trunk", to: ["cat1", "cat2", "cat3", "cat4"] },
        { from: "a1", to: ["p1y", "p1n"] },
        { from: "p1y", to: ["m1", "m1n"] },
        { from: "cat2", to: ["a2u", "a2c"] },
        { from: "a2u", to: ["p2y", "p2n"] },
        { from: "cat3", to: ["a3u", "a3c"] },
        { from: "cat4", to: ["a4u", "a4c"] },
        { from: "a4u", to: ["p4y", "p4n"] },
    ];
    const merges: { from: string[]; to: string }[] = [
        { from: ["qrread", "urltap"], to: "trunk" },
        { from: ["p2y", "a2c"], to: "act2" },
        { from: ["p3y", "a3c"], to: "m3" },
        { from: ["p4y", "a4c"], to: "act4" },
    ];
    const links: [string, string][] = [
        ["pc", "urlclick"],
        ["sp", "urltap"],
        ["cat1", "a1"],
        ["m1", "act1"],
        ["a3u", "p3y"],
        ["p3y", "p3n"],
        ["m3", "act3"],
    ];

    const rightOf = (n: FNode): [number, number] => [n.x + n.w, n.y + n.h / 2];
    const leftOf = (n: FNode): [number, number] => [n.x, n.y + n.h / 2];

    // 1グループを「共有バス（縦線1本）＋左右スタブ」で対称に描く
    const groupPaths = (srcIds: string[], tgtIds: string[]): string[] => {
        const sources = srcIds.map((id) => N[id]);
        const targets = tgtIds.map((id) => N[id]);
        const busX = Math.max(
            Math.min(...targets.map((t) => leftOf(t)[0])) - 20,
            Math.max(...sources.map((s) => rightOf(s)[0])) + 12,
        );
        const ys = [
            ...sources.map((s) => rightOf(s)[1]),
            ...targets.map((t) => leftOf(t)[1]),
        ];
        const top = Math.min(...ys);
        const bot = Math.max(...ys);
        const out: string[] = [];
        if (bot - top > 0.5) out.push(`M${busX},${top} L${busX},${bot}`);
        sources.forEach((s) => {
            const [ax, ay] = rightOf(s);
            out.push(`M${ax},${ay} L${busX},${ay}`);
        });
        targets.forEach((t) => {
            const [bx, by] = leftOf(t);
            out.push(`M${busX},${by} L${bx},${by}`);
        });
        return out;
    };

    const paths: string[] = [
        ...splits.flatMap((g) => groupPaths([g.from], g.to)),
        ...merges.flatMap((g) => groupPaths(g.from, [g.to])),
        ...links.flatMap(([a, b]) => groupPaths([a], [b])),
    ];

    const renderNode = (n: FNode) => {
        if (n.kind === "box") {
            return (
                <div className="h-full rounded-md bg-muted/30 px-3 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUser} className="size-4 text-foreground" />
                        <span className="text-xs font-bold text-foreground whitespace-nowrap">{n.label}</span>
                        {n.info && (
                            <FontAwesomeIcon icon={faCircleInfo} className="size-2.5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="text-right text-xs font-bold text-primary tabular-nums">
                        {(n.count ?? 0).toLocaleString()}人
                    </div>
                </div>
            );
        }
        if (n.kind === "cat") {
            return (
                <div className="flex items-start gap-1.5">
                    <FontAwesomeIcon icon={faUser} className="size-4 mt-0.5 text-foreground" />
                    <span className="text-xs leading-snug text-foreground">
                        {n.lines?.map((l, i) => (
                            <span key={i}>
                                {l}
                                {i < (n.lines?.length ?? 0) - 1 && <br />}
                            </span>
                        ))}
                    </span>
                </div>
            );
        }
        if (n.kind === "device") {
            return (
                <div className="flex flex-col items-center gap-1">
                    <FontAwesomeIcon icon={n.icon ?? faDisplay} className="size-7 text-foreground" />
                    <span className="text-[11px] font-bold text-center text-foreground leading-tight">
                        {n.lines?.map((l, i) => (
                            <span key={i}>
                                {l}
                                {i < (n.lines?.length ?? 0) - 1 && <br />}
                            </span>
                        ))}
                    </span>
                </div>
            );
        }
        if (n.kind === "auth") {
            return (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap">
                    {n.label}
                    {n.info && <FontAwesomeIcon icon={faCircleInfo} className="size-2.5" />}
                </span>
            );
        }
        if (n.kind === "permit") {
            return <span className="text-xs font-bold whitespace-nowrap">{n.label}</span>;
        }
        if (n.kind === "terminal") {
            return <span className="text-xs text-muted-foreground whitespace-nowrap">{n.label}</span>;
        }
        return null;
    };

    return (
        <div className="mt-0 bg-background p-5 overflow-x-auto">
            {/* コントロール */}
            <div className="flex flex-wrap items-end gap-6 rounded-md bg-muted/30 px-4 py-5 w-fit">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                        表示単位
                    </label>
                    <select
                        disabled
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                    >
                        <option>人数(1人につき1回のみカウント)</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                        表示期間
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <span className="text-muted-foreground">–</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        />
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="h-9 px-7 border-primary text-primary hover:text-primary"
                    onClick={() => onChangePeriod(from, to)}
                >
                    変更する
                </Button>
            </div>

            {/* ファネル図 */}
            <div className="mt-8">
                <div
                    className="relative"
                    style={{ width: FUNNEL_W, height: FUNNEL_H }}
                >
                    <svg
                        className="absolute inset-0 pointer-events-none text-border"
                        width={FUNNEL_W}
                        height={FUNNEL_H}
                    >
                        {paths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                            />
                        ))}
                    </svg>
                    {Object.entries(N).map(([id, n]) =>
                        n.kind === "trunk" ? null : (
                            <div
                                key={id}
                                className="absolute"
                                style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
                            >
                                {renderNode(n)}
                            </div>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}

function Kpi({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="text-xl font-bold tabular-nums">
                {value.toLocaleString()}
            </div>
        </div>
    );
}
