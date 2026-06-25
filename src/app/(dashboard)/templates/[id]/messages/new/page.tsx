"use client";

import { useParams } from "next/navigation";

import { MessageEditForm } from "@/components/templates/message-edit-form";

export default function TemplateMessageNewPage() {
  const params = useParams<{ id: string }>();
  return <MessageEditForm templateId={params.id} />;
}
