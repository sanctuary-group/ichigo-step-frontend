import type { MockTag } from "@/mocks/data";
import type { ApiTag } from "@/lib/api/types";

const SOURCE_LABELS: Record<string, string> = {
  qr: "QRコード",
  card: "名刺",
  web: "Web",
  manual: "手動登録",
  other: "その他",
};

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "";
  return SOURCE_LABELS[source] ?? source;
}

/** 友だち表示名（システム表示名 > LINE名 > フォールバック）。 */
export function friendDisplayName(friend: {
  system_display_name?: string | null;
  display_name?: string | null;
}): string {
  return (
    friend.system_display_name?.trim() ||
    friend.display_name?.trim() ||
    "(名前未取得)"
  );
}

/** YYYY.MM.DD HH:mm 形式（monolith の dot ヘルパ）。 */
export function dot(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** API のタグ（数値id）を TagBadge が要求する MockTag 形へ変換。 */
export function toMockTag(t: ApiTag): MockTag {
  return {
    id: String(t.id),
    name: t.name,
    color: t.color ?? "#888888",
  };
}
