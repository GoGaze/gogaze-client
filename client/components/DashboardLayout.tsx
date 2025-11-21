"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/AuthGuard";
import {
  LayoutDashboard,
  Upload,
  Image as ImageIcon,
  Cpu,
  Settings,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Upload",
    href: "/upload",
    icon: Upload,
  },
  {
    title: "Gallery",
    href: "/gallery",
    icon: ImageIcon,
  },
  {
    title: "Devices",
    href: "/devices",
    icon: Cpu,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-700 bg-slate-900/50 backdrop-blur-sm flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            GoGaze
          </h1>
          <p className="text-sm text-slate-400 mt-1">Media Management</p>
        </div>

        <Separator className="bg-slate-700" />

        {/* User Info */}
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <Avatar>
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-purple-600">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-slate-700" />

        {/* Footer */}
        <div className="p-4">
          <p className="text-xs text-slate-500 text-center">
            © 2025 GoGaze. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
    </AuthGuard>
  );
}
