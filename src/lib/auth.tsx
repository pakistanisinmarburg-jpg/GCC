import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AppRole = "guest" | "user" | "moderator" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  nationality: string | null;
  designation: string | null;
  bio: string | null;
  hobbies: string | null;
  languages: string[] | null;
  phone: string | null;
  is_active?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfileAndRole(userId: string): Promise<{ profile: Profile | null; role: AppRole }> {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);
  const role = (roleRow?.role as AppRole | undefined) ?? "user";
  return { profile: (profile as Profile | null) ?? null, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("guest");
  const [loading, setLoading] = useState(true);

  const hydrate = async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) {
      try {
        const { profile, role } = await loadProfileAndRole(s.user.id);
        setProfile(profile);
        setRole(role);
      } catch {
        setProfile(null);
        setRole("user");
      }
    } else {
      setProfile(null);
      setRole("guest");
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) hydrate(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (mounted) hydrate(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    role,
    isAdmin: role === "admin",
    isModerator: role === "moderator" || role === "admin",
    isUser: !!user,
    loading,
    refresh: async () => {
      if (user) {
        const { profile, role } = await loadProfileAndRole(user.id);
        setProfile(profile);
        setRole(role);
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
