// context/AuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncSession, clearSession } from "@/lib/cookies";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Refresh ~10 min before the 1-hour token expiry.
const TOKEN_REFRESH_MS = 50 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

    const clearRefresh = () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      clearRefresh();

      if (nextUser) {
        try {
          await syncSession(await nextUser.getIdToken());
        } catch (error) {
          console.error("Error establishing session:", error);
        }

        tokenRefreshInterval = setInterval(async () => {
          try {
            await syncSession(await nextUser.getIdToken(true)); // force refresh
          } catch (error) {
            // A failed refresh means the token was revoked/expired — sign out
            // rather than leaving a stale session "valid".
            console.error("Token refresh failed; signing out:", error);
            clearRefresh();
            await clearSession();
            await firebaseSignOut(auth);
          }
        }, TOKEN_REFRESH_MS);
      } else {
        await clearSession();
      }
    });

    return () => {
      unsubscribe();
      clearRefresh();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
