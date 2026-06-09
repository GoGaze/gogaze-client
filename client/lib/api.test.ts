import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  MediaApiService,
  WebSocketService,
  formatFileSize,
  getFileType,
  getMediaFileUrl,
} from "./api";

describe("getFileType", () => {
  it("classifies videos, images, and other", () => {
    expect(getFileType("clip.mp4")).toBe("video");
    expect(getFileType("photo.PNG")).toBe("image");
    expect(getFileType("notes.txt")).toBe("other");
    expect(getFileType("noext")).toBe("other");
  });
});

describe("getMediaFileUrl", () => {
  it("returns absolute URLs untouched", () => {
    const url = "https://gogaze.s3.amazonaws.com/media/x.mp4";
    expect(getMediaFileUrl(url)).toBe(url);
  });

  it("does not corrupt hosts containing 'api' when resolving /media/", () => {
    // API origin is http://localhost:8000 by default — string-replace of '/api'
    // would have mangled this; URL parsing must not.
    const resolved = getMediaFileUrl("/media/a.png");
    expect(resolved.endsWith("/media/a.png")).toBe(true);
    expect(resolved).not.toContain("/api");
  });

  it("passes through unknown relative paths", () => {
    expect(getMediaFileUrl("uploads/a.png")).toBe("uploads/a.png");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(1024)).toContain("KB");
    expect(formatFileSize(5 * 1024 * 1024)).toContain("MB");
  });
});

describe("MediaApiService", () => {
  afterEach(() => vi.restoreAllMocks());

  const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    });

  it("fetches media from the same-origin proxy", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([{ id: 1, title: "a", file: "a.png", uploaded_at: "" }]));
    const api = new MediaApiService();
    const result = await api.getMediaFiles();
    expect(fetchMock).toHaveBeenCalledWith("/api/media/");
    expect(result).toHaveLength(1);
  });

  it("registers a device and returns its one-time token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: 1, device_id: "lobby", name: "Lobby", token: "secret", is_online: false, last_seen: null, created_at: "" }, 201),
    );
    const api = new MediaApiService();
    const device = await api.registerDevice("lobby", "Lobby");
    expect(device.token).toBe("secret");
  });

  it("throws ApiError carrying the backend 'error' field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Device is offline." }, 409),
    );
    const api = new MediaApiService();
    await expect(api.playMediaOnDevice(1, "lobby")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "Device is offline.",
    });
  });
});

class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen?: () => void;
  onmessage?: (e: { data: string }) => void;
  onclose?: () => void;
  onerror?: (e: unknown) => void;
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(d: string) {
    this.sent.push(d);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

describe("WebSocketService", () => {
  afterEach(() => {
    FakeWebSocket.instances = [];
  });

  it("connects with the device token in the query string and reports connection", async () => {
    // @ts-expect-error test stub
    globalThis.WebSocket = FakeWebSocket;
    const ws = new WebSocketService("dev-1");
    let connected = false;
    ws.onConnectionChange((c) => (connected = c));

    const p = ws.connect("tok-123");
    const inst = FakeWebSocket.instances.at(-1)!;
    expect(inst.url).toContain("/ws/display/dev-1/?token=tok-123");

    inst.readyState = 1;
    inst.onopen?.();
    await p;

    expect(connected).toBe(true);
    expect(ws.isConnected()).toBe(true);

    ws.send({ type: "hello" });
    expect(inst.sent).toContain(JSON.stringify({ type: "hello" }));

    ws.disconnect();
    expect(inst.readyState).toBe(3);
  });
});

describe("ApiError", () => {
  it("retains status and name", () => {
    const e = new ApiError("nope", 403);
    expect(e.status).toBe(403);
    expect(e.name).toBe("ApiError");
  });
});
