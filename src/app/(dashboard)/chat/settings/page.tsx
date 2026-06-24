"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSort,
  faPenToSquare,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_CHAT_STATUSES } from "@/mocks/data";
import { cn } from "@/lib/utils";

type CategoryId =
  | "statuses"
  | "auto-read"
  | "shortcuts"
  | "short-url"
  | "preview"
  | "read-info";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "statuses", label: "対応ステータス編集" },
  { id: "auto-read", label: "メッセージの自動確認済み変更" },
  { id: "shortcuts", label: "送信ショートカット" },
  { id: "short-url", label: "短縮URLの利用" },
  { id: "preview", label: "送信プレビュー" },
  { id: "read-info", label: "既読情報の表示" },
];

export default function ChatSettingsPage() {
  const [active, setActive] = useState<CategoryId>("statuses");

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">1:1チャット設定</h1>
      </div>

      <div className="flex-1 flex overflow-hidden border-t border-border">
        <aside className="w-60 shrink-0 border-r border-border py-2 overflow-y-auto">
          <ul>
            {CATEGORIES.map((c) => {
              const on = c.id === active;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm transition-colors border-l-2",
                      on
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-transparent text-foreground hover:bg-muted/40"
                    )}
                  >
                    {c.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {active === "statuses" && <StatusesPanel />}
          {active === "auto-read" && <AutoReadPanel />}
          {active === "shortcuts" && <ShortcutsPanel />}
          {active === "short-url" && <ShortUrlPanel />}
          {active === "preview" && <PreviewPanel />}
          {active === "read-info" && <ReadInfoPanel />}
        </section>
      </div>
    </div>
  );
}

// ---- 対応ステータス編集 ----

function StatusesPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        title="対応ステータス編集"
        description="対応ステータスのテキストとカラーが変更できます"
      />

      <div className="flex items-center gap-2">
        <Button>
          <FontAwesomeIcon icon={faPlus} className="size-3" />
          追加
        </Button>
        <Button variant="outline">
          <FontAwesomeIcon icon={faSort} className="size-3" />
          並べ替え
        </Button>
      </div>

      <ul className="space-y-2 max-w-2xl">
        {MOCK_CHAT_STATUSES.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 h-10 px-4 rounded-md border"
              style={{
                backgroundColor: hexToRgba(s.color, 0.1),
                borderColor: hexToRgba(s.color, 0.3),
                color: s.color,
              }}
            >
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm font-medium">{s.name}</span>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="編集">
              <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="削除"
              className="text-muted-foreground hover:text-destructive"
            >
              <FontAwesomeIcon icon={faTrash} className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end max-w-2xl pt-2">
        <Select defaultValue="10">
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10/page</SelectItem>
            <SelectItem value="25">25/page</SelectItem>
            <SelectItem value="50">50/page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ---- メッセージの自動確認済み変更 ----

const AUTO_READ_TYPES = [
  { id: "ar_bracket", label: "【〇〇】メッセージ" },
  { id: "ar_sticker", label: "スタンプ" },
  { id: "ar_react_all", label: "[すべてのメッセージに反応] のメッセージ" },
  { id: "ar_react_keyword", label: "[設定したキーワードに反応] のメッセージ" },
];

function AutoReadPanel() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [onReply, setOnReply] = useState(false);
  const [onBlock, setOnBlock] = useState(false);

  const toggleType = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PanelHeader title="メッセージの自動確認済み変更" />

      <div className="p-4 rounded-lg bg-muted/60 text-sm text-foreground leading-relaxed">
        設定した受信メッセージを自動的に確認済みに変更します。
        <br />
        確認済みに変更されたメッセージは通知されません。
      </div>

      <ul className="space-y-3">
        {AUTO_READ_TYPES.map((t) => (
          <li key={t.id}>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked.has(t.id)}
                onChange={() => toggleType(t.id)}
                className="size-5 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">{t.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="space-y-2 pt-2">
        <div className="text-base font-bold tracking-tight">
          返信時の自動確認済み変更
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          未確認のメッセージがある場合に、メッセージの返信と同時に自動で確認済みに変更します。
        </div>
        <LabeledSwitch
          checked={onReply}
          onCheckedChange={setOnReply}
          offLabel="利用しない"
          onLabel="利用する"
        />
      </div>

      <div className="space-y-2 pt-2">
        <div className="text-base font-bold tracking-tight">
          ブロックされた友だちの自動確認済み変更
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          未確認のメッセージがある状態で、友だちからブロックされた際に自動で確認済みに変更します。
        </div>
        <LabeledSwitch
          checked={onBlock}
          onCheckedChange={setOnBlock}
          offLabel="利用しない"
          onLabel="利用する"
        />
      </div>

      <div className="pt-4">
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10"
        >
          保存
        </Button>
      </div>
    </div>
  );
}

function LabeledSwitch({
  checked,
  onCheckedChange,
  offLabel,
  onLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  offLabel: string;
  onLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span
        className={cn(
          "text-sm",
          !checked ? "font-bold text-foreground" : "text-muted-foreground"
        )}
      >
        {offLabel}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <span
        className={cn(
          "text-sm",
          checked ? "font-bold text-foreground" : "text-muted-foreground"
        )}
      >
        {onLabel}
      </span>
    </div>
  );
}

// ---- 送信ショートカット ----

type ShortcutMode = "shift_enter_send" | "enter_send";

function ShortcutsPanel() {
  const [mode, setMode] = useState<ShortcutMode>("shift_enter_send");

  return (
    <div className="space-y-6 max-w-3xl">
      <PanelHeader title="送信ショートカット" />

      <p className="text-sm text-foreground">
        送信時のショートカットを変更します。
      </p>

      <RadioGroup
        value={mode}
        onValueChange={(v) => setMode(v as ShortcutMode)}
        className="space-y-3"
      >
        <Label
          className={cn(
            "flex items-center gap-3 cursor-pointer text-sm",
            mode === "shift_enter_send"
              ? "text-primary font-bold"
              : "text-muted-foreground font-normal"
          )}
        >
          <RadioGroupItem value="shift_enter_send" />
          <span>
            送信：Shift +Enter　改行：Enter
          </span>
        </Label>
        <Label
          className={cn(
            "flex items-center gap-3 cursor-pointer text-sm",
            mode === "enter_send"
              ? "text-primary font-bold"
              : "text-muted-foreground font-normal"
          )}
        >
          <RadioGroupItem value="enter_send" />
          <span>
            送信：Enter　改行：Shift +Enter
          </span>
        </Label>
      </RadioGroup>

      <div className="pt-2">
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10"
        >
          保存
        </Button>
      </div>
    </div>
  );
}

// ---- 短縮URLの利用 ----

function ShortUrlPanel() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <PanelHeader title="短縮URLの利用" />

      <p className="text-sm text-foreground leading-relaxed">
        1:1チャットでURLを送信する際に短縮リンクを利用します。
        <br />
        (URL分析が利用できます)
      </p>

      <LabeledSwitch
        checked={enabled}
        onCheckedChange={setEnabled}
        offLabel="利用しない"
        onLabel="利用する"
      />

      <div className="pt-2">
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10"
        >
          保存
        </Button>
      </div>
    </div>
  );
}

// ---- 送信プレビュー ----

function PreviewPanel() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <PanelHeader title="送信プレビュー" />

      <p className="text-sm text-foreground">
        1:1チャットでの送信時にプレビューを表示します。
      </p>

      <LabeledSwitch
        checked={enabled}
        onCheckedChange={setEnabled}
        offLabel="利用しない"
        onLabel="利用する"
      />

      <div className="p-4 rounded-lg border-2 border-destructive/70 bg-destructive/5">
        <div className="flex items-center gap-1.5 text-destructive font-bold text-sm">
          <FontAwesomeIcon icon={faTriangleExclamation} className="size-3.5" />
          ご注意
        </div>
        <p className="mt-2 text-sm text-foreground leading-relaxed">
          LINE公式アカウントの仕様上、ichigo-stepからの送信取り消しはできません。送信から24時間以内のメッセージのみ、LINE公式アカウント管理画面のチャットから送信取り消しが可能です。詳細は
          <a
            href="#"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            こちら
          </a>
        </p>
      </div>

      <div className="pt-2">
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10"
        >
          保存
        </Button>
      </div>
    </div>
  );
}

