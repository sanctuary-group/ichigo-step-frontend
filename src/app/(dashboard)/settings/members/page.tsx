"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faEllipsis } from "@fortawesome/free-solid-svg-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
  joinedAt: string;
  status: "active" | "invited";
};

const MOCK_MEMBERS: Member[] = [
  {
    id: "m_1",
    name: "Ryu Ichigo",
    email: "ryu.ichigo20250310@gmail.com",
    role: "owner",
    joinedAt: "2026-04-01",
    status: "active",
  },
  {
    id: "m_2",
    name: "山田 花子",
    email: "yamada@example.com",
    role: "admin",
    joinedAt: "2026-04-15",
    status: "active",
  },
  {
    id: "m_3",
    name: "佐藤 太郎",
    email: "sato@example.com",
    role: "staff",
    joinedAt: "2026-05-10",
    status: "active",
  },
  {
    id: "m_4",
    name: "（招待中）",
    email: "newbie@example.com",
    role: "staff",
    joinedAt: "2026-05-22",
    status: "invited",
  },
];

const ROLE_LABEL: Record<Member["role"], string> = {
  owner: "オーナー",
  admin: "管理者",
  staff: "スタッフ",
};

export default function MembersSettingsPage() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">メンバー</h2>
          <p className="text-xs text-muted-foreground mt-1">
            この組織のメンバーとロールを管理します
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <FontAwesomeIcon icon={faUserPlus} className="size-3.5" />
          メンバーを招待
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">名前</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>参加日</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_MEMBERS.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/40">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback>{m.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {m.name}
                        {m.status === "invited" && (
                          <span className="text-[10px] px-1.5 h-4 inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                            招待中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.email}
                </TableCell>
                <TableCell>
                  {m.role === "owner" ? (
                    <span className="text-xs">{ROLE_LABEL[m.role]}</span>
                  ) : (
                    <Select defaultValue={m.role}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">管理者</SelectItem>
                        <SelectItem value="staff">スタッフ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {m.joinedAt}
                </TableCell>
                <TableCell className="text-right">
                  {m.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="操作"
                          />
                        }
                      >
                        <FontAwesomeIcon
                          icon={faEllipsis}
                          className="size-3.5"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          {m.status === "invited" && (
                            <DropdownMenuItem>招待を再送</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            メンバーを削除
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <InviteDialog open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
}

function InviteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>メンバーを招待</DialogTitle>
          <DialogDescription>
            招待リンクが記載されたメールが送信されます
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="member@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">ロール</Label>
            <Select defaultValue="staff">
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="staff">スタッフ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onClose}>招待を送信（モック）</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
