"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLink,
  faMousePointer,
  faMagnifyingGlass,
  faCopy,
  faTrash,
  faArrowUpRightFromSquare,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchShortLinks, deleteShortLink } from "@/lib/api/short-links";
import type { ShortLinkRow, ShortLinkSort } from "@/types/short-link";

function dt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ShortLinksPage() {
  const { currentChannelId } = useAuth();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [sort, setSort] = useState<ShortLinkSort>("clicks");
  const [copied, setCopied] = useState<number | null>(null);

  const { data, mutate } = useResource(
    currentChannelId
      ? `short-links:${currentChannelId}:${appliedQuery}:${sort}`
      : null,
    () =>
      fetchShortLinks({
        q: appliedQuery || undefined,
        sort,
      }),
  );

  const links = useMemo(() => data?.links ?? [], [data]);
  const stats = data?.meta ?? {
    total_links: 0,
    total_clicks: 0,
    base_url: "",
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
  };

  const copy = (row: ShortLinkRow) => {
    navigator.clipboard?.writeText(`${stats.base_url}/s/${row.token}`);
    setCopied(row.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const remove = async (row: ShortLinkRow) => {
    if (
      !confirm("この短縮URLを削除しますか？\nクリック計測データも失われます。")
    )
      return;
    await deleteShortLink(row.id);
    mutate();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">URL分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          1:1チャットで送信した短縮URLのクリック計測
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat
          icon={faLink}
          label="短縮URL数"
          value={stats.total_links.toLocaleString()}
        />
        <Stat
          icon={faMousePointer}
          label="総クリック数"
          value={stats.total_clicks.toLocaleString()}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <SortTab active={sort === "clicks"} onClick={() => setSort("clicks")}>
            クリック数順
          </SortTab>
          <SortTab active={sort === "recent"} onClick={() => setSort("recent")}>
            新着順
          </SortTab>
        </div>
        <form onSubmit={search} className="relative w-72 max-w-full">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="元URLで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold">短縮URL</th>
                <th className="px-3 py-2.5 text-left font-bold">元URL</th>
                <th className="px-3 py-2.5 text-left font-bold w-32">送信先</th>
                <th className="px-3 py-2.5 text-right font-bold w-24">
                  クリック
                </th>
                <th className="px-3 py-2.5 text-left font-bold w-40">
                  最終クリック
                </th>
                <th className="px-3 py-2.5 text-left font-bold w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-10 text-center text-sm text-muted-foreground"
                  >
                    短縮URLはまだありません。チャット設定で「短縮URLの利用」をONにし、1:1チャットでURLを送信すると計測されます。
                  </td>
                </tr>
              ) : (
                links.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => copy(row)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
                        title="クリックでコピー"
                      >
                        /s/{row.token}
                        <FontAwesomeIcon
                          icon={copied === row.id ? faCheck : faCopy}
                          className={cn(
                            "size-3",
                            copied === row.id
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">
                      <a
                        href={row.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-foreground/80 hover:text-primary truncate max-w-full"
                        title={row.original_url}
                      >
                        <span className="truncate">{row.original_url}</span>
                        <FontAwesomeIcon
                          icon={faArrowUpRightFromSquare}
                          className="size-2.5 shrink-0 text-muted-foreground"
                        />
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {row.friend ? (
                        <Link
                          href={`/friends/${row.friend.id}`}
                          className="text-primary hover:underline"
                        >
                          {row.friend.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold">
                      {row.click_count}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {dt(row.last_clicked_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => remove(row)}
                        className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        aria-label="削除"
                      >
                        <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {links.length >= 200 && (
        <p className="text-xs text-muted-foreground text-center">
          上位 200 件まで表示しています。
        </p>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: typeof faLink;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
          <FontAwesomeIcon icon={icon} className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">{label}</div>
          <div className="text-lg font-bold tabular-nums truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortTab({
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
        "px-3 h-9 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
