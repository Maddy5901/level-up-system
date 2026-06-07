/**
 * Authentication Service
 * Core business logic for signup, login, logout, session management
 * Pure functions, no React hooks
 * All Supabase interactions happen here
 */

import { createClient } from "@supabase/supabase-js";
import type { User, Session, AuthResponse } from "./type";
import { SignupSchema, LoginSchema } from "./schemas";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function signup(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  const emailResult = SignupSchema.pick({ email: true }).safeParse({ email });
  if (!emailResult.success) {
    return { success: false, error: "Invalid email format." };
  }
  
  const passwordResult = SignupSchema.pick({ password: true }).safeParse({ password });
  if (!passwordResult.success) {
    return { success: false, error: "Password does not meet requirements." };
  }
  
  const usernameResult = SignupSchema.pick({ username: true }).safeParse({ username });
  if (!usernameResult.success) {
    return { success: false, error: "Invalid username format." };
  }

  const validatedEmail = emailResult.data.email.toLowerCase();
  const validatedPassword = passwordResult.data.password;
  const validatedUsername = usernameResult.data.username;

  const { data: uniquenessCheck, error: checkError } = await supabase
    .rpc('check_unique_user', { 
      p_email: validatedEmail, 
      p_username: validatedUsername 
    });

  if (checkError) {
    console.error("Uniqueness check failed:", checkError);
    return { success: false, error: "Unable to create account." };
  }

  if (uniquenessCheck?.email_taken) {
    return { success: false, error: "Unable to create account." };
  }

  if (uniquenessCheck?.username_taken) {
    return { success: false, error: "Unable to create account." };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedEmail,
    password: validatedPassword,
    options: {
      data: {
        username: validatedUsername,
      },
    },
  });

  if (authError) {
    console.error("Auth signup error");
    return { success: false, error: "Unable to create account." };
  }

  if (!authData.user) {
    console.error("Auth signup returned no user");
    return { success: false, error: "Unable to create account." };
  }

  if (!authData.session) {
    return {
      success: true,
      user: null as any,
      session: null as any,
    };
  }

  const { data: userProfile, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (fetchError || !userProfile) {
    console.error("Profile fetch failed after signup:", fetchError);
    return { success: false, error: "Unable to create account." };
  }

  return {
    success: true,
    user: {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      current_level: userProfile.current_level,
      total_xp: userProfile.total_xp,
      created_at: userProfile.created_at,
    },
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at,
      expires_in: authData.session.expires_in,
    },
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const emailResult = LoginSchema.pick({ email: true }).safeParse({ email });
  if (!emailResult.success) {
    return { success: false, error: "Unable to log in." };
  }
  
  const passwordResult = LoginSchema.pick({ password: true }).safeParse({ password });
  if (!passwordResult.success) {
    return { success: false, error: "Unable to log in." };
  }

  const validatedEmail = emailResult.data.email.toLowerCase();
  const validatedPassword = passwordResult.data.password;

  const { data: authData, error: authError } = await supabase.auth
    .signInWithPassword({
      email: validatedEmail,
      password: validatedPassword,
    });

  if (authError) {
    console.error("Auth login error");
    return { success: false, error: "Unable to log in." };
  }

  if (!authData.user || !authData.session) {
    console.error("Auth login returned incomplete data");
    return { success: false, error: "Unable to log in." };
  }

  let { data: userProfile, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (fetchError || !userProfile) {
    console.warn("Profile missing, attempting auto-create");
    const { data: newProfile, error: insertError } = await supabase
      .from("users")
      .upsert({
        id: authData.user.id,
        email: validatedEmail,
        username: validatedEmail.split('@')[0],
        current_level: 1,
        total_xp: 0,
      })
      .select()
      .single();

    if (insertError || !newProfile) {
      console.error("Could not create profile on login:", insertError);
      return { success: false, error: "Unable to log in." };
    }
    userProfile = newProfile;
  }

  return {
    success: true,
    user: {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      current_level: userProfile.current_level,
      total_xp: userProfile.total_xp,
      created_at: userProfile.created_at,
    },
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at,
      expires_in: authData.session.expires_in,
    },
  };
}

export async function initializeAuth(): Promise<{
  user: User;
  session: Session;
} | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  const { data: userProfile, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.session.user.id)
    .single();

  if (fetchError || !userProfile) {
    return null;
  }

  return {
    user: {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      current_level: userProfile.current_level,
      total_xp: userProfile.total_xp,
      created_at: userProfile.created_at,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
    },
  };
}

export async function refreshSession(): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    return { success: false, error: "Session refresh failed." };
  }

  const { data: userProfile, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.session.user.id)
    .single();

  if (fetchError || !userProfile) {
    return { success: false, error: "Session refresh failed." };
  }

  return {
    success: true,
    user: {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      current_level: userProfile.current_level,
      total_xp: userProfile.total_xp,
      created_at: userProfile.created_at,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
    },
  };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut().catch((err) => {
    console.error("Logout failed:", err);
  });
}