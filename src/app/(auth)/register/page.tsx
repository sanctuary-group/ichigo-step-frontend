"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPaperPlane,
  faEye,
  faEyeSlash,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";

import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterStepper } from "@/components/auth/register-stepper";
import { cn } from "@/lib/utils";

type Step = "email" | "profile" | "password" | "confirm" | "complete";

type FormData = {
  email: string;
  agreed: boolean;
  name: string;
  company: string;
  phone: string;
  password: string;
  passwordConfirm: string;
};

const INITIAL_FORM: FormData = {
  email: "",
  agreed: false,
  name: "",
  company: "",
  phone: "",
  password: "",
  passwordConfirm: "",
};

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("email");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);

  const stepperCurrent: 1 | 2 | 3 =
    step === "email" ? 1 : step === "complete" ? 3 : 2;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {step !== "complete" && <RegisterStepper current={stepperCurrent} />}

      <div className="w-full max-w-md mx-auto">
        {step === "email" && (
          <EmailStep
            form={form}
            setForm={setForm}
            onNext={() => setStep("profile")}
          />
        )}
        {step === "profile" && (
          <ProfileStep
            form={form}
            setForm={setForm}
            onNext={() => setStep("password")}
          />
        )}
        {step === "password" && (
          <PasswordStep
            form={form}
            setForm={setForm}
            onNext={() => setStep("confirm")}
            onBack={() => setStep("profile")}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            form={form}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((v) => !v)}
            onSubmit={() => setStep("complete")}
            onBack={() => setStep("email")}
          />
        )}
        {step === "complete" && <CompleteStep />}
      </div>
    </div>
  );
}

function EmailStep({
  form,
  setForm,
  onNext,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
}) {
  const canSubmit = form.email.trim() !== "" && form.agreed;

  return (
    <Card className="border-border/60">
      <CardContent className="px-8 py-8 space-y-5">
        <h1 className="text-center text-lg font-bold">
          ichigo-step アカウントを作成しましょう
        </h1>
        <div className="space-y-1.5 text-center">
          <p className="text-sm">登録するメールアドレスを入力してください。</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            独自ドメインを利用したアドレスでメールが届かない場合
            <br />
            フリーメールアドレスでご登録ください。
          </p>
        </div>

        <div className="relative">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="email"
            placeholder="メールアドレス"
            className="pl-10 h-11"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={form.agreed}
            onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
          />
          <span>
            「
            <a
              href="#"
              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              利用規約
            </a>
            」および「
            <a
              href="#"
              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              プライバシーポリシー
            </a>
            」に同意する
          </span>
        </label>

        <Button
          type="button"
          className="w-full h-11 rounded-full gap-2"
          disabled={!canSubmit}
          onClick={onNext}
        >
          <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
          認証メールを送信
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          すでにご登録済みの方は{" "}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            ログイン
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileStep({
  form,
  setForm,
  onNext,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
}) {
  const canSubmit = form.name.trim() !== "" && form.phone.trim() !== "";

  return (
    <Card className="border-border/60">
      <CardContent className="px-8 py-8 space-y-5">
        <h1 className="text-center text-lg font-bold">アカウント登録</h1>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">メールアドレス</div>
          <div className="text-sm">{form.email}</div>
        </div>

        <RequiredField required>
          <Input
            placeholder="名前・担当者名"
            className="h-11 pr-16"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </RequiredField>

        <div className="relative">
          <Input
            placeholder="会社名・屋号"
            className="h-11 pr-12"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center size-6 rounded-md bg-muted text-muted-foreground text-xs">
            ···
          </span>
        </div>

        <RequiredField required>
          <Input
            placeholder="電話番号（ハイフンなし）"
            inputMode="numeric"
            className="h-11 pr-16"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </RequiredField>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-full border-primary text-primary font-bold disabled:opacity-50"
          disabled={!canSubmit}
          onClick={onNext}
        >
          次に進む
        </Button>
      </CardContent>
    </Card>
  );
}

function PasswordStep({
  form,
  setForm,
  onNext,
  onBack,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const showPasswordError = form.password.trim() === "";
  const showConfirmError = form.passwordConfirm.trim() === "";
  const canSubmit =
    form.password.trim() !== "" &&
    form.passwordConfirm.trim() !== "" &&
    form.password === form.passwordConfirm;

  return (
    <Card className="border-border/60">
      <CardContent className="px-8 py-8 space-y-5">
        <h1 className="text-center text-lg font-bold">アカウント登録</h1>

        <div className="space-y-2">
          <Label className="text-sm font-bold">パスワード</Label>
          <div className="rounded-md bg-muted/50 px-4 py-3 text-xs leading-relaxed space-y-1">
            <div>
              ・英大文字・小文字・数字・記号それぞれを最低1文字ずつ含む6~12文字
            </div>
            <div className="break-all">
              ・使用可能な記号 ! @ # & ( ) - [ {"{"} {"}"} ] ; &apos; , . ? / * ~
              $ ^ + = &lt; &gt; . _ -
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <RequiredField required>
            <Input
              type="password"
              placeholder="パスワード"
              className="h-11 pr-16"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </RequiredField>
          {showPasswordError && (
            <div className="text-xs text-destructive font-medium">
              パスワードを入力してください。
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <RequiredField required>
            <Input
              type="password"
              placeholder="パスワード確認用"
              className="h-11 pr-16"
              value={form.passwordConfirm}
              onChange={(e) =>
                setForm({ ...form, passwordConfirm: e.target.value })
              }
            />
          </RequiredField>
          {showConfirmError && (
            <div className="text-xs text-destructive font-medium">
              パスワードの確認を入力してください。
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-full border-primary text-primary font-bold disabled:opacity-50"
          disabled={!canSubmit}
          onClick={onNext}
        >
          登録内容の確認
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline hover:no-underline"
          >
            前ページに戻る
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfirmStep({
  form,
  showPassword,
  onTogglePassword,
  onSubmit,
  onBack,
}: {
  form: FormData;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="px-8 py-8 space-y-5">
        <h1 className="text-center text-lg font-bold">アカウント登録</h1>

        <ConfirmRow label="メールアドレス" value={form.email} />
        <ConfirmRow label="名前・担当者名" value={form.name} />
        <ConfirmRow
          label="会社名・屋号"
          value={form.company || "—"}
        />
        <ConfirmRow label="電話番号" value={form.phone} />
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">パスワード</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono">
              {showPassword ? form.password : "•".repeat(form.password.length)}
            </span>
            <button
              type="button"
              onClick={onTogglePassword}
              className="text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="size-4"
              />
            </button>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-full border-primary text-primary font-bold"
          onClick={onSubmit}
        >
          アカウント登録
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline hover:no-underline"
          >
            最初のページに戻る
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteStep() {
  return (
    <Card className="border-border/60">
      <CardContent className="px-8 py-12 flex flex-col items-center text-center gap-4">
        <FontAwesomeIcon icon={faFlag} className="size-12 text-primary" />
        <div className="text-lg font-bold text-primary">アカウント登録完了</div>
        <p className="text-sm leading-relaxed">
          アカウント登録が完了しました。
          <br />
          ログインページよりログインしてください。
        </p>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-2 h-11 px-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          )}
        >
          ログイン
        </Link>
      </CardContent>
    </Card>
  );
}

function RequiredField({
  required,
  children,
}: {
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {required && (
        <span
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "inline-flex items-center justify-center text-[10px] font-bold",
            "px-1.5 py-0.5 rounded bg-destructive/10 text-destructive"
          )}
        >
          必須
        </span>
      )}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm break-all">{value}</div>
    </div>
  );
}
