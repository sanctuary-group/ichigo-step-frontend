import { apiFetch } from "./client";
import { mapScenario } from "./mappers";
import type { ApiScenario } from "./types";
import type { MockScenario } from "@/mocks/data";

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
