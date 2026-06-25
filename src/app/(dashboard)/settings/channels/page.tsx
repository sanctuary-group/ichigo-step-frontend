"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faEye,
  faEyeSlash,
  faPlug,
  faPen,
  faCopy,
  faCheck,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { GuideButton } from "@/components/guide-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchChannelDetails,
  createChannel,
  updateChannel,
  deleteChannel,
  testChannel,
  fetchCredentials,
  type ChannelDetail,
} from "@/lib/api/channels";
import { useResource } from "@/lib/api/use-resource";
import { ApiError } from "@/lib/api/client";
import { API_ORIGIN } from "@/lib/api/config";

type Toast = { kind: "success" | "error"; text: string } | null;

export default function ChannelsSettingsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const { data: channels, mutate } = useResource(
    "settings-channels",
    fetchChannelDetails,
  );
  const channelList = channels ?? [];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleDelete(channel: ChannelDetail) {
    if (!window.confirm(`「${channel.name}」を削除しますか？`)) return;
    try {
      await deleteChannel(channel.id);
      setToast({ kind: "success", text: "チャネルを削除しました" });
      mutate();
    } catch (e) {
      setToast({
        kind: "error",
        text: e instanceof ApiError ? e.message : "削除に失敗しました",
      });
    }
  }

  async function handleTest(channel: ChannelDetail) {
    try {
      const res = await testChannel(channel.id);
      setToast({
        kind: "success",
        text: `接続に成功しました（${res.name}）`,
      });
      mutate();
    } catch (e) {
      setToast({
        kind: "error",
        text: e instanceof ApiError ? e.message : "接続テストに失敗しました",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">LINE チャネル</h2>
          <p className="text-xs text-muted-foreground mt-1">
            複数の LINE 公式アカウントを束ねて管理できます
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GuideButton topic="connection" />
          <Button onClick={() => setShowAdd((v) => !v)}>
            <FontAwesomeIcon icon={faPlus} className="size-3.5" />
            チャネルを追加
          </Button>
        </div>
      </div>

      {toast && (
        <div
          className={
            toast.kind === "success"
              ? "rounded-md px-3 py-2 text-sm bg-primary/10 text-primary"
              : "rounded-md px-3 py-2 text-sm bg-destructive/10 text-destructive"
          }
        >
          {toast.text}
        </div>
      )}

      <div className="space-y-3">
        {channelList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              まだチャネルが登録されていません
            </CardContent>
          </Card>
        ) : (
          channelList.map((c) =>
            editingId === c.id ? (
              <ChannelFormCard
                key={c.id}
                channel={c}
                onClose={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  setToast({ kind: "success", text: "保存しました" });
                  mutate();
                }}
              />
            ) : (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary font-bold">
                      {c.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {c.name}
                        {c.connectionVerifiedAt && (
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="size-3.5 text-primary shrink-0"
                            title="接続テスト成功済み"
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.basicId ?? c.channelId}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(c)}
                    >
                      <FontAwesomeIcon icon={faPlug} className="size-3.5" />
                      接続テスト
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="編集"
                      className="text-muted-foreground hover:text-foreground size-9 p-0"
                      onClick={() => {
                        setShowAdd(false);
                        setEditingId(c.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faPen} className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="削除"
                      className="text-muted-foreground hover:text-destructive size-9 p-0"
                      onClick={() => handleDelete(c)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                    </Button>
                  </div>

                  {c.connectionVerifiedAt && c.webhookUrl ? (
                    <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                      <div className="text-[11px] font-medium text-muted-foreground">
                        Webhook URL（このチャネル専用）
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 min-w-0 truncate font-mono text-[11px]">
                          {c.webhookUrl}
                        </code>
                        <CopyButton value={c.webhookUrl} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        LINE Developers の Messaging API 設定の Webhook URL に貼り付けてください。
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground pl-[60px]">
                      接続テストに成功すると、このチャネル専用の Webhook URL をコピーできます。
                    </p>
                  )}
                </CardContent>
              </Card>
            ),
          )
        )}
      </div>

      {showAdd && (
        <ChannelFormCard
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            setToast({ kind: "success", text: "登録しました" });
            mutate();
          }}
        />
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <div className="font-medium text-foreground">Webhook URL</div>
          <code className="block bg-muted/60 rounded p-2 font-mono text-[11px] break-all">
            POST {API_ORIGIN}/api/line/webhook/{"{channelId}"}
          </code>
          <p>
            LINE Developers の Messaging API 設定で、登録したチャネルの Channel ID を {"{channelId}"} に当てはめた URL を設定してください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="shrink-0"
    >
      <FontAwesomeIcon
        icon={copied ? faCheck : faCopy}
        className={copied ? "size-3.5 text-primary" : "size-3.5"}
      />
      {copied ? "コピー済み" : "コピー"}
    </Button>
  );
}

function ChannelFormCard({
  channel,
  onClose,
  onSaved,
}: {
  channel?: ChannelDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!channel;
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [credLoaded, setCredLoaded] = useState(false);
  const [credLoading, setCredLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: channel?.name ?? "",
    basic_id: channel?.basicId ?? "",
    channel_id: channel?.channelId ?? "",
    channel_secret: "",
    channel_access_token: "",
    liff_id: channel?.liffId ?? "",
  });
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // 編集時のみ、復号済みの認証情報を取得して欄に流し込む（既定はマスク表示）。
  async function ensureCredentials() {
    if (!isEdit || !channel || credLoaded || credLoading) return;
    setCredLoading(true);
    try {
      const data = await fetchCredentials(channel.id);
      setForm((f) => ({
        ...f,
        channel_secret: f.channel_secret || data.channel_secret || "",
        channel_access_token:
          f.channel_access_token || data.channel_access_token || "",
      }));
      setCredLoaded(true);
    } catch {
      // 取得失敗時は何もしない（空欄＝既存維持のまま）
    } finally {
      setCredLoading(false);
    }
  }

  async function toggleSecret() {
    if (!showSecret) await ensureCredentials();
    setShowSecret((v) => !v);
  }

  async function toggleToken() {
    if (!showToken) await ensureCredentials();
    setShowToken((v) => !v);
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    // 復号情報は非同期取得（await 後に setState）。同期 setState ではない。
    if (isEdit) void ensureCredentials();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      if (isEdit && channel) {
        await updateChannel(channel.id, {
          name: form.name,
          channel_id: form.channel_id,
          basic_id: form.basic_id || undefined,
          liff_id: form.liff_id || undefined,
          channel_secret: form.channel_secret || undefined,
          channel_access_token: form.channel_access_token || undefined,
        });
      } else {
        await createChannel({
          name: form.name,
          channel_id: form.channel_id,
          channel_secret: form.channel_secret,
          channel_access_token: form.channel_access_token,
          basic_id: form.basic_id || undefined,
          liff_id: form.liff_id || undefined,
        });
      }
      onSaved();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors());
        setError(e.message);
      } else {
        setError(isEdit ? "保存に失敗しました" : "登録に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  }

  const secretPlaceholder = isEdit
    ? "変更する場合のみ入力"
    : "LINE Developers Console から取得";
  const tokenPlaceholder = isEdit ? "変更する場合のみ入力" : "長期トークン";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "チャネルを編集" : "新しいチャネルを追加"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ch-name">表示名（社内管理用）</Label>
            <Input
              id="ch-name"
              placeholder="例: 株式会社サンプル 公式LINE"
              value={form.name}
              onChange={set("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ch-id">Channel ID</Label>
              <Input
                id="ch-id"
                placeholder="1234567890"
                value={form.channel_id}
                onChange={set("channel_id")}
              />
              {errors.channel_id && (
                <p className="text-xs text-destructive">{errors.channel_id}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ch-basic">Basic ID（@xxx）</Label>
              <Input
                id="ch-basic"
                placeholder="@example"
                value={form.basic_id}
                onChange={set("basic_id")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ch-secret">Channel Secret</Label>
            <div className="relative">
              <Input
                id="ch-secret"
                type={showSecret ? "text" : "password"}
                placeholder={secretPlaceholder}
                className="pr-9"
                value={form.channel_secret}
                onChange={set("channel_secret")}
              />
              <button
                type="button"
                onClick={toggleSecret}
                disabled={credLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label="表示切替"
              >
                <FontAwesomeIcon
                  icon={showSecret ? faEyeSlash : faEye}
                  className="size-3.5"
                />
              </button>
            </div>
            {errors.channel_secret && (
              <p className="text-xs text-destructive">{errors.channel_secret}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ch-token">Channel Access Token</Label>
            <div className="relative">
              <Input
                id="ch-token"
                type={showToken ? "text" : "password"}
                placeholder={tokenPlaceholder}
                className="pr-9"
                value={form.channel_access_token}
                onChange={set("channel_access_token")}
              />
              <button
                type="button"
                onClick={toggleToken}
                disabled={credLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label="表示切替"
              >
                <FontAwesomeIcon
                  icon={showToken ? faEyeSlash : faEye}
                  className="size-3.5"
                />
              </button>
            </div>
            {errors.channel_access_token && (
              <p className="text-xs text-destructive">
                {errors.channel_access_token}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ch-liff">LIFF ID（任意）</Label>
            <Input
              id="ch-liff"
              placeholder="2000xxxxxx-xxxxxxxx"
              value={form.liff_id}
              onChange={set("liff_id")}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? isEdit
                  ? "保存中..."
                  : "登録中..."
                : isEdit
                  ? "保存"
                  : "登録"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
