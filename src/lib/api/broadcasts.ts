import { apiFetch } from "./client";
import { mapBroadcast } from "./mappers";
import type { ApiBroadcast } from "./types";
import type { MockBroadcast } from "@/mocks/data";

export type BroadcastTab = "scheduled" | "draft" | "history";

/** GET /broadcasts?tab=&month= */
export async function fetchBroadcasts(params: {
  tab: BroadcastTab;
  month?: string;
}): Promise<MockBroadcast[]> {
  const data = await apiFetch<ApiBroadcast[]>("/broadcasts", {
    query: { tab: params.tab, month: params.month },
  });
  return data.map(mapBroadcast);
}

/** GET /broadcasts/{id} */
export async function fetchBroadcast(id: string): Promise<MockBroadcast> {
  const data = await apiFetch<ApiBroadcast>(`/broadcasts/${id}`);
  return mapBroadcast(data);
}

/** DELETE /broadcasts/{id} */
export async function deleteBroadcast(id: string): Promise<void> {
  await apiFetch(`/broadcasts/${id}`, { method: "DELETE" });
}

/** POST /broadcasts/{id}/send-now （即時配信開始：draft/scheduled のみ） */
export async function sendBroadcastNow(id: string): Promise<void> {
  await apiFetch(`/broadcasts/${id}/send-now`, { method: "POST", body: {} });
}

/** POST /broadcasts/bulk-delete */
export async function bulkDeleteBroadcasts(ids: string[]): Promise<void> {
  await apiFetch("/broadcasts/bulk-delete", {
    method: "POST",
    body: { ids: ids.map((id) => Number(id)) },
  });
}
