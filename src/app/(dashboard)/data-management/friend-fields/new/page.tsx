"use client";

import { useSearchParams } from "next/navigation";

import { fetchFolders } from "@/lib/api/folders";
import { useResource } from "@/lib/api/use-resource";
import { useAuth } from "@/lib/auth/auth-context";
import { FriendFieldForm } from "@/components/data-management/friend-field-form";

export default function NewFriendFieldPage() {
  const { currentChannelId } = useAuth();
  const searchParams = useSearchParams();
  const defaultFolderId = searchParams.get("folder");

  const { data: folders } = useResource(
    currentChannelId ? `friend-field-folders:${currentChannelId}` : null,
    () => fetchFolders("friend-field-folders"),
  );

  return (
    <FriendFieldForm
      folders={folders ?? []}
      defaultFolderId={defaultFolderId}
    />
  );
}
