"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import {
  updatePassword,
  reauthenticateWithCredential,
  sendEmailVerification,
  EmailAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useToast } from "@/components/ui/toast";
import { LogOut, Key, Shield, Loader2, MailCheck } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleResendVerification = async () => {
    if (!user) return;
    setSendingVerification(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: "Verification email sent",
        description: "Check your inbox to verify your address.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof FirebaseError ? err.message : "Could not send verification email.";
      toast({ title: "Failed to send", description: message, variant: "error" });
    } finally {
      setSendingVerification(false);
    }
  };

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
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
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
            setError(
              "Please log out and log in again before changing your password"
            );
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
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>

        {/* Profile */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {user?.displayName || "User"}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">User ID</p>
                <p className="font-mono text-foreground text-xs">
                  {user?.uid}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email verified</p>
                {user?.emailVerified ? (
                  <span className="text-green-400">Verified</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">Not verified</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                    >
                      {sendingVerification ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <MailCheck className="mr-1.5 h-3.5 w-3.5" />
                          Resend
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="bg-secondary border-input"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="bg-secondary border-input"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-secondary border-input"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-md p-3">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={loading}>
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
        <Card className="border-destructive/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sign Out</p>
                <p className="text-xs text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
