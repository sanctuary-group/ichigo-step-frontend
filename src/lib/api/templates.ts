import { apiFetch } from "./client";
import { mapTemplate } from "./mappers";
import type { ApiTemplate } from "./types";
import type { MockTemplate } from "@/mocks/data";

export type TemplateListParams = {
  folder?: string;
  q?: string;
  sort?: "name" | "created_at" | "updated_at";
  dir?: "asc" | "desc";
};

/** GET /templates */
export async function fetchTemplates(params: TemplateListParams = {}): Promise<MockTemplate[]> {
  const data = await apiFetch<ApiTemplate[]>("/templates", {
    query: { folder: params.folder, q: params.q, sort: params.sort, dir: params.dir },
  });
  return data.map(mapTemplate);
}

/** POST /templates （template_folder_id 必須） */
export async function createTemplate(input: {
  name: string;
  template_folder_id: number;
  delay_send?: boolean;
}): Promise<MockTemplate> {
  const data = await apiFetch<ApiTemplate>("/templates", { method: "POST", body: input });
  return mapTemplate(data);
}

/** PUT /templates/{id} */
export async function updateTemplate(
  id: string,
  input: { name?: string; template_folder_id?: number; delay_send?: boolean },
): Promise<MockTemplate> {
  const data = await apiFetch<ApiTemplate>(`/templates/${id}`, { method: "PUT", body: input });
  return mapTemplate(data);
}

/** DELETE /templates/{id} */
export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch(`/templates/${id}`, { method: "DELETE" });
}
