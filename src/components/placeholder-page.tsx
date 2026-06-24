import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
  icon = faWandMagicSparkles,
  step,
}: {
  title: string;
  description?: string;
  icon?: IconDefinition;
  step?: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <Card className="border-dashed">
        <CardContent className="grid place-items-center gap-3 py-16 text-center">
          <div className="grid place-items-center size-14 rounded-2xl bg-primary/10 text-primary">
            <FontAwesomeIcon icon={icon} className="size-6" />
          </div>
          <div className="text-base font-medium">これから実装します</div>
          {step && (
            <div className="text-xs text-muted-foreground">{step}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
