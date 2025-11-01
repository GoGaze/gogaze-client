import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMediaFiles } from "@/lib/server-api";
import Link from "next/link";
import { Upload, Image as ImageIcon, Cpu, Activity } from "lucide-react";

export default async function DashboardPage() {
  const mediaFiles = await getMediaFiles();

  const stats = [
    {
      title: "Total Uploads",
      value: mediaFiles.length.toString(),
      description: "Videos and Photos",
      icon: Upload,
      color: "text-blue-500",
    },
    {
      title: "Media Files",
      value: mediaFiles.length.toString(),
      description: "In gallery",
      icon: ImageIcon,
      color: "text-purple-500",
    },
    {
      title: "Active Devices",
      value: "0",
      description: "Raspberry Pi connected",
      icon: Cpu,
      color: "text-green-500",
    },
    {
      title: "Status",
      value: "Online",
      description: "System operational",
      icon: Activity,
      color: "text-emerald-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome back to your media dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/upload">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Upload Media</CardTitle>
                <CardDescription className="text-slate-400">
                  Upload videos and photos to your gallery
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/gallery">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">View Gallery</CardTitle>
                <CardDescription className="text-slate-400">
                  Browse all your uploaded media files
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/devices">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-600/20 flex items-center justify-center mb-4">
                  <Cpu className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Manage Devices</CardTitle>
                <CardDescription className="text-slate-400">
                  View and control Raspberry Pi devices
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Your latest uploads and device activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Upload your first media file to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
