import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm mx-auto">
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-center">ログイン</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action="/chat" className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" type="password" />
          </div>
          <Button type="submit" className="w-full">
            ログイン
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="text-primary hover:underline">
            新規登録
          </Link>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
