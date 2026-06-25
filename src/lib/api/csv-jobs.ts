import { API_ORIGIN, TENANT_BASE } from "./config";
import { apiFetch } from "./client";
import type { ApiCsvJob } from "./types";

export type CsvJobRow = {
  id: string;
  createdAt: string;
  name: string;
  targetCount: number;
  conditionLabel: string;
  status: string;
  hasFile: boolean;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10).replace(/-/g, "/");
}

function mapCsvJob(api: ApiCsvJob): CsvJobRow {
  return {
    id: String(api.id),
    createdAt: fmtDate(api.created_at),
    name: api.name ?? api.original_filename ?? `#${api.id}`,
    targetCount: api.target_count ?? api.row_count ?? 0,
    conditionLabel: api.condition_label ?? "—",
    status: api.status,
    hasFile: api.has_file,
  };
}

/** GET /csv-jobs?kind=export|import */
export async function fetchCsvJobs(kind: "export" | "import"): Promise<CsvJobRow[]> {
  const data = await apiFetch<ApiCsvJob[]>("/csv-jobs", { query: { kind } });
  return data.map(mapCsvJob);
}

/** DELETE /csv-jobs/{id} */
export async function deleteCsvJob(id: string): Promise<void> {
  await apiFetch(`/csv-jobs/${id}`, { method: "DELETE" });
}

/** ダウンロードURL（GET /csv-jobs/{id}/download） */
export function csvJobDownloadUrl(id: string): string {
  return `${API_ORIGIN}${TENANT_BASE}/csv-jobs/${id}/download`;
}
