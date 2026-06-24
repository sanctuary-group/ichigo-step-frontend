"use client";

import { useId } from "react";

type Point = { date: string; value: number };
type Series = { label: string; color: string; data: Point[] };

const W = 600;
const H = 180;
const PAD_X = 28;
const PAD_Y = 16;

/**
 * 軽量 SVG 折れ線チャート（複数系列対応、目盛は y 軸のみ簡易）。
 * MVP 用なのでツールチップ等は無し。
 */
export function MiniLineChart({
  series,
  height = H,
}: {
  series: Series[];
  height?: number;
}) {
  const id = useId();
  const allValues = series.flatMap((s) => s.data.map((p) => p.value));
  const maxV = Math.max(1, ...allValues);
  const niceMax = Math.ceil(maxV / 5) * 5 || 5;
  const xs = series[0]?.data.length ?? 0;

  const xScale = (i: number) =>
    PAD_X + (i * (W - PAD_X * 2)) / Math.max(1, xs - 1);
  const yScale = (v: number) =>
    height - PAD_Y - (v / niceMax) * (height - PAD_Y * 2);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-auto"
        role="img"
        aria-label="折れ線チャート"
      >
        {/* y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = yScale(niceMax * t);
          return (
            <g key={t}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
                strokeDasharray={t === 0 ? "" : "2 3"}
              />
              <text
                x={PAD_X - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {Math.round(niceMax * t)}
              </text>
            </g>
          );
        })}

        {/* series */}
        {series.map((s, si) => {
          const path = s.data
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"}${xScale(i).toFixed(2)},${yScale(p.value).toFixed(2)}`
            )
            .join(" ");
          const areaPath =
            `M${xScale(0).toFixed(2)},${(height - PAD_Y).toFixed(2)} ` +
            s.data
              .map(
                (p, i) =>
                  `L${xScale(i).toFixed(2)},${yScale(p.value).toFixed(2)}`
              )
              .join(" ") +
            ` L${xScale(s.data.length - 1).toFixed(2)},${(height - PAD_Y).toFixed(2)} Z`;
          return (
            <g key={s.label}>
              <defs>
                <linearGradient
                  id={`${id}-grad-${si}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={areaPath} fill={`url(#${id}-grad-${si})`} />
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 ml-1">
        {series.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniBarChart({
  data,
  color = "var(--color-primary)",
  height = H,
}: {
  data: Point[];
  color?: string;
  height?: number;
}) {
  const maxV = Math.max(1, ...data.map((p) => p.value));
  const niceMax = Math.ceil(maxV / 5) * 5 || 5;
  const innerW = W - PAD_X * 2;
  const barW = innerW / data.length - 2;
  const yScale = (v: number) =>
    height - PAD_Y - (v / niceMax) * (height - PAD_Y * 2);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-auto"
        role="img"
        aria-label="棒グラフ"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = yScale(niceMax * t);
          return (
            <g key={t}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
                strokeDasharray={t === 0 ? "" : "2 3"}
              />
              <text
                x={PAD_X - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {Math.round(niceMax * t)}
              </text>
            </g>
          );
        })}
        {data.map((p, i) => {
          const x = PAD_X + (i * innerW) / data.length + 1;
          const y = yScale(p.value);
          const h = height - PAD_Y - y;
          return (
            <rect
              key={p.date}
              x={x}
              y={y}
              width={barW}
              height={Math.max(0, h)}
              rx={2}
              fill={color}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
}

export type { Point, Series };
