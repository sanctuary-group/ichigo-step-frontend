"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { NAV_GROUPS, type NavItem } from "@/lib/nav";
import { StrawberryIcon } from "@/components/strawberry-icon";
import { cn } from "@/lib/utils";

const HOVER_CLOSE_DELAY_MS = 150;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <SidebarContent variant="desktop" />
    </aside>
  );
}

/**
 * Sidebar の中身。デスクトップ <aside> とモバイル Sheet ドロワー両方で再利用する。
 * desktop: hover popout でサブメニュー展開
 * mobile: タップで accordion 展開（hover が効かないため）
 */
export function SidebarContent({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [expandedHrefs, setExpandedHrefs] = useState<Set<string>>(new Set());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = (href: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHoveredHref(href);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHoveredHref(null);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  const toggleExpand = (href: string) => {
    setExpandedHrefs((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-5 h-16 hover:bg-sidebar-accent/40 transition-colors"
      >
        <div className="grid place-items-center size-9 rounded-xl bg-primary/10">
          <StrawberryIcon className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold text-sidebar-foreground">
            ichigo-step
          </div>
          <div className="text-[10px] text-muted-foreground tracking-wider">
            LINE MARKETING
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <div className="px-3 mb-1.5 text-[11px] font-medium text-muted-foreground tracking-wider">
              {group.heading}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarRow
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  variant={variant}
                  isOpen={hoveredHref === item.href}
                  isExpanded={expandedHrefs.has(item.href)}
                  onOpen={() => openMenu(item.href)}
                  onClose={scheduleClose}
                  onToggleExpand={() => toggleExpand(item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 text-[10px] text-muted-foreground">
        v0.1.0 Mockup
      </div>
    </>
  );
}

function SidebarRow({
  item,
  pathname,
  variant,
  isOpen,
  isExpanded,
  onOpen,
  onClose,
  onToggleExpand,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  variant: "desktop" | "mobile";
  isOpen: boolean;
  isExpanded: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggleExpand: () => void;
  onNavigate?: () => void;
}) {
  const active = isActive(item.href, pathname);
  const hasChildren = !!item.children && item.children.length > 0;
  const liRef = useRef<HTMLLIElement>(null);
  const [popoutPos, setPopoutPos] = useState<{ top: number; left: number } | null>(
    null
  );

  const handleEnter = () => {
    if (variant !== "desktop" || !hasChildren) return;
    if (liRef.current) {
      const rect = liRef.current.getBoundingClientRect();
      setPopoutPos({ top: rect.top, left: rect.right });
    }
    onOpen();
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen, onClose]);

  return (
    <li
      ref={liRef}
      onMouseEnter={variant === "desktop" && hasChildren ? handleEnter : undefined}
      onMouseLeave={variant === "desktop" && hasChildren ? onClose : undefined}
    >
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "group/row flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm transition-colors flex-1 min-w-0",
            active
              ? "bg-primary/10 text-primary font-semibold"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <FontAwesomeIcon
            icon={item.icon}
            className={cn(
              "size-4 shrink-0",
              active
                ? "text-primary"
                : "text-muted-foreground group-hover/row:text-sidebar-accent-foreground"
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
              {item.badge}
            </span>
          )}
          {hasChildren && variant === "desktop" && (
            <FontAwesomeIcon
              icon={faChevronRight}
              className={cn(
                "size-2.5",
                active ? "text-primary/70" : "text-muted-foreground"
              )}
            />
          )}
        </Link>
        {hasChildren && variant === "mobile" && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "サブメニューを閉じる" : "サブメニューを開く"}
            className="grid place-items-center size-9 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <FontAwesomeIcon
              icon={isExpanded ? faChevronDown : faChevronRight}
              className="size-3"
            />
          </button>
        )}
      </div>

      {hasChildren && variant === "mobile" && isExpanded && (
        <ul className="mt-0.5 ml-7 space-y-0.5">
          {item.children!.map((child) => {
            const childActive = pathname === child.href;
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors",
                    childActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <FontAwesomeIcon
                    icon={child.icon}
                    className={cn(
                      "size-3.5 shrink-0",
                      childActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="flex-1 truncate">{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hasChildren && variant === "desktop" && isOpen && popoutPos && (
        <div
          className="fixed z-50 ml-1 min-w-44 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-1"
          style={{ top: popoutPos.top, left: popoutPos.left }}
          onMouseEnter={onOpen}
          onMouseLeave={onClose}
        >
          <ul className="space-y-0.5">
            {item.children!.map((child) => {
              const childActive = pathname === child.href;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors",
                      childActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <FontAwesomeIcon
                      icon={child.icon}
                      className={cn(
                        "size-3.5",
                        childActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 truncate">{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}
