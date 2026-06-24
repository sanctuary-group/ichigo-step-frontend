"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faUsers,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { cn } from "@/lib/utils";

type Item = { label: string; href: string; icon: IconDefinition };

const ITEMS: Item[] = [
  { label: "LINE チャネル", href: "/settings/channels", icon: faKey },
  { label: "メンバー", href: "/settings/members", icon: faUsers },
  { label: "プロフィール", href: "/settings/profile", icon: faUser },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">設定</h1>
          <p className="text-sm text-muted-foreground mt-1">
            組織・チャネル・メンバーの管理
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <nav className="space-y-0.5">
            {ITEMS.map((it) => {
              const active = pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <FontAwesomeIcon
                    icon={it.icon}
                    className={cn(
                      "size-4",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
