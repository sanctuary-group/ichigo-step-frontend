"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faTriangleExclamation,
  faCircleCheck,
  faCircleExclamation,
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
  const [companyDraft, setCompanyDraft] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);

  const name = nameDraft ?? profile?.name ?? user?.name ?? "";
  const email = emailDraft ?? profile?.email ?? user?.email ?? "";
  const company = companyDraft ?? profile?.company ?? "";
  const phone = phoneDraft ?? profile?.phone ?? "";
  const emailVerified = profile?.email_verified ?? false;

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {},
  );

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const dirty =
    nameDraft !== null ||
    emailDraft !== null ||
    companyDraft !== null ||
    phoneDraft !== null;

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileErrors({});
    try {
      await updateProfile({
        name,
        email,
        company: company || null,
        phone: phone || null,
      });
      setNameDraft(null);
      setEmailDraft(null);
      setCompanyDraft(null);
      setPhoneDraft(null);
      mutate();
      refresh();
      setProfileMsg("保存しました");
    } catch (e) {
      if (e instanceof ApiError) setProfileErrors(e.fieldErrors());
      setProfileMsg(e instanceof ApiError ? e.message : "保存に失敗しました");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelProfile() {
    setNameDraft(null);
    setEmailDraft(null);
    setCompanyDraft(null);
    setPhoneDraft(null);
    setProfileMsg(null);
    setProfileErrors({});
  }

  async function handleUpdatePassword() {
    setSavingPw(true);
    setPwMsg(null);
    setPwErrors({});
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
      if (e instanceof ApiError) setPwErrors(e.fieldErrors());
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
                {name.slice(0, 1) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button type="button" variant="outline" size="sm" disabled>
                画像を変更
              </Button>
              <div className="text-[11px] text-muted-foreground">
                推奨: 正方形 PNG/JPG 512px 以上
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field id="name" label="表示名" error={profileErrors.name}>
              <Input
                id="name"
                value={name}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={50}
              />
            </Field>
            <Field
              id="email"
              label="メールアドレス"
              error={profileErrors.email}
            >
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmailDraft(e.target.value)}
              />
              {emailVerified ? (
                <p className="text-[11px] text-primary flex items-center gap-1">
                  <FontAwesomeIcon icon={faCircleCheck} className="size-3" />
                  確認済み
                </p>
              ) : (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="size-3"
                  />
                  未確認
                </p>
              )}
            </Field>
            <Field id="company" label="会社名・屋号" error={profileErrors.company}>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompanyDraft(e.target.value)}
                maxLength={100}
              />
            </Field>
            <Field
              id="phone"
              label="電話番号（ハイフンなし）"
              error={profileErrors.phone}
            >
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhoneDraft(e.target.value)}
                inputMode="numeric"
                placeholder="09012345678"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2">
            {profileMsg && (
              <span className="text-xs text-muted-foreground mr-auto">
                {profileMsg}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelProfile}
              disabled={!dirty || savingProfile}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={!dirty || savingProfile}
            >
              {savingProfile ? "保存中..." : "保存"}
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
            <Field
              id="cur"
              label="現在のパスワード"
              error={pwErrors.current_password}
            >
              <Input
                id="cur"
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field id="new" label="新しいパスワード" error={pwErrors.password}>
              <Input
                id="new"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field id="conf" label="確認用">
              <Input
                id="conf"
                type="password"
                value={confPw}
                onChange={(e) => setConfPw(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground">
            英大文字・小文字・数字・記号をそれぞれ1文字以上含む6〜12文字
          </p>
          <div className="flex items-center justify-end gap-2">
            {pwMsg && (
              <span className="text-xs text-muted-foreground mr-auto">
                {pwMsg}
              </span>
            )}
            <Button
              onClick={handleUpdatePassword}
              disabled={savingPw || !curPw || !newPw}
            >
              {savingPw ? "更新中..." : "パスワードを更新"}
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
            <FontAwesomeIcon icon={faRightFromBracket} className="size-3.5" />
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

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
