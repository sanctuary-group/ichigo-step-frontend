"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRotateLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  fetchTrashedTags,
  restoreTag,
  forceDeleteTag,
  type TrashedTag,
} from "@/lib/api/tags";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatYmd(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export default function TagsTrashedPage() {
  const { currentChannelId } = useAuth();
  const { data: tags, mutate } = useResource(
    currentChannelId ? `tags-trashed:${currentChannelId}` : null,
    () => fetchTrashedTags(),
  );

  const restore = async (t: TrashedTag) => {
    await restoreTag(t.id);
    mutate();
  };

  const forceDelete = async (t: TrashedTag) => {
    if (
      !confirm(
        `「${t.name}」を完全に削除します。元に戻せません。よろしいですか？`,
      )
    )
      return;
    await forceDeleteTag(t.id);
    mutate();
  };

  const rows = tags ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/tags"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="size-3" />
          タグ管理へ戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">削除したタグ</h1>
      <p className="text-sm text-muted-foreground">
        削除したタグを復元、または完全に削除できます。
      </p>

      <hr className="border-border" />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left font-bold text-foreground">
                管理名
              </th>
              <th className="px-3 py-2 text-left font-bold text-foreground w-20">
                人数
              </th>
              <th className="px-3 py-2 text-left font-bold text-foreground w-32">
                削除日
              </th>
              <th className="px-3 py-2 text-left font-bold text-foreground w-48">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-b border-border">
                <td
                  colSpan={4}
                  className="px-3 py-5 text-sm font-bold text-foreground"
                >
                  {tags === undefined
                    ? "読み込み中…"
                    : "削除したタグはありません。"}
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border hover:bg-muted/30"
                >
                  <td className="px-3 py-3">
                    <span className="font-medium truncate">{t.name}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                    {t.friendsCount.toLocaleString()}人
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                    {formatYmd(t.deletedAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => restore(t)}
                      >
                        <FontAwesomeIcon
                          icon={faRotateLeft}
                          className="size-3"
                        />
                        復元
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-muted-foreground hover:text-destructive"
                        onClick={() => forceDelete(t)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="size-3" />
                        完全に削除
                      </Button>
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
