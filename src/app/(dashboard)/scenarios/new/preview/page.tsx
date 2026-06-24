"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCaretDown,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";

export default function BulkPreviewPage() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
      {/* パンくず + 戻るリンク */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/scenarios/new"
            className="text-foreground underline hover:no-underline"
          >
            ステップ編集
          </Link>
          <span className="text-muted-foreground">&gt;</span>
          <span className="text-foreground">一括プレビュー</span>
        </nav>
        <Link
          href="/scenarios/new"
          className="inline-flex items-center gap-1 text-sm text-foreground underline hover:no-underline"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="size-3" />
          ステップ編集画面に戻る
        </Link>
      </div>

      <hr className="border-border" />

      {/* 詳細設定 折りたたみ */}
      <div>
        <button
          onClick={() => setDetailsOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary"
        >
          <FontAwesomeIcon
            icon={detailsOpen ? faCaretUp : faCaretDown}
            className="size-3"
          />
          詳細設定
        </button>
        {detailsOpen && (
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            プレビュー時の詳細設定（モック）— 表示順序 / フィルタ / テスト送信先など
          </div>
        )}
      </div>

      <hr className="border-border" />

      {/* 空状態 */}
      <div className="text-center py-20 text-sm text-foreground leading-relaxed">
        ステップ配信が作成されていません。
        <br />
        メッセージを追加すると表示されます。
      </div>
    </div>
  );
}
