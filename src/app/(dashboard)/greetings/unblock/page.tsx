"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faTableCells,
  faFileLines,
  faTag,
  faEllipsis,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ActionEditDialog } from "@/components/action-edit-dialog";
import { FriendAddUrlCard } from "@/components/friend-add-url-card";

const MAX_LEN = 5000;

const TEST_STEPS: string[] = [
  "友だち詳細ページ\n「削除」より\n友だち情報を削除",
  "スマホのLINE上で\nLINE公式アカウントを\nブロック",
  "スマホのLINE上で\nLINE公式アカウントを\nブロック解除",
  "設定したアクションが\n稼働すれば\nテスト成功",
];

export default function UnblockGreetingsPage() {
  const [content, setContent] = useState("");
  const [actionOpen, setActionOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-orange-500 text-white px-3 py-1 text-xs font-bold">
          ブロック解除時用
        </span>
        <h1 className="text-xl font-bold tracking-tight">
          あいさつメッセージ設定
        </h1>
        <a
          href="#"
          className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
        >
          友だちのブロック解除経路を分析したい場合はこちら
        </a>
      </div>

      <Card className="bg-muted/40">
        <CardContent className="p-4 flex items-center gap-3">
          <span className="grid place-items-center size-10 rounded-full bg-background border border-border shrink-0">
            <FontAwesomeIcon
              icon={faUserSlash}
              className="size-4 text-orange-500"
            />
          </span>
          <p className="text-sm text-foreground">
            このページで設定したメッセージ・アクションは{" "}
            <span className="font-bold">友だちのブロック解除時のみ</span>{" "}
            稼働します。
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" className="flex flex-col">
        <TabsList
          variant="line"
          className="border-b border-border justify-start gap-2 h-auto rounded-none p-0 self-stretch"
        >
          <TabsTrigger
            value="settings"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            メッセージ・アクション設定
          </TabsTrigger>
          <TabsTrigger
            value="test"
            className="!flex-none px-4 py-2 data-active:text-blue-600 data-active:font-bold"
          >
            テスト方法
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="text-sm font-bold">
                ブロック解除時のメッセージ・アクション設定
              </div>

              <Card className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-bold">送信するメッセージを登録</div>
                  <div className="rounded-md border border-border bg-muted/30 p-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-background"
                    >
                      ＋ LINE名
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-background"
                    >
                      ＋ 友だち情報
                    </Button>
                  </div>
                  <Textarea
                    rows={14}
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
                    placeholder=""
                  />
                  <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                    {content.length}/{MAX_LEN.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-bold">
                    上記メッセージ送信以外のアクション登録
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ブロック解除時の
                    <span className="text-primary font-medium mx-0.5">
                      ステップ配信の開始
                    </span>
                    や
                    <span className="text-primary font-medium mx-0.5">
                      リッチメニュー表示
                    </span>
                    などのアクションをこちらで設定します。
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <ActionTile
                      icon={faClock}
                      label={["ステップ配信を", "開始・停止する"]}
                    />
                    <ActionTile
                      icon={faTableCells}
                      label={["リッチメニューを", "表示する"]}
                    />
                    <ActionTile
                      icon={faFileLines}
                      label={["テンプレートを", "送信する"]}
                    />
                    <ActionTile
                      icon={faTag}
                      label={["タグを", "付け・外しする"]}
                    />
                    <ActionTile
                      icon={faEllipsis}
                      label={["その他の", "アクションをみる"]}
                    />
                  </div>
                  <div>
                    <Button
                      onClick={() => setActionOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                    >
                      アクション追加・編集
                    </Button>
                  </div>
                  <div className="border border-border rounded-md px-4 py-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">テンプレート</div>
                      <div className="font-medium mt-0.5">挨拶メッセージ</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">絞り込みなし</div>
                      <div className="font-medium mt-0.5">を送信</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-10"
            >
              保存
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <FriendAddUrlCard />

          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-sm font-bold">
                  ブロック解除時アクションのテスト方法
                </h3>
                <a
                  href="#"
                  className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
                >
                  テスト方法を動画で確認
                </a>
              </div>

              <div className="text-sm">
                すでに ichigo-step に表示されているLINEアカウントの場合
              </div>

              <div className="relative">
                <div className="absolute top-4 left-[12.5%] right-[12.5%] h-px bg-border" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
                  {TEST_STEPS.map((step, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-center">
                        <div className="relative z-10 size-8 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold tabular-nums">
                          {i + 1}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-4 text-xs text-center leading-relaxed min-h-20 flex items-center justify-center">
                        <div className="whitespace-pre-line">{step}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm font-bold">
                ご注意事項
              </div>

              <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                LINE公式アカウント管理画面のあいさつメッセージが設定されている場合は、どちらも送信されます。
              </p>

              <p className="text-xs text-muted-foreground">
                (ichigo-step のあいさつメッセージのみご利用いただくことを推奨しています。)
              </p>
            </CardContent>
          </Card>

          <div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary px-10 h-10"
            >
              保存
            </Button>
          </div>
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
  label: [string, string];
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-background p-4 hover:bg-muted/40 transition-colors"
    >
      <FontAwesomeIcon icon={icon} className="size-6 text-foreground" />
      <div className="text-xs text-center leading-tight text-foreground">
        <div>{label[0]}</div>
        <div>{label[1]}</div>
      </div>
    </button>
  );
}
