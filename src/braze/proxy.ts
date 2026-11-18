// Thin proxy to the Braze REST API (Braze doesn't allow browser CORS calls).
// The API key arrives per request in the x-braze-api-key header and is never stored or logged.
// Works as a Next.js App Router route handler, or anywhere with Web Request/Response.

import { isAllowedEndpoint } from "./endpoints";

export const API_KEY_HEADER = "x-braze-api-key";

export interface BrazeProxyOptions {
  /** Braze paths this proxy forwards, e.g. ["/users/track"]. */
  allowedPaths: string[];
  /** Allow http://localhost mock servers. Default: process.env.ALLOW_MOCK_BRAZE === "true". */
  allowMock?: () => boolean;
  /** Upstream timeout in ms (default 30 s). */
  timeoutMs?: number;
}

/** Body the browser sends to the proxy. */
export interface BrazeProxyRequest {
  base: string;
  path: string;
  payload?: unknown;
}

function json(body: unknown, status: number, headers?: Headers) {
  const h = headers ?? new Headers();
  h.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status, headers: h });
}

export function createBrazeProxy(opts: BrazeProxyOptions) {
  const allowed = new Set(opts.allowedPaths);
  const allowMock = opts.allowMock ?? (() => typeof process !== "undefined" && process.env?.ALLOW_MOCK_BRAZE === "true");
  const timeoutMs = opts.timeoutMs ?? 30_000;

  return async function POST(req: Request): Promise<Response> {
    const apiKey = req.headers.get(API_KEY_HEADER);
    if (!apiKey) return json({ message: "Missing Braze API key" }, 400);

    let body: Partial<BrazeProxyRequest>;
    try {
      body = await req.json();
    } catch {
      return json({ message: "Invalid JSON body" }, 400);
    }
    const base = String(body.base ?? "").replace(/\/+$/, "");
    const path = String(body.path ?? "");
    if (!allowed.has(path)) return json({ message: `Path not allowed: ${path}` }, 400);
    if (!isAllowedEndpoint(base, allowMock())) return json({ message: `Endpoint not allowed: ${base}` }, 400);

    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body.payload ?? {}),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      return json({ message: `Could not reach Braze: ${e instanceof Error ? e.message : e}` }, 502);
    }

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text.slice(0, 500) || `HTTP ${res.status}` };
    }

    const headers = new Headers();
    const retryAfter = res.headers.get("retry-after");
    const reset = res.headers.get("x-ratelimit-reset");
    let retryMs = 0;
    if (retryAfter && !Number.isNaN(Number(retryAfter))) retryMs = Number(retryAfter) * 1000;
    else if (reset && !Number.isNaN(Number(reset))) retryMs = Math.max(0, Number(reset) * 1000 - Date.now());
    if (res.status === 429 && retryMs) headers.set("x-retry-after-ms", String(Math.min(retryMs, 60_000)));
    for (const h of ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"]) {
      const v = res.headers.get(h);
      if (v) headers.set(h, v);
    }
    return json(parsed, res.status, headers);
  };
}
