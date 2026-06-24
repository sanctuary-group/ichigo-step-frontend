"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faQrcode,
  faHeadset,
  faBell,
  faChartColumn,
  faUser,
  faFileLines,
  faYenSign,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_CHANNELS, MOCK_CURRENT_USER } from "@/mocks/data";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MobileNavTrigger } from "@/components/layout/mobile-nav-trigger";

export function Header() {
  const currentChannel = MOCK_CHANNELS[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 h-16 px-2 sm:px-4 lg:px-6 bg-background/95 backdrop-blur border-b border-border">
      <MobileNavTrigger />
      {/* Center: channel switcher */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-2xl lg:mx-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="flex-1 justify-between h-11 rounded-full px-2 w-full"
              />
            }
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="size-8">
                <AvatarImage src={currentChannel.pictureUrl} />
                <AvatarFallback>
                  {currentChannel.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">
                {currentChannel.name}
              </span>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="size-3 ml-2 text-muted-foreground"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>LINE 公式アカウント</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MOCK_CHANNELS.map((c) => (
                <DropdownMenuItem key={c.id} className="gap-2 py-2">
                  <Avatar className="size-7">
                    <AvatarImage src={c.pictureUrl} />
                    <AvatarFallback>{c.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {c.basicId}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="hidden md:inline-flex rounded-full size-11"
              />
            }
          >
            <FontAwesomeIcon icon={faQrcode} className="size-4" />
          </TooltipTrigger>
          <TooltipContent>友だち追加 QR</TooltipContent>
        </Tooltip>
      </div>

      {/* Right utilities */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="hidden sm:flex items-center gap-1">
          <HeaderIconButton icon={faChartColumn} label="配信数" />
          <HeaderIconButton icon={faHeadset} label="サポート" />
          <HeaderIconButton icon={faBell} label="お知らせ" dot />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="h-11 rounded-full pl-1 pr-2 gap-2 ml-1"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback>
                {MOCK_CURRENT_USER.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden md:inline">
              {MOCK_CURRENT_USER.name}
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="size-3 text-muted-foreground"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="size-10">
                <AvatarFallback>
                  {MOCK_CURRENT_USER.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="text-base font-bold">{MOCK_CURRENT_USER.name}</div>
            </div>
            <DropdownMenuSeparator />
            <div className="flex items-center gap-2 px-2 py-2.5 text-sm">
              <span className="size-2.5 rounded-full bg-primary" />
              <span>フリープラン</span>
            </div>
            <div className="px-2 pb-2">
              <Link
                href="/settings/profile"
                className="block w-full text-center rounded-md border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 h-10 leading-10 text-sm font-bold transition-colors"
              >
                マイページ
              </Link>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/settings/channels" />}
              className="gap-3 py-2.5"
            >
              <FontAwesomeIcon
                icon={faUser}
                className="size-4 text-muted-foreground"
              />
              LINE公式アカウント一覧
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-2.5">
              <FontAwesomeIcon
                icon={faFileLines}
                className="size-4 text-muted-foreground"
              />
              契約情報
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-2.5">
              <FontAwesomeIcon
                icon={faYenSign}
                className="size-4 text-muted-foreground"
              />
              決済履歴・領収書
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 py-2.5">
              <FontAwesomeIcon
                icon={faRightFromBracket}
                className="size-4 text-muted-foreground"
              />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function HeaderIconButton({
  icon,
  label,
  dot,
}: {
  icon: IconDefinition;
  label: string;
  dot?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-full text-muted-foreground hover:text-foreground"
          />
        }
      >
        <FontAwesomeIcon icon={icon} className="size-4" />
        {dot && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
