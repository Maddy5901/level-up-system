/**
 * Authentication Context & Provider
 * Global auth state management
 * Initializes auth on app mount, listens for auth state changes
 * Wraps entire app (in App.tsx)
 */

import React, { createContext, useEffect, useState, useCallback } from "react";
import type { AuthContextType, AuthResponse, User, Session } from "./type";
import {
  signup,
  login,
  logout,
  initializeAuth,
  refreshSession,
} from "./service";
import { createClient } from "@supabase/supabase-js";

// Create context (exported for useAuth hook)
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Initialize Supabase client for auth state listener
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider Component
 * Wraps entire app, provides auth context to all children
 * Initializes auth state on mount, listens for auth changes
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth on app mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authData = await initializeAuth();

        if (authData) {
          setUser(authData.user);
          setSession(authData.session);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Listen for auth state changes from other tabs/windows
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === "SIGNED_IN" && authSession) {
        // User signed in
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authSession.user.id)
          .single();

        if (!error && userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            username: userData.username,
            current_level: userData.current_level,
            total_xp: userData.total_xp,
            created_at: userData.created_at,
          });
          setSession({
            access_token: authSession.access_token,
            refresh_token: authSession.refresh_token,
            expires_at: authSession.expires_at,
            expires_in: authSession.expires_in,
          });
          setIsAuthenticated(true);
        }
      } else if (event === "SIGNED_OUT") {
        // User signed out
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      } else if (event === "TOKEN_REFRESHED" && authSession) {
        // JWT token refreshed
        setSession({
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token,
          expires_at: authSession.expires_at,
          expires_in: authSession.expires_in,
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Signup handler
   */
  const handleSignup = useCallback(
    async (
      email: string,
      password: string,
      username: string
    ): Promise<AuthResponse> => {
      const result = await signup(email, password, username);

      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
      }

      return result;
    },
    []
  );

  /**
   * Login handler
   */
  const handleLogin = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const result = await login(email, password);

      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
      }

      return result;
    },
    []
  );

  /**
   * Logout handler
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Refresh session handler
   */
  const handleRefreshSession = useCallback(
    async (): Promise<AuthResponse> => {
      const result = await refreshSession();

      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
      }

      return result;
    },
    []
  );

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    loading,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
    refreshSession: handleRefreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}