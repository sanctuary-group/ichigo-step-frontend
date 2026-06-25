import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";

type GuideTopic = "connection" | "webhook" | "liff" | "qr";

/**
 * 各ページのヘッダー等に置く「使い方ガイド」への導線ボタン。
 * クリックで該当トピックのガイドへ遷移する。
 */
export function GuideButton({
    topic,
    label = "使い方ガイド",
    className,
}: {
    topic: GuideTopic;
    label?: string;
    className?: string;
}) {
    return (
        <Link
            href={`/guide?topic=${topic}`}
            className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-blue-400 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors",
                className,
            )}
        >
            <FontAwesomeIcon icon={faCircleQuestion} className="size-3.5" />
            {label}
        </Link>
    );
}
