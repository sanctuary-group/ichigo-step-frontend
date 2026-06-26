import { API_ORIGIN, TENANT_BASE } from "./config";
import { getCurrentChannelId } from "./channel-store";
import { getToken } from "./token-store";

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

/**
 * 読み取り（GET/HEAD）で「対象チャンネルが不正・非アクティブ」により 422 が返ったときに
 * 呼ばれるハンドラ（AuthProvider が登録）。localStorage のチャンネルがスタールした場合に
 * サーバー既定チャンネルへフォールバックさせる用途。
 */
let onInvalidChannel: (() => void) | null = null;
export function setInvalidChannelHandler(fn: (() => void) | null): void {
  onInvalidChannel = fn;
}

/**
 * チャンネル解決失敗による 422 か判定する。
 * ResolveApiChannel は非アクティブ/他組織IDで `abort(422)`（errors 無し・message のみ）を返す。
 * 読み取り（安全メソッド）でチャンネルヘッダを送っていた場合の 422 はこれと断定できる
 * （読み取りはボディ検証が無いため、GET の 422 はチャンネル解決失敗に限られる）。
 */
function isStaleChannelError(method: string, status: number): boolean {
  const safe = method === "GET" || method === "HEAD";
  return status === 422 && safe && getCurrentChannelId() !== null;
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** 既定では path は API_ORIGIN 直下。tenant でテナントAPIベースを前置。 */
  base?: "tenant" | "origin";
  /** クエリパラメータ */
  query?: Record<string, string | number | boolean | null | undefined>;
};

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

function buildHeaders(options: ApiFetchOptions): Headers {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody) headers.set("Content-Type", "application/json");

  // Bearer トークン認証（別ドメイン構成）
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // channel-scoped リソースは読み書きとも UI 選択中のチャンネルを対象にする。
  // ヘッダ未指定だとサーバー既定チャンネルにフォールバックしてしまうため、
  // GET でも常に付与する（channel 非適用エンドポイントでは無視されるだけで無害）。
  const channelId = getCurrentChannelId();
  if (channelId) headers.set("X-Line-Channel-Id", channelId);

  return headers;
}

function doFetch(url: string, method: string, options: ApiFetchOptions): Promise<Response> {
  const hasBody = options.body !== undefined && options.body !== null;
  return fetch(url, {
    ...options,
    method,
    headers: buildHeaders(options),
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
 * - Authorization: Bearer を自動付与
 * - 選択中チャンネルがあれば読み書き問わず X-Line-Channel-Id を付与
 * - 401 → onUnauthorized、422 → ApiError(errors)
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const base = options.base ?? "tenant";
  const url = buildUrl(path, base, options.query);

  const res = await doFetch(url, method, options);

  if (res.status === 401) {
    onUnauthorized?.();
    throw await parseError(res);
  }
  if (isStaleChannelError(method, res.status)) onInvalidChannel?.();
  if (!res.ok) throw await parseError(res);
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

  const res = await doFetch(url, method, options);
  if (res.status === 401) {
    onUnauthorized?.();
    throw await parseError(res);
  }
  if (isStaleChannelError(method, res.status)) onInvalidChannel?.();
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
