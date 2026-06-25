"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faAngleRight,
  faClipboard,
  faTag,
  faAddressCard,
  faStairs,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionEditDialog } from "@/components/action-edit-dialog";
import { cn } from "@/lib/utils";
import { fetchFolders } from "@/lib/api/folders";
import { createQrAction } from "@/lib/api/qr-actions";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

const MAX_NAME = 50;
const MAX_CONTENT = 5000;

type SettingId =
  | "read"
  | "active"
  | "referral"
  | "option";

const SETTINGS: { id: SettingId; label: string }[] = [
  { id: "read", label: "読み込み時アクション" },
  { id: "active", label: "稼働ON・OFFの設定" },
  { id: "referral", label: "紹介時アクション" },
  { id: "option", label: "オプション設定" },
];

export default function NewQrActionPage() {
  const router = useRouter();
  const { currentChannelId } = useAuth();
  const { data: folders } = useResource(
    currentChannelId ? "qr-action-folders" : null,
    () => fetchFolders("qr-action-folders"),
  );
  const folderList = folders ?? [];

  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [setting, setSetting] = useState<SettingId>("read");
  const [content, setContent] = useState("");
  const [combineGreeting, setCombineGreeting] = useState<string>("combine");
  const [actionOpen, setActionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveFolderId = folderId || folderList[0]?.id || "";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await createQrAction({
        name: name.trim(),
        qr_action_folder_id: Number(effectiveFolderId),
        audience: "new",
        message: content || undefined,
        combine_greeting: combineGreeting === "combine",
        action_type: "none",
      });
      router.push("/qr-actions");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 bg-muted/30 border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_320px] gap-6 items-end">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Link
                href="/qr-actions"
                className="hover:text-foreground hover:underline"
              >
                TOP
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
              <span className="font-bold text-foreground">
                QRコードアクション 編集
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">稼働対象</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                <span className="size-2 rounded-full bg-primary" />
                新規友だち追加時のみ
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-end justify-between">
              <Label htmlFor="qr-edit-name" className="text-xs font-bold">
                管理名
              </Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {name.length}/ {MAX_NAME}
              </span>
            </div>
            <Input
              id="qr-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">フォルダ</Label>
            <Select
              value={effectiveFolderId}
              onValueChange={(v) => v && setFolderId(v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="フォルダを選択" />
              </SelectTrigger>
              <SelectContent>
                {folderList.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
        <TabsList
          variant="line"
          className="border-b border-border justify-start gap-2 h-auto rounded-none p-0 px-6 self-stretch"
        >
          <TabsTrigger
            value="basic"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            基本設定
          </TabsTrigger>
          <TabsTrigger
            value="external"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            外部連携
          </TabsTrigger>
          <TabsTrigger
            value="qr"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            QRコード表示
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="basic"
          className="flex-1 overflow-y-auto bg-muted/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 md:gap-6 p-4 md:p-6">
            <aside className="rounded-md border border-border bg-background overflow-hidden h-fit">
              <div className="bg-muted/60 px-4 py-2.5 text-sm font-bold text-center">
                設定項目
              </div>
              <ul className="p-3 space-y-2">
                {SETTINGS.map((s) => {
                  const active = s.id === setting;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setSetting(s.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-sm transition-colors border",
                          active
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <span>{s.label}</span>
                        <FontAwesomeIcon
                          icon={faAngleRight}
                          className="size-3 text-muted-foreground"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <section className="space-y-4">
              <div className="rounded-md bg-muted/40 px-4 py-2.5 text-sm font-bold">
                QRコード読み込み時のメッセージ・アクション
              </div>

              <div className="space-y-1">
                <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                  新規友だちに対するアクションは初めての友だち追加時のみ、1度だけ稼働します。
                </p>
                <p className="text-xs">
                  友だち追加後の稼働テスト方法は
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline mx-0.5"
                  >
                    こちら
                  </a>
                </p>
              </div>

              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <div className="text-sm font-bold">送信するメッセージを登録</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8">
                    ＋ LINE名
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    友だち情報
                  </Button>
                </div>
                <Textarea
                  rows={14}
                  value={content}
                  onChange={(e) =>
                    setContent(e.target.value.slice(0, MAX_CONTENT))
                  }
                />
                <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                  {content.length}/{MAX_CONTENT.toLocaleString()}
                </div>
              </div>

              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <div className="text-sm font-bold">
                  上記メッセージ送信以外のアクション登録
                </div>
                <div className="text-xs text-muted-foreground">よく使われる項目</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <ActionTile icon={faClipboard} label="テンプレート" />
                  <ActionTile icon={faTag} label="タグ" />
                  <ActionTile icon={faAddressCard} label="友だち情報" />
                  <ActionTile icon={faStairs} label="ステップ配信" />
                  <ActionTile icon={faEllipsis} label="その他" />
                </div>
                <div>
                  <Button
                    onClick={() => setActionOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                  >
                    アクション追加・編集
                  </Button>
                </div>
                <div className="rounded-md bg-muted/40 px-4 py-3 text-sm text-center text-muted-foreground">
                  アクションは登録されていません
                </div>
              </div>

              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <div className="text-sm font-bold">あいさつメッセージの併用</div>
                <p className="text-xs leading-relaxed">
                  QRコードを読み込んで ichigo-step 上に友だちが反映された時に
                  <br />
                  上記で設定したメッセージ・アクションとあいさつメッセージを併用する場合の設定です。
                </p>
                <div className="text-sm font-bold pt-1">
                  新規友だちの追加時に新規友だち用のあいさつメッセージ・アクションを
                </div>
                <RadioGroup
                  value={combineGreeting}
                  onValueChange={(v) => v && setCombineGreeting(v)}
                  className="flex items-center gap-6"
                >
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="combine" />
                    併用する
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="separate" />
                    併用しない
                  </label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                  ※QRコードアクションでステップ配信を設定している場合
                  <br />
                  あいさつメッセージで設定しているステップ配信は実行されません。
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving || !name.trim() || !effectiveFolderId}
                    className="border-primary text-primary hover:bg-primary/10 hover:text-primary h-10 px-10 disabled:opacity-50"
                  >
                    {saving ? "保存中…" : "保存"}
                  </Button>
                  <Button variant="outline" className="h-10 px-6">
                    稼働プレビュー
                  </Button>
                </div>
                <Link
                  href="/qr-actions"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-md text-sm font-medium border border-border bg-background hover:bg-muted transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
                  一覧に戻る
                </Link>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="external" className="flex-1 overflow-y-auto p-6">
          <div className="text-sm text-muted-foreground">外部連携（モック）</div>
        </TabsContent>

        <TabsContent value="qr" className="flex-1 overflow-y-auto p-6">
          <div className="text-sm text-muted-foreground">QRコード表示（モック）</div>
        </TabsContent>
      </Tabs>

      <ActionEditDialog open={actionOpen} onOpenChange={setActionOpen} />
    </div>
  );
}

function ActionTile({
  icon,
  label,
}: {
  icon: IconDefinition;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-background p-4 hover:bg-muted/40 transition-colors"
    >
      <FontAwesomeIcon icon={icon} className="size-5 text-foreground" />
      <div className="text-xs text-center leading-tight text-foreground">
        {label}
      </div>
    </button>
  );
}
