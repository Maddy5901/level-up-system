/**
 * useAuth Hook
 * Custom hook to access AuthContext from any component
 * Throws error if used outside AuthProvider
 */

import { useContext } from "react";
import { AuthContext } from "./context";
import type { AuthContextType } from "./type";

/**
 * Hook to access authentication context
 * Must be used within <AuthProvider>
 * Throws error if context not available
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within <AuthProvider>. Wrap your app with AuthProvider at the root level."
    );
  }

  return context;
}