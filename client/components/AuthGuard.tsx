"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/lib/cookies";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Redirects to login if user is not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check both Firebase auth state and cookie token
      const hasToken = getAuthToken();
      
      if (!user || !hasToken) {
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  const hasToken = getAuthToken();
  if (!user || !hasToken) {
    return null;
  }

  return <>{children}</>;
}

