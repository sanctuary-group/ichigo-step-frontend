import { apiFetch } from "./client";
import { mapScenario } from "./mappers";
import type { ApiScenario } from "./types";
import type { MockScenario } from "@/mocks/data";
import type { Scenario } from "@/types/scenario";

/** GET /scenarios?folder=&q= */
export async function fetchScenarios(params: { folder?: string; q?: string } = {}): Promise<
  MockScenario[]
> {
  const data = await apiFetch<ApiScenario[]>("/scenarios", {
    query: { folder: params.folder, q: params.q },
  });
  return data.map(mapScenario);
}

/** GET /scenarios/{id} */
export async function fetchScenario(id: string): Promise<MockScenario> {
  const data = await apiFetch<ApiScenario>(`/scenarios/${id}`);
  return mapScenario(data);
}

/**
 * GET /scenarios/{id} — 編集フォーム用の生 snake_case 構造をそのまま返す。
 * バックエンドは `with(['steps.messages', 'triggerTag'])` で steps[].messages[] を
 * 含む完全な構造を返すため、ScenariosFormInner の `scenario` 初期化子がそのまま使える。
 * （fetchScenario は Mock 変換するため、編集には raw 版のこちらを使う）
 */
export async function fetchRawScenario(id: string): Promise<Scenario> {
  return apiFetch<Scenario>(`/scenarios/${id}`);
}

/** DELETE /scenarios/{id} */
export async function deleteScenario(id: string): Promise<void> {
  await apiFetch(`/scenarios/${id}`, { method: "DELETE" });
}

/**
 * シナリオ作成 / 更新。
 * 新規: POST /scenarios、編集: PUT /scenarios/{id}。
 * payload は SaveScenarioRequest に対応した生 shape（steps[] を含む）。
 */
export async function saveScenario(
  payload: Record<string, unknown>,
  editId?: string,
): Promise<ApiScenario> {
  if (editId) {
    return apiFetch<ApiScenario>(`/scenarios/${editId}`, {
      method: "PUT",
      body: payload,
    });
  }
  return apiFetch<ApiScenario>("/scenarios", {
    method: "POST",
    body: payload,
  });
}
