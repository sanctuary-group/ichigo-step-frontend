/** 短縮URL（クリック計測）の行。 */
export type ShortLinkRow = {
  id: number;
  token: string;
  original_url: string;
  click_count: number;
  last_clicked_at: string | null;
  created_at: string;
  friend: { id: number; name: string } | null;
};

/** 短縮URL一覧の集計・基準URL。 */
export type ShortLinkMeta = {
  total_links: number;
  total_clicks: number;
  base_url: string;
};

export type ShortLinkSort = "clicks" | "recent";

/** 一覧の取得結果（行 + 集計）。 */
export type ShortLinkList = {
  links: ShortLinkRow[];
  meta: ShortLinkMeta;
};
