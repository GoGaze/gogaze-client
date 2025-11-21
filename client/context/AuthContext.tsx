// context/AuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setAuthToken, removeAuthToken } from "@/lib/cookies";

// Define the type for the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout | null = null;
    
    // onAuthStateChanged returns an unsubscriber
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Clear any existing token refresh interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
      
      // Store token in cookie when user is authenticated
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          
          // Refresh token every 50 minutes (tokens expire after 1 hour)
          tokenRefreshInterval = setInterval(async () => {
            try {
              const refreshedToken = await user.getIdToken(true); // Force refresh
              setAuthToken(refreshedToken);
            } catch (error) {
              console.error("Error refreshing token:", error);
            }
          }, 50 * 60 * 1000); // 50 minutes
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
      } else {
        // Remove token when user logs out
        removeAuthToken();
      }
    });

    // Unsubscribe to the listener when the component unmounts
    return () => {
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  return useContext(AuthContext);
};