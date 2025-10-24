"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cpu,
  Monitor,
  Wifi,
  WifiOff,
  Settings,
  Power,
  Play,
  Pause,
  RefreshCw,
  Plus,
} from "lucide-react";

// Mock data for Raspberry Pi devices
const mockDevices = [
  {
    id: "rpi-001",
    name: "Main Entrance Display",
    status: "online",
    ipAddress: "192.168.1.101",
    currentMedia: "Product_Demo.mp4",
    uptime: "5 days 12 hours",
    lastSeen: "2 minutes ago",
    resolution: "1920x1080",
    storage: {
      used: 8.5,
      total: 32,
    },
  },
  {
    id: "rpi-002",
    name: "Conference Room Screen",
    status: "online",
    ipAddress: "192.168.1.102",
    currentMedia: "Company_Presentation.jpg",
    uptime: "2 days 8 hours",
    lastSeen: "1 minute ago",
    resolution: "1920x1080",
    storage: {
      used: 12.3,
      total: 32,
    },
  },
  {
    id: "rpi-003",
    name: "Lobby Display",
    status: "offline",
    ipAddress: "192.168.1.103",
    currentMedia: "None",
    uptime: "0 hours",
    lastSeen: "2 hours ago",
    resolution: "1920x1080",
    storage: {
      used: 5.2,
      total: 32,
    },
  },
];

export default function DevicesPage() {
  const [devices] = useState(mockDevices);

  const onlineDevices = devices.filter((d) => d.status === "online").length;
  const offlineDevices = devices.filter((d) => d.status === "offline").length;

  const getStoragePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Raspberry Pi Devices</h1>
            <p className="text-slate-400">Manage and monitor your connected displays</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Total Devices
              </CardTitle>
              <Cpu className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{devices.length}</div>
              <p className="text-xs text-slate-400 mt-1">Registered displays</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Online</CardTitle>
              <Wifi className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{onlineDevices}</div>
              <p className="text-xs text-slate-400 mt-1">Active connections</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Offline</CardTitle>
              <WifiOff className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{offlineDevices}</div>
              <p className="text-xs text-slate-400 mt-1">Disconnected devices</p>
            </CardContent>
          </Card>
        </div>

        {/* Devices List */}
        <div className="space-y-4">
          {devices.map((device) => (
            <Card
              key={device.id}
              className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-purple-500/50 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        device.status === "online"
                          ? "bg-green-600/20"
                          : "bg-red-600/20"
                      }`}
                    >
                      <Cpu
                        className={`h-6 w-6 ${
                          device.status === "online" ? "text-green-400" : "text-red-400"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-white">{device.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            device.status === "online"
                              ? "bg-green-500/20 text-green-300 border-green-500"
                              : "bg-red-500/20 text-red-300 border-red-500"
                          }
                        >
                          {device.status === "online" ? (
                            <>
                              <Wifi className="h-3 w-3 mr-1" />
                              Online
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 mr-1" />
                              Offline
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400">
                        {device.id} • {device.ipAddress}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      disabled={device.status === "offline"}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Current Media */}
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-purple-400" />
                      <p className="text-sm font-medium text-slate-300">Current Media</p>
                    </div>
                    <p className="text-white font-medium truncate">
                      {device.currentMedia}
                    </p>
                    {device.status === "online" && device.currentMedia !== "None" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Change
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Uptime */}
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Power className="h-4 w-4 text-blue-400" />
                      <p className="text-sm font-medium text-slate-300">Uptime</p>
                    </div>
                    <p className="text-white font-medium">{device.uptime}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Last seen: {device.lastSeen}
                    </p>
                  </div>

                  {/* Resolution */}
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-green-400" />
                      <p className="text-sm font-medium text-slate-300">Resolution</p>
                    </div>
                    <p className="text-white font-medium">{device.resolution}</p>
                    <p className="text-xs text-slate-400 mt-1">Full HD display</p>
                  </div>

                  {/* Storage */}
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-4 w-4 text-yellow-400" />
                      <p className="text-sm font-medium text-slate-300">Storage</p>
                    </div>
                    <p className="text-white font-medium">
                      {device.storage.used} GB / {device.storage.total} GB
                    </p>
                    <div className="mt-2">
                      <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all"
                          style={{
                            width: `${getStoragePercentage(
                              device.storage.used,
                              device.storage.total
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {getStoragePercentage(device.storage.used, device.storage.total)}%
                        used
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Devices */}
        {devices.length === 0 && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="py-16">
              <div className="text-center text-slate-400">
                <Cpu className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg mb-2">No devices registered</p>
                <p className="text-sm mb-4">
                  Add your first Raspberry Pi device to get started
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
