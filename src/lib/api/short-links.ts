import { apiFetchPaginated, apiFetch } from "./client";
import type {
  ShortLinkList,
  ShortLinkRow,
  ShortLinkMeta,
  ShortLinkSort,
} from "@/types/short-link";

/**
 * GET /short-links?q=&sort=
 * バックエンドは `{ data, meta: { total_links, total_clicks, base_url } }` を返す。
 * data を行に、meta を集計としてそのまま返す。
 */
export async function fetchShortLinks(
  params: { q?: string; sort?: ShortLinkSort } = {},
): Promise<ShortLinkList> {
  const { items, meta } = await apiFetchPaginated<ShortLinkRow>("/short-links", {
    query: { q: params.q, sort: params.sort },
  });
  const m = meta as unknown as Partial<ShortLinkMeta>;
  return {
    links: items,
    meta: {
      total_links: m.total_links ?? items.length,
      total_clicks: m.total_clicks ?? 0,
      base_url: m.base_url ?? "",
    },
  };
}

/** DELETE /short-links/{id} */
export async function deleteShortLink(id: number): Promise<void> {
  await apiFetch(`/short-links/${id}`, { method: "DELETE" });
}
