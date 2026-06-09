"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { WebSocketService, WebSocketMessage, getMediaFileUrl } from "@/lib/api";

const VIDEO_RE = /\.(mp4|mov|avi|mkv|webm|flv|wmv)(\?|$)/i;

function DisplayScreen() {
  const params = useParams();
  const searchParams = useSearchParams();
  const deviceId = String(params.deviceId ?? "");
  const token = searchParams.get("token") ?? "";

  const [connected, setConnected] = useState(false);
  const [media, setMedia] = useState<{ url: string; sessionId?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing device token in the URL.");
      return;
    }
    const ws = new WebSocketService(deviceId);
    wsRef.current = ws;
    ws.onConnectionChange(setConnected);
    ws.onMessage((msg: WebSocketMessage) => {
      if (msg.type === "play" && typeof msg.url === "string") {
        setMedia({
          url: getMediaFileUrl(msg.url),
          sessionId: typeof msg.session_id === "number" ? msg.session_id : undefined,
        });
      } else if (msg.type === "stop") {
        setMedia(null);
      }
    });
    ws.connect(token).catch(() => setError("Could not connect — check the device token."));
    return () => ws.disconnect();
  }, [deviceId, token]);

  const isVideo = media ? VIDEO_RE.test(media.url) : false;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      {error ? (
        <div className="p-8 text-center text-white/80">
          <p className="text-lg">{error}</p>
          <p className="mt-2 text-sm text-white/50">Device: {deviceId}</p>
        </div>
      ) : media ? (
        isVideo ? (
          <video
            src={media.url}
            autoPlay
            className="max-h-full max-w-full"
            onEnded={() => {
              wsRef.current?.send({ type: "playback_completed", session_id: media.sessionId });
              setMedia(null);
            }}
            onError={() =>
              wsRef.current?.send({
                type: "playback_error",
                session_id: media.sessionId,
                error: "playback failed",
              })
            }
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt="" className="max-h-full max-w-full object-contain" />
        )
      ) : (
        <div className="text-center text-white/40">
          <p className="text-lg">{connected ? "Ready" : "Connecting…"}</p>
          <p className="mt-2 text-sm">{deviceId}</p>
        </div>
      )}
    </div>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <DisplayScreen />
    </Suspense>
  );
}
