/**
 * Authentication Types
 * Core type definitions for authentication system
 * Used across all auth modules (service, context, components)
 */

/**
 * User record from 'users' table
 * Linked to Supabase Auth user via id (foreign key)
 */
export interface User {
  id: string;
  email: string;
  username: string;
  current_level: number;
  total_xp: number;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string | null;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: any;
}

export type AuthResponse = 
  | { success: true; user: User | null; session: Session | null }
  | { success: false; error: string };

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse>;
}