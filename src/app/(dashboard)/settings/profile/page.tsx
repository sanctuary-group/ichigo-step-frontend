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
import { fetchProfile, updateProfile, updatePassword } from "@/lib/api/profile";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

export default function ProfileSettingsPage() {
  const { user, logout, refresh } = useAuth();
  const { data: profile, mutate } = useResource("profile", fetchProfile);

  // 編集中は draft、未編集なら取得値を表示（setState-in-effect を避ける）。
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const name = nameDraft ?? profile?.name ?? user?.name ?? "";
  const email = emailDraft ?? profile?.email ?? user?.email ?? "";
  const setName = (v: string) => setNameDraft(v);
  const setEmail = (v: string) => setEmailDraft(v);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({ name, email });
      setNameDraft(null);
      setEmailDraft(null);
      mutate();
      refresh();
      setProfileMsg("保存しました");
    } catch (e) {
      setProfileMsg(e instanceof ApiError ? e.message : "保存に失敗しました");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelProfile() {
    setNameDraft(null);
    setEmailDraft(null);
    setProfileMsg(null);
  }

  async function handleUpdatePassword() {
    setSavingPw(true);
    setPwMsg(null);
    try {
      await updatePassword({
        current_password: curPw,
        password: newPw,
        password_confirmation: confPw,
      });
      setCurPw("");
      setNewPw("");
      setConfPw("");
      setPwMsg("パスワードを更新しました");
    } catch (e) {
      setPwMsg(e instanceof ApiError ? e.message : "更新に失敗しました");
    } finally {
      setSavingPw(false);
    }
  }

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
            {profileMsg && (
              <span className="text-xs text-muted-foreground mr-auto">{profileMsg}</span>
            )}
            <Button variant="outline" onClick={handleCancelProfile} disabled={savingProfile}>
              キャンセル
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "保存中…" : "保存"}
            </Button>
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
              <Input
                id="cur"
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">新しいパスワード</Label>
              <Input
                id="new"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">確認用</Label>
              <Input
                id="conf"
                type="password"
                value={confPw}
                onChange={(e) => setConfPw(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {pwMsg && (
              <span className="text-xs text-muted-foreground mr-auto">{pwMsg}</span>
            )}
            <Button
              onClick={handleUpdatePassword}
              disabled={savingPw || !curPw || !newPw || !confPw}
            >
              {savingPw ? "更新中…" : "パスワードを更新"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>セッション</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => logout()}>
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
