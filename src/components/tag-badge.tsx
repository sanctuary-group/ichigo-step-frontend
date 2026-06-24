import { cn } from "@/lib/utils";
import type { MockTag } from "@/mocks/data";

export function TagBadge({
  tag,
  size = "default",
  className,
}: {
  tag: MockTag;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium border",
        size === "sm" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-xs",
        className
      )}
      style={{
        backgroundColor: hexToRgba(tag.color, 0.12),
        borderColor: hexToRgba(tag.color, 0.4),
        color: tag.color,
      }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
