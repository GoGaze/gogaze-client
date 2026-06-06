"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mediaApi, Device } from "@/lib/api";
import { Loader2, MonitorSmartphone, Wifi, WifiOff } from "lucide-react";

interface DevicePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (deviceId: string) => void;
  title?: string;
  /** When true (default), offline devices cannot be selected. */
  onlineOnly?: boolean;
}

export function DevicePickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Select a device",
  onlineOnly = true,
}: DevicePickerDialogProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    mediaApi
      .getDevices()
      .then((d) => !cancelled && setDevices(d))
      .catch(() => !cancelled && setError("Could not load devices."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose a registered display device{onlineOnly ? " that is online" : ""}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-destructive">{error}</p>
        ) : devices.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No devices registered yet.{" "}
            <Link href="/devices" className="text-primary underline">
              Add a device
            </Link>
            .
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {devices.map((d) => {
              const disabled = onlineOnly && !d.is_online;
              return (
                <button
                  key={d.device_id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(d.device_id);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.device_id}</p>
                    </div>
                  </div>
                  {d.is_online ? (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Wifi className="h-3.5 w-3.5" /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <WifiOff className="h-3.5 w-3.5" /> Offline
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
