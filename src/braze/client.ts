// Browser-side calls through the app's Braze proxy (see createBrazeProxy). The API key lives
// only in the caller's memory and travels per request in the x-braze-api-key header.

import { resolveEndpoint } from "./endpoints";
import { API_KEY_HEADER } from "./proxy";

export interface BrazeConnection {
  /** Key from BRAZE_ENDPOINTS, or "custom". */
  endpoint: string;
  customEndpoint: string;
  apiKey: string;
  workspaceLabel: string;
}

export const EMPTY_CONNECTION: BrazeConnection = { endpoint: "US-01", customEndpoint: "", apiKey: "", workspaceLabel: "" };

export interface BrazeCallResult<T = Record<string, unknown>> {
  /** 2xx from Braze. Check `data.errors` too: Braze reports per-object problems inside a 201. */
  ok: boolean;
  status: number;
  data: T & { message?: string; errors?: unknown[] };
  /** From 429 responses, when Braze said how long to wait. */
  retryAfterMs?: number;
}

export function isConnected(c: BrazeConnection): boolean {
  return !!c.apiKey.trim() && !!resolveEndpoint(c.endpoint, c.customEndpoint);
}

export async function callBraze<T = Record<string, unknown>>(
  conn: BrazeConnection, path: string, payload: unknown,
  opts: { proxyUrl?: string; signal?: AbortSignal } = {},
): Promise<BrazeCallResult<T>> {
  const res = await fetch(opts.proxyUrl ?? "/api/braze", {
    method: "POST",
    headers: { "content-type": "application/json", [API_KEY_HEADER]: conn.apiKey.trim() },
    body: JSON.stringify({ base: resolveEndpoint(conn.endpoint, conn.customEndpoint), path, payload }),
    signal: opts.signal,
  });
  let data: BrazeCallResult<T>["data"];
  try {
    data = await res.json();
  } catch {
    data = { message: `HTTP ${res.status}` } as BrazeCallResult<T>["data"];
  }
  const retry = Number(res.headers.get("x-retry-after-ms"));
  return { ok: res.ok, status: res.status, data, retryAfterMs: Number.isFinite(retry) && retry > 0 ? retry : undefined };
}

/** Human-readable message for a failed call. */
export function describeBrazeError(r: BrazeCallResult): string {
  const msg = typeof r.data?.message === "string" ? r.data.message : "";
  if (r.status === 401) return "Braze rejected the API key (401). Check the key and the instance.";
  if (r.status === 403) return `The API key lacks a permission this call needs (403)${msg ? `: ${msg}` : ""}.`;
  if (r.status === 429) return "Braze rate limit reached (429). Try again shortly.";
  return msg || `Braze returned HTTP ${r.status}.`;
}
