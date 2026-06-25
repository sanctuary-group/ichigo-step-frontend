"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useResource } from "@/lib/api/use-resource";
import {
    fetchQrActionDataDetail,
    type QrActionDataDetail,
} from "@/lib/api/qr-actions";
import { QrActionDataDetailView } from "@/components/qr-actions/data-detail-view";

/** "YYYY-MM-01"（当月初日） */
function startOfMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** "YYYY-MM-DD"（今日） */
function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
    ).padStart(2, "0")}`;
}

export default function QrActionDataDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();

    const [period, setPeriod] = useState<{ from: string; to: string }>(() => ({
        from: startOfMonth(),
        to: today(),
    }));

    const { data, isLoading, error } = useResource<QrActionDataDetail>(
        `qr-action-data:${id}:${period.from}:${period.to}`,
        () => fetchQrActionDataDetail(id, period),
    );

    // backend 未実装/404 などで取得失敗した場合の空状態フォールバック。
    const fallback = useMemo<QrActionDataDetail>(
        () => ({
            qrAction: { id: Number(id), name: "データ詳細", created_date: period.from },
            period,
            rows: [],
            totals: { scans: 0, follows: 0, actions: 0 },
            friends: [],
            friendStats: { new: 0, existing: 0, unblock: 0, blocked: 0 },
        }),
        [id, period],
    );

    if (isLoading && !data) {
        return (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                読み込み中...
            </div>
        );
    }

    const view = data ?? fallback;
    // backend 側の period が返ればそれを優先（無ければ画面 state を使う）。
    const resolved: QrActionDataDetail = {
        ...view,
        period: error ? period : view.period,
    };

    return (
        <QrActionDataDetailView
            {...resolved}
            onChangePeriod={(from, to) => setPeriod({ from, to })}
            onBack={() => router.push("/qr-actions")}
        />
    );
}
