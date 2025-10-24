"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { Cpu, Wifi, WifiOff, Play, Square, Settings, Trash2 } from "lucide-react";

interface Device {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  lastSeen: Date;
}

export function DevicesClient() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  const { connected, connecting, error, connect, disconnect, lastMessage } = useWebSocket();

  // Mock devices for demonstration
  useEffect(() => {
    // In a real app, you'd fetch this from an API
    setDevices([
      {
        id: "display_001",
        name: "Living Room Display",
        status: 'connected',
        lastSeen: new Date(),
      },
      {
        id: "display_002", 
        name: "Kitchen Display",
        status: 'disconnected',
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
      },
    ]);
  }, []);

  const handleAddDevice = () => {
    if (newDeviceId && newDeviceName) {
      const newDevice: Device = {
        id: newDeviceId,
        name: newDeviceName,
        status: 'disconnected',
        lastSeen: new Date(),
      };
      setDevices(prev => [...prev, newDevice]);
      setNewDeviceId("");
      setNewDeviceName("");
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      await connect(deviceId);
      setSelectedDevice(deviceId);
    } catch (error) {
      console.error('Failed to connect to device:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSelectedDevice(null);
  };

  const handlePlay = async (deviceId: string) => {
    // This would send a play command to the device
    console.log('Playing media on device:', deviceId);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Devices</h1>
        <p className="text-slate-400">Manage and monitor your Raspberry Pi display devices</p>
      </div>

      {/* Device Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              Connected Devices
            </CardTitle>
            <Wifi className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {devices.filter(d => d.status === 'connected').length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Active connections</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              Total Devices
            </CardTitle>
            <Cpu className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{devices.length}</div>
            <p className="text-xs text-slate-400 mt-1">Registered devices</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              WebSocket Status
            </CardTitle>
            {connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {connected ? "Connected" : "Disconnected"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {selectedDevice ? `To ${selectedDevice}` : "No device selected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Device */}
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-white">Add New Device</CardTitle>
          <CardDescription className="text-slate-400">
            Connect a new Raspberry Pi device to your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="device-id" className="text-slate-200 mb-2 block">
                Device ID
              </Label>
              <Input
                id="device-id"
                placeholder="Enter device ID (e.g., display_001)"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="device-name" className="text-slate-200 mb-2 block">
                Device Name
              </Label>
              <Input
                id="device-name"
                placeholder="Enter device name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddDevice}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!newDeviceId || !newDeviceName}
              >
                Add Device
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Connected Devices</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your display devices and monitor their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Cpu className="h-12 w-12 mx-auto mb-4 text-slate-500" />
              <p className="text-lg mb-2">No devices connected</p>
              <p className="text-sm">Add your first Raspberry Pi device to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-slate-600 flex items-center justify-center">
                      <Cpu className="h-6 w-6 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{device.name}</h3>
                      <p className="text-sm text-slate-400">ID: {device.id}</p>
                      <p className="text-xs text-slate-500">
                        Last seen: {device.lastSeen.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        device.status === 'connected'
                          ? "bg-green-500/20 text-green-300 border-green-500"
                          : "bg-red-500/20 text-red-300 border-red-500"
                      }
                    >
                      {device.status}
                    </Badge>
                    
                    {selectedDevice === device.id ? (
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-900/20"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnect(device.id)}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        disabled={connecting}
                      >
                        {connecting ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handlePlay(device.id)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WebSocket Messages */}
      {lastMessage && (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-6">
          <CardHeader>
            <CardTitle className="text-white">Last Message</CardTitle>
            <CardDescription className="text-slate-400">
              Real-time communication with devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-x-auto">
              {JSON.stringify(lastMessage, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
