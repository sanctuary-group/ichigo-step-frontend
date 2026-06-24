"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar";

export function MobileNavTrigger() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // ルート遷移時に自動で閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden size-10 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="メニューを開く"
          />
        }
      >
        <FontAwesomeIcon icon={faBars} className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">ナビゲーション</SheetTitle>
        <SidebarContent variant="mobile" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
