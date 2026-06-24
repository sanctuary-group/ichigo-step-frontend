import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  diff,
  icon,
}: {
  label: string;
  value: number;
  unit?: string;
  diff?: number;
  icon?: IconDefinition;
}) {
  const positive = (diff ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        {icon && (
          <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <FontAwesomeIcon icon={icon} className="size-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="flex items-baseline gap-1 mt-1">
            <div className="text-2xl font-bold tabular-nums">
              {value.toLocaleString()}
            </div>
            {unit && (
              <div className="text-xs text-muted-foreground">{unit}</div>
            )}
          </div>
          {diff !== undefined && (
            <div
              className={cn(
                "inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium",
                positive ? "text-primary" : "text-destructive"
              )}
            >
              <FontAwesomeIcon
                icon={positive ? faArrowUp : faArrowDown}
                className="size-2.5"
              />
              {Math.abs(diff).toFixed(1)}%
              <span className="text-muted-foreground font-normal">前30日比</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
