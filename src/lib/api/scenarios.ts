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
