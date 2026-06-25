"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LiffAuthMock } from "./liff-auth-mock";

export type QrCodeDialogTarget = {
  name: string;
  token: string;
  public_url: string;
  image_url?: string | null;
  scan_count: number;
  follow_count: number;
};

/** 一覧の「QRコードを表示」で開く、アクションURL + QR + 認証ページ説明のモーダル。 */
export function QrCodeDialog({
  qr,
  accountName,
  onClose,
}: {
  qr: QrCodeDialogTarget | null;
  accountName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    if (!qr) return;
    navigator.clipboard.writeText(qr.public_url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog
      open={qr !== null}
      onOpenChange={(o) => {
        if (!o) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {qr && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{qr.name}</DialogTitle>
            </DialogHeader>

            {/* アクションURL（QRコード） */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-1.5">
                <h2 className="text-sm font-bold">アクションURL（QRコード）</h2>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  title="QRコード（URL）を読み込むとこのアクションが発火します"
                  className="size-3 text-muted-foreground cursor-help"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <code className="flex-1 text-xs bg-muted rounded-md px-3 py-2.5 truncate">
                      {qr.public_url}
                    </code>
                    <button
                      onClick={copyUrl}
                      className="shrink-0 size-10 grid place-items-center rounded-md border border-border hover:bg-muted text-muted-foreground"
                      aria-label="コピー"
                    >
                      <FontAwesomeIcon icon={faCopy} className="size-4" />
                    </button>
                  </div>
                  {qr.image_url && (
                    <>
                      <div className="shrink-0 size-20 rounded-md border border-border bg-white grid place-items-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qr.image_url}
                          alt="QRコード"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <a
                        href={qr.image_url}
                        download={`qr-${qr.token}.png`}
                        className="shrink-0 size-10 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
                        aria-label="QR画像をダウンロード"
                        title="QR画像をダウンロード"
                      >
                        <FontAwesomeIcon icon={faDownload} className="size-4" />
                      </a>
                    </>
                  )}
                </div>
                {copied && (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    コピーしました
                  </p>
                )}
                <div className="mt-4 flex gap-6 text-xs text-muted-foreground">
                  <div>
                    URL読込人数:{" "}
                    <span className="font-bold text-foreground tabular-nums">
                      {qr.scan_count.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    友だち追加:{" "}
                    <span className="font-bold text-foreground tabular-nums">
                      {qr.follow_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 認証ページの表示について */}
            <section className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <h2 className="text-sm font-bold">
                  認証ページの表示について（LIFF URLへのアクセス）
                </h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                <LiffAuthMock accountName={accountName} />
                <div className="space-y-4 text-sm">
                  <p className="leading-relaxed">
                    認証ページは、
                    <span className="text-primary underline">LIFF(リフ)</span> URLにアクセスした際に
                    友だち1人につき1度のみ表示されます。
                  </p>
                  <p className="font-bold text-destructive">
                    これはLINE公式アカウントの仕様で、非表示にすることはできません。
                  </p>
                  <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-2">
                    <p className="text-sm font-bold">LIFF URLを利用している機能</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>・QRコードアクション</li>
                      <li>・フォーム作成</li>
                      <li>・予約（面談/レッスン/イベント）</li>
                      <li>・商品販売</li>
                      <li>・友だち紹介</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                閉じる
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
