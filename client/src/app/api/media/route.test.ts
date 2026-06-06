// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/media (proxy)", () => {
  it("forwards the session cookie as a Bearer token and relays the body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new NextRequest("http://localhost:3000/api/media", {
      headers: { cookie: "session=tok-xyz" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok-xyz");
    expect(await res.json()).toEqual([{ id: 1 }]);
  });

  it("relays a 404 instead of collapsing it into a 500", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"error":"not found"}', {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );
    const req = new NextRequest("http://localhost:3000/api/media");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 502 when the backend is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const req = new NextRequest("http://localhost:3000/api/media");
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});
