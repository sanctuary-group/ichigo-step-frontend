// シナリオビルダー（移植版 Scenarios/Form）が必要とする生shapeを取得する。
// monolith の web ScenarioController@create が share していたものを API 取得に置換。
import { apiFetch } from "./client";
import type { ScenarioStepMessage } from "@/types/scenario";

export type ImportTemplate = {
  id: number;
  name: string;
  folder_id: number | null;
  messages: ScenarioStepMessage[];
};

export type TemplateFolderOption = { id: number; name: string };

export type QuoteSourceStep = {
  delay_minutes: number;
  timing_mode: "immediate" | "datetime" | "elapsed";
  linked_template_id: number | null;
  messages: ScenarioStepMessage[];
};

export type QuoteSource = { id: number; name: string; steps: QuoteSourceStep[] };

type ApiTemplate = {
  id: number;
  name: string;
  template_folder_id?: number | null;
  folder_id?: number | null;
  messages?: ScenarioStepMessage[];
};

/** テンプレート取込用（folder_id + messages 込み） */
export async function fetchScenarioImportTemplates(): Promise<ImportTemplate[]> {
  const data = await apiFetch<ApiTemplate[]>("/templates");
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    folder_id: t.folder_id ?? t.template_folder_id ?? null,
    messages: t.messages ?? [],
  }));
}

/** テンプレートフォルダ一覧 */
export async function fetchScenarioTemplateFolders(): Promise<TemplateFolderOption[]> {
  const data = await apiFetch<{ id: number; name: string }[]>("/template-folders");
  return data.map((f) => ({ id: f.id, name: f.name }));
}

type ApiQuoteScenario = {
  id: number;
  name: string;
  steps?: {
    delay_minutes: number;
    timing_mode: "immediate" | "datetime" | "elapsed";
    linked_template_id?: number | null;
    messages?: ScenarioStepMessage[];
  }[];
};

/** 一括引用登録の引用元（他シナリオのステップ） */
export async function fetchQuoteSources(excludeId?: number): Promise<QuoteSource[]> {
  const data = await apiFetch<ApiQuoteScenario[]>("/scenarios");
  return data
    .filter((s) => excludeId == null || s.id !== excludeId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      steps: (s.steps ?? []).map((step) => ({
        delay_minutes: step.delay_minutes,
        timing_mode: step.timing_mode,
        linked_template_id: step.linked_template_id ?? null,
        messages: step.messages ?? [],
      })),
    }));
}

/** 既定フォルダ（is_system 優先・sort_order 順の先頭） */
export async function fetchDefaultScenarioFolderId(): Promise<number | null> {
  const data = await apiFetch<{ id: number; is_system?: boolean; sort_order?: number | null }[]>(
    "/scenario-folders",
  );
  if (data.length === 0) return null;
  const sorted = [...data].sort((a, b) => {
    const sysA = a.is_system ? 1 : 0;
    const sysB = b.is_system ? 1 : 0;
    if (sysA !== sysB) return sysB - sysA;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  return sorted[0]?.id ?? null;
}
