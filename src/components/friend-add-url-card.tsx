"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faDownload,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ADD_URL = "https://line.me/R/ti/p/%40775relmc";

export function FriendAddUrlCard() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-bold">友だち追加URL</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={ADD_URL}
                readOnly
                className="h-10 pr-10 bg-muted/30"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-7 rounded hover:bg-muted text-muted-foreground"
                aria-label="URLをコピー"
              >
                <FontAwesomeIcon icon={faCopy} className="size-3.5" />
              </button>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="size-3.5" />
              LINE公式アカウントの友だち追加URLとの違い
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-28 grid place-items-center rounded-md border border-border bg-background p-2">
              <QrPlaceholder />
            </div>
            <button
              type="button"
              className="grid place-items-center size-8 rounded hover:bg-muted text-muted-foreground self-end"
              aria-label="QRコードをダウンロード"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QrPlaceholder() {
  return (
    <svg
      viewBox="0 0 33 33"
      className="size-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="33" height="33" fill="white" />
      <g fill="black">
        <rect x="0" y="0" width="7" height="7" />
        <rect x="1" y="1" width="5" height="5" fill="white" />
        <rect x="2" y="2" width="3" height="3" />
        <rect x="26" y="0" width="7" height="7" />
        <rect x="27" y="1" width="5" height="5" fill="white" />
        <rect x="28" y="2" width="3" height="3" />
        <rect x="0" y="26" width="7" height="7" />
        <rect x="1" y="27" width="5" height="5" fill="white" />
        <rect x="2" y="28" width="3" height="3" />
      </g>
      <g fill="black">
        {QR_DOTS.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="1" height="1" />
        ))}
      </g>
    </svg>
  );
}

const QR_DOTS: [number, number][] = [
  [8, 0], [10, 0], [12, 0], [14, 0], [16, 0], [18, 0], [20, 0], [22, 0], [24, 0],
  [8, 2], [11, 2], [13, 2], [15, 2], [19, 2], [21, 2], [23, 2],
  [9, 4], [10, 4], [12, 4], [17, 4], [18, 4], [20, 4], [24, 4],
  [8, 6], [11, 6], [14, 6], [16, 6], [22, 6],
  [0, 8], [2, 8], [4, 8], [6, 8], [9, 8], [11, 8], [13, 8], [15, 8], [17, 8], [20, 8], [22, 8], [25, 8], [27, 8], [30, 8], [32, 8],
  [1, 10], [3, 10], [8, 10], [12, 10], [14, 10], [18, 10], [21, 10], [24, 10], [26, 10], [29, 10],
  [0, 12], [5, 12], [7, 12], [10, 12], [11, 12], [16, 12], [19, 12], [22, 12], [25, 12], [28, 12], [31, 12],
  [2, 14], [4, 14], [6, 14], [9, 14], [13, 14], [15, 14], [17, 14], [20, 14], [23, 14], [26, 14], [30, 14], [32, 14],
  [1, 16], [3, 16], [5, 16], [8, 16], [11, 16], [14, 16], [18, 16], [21, 16], [24, 16], [27, 16], [29, 16], [31, 16],
  [0, 18], [4, 18], [7, 18], [9, 18], [12, 18], [16, 18], [19, 18], [22, 18], [25, 18], [28, 18], [32, 18],
  [2, 20], [5, 20], [10, 20], [13, 20], [15, 20], [18, 20], [21, 20], [24, 20], [27, 20], [30, 20],
  [1, 22], [3, 22], [8, 22], [11, 22], [14, 22], [17, 22], [20, 22], [23, 22], [26, 22], [29, 22], [31, 22],
  [9, 24], [12, 24], [15, 24], [19, 24], [22, 24], [25, 24], [28, 24], [32, 24],
  [8, 26], [11, 26], [14, 26], [17, 26], [20, 26], [23, 26], [26, 26], [29, 26], [31, 26],
  [9, 28], [13, 28], [16, 28], [18, 28], [21, 28], [24, 28], [27, 28], [30, 28], [32, 28],
  [8, 30], [10, 30], [12, 30], [15, 30], [19, 30], [22, 30], [25, 30], [28, 30], [31, 30],
  [9, 32], [11, 32], [14, 32], [16, 32], [18, 32], [20, 32], [23, 32], [26, 32], [29, 32], [32, 32],
];
