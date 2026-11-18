// Braze REST endpoints by instance. The proxy only forwards to hosts that pass isAllowedEndpoint.

export const BRAZE_ENDPOINTS: { key: string; label: string; url: string }[] = [
  { key: "US-01", label: "US-01 (dashboard.braze.com)", url: "https://rest.iad-01.braze.com" },
  { key: "US-02", label: "US-02", url: "https://rest.iad-02.braze.com" },
  { key: "US-03", label: "US-03", url: "https://rest.iad-03.braze.com" },
  { key: "US-04", label: "US-04", url: "https://rest.iad-04.braze.com" },
  { key: "US-05", label: "US-05", url: "https://rest.iad-05.braze.com" },
  { key: "US-06", label: "US-06", url: "https://rest.iad-06.braze.com" },
  { key: "US-07", label: "US-07", url: "https://rest.iad-07.braze.com" },
  { key: "US-08", label: "US-08", url: "https://rest.iad-08.braze.com" },
  { key: "US-10", label: "US-10", url: "https://rest.us-10.braze.com" },
  { key: "EU-01", label: "EU-01", url: "https://rest.fra-01.braze.eu" },
  { key: "EU-02", label: "EU-02", url: "https://rest.fra-02.braze.eu" },
  { key: "AU-01", label: "AU-01", url: "https://rest.au-01.braze.com" },
  { key: "ID-01", label: "ID-01", url: "https://rest.id-01.braze.com" },
];

const BRAZE_HOST = /^rest\.[a-z0-9-]+\.braze\.(com|eu)$/;

/** Resolve the configured endpoint key / custom URL to a base URL (no trailing slash). */
export function resolveEndpoint(endpoint: string, customEndpoint: string): string {
  if (endpoint === "custom") return customEndpoint.trim().replace(/\/+$/, "");
  return BRAZE_ENDPOINTS.find((e) => e.key === endpoint)?.url ?? "";
}

/**
 * Only real Braze REST hosts over https. A local mock (http://localhost / 127.0.0.1)
 * is allowed when ALLOW_MOCK_BRAZE=true, for testing.
 */
export function isAllowedEndpoint(base: string, allowMock: boolean): boolean {
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    return false;
  }
  if (u.pathname !== "/" && u.pathname !== "") return false;
  if (u.protocol === "https:" && BRAZE_HOST.test(u.hostname)) return true;
  return allowMock && u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
}
