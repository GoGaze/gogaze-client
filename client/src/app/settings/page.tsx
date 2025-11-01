"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { LogOut, Key, User, Mail, Shield, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (!user || !user.email) {
      setError("No user logged in");
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/wrong-password":
            setError("Current password is incorrect");
            break;
          case "auth/weak-password":
            setError("New password is too weak");
            break;
          case "auth/requires-recent-login":
            setError("Please log out and log in again before changing your password");
            break;
          default:
            setError(`Failed to change password: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account settings and preferences</p>
        </div>

        {/* Profile Information */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Your account details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-slate-300">Display Name</Label>
                <div className="mt-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-white">{user?.displayName || "Not set"}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Email Address</Label>
                <div className="mt-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-slate-300">User ID</Label>
                <div className="mt-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-white text-sm font-mono">{user?.uid}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Email Verified</Label>
                <div className="mt-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-white">
                    {user?.emailVerified ? (
                      <span className="text-green-400">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-400">Not verified</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Key className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription className="text-slate-400">
                  Update your password to keep your account secure
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="current-password" className="text-slate-200">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="new-password" className="text-slate-200">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-slate-200">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-md p-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-400 text-sm bg-green-950/30 border border-green-900/50 rounded-md p-3">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-900/50 bg-red-950/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-white">Danger Zone</CardTitle>
                <CardDescription className="text-slate-400">
                  Irreversible account actions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="bg-slate-700 mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">Sign Out</h3>
                <p className="text-sm text-slate-400">
                  Sign out of your account on this device
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
