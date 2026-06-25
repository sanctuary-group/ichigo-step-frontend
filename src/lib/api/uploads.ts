import { API_ORIGIN, TENANT_BASE } from "./config";
import { getToken } from "./token-store";
import { getCurrentChannelId } from "./channel-store";
import { ApiError } from "./client";

/**
 * multipart/form-data でファイルをアップロードし、返却された url を返す。
 * tenant API の /uploads/* に Bearer + X-Line-Channel-Id を付けて送る。
 */
async function uploadFile(
  path: string,
  field: string,
  file: Blob,
  extra?: Record<string, string>,
): Promise<string> {
  const fd = new FormData();
  fd.append(field, file);
  if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v);

  const headers = new Headers({ Accept: "application/json" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const channelId = getCurrentChannelId();
  if (channelId) headers.set("X-Line-Channel-Id", channelId);

  const res = await fetch(`${API_ORIGIN}${TENANT_BASE}${path}`, {
    method: "POST",
    headers, // Content-Type は付けない（boundary をブラウザに任せる）
    body: fd,
  });

  if (!res.ok) {
    let message = `アップロードに失敗しました (HTTP ${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
      else if (data?.message) message = data.message;
    } catch {
      /* noop */
    }
    throw new ApiError(res.status, message);
  }

  const json = await res.json();
  return (json?.url ?? json?.data?.url) as string;
}

/** POST /uploads/image */
export function uploadImage(file: Blob): Promise<string> {
  return uploadFile("/uploads/image", "image", file);
}

/** POST /uploads/media (kind=video|audio) */
export function uploadMedia(file: Blob, kind: "video" | "audio"): Promise<string> {
  return uploadFile("/uploads/media", "media", file, { kind });
}

/** POST /uploads/pdf */
export function uploadPdf(file: Blob): Promise<string> {
  return uploadFile("/uploads/pdf", "pdf", file);
}
