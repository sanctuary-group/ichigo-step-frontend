import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon = faInbox,
  title,
  description,
  action,
  className,
}: {
  icon?: IconDefinition;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-3 py-16 px-6 text-center",
        className
      )}
    >
      <div className="grid place-items-center size-12 rounded-2xl bg-muted text-muted-foreground">
        <FontAwesomeIcon icon={icon} className="size-5" />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground max-w-sm">
            {description}
          </div>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
