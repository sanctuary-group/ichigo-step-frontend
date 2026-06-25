import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/ban-detection";

const LABELS: Record<RiskLevel, string> = {
  normal: "正常",
  warning: "警告",
  danger: "危険",
};

const CLASSES: Record<RiskLevel, string> = {
  normal:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  danger:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 animate-pulse",
};

export function RiskBadge({
  risk,
  className,
}: {
  risk: RiskLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-bold",
        CLASSES[risk],
        className,
      )}
    >
      {LABELS[risk]}
    </span>
  );
}
