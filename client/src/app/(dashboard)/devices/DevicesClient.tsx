"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { mediaApi, ApiError, Device, DeviceWithToken } from "@/lib/api";
import {
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  KeyRound,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export function DevicesClient() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  // Shown once after register / regenerate.
  const [credential, setCredential] = useState<{ deviceId: string; token: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDevices(await mediaApi.getDevices());
    } catch {
      setError("Couldn't load devices. The server may be unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll presence every 15s.
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const handleRegister = async () => {
    const deviceId = newId.trim().toLowerCase();
    const name = newName.trim();
    if (!SLUG_RE.test(deviceId)) {
      toast({ title: "Invalid device id", description: "Use lowercase letters, digits and hyphens.", variant: "error" });
      return;
    }
    if (!name) {
      toast({ title: "Name required", variant: "error" });
      return;
    }
    setBusy(true);
    try {
      const created: DeviceWithToken = await mediaApi.registerDevice(deviceId, name);
      setAddOpen(false);
      setNewId("");
      setNewName("");
      setCredential({ deviceId: created.device_id, token: created.token });
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not register device.";
      toast({ title: "Registration failed", description: message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async (device: Device) => {
    try {
      const { token } = await mediaApi.regenerateDeviceToken(device.device_id);
      setCredential({ deviceId: device.device_id, token });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not regenerate token.";
      toast({ title: "Failed", description: message, variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await mediaApi.deleteDevice(deleteTarget.device_id);
      setDevices((prev) => prev.filter((d) => d.device_id !== deleteTarget.device_id));
      toast({ title: "Device removed", variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not delete device.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const displayUrl = (deviceId: string, token: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/display/${deviceId}?token=${encodeURIComponent(token)}`
      : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", variant: "success" });
    } catch {
      toast({ title: "Copy failed", variant: "error" });
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Devices</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add device
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive/40 bg-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="text-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : devices.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No devices registered yet.</p>
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add your first device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => (
            <Card key={d.device_id} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{d.name}</CardTitle>
                {d.is_online ? (
                  <Badge variant="outline" className="border-green-500/50 text-green-500">
                    <Wifi className="mr-1 h-3 w-3" /> Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <WifiOff className="mr-1 h-3 w-3" /> Offline
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-xs text-muted-foreground">{d.device_id}</p>
                <p className="text-xs text-muted-foreground">
                  Last seen:{" "}
                  {d.last_seen ? new Date(d.last_seen).toLocaleString() : "never"}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRegenerate(d)}>
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" /> New token
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(d)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add device dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a device</DialogTitle>
            <DialogDescription>
              The device id appears in the screen&rsquo;s URL. Use lowercase letters, digits and hyphens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="device-id">Device id</Label>
              <Input id="device-id" placeholder="lobby-screen" value={newId} onChange={(e) => setNewId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-name">Name</Label>
              <Input id="device-name" placeholder="Lobby Screen" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleRegister} disabled={busy}>
              {busy ? "Registering…" : "Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credential (token) dialog — shown ONCE */}
      <Dialog open={!!credential} onOpenChange={(o) => !o && setCredential(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device token</DialogTitle>
            <DialogDescription>
              Copy this now — it is shown only once. Open the display URL on the screen device to connect it.
            </DialogDescription>
          </DialogHeader>
          {credential && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Token</Label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-secondary p-2 text-xs">{credential.token}</code>
                  <Button size="icon" variant="outline" onClick={() => copy(credential.token)} aria-label="Copy token">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Display URL</Label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-secondary p-2 text-xs">
                    {displayUrl(credential.deviceId, credential.token)}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copy(displayUrl(credential.deviceId, credential.token))}
                    aria-label="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredential(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove device?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed and its token invalidated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={busy}>
              {busy ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
