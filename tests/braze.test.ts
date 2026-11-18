import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedEndpoint, resolveEndpoint } from "../src/braze/endpoints";
import { API_KEY_HEADER, createBrazeProxy } from "../src/braze/proxy";
import { isTimeValue, timeValue, unwrapTime } from "../src/braze/values";

describe("endpoints", () => {
  it("allows Braze hosts only", () => {
    expect(isAllowedEndpoint(resolveEndpoint("US-01", ""), false)).toBe(true);
    expect(isAllowedEndpoint("https://rest.fra-02.braze.eu", false)).toBe(true);
    expect(isAllowedEndpoint("https://evil.com", false)).toBe(false);
    expect(isAllowedEndpoint("https://rest.iad-01.braze.com.evil.com", false)).toBe(false);
    expect(isAllowedEndpoint("http://localhost:4010", false)).toBe(false);
    expect(isAllowedEndpoint("http://localhost:4010", true)).toBe(true);
  });
});

describe("$time values", () => {
  it("wraps and unwraps", () => {
    expect(timeValue("2024-01-01")).toEqual({ $time: "2024-01-01" });
    expect(isTimeValue({ $time: "x" })).toBe(true);
    expect(isTimeValue(["x"])).toBe(false);
    expect(unwrapTime({ $time: "2024-01-01" })).toBe("2024-01-01");
    expect(unwrapTime("a")).toBe("a");
  });
});

describe("createBrazeProxy", () => {
  afterEach(() => vi.unstubAllGlobals());
  const proxy = createBrazeProxy({ allowedPaths: ["/users/track"], allowMock: () => false });
  const req = (body: unknown, key: string | null = "k") =>
    new Request("http://app/api/braze", { method: "POST", headers: key ? { [API_KEY_HEADER]: key } : {}, body: JSON.stringify(body) });

  it("rejects missing keys, paths and hosts not on the allow-list", async () => {
    expect((await proxy(req({}, null))).status).toBe(400);
    expect((await proxy(req({ base: "https://rest.iad-01.braze.com", path: "/users/delete" }))).status).toBe(400);
    expect((await proxy(req({ base: "https://evil.com", path: "/users/track" }))).status).toBe(400);
  });

  it("forwards the key as a bearer token and passes rate-limit hints back", async () => {
    const fetchMock = vi.fn(async () => new Response('{"message":"slow down"}', { status: 429, headers: { "retry-after": "3" } }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await proxy(req({ base: "https://rest.iad-01.braze.com/", path: "/users/track", payload: { attributes: [] } }, "secret"));
    expect(res.status).toBe(429);
    expect(res.headers.get("x-retry-after-ms")).toBe("3000");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://rest.iad-01.braze.com/users/track");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret");
    expect(await res.json()).toEqual({ message: "slow down" });
  });
});
