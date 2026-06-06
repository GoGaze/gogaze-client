// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { authHeaders, relay, upstreamError } from "./config";

function fakeRequest(cookie?: string): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name === "session" && cookie ? { value: cookie } : undefined,
    },
  } as unknown as NextRequest;
}

describe("authHeaders", () => {
  it("forwards the session cookie as a Bearer token", () => {
    expect(authHeaders(fakeRequest("tok-abc"))).toEqual({
      Authorization: "Bearer tok-abc",
    });
  });

  it("returns no header when there is no session cookie", () => {
    expect(authHeaders(fakeRequest())).toEqual({});
  });
});

describe("relay", () => {
  it("preserves the upstream status and body", async () => {
    const upstream = new Response('{"ok":false}', {
      status: 409,
      headers: { "content-type": "application/json" },
    });
    const res = await relay(upstream);
    expect(res.status).toBe(409);
    expect(await res.text()).toBe('{"ok":false}');
  });
});

describe("upstreamError", () => {
  it("returns a 502", async () => {
    const res = upstreamError(new Error("boom"), "test");
    expect(res.status).toBe(502);
  });
});
