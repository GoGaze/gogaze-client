"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FirebaseError } from "firebase/app";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [user, authLoading, router, searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      // Redirect to the original page or dashboard
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-email":
            setError("Invalid email address");
            break;
          case "auth/user-disabled":
            setError("This account has been disabled");
            break;
          case "auth/user-not-found":
            setError("No account found with this email");
            break;
          case "auth/wrong-password":
            setError("Incorrect password");
            break;
          case "auth/email-already-in-use":
            setError("Email already in use");
            break;
          case "auth/weak-password":
            setError("Password should be at least 6 characters");
            break;
          default:
            setError("An error occurred. Please try again.");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
      // Redirect to the original page or dashboard
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err) {
      console.error("Google Sign-in Error:", err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/popup-closed-by-user":
            setError("Sign-in popup was closed");
            break;
          case "auth/popup-blocked":
            setError("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
            break;
          case "auth/cancelled-popup-request":
            setError("Only one sign-in popup is allowed at a time");
            break;
          case "auth/operation-not-allowed":
            setError("Google sign-in is not enabled. Please contact support.");
            break;
          case "auth/unauthorized-domain":
            setError("This domain is not authorized for Google sign-in. Please contact support.");
            break;
          case "auth/account-exists-with-different-credential":
            setError("An account already exists with the same email but different sign-in method.");
            break;
          default:
            setError(`Google sign-in failed: ${err.code}. ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred during Google sign-in");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render login form if already logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center text-white">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-slate-300">
              {isSignUp
                ? "Sign up to get started with your account"
                : "Sign in to your account to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-md p-3">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-slate-100 text-slate-900 border-slate-600 font-semibold py-2 transition-all duration-200"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <button
              type="button"
              className="text-sm text-slate-300 hover:text-white transition-colors"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
