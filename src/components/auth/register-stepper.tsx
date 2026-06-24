import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "メール送信" },
  { id: 2, label: "アカウント登録" },
  { id: 3, label: "完了" },
];

export function RegisterStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-start justify-center gap-0 max-w-xl mx-auto w-full mb-10">
      {STEPS.map((step, i) => {
        const done = step.id < current;
        const active = step.id === current;
        const isLast = i === STEPS.length - 1;
        const lineActive = step.id < current;

        return (
          <li
            key={step.id}
            className={cn("flex items-start", !isLast && "flex-1")}
          >
            <div className="flex flex-col items-center gap-2 w-20 shrink-0">
              <div
                className={cn(
                  "size-9 rounded-full grid place-items-center text-sm font-bold tabular-nums transition-colors",
                  (active || done) && "bg-primary text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                {done ? (
                  <FontAwesomeIcon icon={faCheck} className="size-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm whitespace-nowrap",
                  active && "text-primary font-bold",
                  done && "text-foreground",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5 mt-[18px] transition-colors",
                  lineActive ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
