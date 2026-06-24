import { API_ORIGIN, TENANT_BASE } from "./config";
import { ensureCsrfCookie, readXsrfToken } from "./csrf";
import { getCurrentChannelId } from "./channel-store";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
  /** 422 のフィールドエラーを「最初の1件ずつ」のマップにして返す。 */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (this.errors) {
      for (const [k, v] of Object.entries(this.errors)) {
        if (v?.length) out[k] = v[0];
      }
    }
    return out;
  }
}

/** 401 を受けたときに呼ばれるハンドラ（AuthProvider が登録）。 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** 既定では path は API_ORIGIN 直下。raw=true でそのまま、false でテナントAPIベースを前置。 */
  base?: "tenant" | "origin";
  /** クエリパラメータ */
  query?: Record<string, string | number | boolean | null | undefined>;
};

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildUrl(path: string, base: "tenant" | "origin", query?: ApiFetchOptions["query"]): string {
  const prefix = base === "tenant" ? TENANT_BASE : "";
  const url = new URL(`${API_ORIGIN}${prefix}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function doFetch(url: string, method: string, options: ApiFetchOptions): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody) headers.set("Content-Type", "application/json");

  if (MUTATING.has(method)) {
    await ensureCsrfCookie();
    const token = readXsrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
    const channelId = getCurrentChannelId();
    if (channelId) headers.set("X-Line-Channel-Id", channelId);
  }

  return fetch(url, {
    ...options,
    method,
    credentials: "include",
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || `HTTP ${res.status}`;
  let errors: Record<string, string[]> | undefined;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
    if (data?.errors) errors = data.errors;
  } catch {
    /* JSON でない場合は statusText のまま */
  }
  return new ApiError(res.status, message, errors);
}

/**
 * 型付き fetch。`{ data }` 包みを unwrap して T を返す。
 * - 認証/CSRF cookie を自動付与
 * - 変更系は X-XSRF-TOKEN と X-Line-Channel-Id を付与
 * - 401 → onUnauthorized、419 → CSRF再取得して1度だけリトライ、422 → ApiError(errors)
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const base = options.base ?? "tenant";
  const url = buildUrl(path, base, options.query);

  let res = await doFetch(url, method, options);

  // CSRF トークン切れ → 再取得して1度だけリトライ
  if (res.status === 419) {
    await ensureCsrfCookie(true);
    res = await doFetch(url, method, options);
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw await parseError(res);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json();
  // Laravel Resource は単体/コレクションとも { data } 包み。
  return (json && "data" in json ? json.data : json) as T;
}

export type Paginated<T> = {
  items: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

/**
 * ページネーション付きコレクションを取得し、{ items, meta } に整形する。
 */
export async function apiFetchPaginated<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Paginated<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const base = options.base ?? "tenant";
  const url = buildUrl(path, base, options.query);

  let res = await doFetch(url, method, options);
  if (res.status === 419) {
    await ensureCsrfCookie(true);
    res = await doFetch(url, method, options);
  }
  if (res.status === 401) {
    onUnauthorized?.();
    throw await parseError(res);
  }
  if (!res.ok) throw await parseError(res);

  const json = await res.json();
  const items = (json?.data ?? []) as T[];
  const meta = json?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: items.length,
    total: items.length,
  };
  return { items, meta };
}
