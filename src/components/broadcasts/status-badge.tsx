import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "bg-muted text-muted-foreground" },
  scheduled: {
    label: "予約",
    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  sending: {
    label: "送信中",
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  sent: { label: "送信済", cls: "bg-primary/10 text-primary" },
  failed: { label: "失敗", cls: "bg-destructive/10 text-destructive" },
};

export function BroadcastStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const v = MAP[status] ?? MAP.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] px-2 h-5 rounded-full font-medium",
        v.cls,
        className
      )}
    >
      {v.label}
    </span>
  );
}
