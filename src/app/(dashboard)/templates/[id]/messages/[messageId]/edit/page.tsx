"use client";

import { useParams } from "next/navigation";

import { MessageEditForm } from "@/components/templates/message-edit-form";

export default function TemplateMessageEditPage() {
  const params = useParams<{ id: string; messageId: string }>();
  return <MessageEditForm templateId={params.id} messageId={params.messageId} />;
}
