import { API_ORIGIN, TENANT_BASE } from "./config";
import { apiFetch, ApiError } from "./client";
import { getToken } from "./token-store";
import { getCurrentChannelId } from "./channel-store";
import type { ApiCsvJob } from "./types";

export type CsvJobRow = {
  id: string;
  createdAt: string;
  name: string;
  targetCount: number;
  conditionLabel: string;
  status: string;
  hasFile: boolean;
  originalFilename: string;
  rowCount: number;
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ").replace(/-/g, "/");
}

function mapCsvJob(api: ApiCsvJob): CsvJobRow {
  return {
    id: String(api.id),
    createdAt: fmtDateTime(api.created_at),
    name: api.name ?? api.original_filename ?? `#${api.id}`,
    targetCount: api.target_count ?? api.row_count ?? 0,
    conditionLabel: api.condition_label ?? "—",
    status: api.status,
    hasFile: api.has_file,
    originalFilename: api.original_filename ?? "—",
    rowCount: api.row_count ?? api.target_count ?? 0,
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

/**
 * GET /csv-jobs/{id}/download
 * Bearer 認証が必要なため blob で取得し、ブラウザでダウンロードを発火する。
 */
export async function downloadCsvJob(id: string, filename: string): Promise<void> {
  const headers = new Headers({ Accept: "text/csv" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const channelId = getCurrentChannelId();
  if (channelId) headers.set("X-Line-Channel-Id", channelId);

  const res = await fetch(csvJobDownloadUrl(id), { headers });
  if (!res.ok) throw new ApiError(res.status, `ダウンロードに失敗しました (HTTP ${res.status})`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type CsvExportOptions = {
  singleFields: { id: string; label: string }[];
  fieldFolders: { id: number; name: string; count: number }[];
  audienceCounts: Record<"active" | "blocked" | "blockedBy", number>;
};

type ApiExportOptions = {
  single_fields: { id: string; label: string }[];
  tag_folders: { id: string; name: string; count: number }[];
  field_folders: { id: number; name: string; count: number }[];
  audience_counts: Record<"active" | "blocked" | "blockedBy", number>;
};

/** GET /csv-jobs/export-options */
export async function fetchCsvExportOptions(): Promise<CsvExportOptions> {
  const data = await apiFetch<ApiExportOptions>("/csv-jobs/export-options");
  return {
    singleFields: data.single_fields ?? [],
    fieldFolders: data.field_folders ?? [],
    audienceCounts: data.audience_counts ?? { active: 0, blocked: 0, blockedBy: 0 },
  };
}

/** POST /csv-jobs/export */
export async function createCsvExport(input: {
  name: string;
  audience: "active" | "blocked" | "blockedBy";
  columns: string[];
  field_ids?: number[];
}): Promise<CsvJobRow> {
  const data = await apiFetch<ApiCsvJob>("/csv-jobs/export", {
    method: "POST",
    body: input,
  });
  return mapCsvJob(data);
}

/**
 * POST /csv-jobs/import（multipart）。
 * ファイル送信のため apiFetch ではなく FormData で直接送る。
 */
export async function createCsvImport(input: { name: string; file: File }): Promise<void> {
  const fd = new FormData();
  fd.append("name", input.name);
  fd.append("file", input.file);

  const headers = new Headers({ Accept: "application/json" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const channelId = getCurrentChannelId();
  if (channelId) headers.set("X-Line-Channel-Id", channelId);

  const res = await fetch(`${API_ORIGIN}${TENANT_BASE}/csv-jobs/import`, {
    method: "POST",
    headers,
    body: fd,
  });
  if (!res.ok) {
    let message = `取り込みに失敗しました (HTTP ${res.status})`;
    let errors: Record<string, string[]> | undefined;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
      if (data?.errors) errors = data.errors;
    } catch {
      /* noop */
    }
    throw new ApiError(res.status, message, errors);
  }
}
