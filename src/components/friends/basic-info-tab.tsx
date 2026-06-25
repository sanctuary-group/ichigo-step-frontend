"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type FriendDetail,
  type FriendFieldDetail,
  type FieldValueLite,
  saveFriendFieldValues,
  updateFriendBasic,
} from "@/lib/api/friend-detail";
import { dot, sourceLabel } from "./friend-show-helpers";

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </div>
  );
}

function DisplaySettingButton() {
  return (
    <Button
      type="button"
      size="sm"
      disabled
      className="h-8 bg-zinc-500 text-white opacity-70"
    >
      表示設定
    </Button>
  );
}

export function BasicInfoTab({
  friend,
  fields,
  values,
  messageCount,
  onSaved,
}: {
  friend: FriendDetail;
  fields: FriendFieldDetail[];
  values: FieldValueLite[];
  messageCount: number;
  onSaved: () => void;
}) {
  return (
    <div className="space-y-8">
      <BasicInfoTable friend={friend} count={messageCount} />
      <FriendInfoTable
        friend={friend}
        fields={fields}
        values={values}
        onSaved={onSaved}
      />
      <MemoSection friend={friend} onSaved={onSaved} />
    </div>
  );
}

function BasicInfoTable({
  friend,
  count,
}: {
  friend: FriendDetail;
  count: number;
}) {
  void count;
  const added = friend.followed_at
    ? `${dot(friend.followed_at)}${friend.source ? ` ${sourceLabel(friend.source)}` : ""}`
    : "—";

  const rows: [string, React.ReactNode][] = [
    ["LINE名", friend.display_name ?? "—"],
    ["友だち追加日時", added],
    [
      "最終メッセージ受信",
      friend.last_message_at ? dot(friend.last_message_at) : "—",
    ],
    ["QRコードアクション", "—"],
    ["紹介アフィリエイター", "—"],
    ["表示中リッチメニュー", "—"],
  ];

  return (
    <section>
      <SectionHeading title="基本情報" action={<DisplaySettingButton />} />
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value], i) => (
              <tr
                key={label}
                className={cn(
                  i !== rows.length - 1 && "border-b border-border",
                )}
              >
                <th className="w-48 text-left align-top font-medium bg-muted/50 px-4 py-3 border-r border-border">
                  {label}
                </th>
                <td className="px-4 py-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FriendInfoTable({
  friend,
  fields,
  values: valueList,
  onSaved,
}: {
  friend: FriendDetail;
  fields: FriendFieldDetail[];
  values: FieldValueLite[];
  onSaved: () => void;
}) {
  const initialValues = useMemo(() => {
    const map: Record<number, string> = {};
    for (const f of fields) {
      const v = valueList.find((fv) => fv.friend_field_id === f.id);
      map[f.id] = v?.value ?? "";
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend.id, fields.length, valueList]);

  const [sysName, setSysName] = useState(friend.system_display_name ?? "");
  const [values, setValues] = useState<Record<number, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSysName(friend.system_display_name ?? "");
    setValues(initialValues);
    setSaved(false);
  }, [friend.id, initialValues, friend.system_display_name]);

  const sysDirty = sysName !== (friend.system_display_name ?? "");
  const fieldsDirty = fields.some(
    (f) => (values[f.id] ?? "") !== initialValues[f.id],
  );
  const dirty = sysDirty || fieldsDirty;

  const save = async () => {
    setSaving(true);
    try {
      if (sysDirty) {
        await updateFriendBasic(friend.id, {
          system_display_name: sysName || null,
        });
      }
      if (fieldsDirty) {
        await saveFriendFieldValues(friend.id, values);
      }
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <SectionHeading title="友だち情報" action={<DisplaySettingButton />} />
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            <FriendInfoRow label="システム表示名" first>
              <input
                value={sysName}
                onChange={(e) => setSysName(e.target.value)}
                maxLength={100}
                placeholder="社内呼称（任意）"
                className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
              />
            </FriendInfoRow>

            {fields.map((f) => (
              <FriendInfoRow key={f.id} label={f.name}>
                <FieldValueCell
                  field={f}
                  value={values[f.id] ?? ""}
                  onChange={(v) =>
                    setValues((prev) => ({ ...prev, [f.id]: v }))
                  }
                />
              </FriendInfoRow>
            ))}
          </tbody>
        </table>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          項目を増やすには
          <Link
            href="/data-management/friend-fields"
            className="text-blue-600 dark:text-blue-400 underline mx-1"
          >
            友だち情報管理
          </Link>
          で作成してください。
        </p>
      )}
      <div className="flex items-center justify-end gap-3 mt-3">
        <span className="text-xs text-muted-foreground">
          {saved ? "保存しました" : ""}
        </span>
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </section>
  );
}

function FriendInfoRow({
  label,
  first,
  children,
}: {
  label: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr className={cn(!first && "border-t border-border")}>
      <th className="w-48 text-left align-middle font-medium bg-zinc-500 text-white px-4 py-2.5">
        {label}
      </th>
      <td className="px-4 py-2.5">{children}</td>
    </tr>
  );
}

function FieldValueCell({
  field,
  value,
  onChange,
}: {
  field: FriendFieldDetail;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.field_type === "choice") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-sm"
      >
        <option value="">未設定</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  const type =
    field.field_type === "number"
      ? "number"
      : field.field_type === "date"
        ? "date"
        : field.field_type === "phone"
          ? "tel"
          : field.field_type === "email"
            ? "email"
            : "text";
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={1000}
      className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
    />
  );
}

function MemoSection({
  friend,
  onSaved,
}: {
  friend: FriendDetail;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(friend.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNote(friend.note ?? "");
    setSaved(false);
  }, [friend.id, friend.note]);

  const save = async () => {
    setSaving(true);
    try {
      await updateFriendBasic(friend.id, { note });
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2 className="text-base font-bold mb-3">メモ</h2>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="この友だちに関するメモを入力..."
        rows={5}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y min-h-28"
      />
      <div className="flex items-center justify-end gap-3 mt-3">
        <span className="text-xs text-muted-foreground">
          {saved ? "保存しました" : ""}
        </span>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </section>
  );
}
