"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_CURRENT_USER } from "@/mocks/data";

export default function ProfileSettingsPage() {
  const [name, setName] = useState(MOCK_CURRENT_USER.name);
  const [email, setEmail] = useState(MOCK_CURRENT_USER.email);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">プロフィール</h2>
        <p className="text-xs text-muted-foreground mt-1">
          ご自身のアカウント情報を編集します
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl">
                {name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button variant="outline" size="sm" disabled>
                画像を変更（モック）
              </Button>
              <div className="text-[11px] text-muted-foreground">
                推奨: 正方形 PNG/JPG 512px 以上
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">表示名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline">キャンセル</Button>
            <Button>保存</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cur">現在のパスワード</Label>
              <Input id="cur" type="password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">新しいパスワード</Label>
              <Input id="new" type="password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">確認用</Label>
              <Input id="conf" type="password" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button>パスワードを更新</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>セッション</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className="size-3.5"
            />
            このブラウザからログアウト
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-4" />
            危険な操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            アカウントを削除すると、関連する組織からの脱退が必要です。
          </div>
          <Button variant="destructive" disabled>
            アカウントを削除
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
