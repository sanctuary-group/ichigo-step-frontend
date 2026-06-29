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

/** POST /scenarios/{id}/duplicate — ステップ・メッセージごと複製（停止状態で作成） */
export async function duplicateScenario(id: string): Promise<ApiScenario> {
  return apiFetch<ApiScenario>(`/scenarios/${id}/duplicate`, { method: "POST" });
}

/** POST /scenarios/bulk-delete */
export async function bulkDeleteScenarios(ids: string[]): Promise<void> {
  await apiFetch("/scenarios/bulk-delete", {
    method: "POST",
    body: { ids: ids.map(Number) },
  });
}

/** POST /scenarios/bulk-move */
export async function bulkMoveScenarios(
  ids: string[],
  scenarioFolderId: string,
): Promise<void> {
  await apiFetch("/scenarios/bulk-move", {
    method: "POST",
    body: { ids: ids.map(Number), scenario_folder_id: Number(scenarioFolderId) },
  });
}

export type ScenarioSubscriber = {
  id: number;
  name: string;
  picture_url: string | null;
  current_step_order: number;
};

export type ScenarioSubscriberStatus = "active" | "terminated" | "completed";

/** GET /scenarios/{id}/subscribers?status= */
export async function fetchScenarioSubscribers(
  id: string,
  status: ScenarioSubscriberStatus,
): Promise<ScenarioSubscriber[]> {
  return apiFetch<ScenarioSubscriber[]>(`/scenarios/${id}/subscribers`, {
    query: { status },
  });
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

/** POST /scenarios/reorder（並べ替え後の id 配列）。 */
export async function reorderScenarios(ids: number[]): Promise<void> {
  await apiFetch("/scenarios/reorder", { method: "POST", body: { ids } });
}