// ---- 既読情報の表示 ----

const READ_INFO_FAQ: { question: string; answer: string; body: React.ReactNode }[] =
  [
    {
      question:
        "Q.ichigo-stepから友だちがメッセージを開いたか（既読か）はわかりますか？",
      answer: "A.ichigo-stepから友だちが既読したかどうかの情報は確認できません。",
      body: (
        <>
          これはLINE公式アカウント側の仕様のため、LINE公式アカウントの仕様が変更されない限り、ichigo-step側では既読情報の確認はできません。
          <br />
          詳細は
          <FaqLink />
        </>
      ),
    },
    {
      question:
        "Q.友だちがメッセージを送信してすぐに既読マークをつけないようにできますか？",
      answer: "A.LINE公式アカウントの設定変更で対応可能です。",
      body: (
        <>
          LINE公式アカウント管理画面の「応答設定」のチャットがオンかオフかによって表示が異なります。詳細は
          <FaqLink />
        </>
      ),
    },
    {
      question:
        "Q.友だちからのメッセージを確認しても、相手のライン上で「既読」がつかないのですがエラーですか？",
      answer:
        "A.LINE公式アカウント管理画面のチャット機能がオンになっている場合はLINE公式アカウント側でチャットを確認しない限りは既読は付きません。",
      body: (
        <>
          オフの場合は、友だちがメッセージを送信した時点で既読になります。
          <br />
          詳細は
          <FaqLink />
        </>
      ),
    },
  ];

function ReadInfoPanel() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PanelHeader title="既読情報の表示" />

      <div className="space-y-8">
        {READ_INFO_FAQ.map((qa, i) => (
          <div key={i} className="space-y-3">
            <div className="px-4 py-3 rounded-md bg-muted/60 text-sm font-bold text-foreground leading-relaxed">
              {qa.question}
            </div>
            <div className="px-1 space-y-2">
              <div className="text-sm font-bold text-foreground underline underline-offset-2">
                {qa.answer}
              </div>
              <div className="text-sm text-foreground leading-relaxed">
                {qa.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqLink() {
  return (
    <a
      href="#"
      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
    >
      こちら
    </a>
  );
}

// ---- 共通パーツ ----

function PanelHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
