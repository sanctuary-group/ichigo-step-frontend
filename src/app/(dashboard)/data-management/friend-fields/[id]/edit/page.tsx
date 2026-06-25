"use client";

import { useParams } from "next/navigation";

import { useResource } from "@/lib/api/use-resource";
import { fetchFolders } from "@/lib/api/folders";
import { fetchFriendField } from "@/lib/api/friend-fields";
import { FriendFieldForm } from "@/components/data-management/friend-field-form";

export default function EditFriendFieldPage() {
  const params = useParams();
  const id = String(params.id);

  const { data, isLoading, error } = useResource(
    `friend-field-edit:${id}`,
    async () => {
      const [field, folders] = await Promise.all([
        fetchFriendField(id),
        fetchFolders("friend-field-folders"),
      ]);
      return { field, folders };
    },
  );

  if (isLoading || !data) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
        {error ? "読み込みに失敗しました" : "読み込み中..."}
      </div>
    );
  }

  if (!data.field) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
        項目が見つかりませんでした
      </div>
    );
  }

  return (
    <FriendFieldForm
      folders={data.folders}
      initial={{
        id: data.field.id,
        name: data.field.name,
        folderId: data.field.folderId,
        fieldType: data.field.fieldType,
        runMode: data.field.runMode,
        options: data.field.options,
      }}
    />
  );
}
